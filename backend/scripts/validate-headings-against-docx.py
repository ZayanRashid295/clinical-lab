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
    if re.search(r"\bis defined by\b", trimmed, re.I):
        return True
    if len(trimmed) > 80 and ", " in trimmed and re.search(r"\.\s", trimmed):
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


def find_content_end(blocks, question_id: str, search_from: int) -> int:
    for index in range(search_from + 1, len(blocks)):
        kind, text, _ = blocks[index]
        if kind != "paragraph":
            continue
        if SECTION_RE.match(text):
            return index
        match = QUESTION_ID_RE.search(text)
        if match:
            qid = re.sub(r"[^\dA-Za-z]", "", match.group(1))
            if qid != question_id:
                return index
    return len(blocks)


def extract_expected(doc: DocxDocument, question_id: str) -> dict:
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

    content_end = find_content_end(blocks, question_id, meta_end)
    index = meta_end + 1
    result: dict = {"table_headings": [], "diagram_headings": [], "diagram_descriptions": []}

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
            parts.insert(0, re.sub(r"\s+", " ", text.strip()))
            i -= 1
        return normalize(" ".join(parts))

    while index < content_end:
        kind, text, has_image = blocks[index]
        if kind == "table":
            result["table_headings"].append(collect_heading_before_table(index))
            index += 1
            continue
        if kind == "paragraph" and has_image:
            index += 1
            while index < content_end:
                skip_kind, skip_text, _ = blocks[index]
                if skip_kind != "paragraph":
                    break
                if not skip_text:
                    index += 1
                    continue
                break
            diagram_parts: list[str] = []
            while index < content_end:
                d_kind, d_text, d_img = blocks[index]
                if d_kind != "paragraph":
                    break
                if not d_text:
                    index += 1
                    continue
                if DIAGRAM_RE.match(d_text):
                    result["diagram_descriptions"].append(d_text)
                    index += 1
                    break
                if d_img or is_metadata_line(d_text):
                    break
                if is_interim_table_section(d_text) or is_prose_paragraph(d_text):
                    break
                diagram_parts.append(re.sub(r"\s+", " ", d_text.strip()))
                index += 1
            if diagram_parts:
                result["diagram_headings"].append(normalize(" ".join(diagram_parts)))
            continue
        index += 1

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
        expected = extract_expected(doc, qid)
        checked += 1
        rel = docx_path.relative_to(DATA_DIR)

        tables = [t for t in (data.get("tables") or []) if t.get("rows")]
        if not tables:
            tables = [t for t in [data.get("table1"), data.get("table2")] if t and t.get("rows")]

        diagrams = data.get("diagrams") or []
        if not diagrams and data.get("diagram"):
            diagrams = [data.get("diagram")]

        exp_tables = expected.get("table_headings", [])
        exp_diagrams = expected.get("diagram_headings", [])
        exp_descs = expected.get("diagram_descriptions", [])

        if len(exp_tables) != len(tables):
            mismatches.append(
                f"{qid} ({rel}): table count doc={len(exp_tables)} json={len(tables)}"
            )

        for idx, exp_heading in enumerate(exp_tables):
            if idx >= len(tables):
                break
            got_heading = normalize(tables[idx].get("heading"))
            if normalize(exp_heading) != got_heading:
                mismatches.append(
                    f"{qid} ({rel}): tables[{idx}].heading\n  expected: {exp_heading}\n  got:      {got_heading}"
                )

        if len(exp_diagrams) != len(diagrams):
            mismatches.append(
                f"{qid} ({rel}): diagram count doc={len(exp_diagrams)} json={len(diagrams)}"
            )

        for idx, exp_heading in enumerate(exp_diagrams):
            if idx >= len(diagrams):
                break
            got_heading = normalize(diagrams[idx].get("heading"))
            if normalize(exp_heading) != got_heading:
                mismatches.append(
                    f"{qid} ({rel}): diagrams[{idx}].heading\n  expected: {exp_heading}\n  got:      {got_heading}"
                )

        for idx, exp_desc in enumerate(exp_descs):
            if idx >= len(diagrams):
                break
            got_desc = normalize(diagrams[idx].get("description"))
            if exp_desc and got_desc and normalize(exp_desc) != got_desc:
                if not got_desc.startswith(exp_desc[:40]) and exp_desc[:40] not in got_desc:
                    mismatches.append(
                        f"{qid} ({rel}): diagrams[{idx}].description mismatch\n  expected: {exp_desc[:120]}\n  got:      {got_desc[:120]}"
                    )

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
