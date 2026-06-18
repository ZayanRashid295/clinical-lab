#!/usr/bin/env python3
"""Compare table1/table2/diagram headings in question.json with DOCX document order."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from docx import Document
from docx.document import Document as DocxDocument
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "clinical lab data"
OUT_DIR = ROOT / "clinical-lab-data-test-output"

METADATA_RE = re.compile(
    r"^(Category|Product|System|Topic|Subtopic|MCQ Title|Cognitive Level|Clinical Skill|Difficulty Level|Subject|Domain|Competency Domain|System\s*/\s*Title)\s*:",
    re.I,
)
INTERIM_TABLE_SECTION_RE = re.compile(
    r"^(Key Clinical Interpretation|Brief Key Points?|Clinical Takeaway|Key Concept Summary|Key Points?)$",
    re.I,
)


def is_interim_table_section(text: str) -> bool:
    return bool(INTERIM_TABLE_SECTION_RE.match(text.strip()))


def is_prose_paragraph(text: str) -> bool:
    trimmed = text.strip()
    if not trimmed:
        return False
    if trimmed.startswith("(") and trimmed.endswith(")") and len(trimmed) <= 120:
        return False
    if len(trimmed) > 100:
        return True
    if re.search(r"\bis defined by\b", trimmed, re.I):
        return True
    if len(trimmed) > 80 and ", " in trimmed:
        return True
    if len(trimmed) > 30 and trimmed[0].islower():
        return True
    return bool(re.match(r"^(Used in|Target |Chosen after|The |This |Patients |Although |A known |A \d)", trimmed))
DIAGRAM_RE = re.compile(r"^(?:This (?:medical educational )?|The )diagram\b", re.I)
QUESTION_ID_RE = re.compile(r"Question Id:\s*(\S+)", re.I)
SECTION_RE = re.compile(r"^SECTION\s+\d+", re.I)


def iter_body_blocks(doc: DocxDocument):
    body = doc.element.body
    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            yield ("paragraph", Paragraph(child, doc))
        elif child.tag == qn("w:tbl"):
            yield ("table", Table(child, doc))


def paragraph_has_image(paragraph: Paragraph) -> bool:
    xml = paragraph._element.xml
    return "w:drawing" in xml or "w:pict" in xml or "w:object" in xml


def paragraph_text(paragraph: Paragraph) -> str:
    return paragraph.text.strip()


def is_metadata_line(text: str) -> bool:
    return bool(METADATA_RE.match(text.strip()))


def normalize(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip())


def find_question_id(doc: DocxDocument) -> str | None:
    for kind, block in iter_body_blocks(doc):
        if kind != "paragraph":
            continue
        match = QUESTION_ID_RE.search(paragraph_text(block))
        if match:
            return re.sub(r"[^\dA-Za-z]", "", match.group(1))
    return None


def find_key_concept_index(blocks) -> int | None:
    candidates: list[int] = []
    for i, (kind, text, _) in enumerate(blocks):
        if kind != "paragraph":
            continue
        if text.strip() == "Key Concept" or text.startswith("Key Concept "):
            candidates.append(i)
    for index in reversed(candidates):
        for j in range(index + 1, min(index + 8, len(blocks))):
            kind, text, _ = blocks[j]
            if kind == "paragraph" and text.startswith("Category:"):
                return index
    return candidates[-1] if candidates else None


def extract_expected(doc: DocxDocument) -> dict:
    raw_blocks = list(iter_body_blocks(doc))
    blocks: list[tuple[str, str, bool]] = []
    for kind, block in raw_blocks:
        if kind == "paragraph":
            text = paragraph_text(block)
            blocks.append(("paragraph", text, paragraph_has_image(block)))
        else:
            blocks.append(("table", "TABLE", False))

    key_idx = find_key_concept_index(blocks)
    search_from = (key_idx + 1) if key_idx is not None else 0

    meta_start = meta_end = None
    for i in range(search_from, len(blocks)):
        kind, text, _ = blocks[i]
        if kind != "paragraph":
            if meta_start is not None:
                break
            continue
        if not text:
            continue
        if is_metadata_line(text):
            if meta_start is None:
                meta_start = i
            meta_end = i
            continue
        if meta_start is not None:
            break

    if meta_start is None:
        return {}

    index = meta_end + 1
    result: dict = {}

    def find_next_table(start: int) -> int:
        for i in range(start, len(blocks)):
            if blocks[i][0] == "table":
                return i
        return -1

    def collect_heading_before_table(table_index: int) -> str:
        parts: list[str] = []
        i = table_index - 1
        while i >= 0:
            kind, text, has_image = blocks[i]
            if kind != "paragraph":
                break
            if not text:
                i -= 1
                continue
            if is_metadata_line(text) or has_image or DIAGRAM_RE.match(text):
                break
            if is_interim_table_section(text) or is_prose_paragraph(text):
                break
            parts.insert(0, text)
            i -= 1
        return normalize(" ".join(parts))

    table1_index = find_next_table(index)
    if table1_index != -1:
        result["table1_heading"] = collect_heading_before_table(table1_index)
        index = table1_index + 1

    table2_index = find_next_table(index)
    if table2_index != -1:
        result["table2_heading"] = collect_heading_before_table(table2_index)
        index = table2_index + 1

    while index < len(blocks):
        kind, text, has_image = blocks[index]
        if kind == "paragraph" and has_image:
            break
        index += 1

    if index >= len(blocks):
        return result

    index += 1
    while index < len(blocks):
        kind, text, has_image = blocks[index]
        if kind != "paragraph":
            break
        if not text:
            index += 1
            continue
        break

    diagram_parts: list[str] = []
    while index < len(blocks):
        kind, text, has_image = blocks[index]
        if kind != "paragraph":
            break
        if not text:
            index += 1
            continue
        if DIAGRAM_RE.match(text):
            result["diagram_description"] = text
            break
        diagram_parts.append(text)
        index += 1

    if diagram_parts:
        result["diagram_heading"] = normalize(" ".join(diagram_parts))

    return result


def walk_docx_files(data_dir: Path):
    for path in sorted(data_dir.rglob("*.docx")):
        yield path


def main() -> int:
    mismatches: list[str] = []
    missing_json: list[str] = []
    checked = 0

    for docx_path in walk_docx_files(DATA_DIR):
        doc = Document(str(docx_path))
        qid = find_question_id(doc)
        if not qid:
            mismatches.append(f"{docx_path.name}: no question id in docx")
            continue

        json_path = OUT_DIR / qid / "question.json"
        if not json_path.exists():
            missing_json.append(f"{qid} ({docx_path.name})")
            continue

        data = json.loads(json_path.read_text())
        expected = extract_expected(doc)
        checked += 1
        rel = docx_path.relative_to(DATA_DIR)

        def check(field: str, json_key: str, nested: str = "heading"):
            exp = expected.get(field, "")
            got = normalize((data.get(json_key) or {}).get(nested))
            if exp and not got:
                mismatches.append(f"{qid} ({rel}): missing parsed {json_key}.{nested}; expected: {exp[:80]}")
            elif got and not exp:
                mismatches.append(f"{qid} ({rel}): unexpected {json_key}.{nested}: {got[:80]}")
            elif exp and got and normalize(exp) != normalize(got):
                mismatches.append(
                    f"{qid} ({rel}): {json_key}.{nested}\n  expected: {exp}\n  got:      {got}"
                )

        check("table1_heading", "table1")
        check("table2_heading", "table2")
        check("diagram_heading", "diagram")

        exp_desc = normalize(expected.get("diagram_description"))
        got_desc = normalize(data.get("diagram") and data.get("diagram").get("description"))
        if exp_desc and not got_desc:
            mismatches.append(f"{qid} ({rel}): missing diagram.description; expected start: {exp_desc[:80]}")
        elif exp_desc and got_desc and exp_desc != got_desc:
            if not got_desc.startswith(exp_desc[:40]) and exp_desc[:40] not in got_desc:
                mismatches.append(
                    f"{qid} ({rel}): diagram.description mismatch\n  expected: {exp_desc[:120]}\n  got:      {got_desc[:120]}"
                )

        has_table1_doc = "table1_heading" in expected
        has_table2_doc = "table2_heading" in expected
        has_table1_json = bool(data.get("table1", {}).get("rows"))
        has_table2_json = bool(data.get("table2", {}).get("rows"))
        if has_table1_doc != has_table1_json:
            mismatches.append(f"{qid} ({rel}): table1 presence doc={has_table1_doc} json={has_table1_json}")
        if has_table2_doc != has_table2_json:
            mismatches.append(f"{qid} ({rel}): table2 presence doc={has_table2_doc} json={has_table2_json}")

    print(f"Checked {checked} docx/json pairs")
    if missing_json:
        print(f"Missing JSON ({len(missing_json)}):")
        for item in missing_json:
            print(f"  {item}")
    print(f"Mismatches: {len(mismatches)}")
    for item in mismatches:
        print(item)
        print()

    return 1 if mismatches or missing_json else 0


if __name__ == "__main__":
    sys.exit(main())
