import { XMLParser } from "fast-xml-parser";
import { extractText } from "./xmlUtils";

type XmlValue = string | number | boolean | XmlObject | XmlValue[];
interface XmlObject {
  [key: string]: XmlValue | undefined;
}

export interface FormattedParagraph {
  text: string;
  /** Inner HTML for this paragraph (runs only, no block wrapper). */
  innerHtml: string;
  isListItem: boolean;
  listOrdered: boolean;
  listLevel: number;
}

const richParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: false,
  trimValues: false,
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getTextContent(node: XmlValue | undefined): string {
  return extractText(node);
}

function hasElement(obj: XmlObject | undefined, key: string): boolean {
  return obj !== undefined && key in obj;
}

function runToHtml(run: XmlObject): string {
  if (hasElement(run, "w:br")) return "<br/>";
  if (hasElement(run, "w:tab")) return "&emsp;";

  const text = getTextContent(run["w:t"]);
  if (!text) return "";

  let html = escapeHtml(text);
  const rPr = run["w:rPr"] as XmlObject | undefined;
  const tags: string[] = [];
  if (rPr) {
    if (hasElement(rPr, "w:b") || hasElement(rPr, "w:bCs")) tags.push("strong");
    if (hasElement(rPr, "w:i") || hasElement(rPr, "w:iCs")) tags.push("em");
    if (hasElement(rPr, "w:u")) tags.push("u");
    if (hasElement(rPr, "w:strike")) tags.push("s");
    const vert = rPr["w:vertAlign"] as XmlObject | undefined;
    const vertVal = vert?.["@_w:val"];
    if (vertVal === "superscript") tags.push("sup");
    if (vertVal === "subscript") tags.push("sub");
  }
  for (const tag of tags) html = `<${tag}>${html}</${tag}>`;
  return html;
}

function wrapRunText(html: string, text: string): string {
  if (!text) return "";
  const escaped = escapeHtml(text);
  if (!html || html === "<br/>") return escaped;
  const openTags: string[] = [];
  const re = /<\/?([a-z]+)[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    if (match[0].startsWith("</")) {
      openTags.pop();
    } else if (!match[0].endsWith("/>")) {
      openTags.push(tag);
    }
  }
  let wrapped = escaped;
  for (let index = openTags.length - 1; index >= 0; index -= 1) {
    wrapped = `<${openTags[index]}>${wrapped}</${openTags[index]}>`;
  }
  return wrapped;
}

function collectRunsHtml(paragraph: XmlObject): Array<{ text: string; html: string }> {
  const runs: Array<{ text: string; html: string }> = [];
  for (const run of asArray(paragraph["w:r"])) {
    const runObj = run as XmlObject;
    const text = getTextContent(runObj["w:t"]);
    const html = runToHtml(runObj);
    if (text || html === "<br/>" || html === "&emsp;") {
      runs.push({ text, html });
    }
  }
  for (const hyperlink of asArray(paragraph["w:hyperlink"])) {
    const link = hyperlink as XmlObject;
    for (const run of asArray(link["w:r"])) {
      const runObj = run as XmlObject;
      const text = getTextContent(runObj["w:t"]);
      const html = runToHtml(runObj);
      if (text) runs.push({ text, html });
    }
  }
  return runs;
}

/** Slice paragraph inner HTML by plain-text character offsets (preserves run formatting). */
export function sliceParagraphHtml(
  paragraph: XmlObject,
  startOffset: number,
  endOffset?: number,
): string {
  const runs = collectRunsHtml(paragraph);
  const parts: string[] = [];
  let pos = 0;

  for (const run of runs) {
    const runStart = pos;
    const runEnd = pos + run.text.length;
    pos = runEnd;

    if (runEnd <= startOffset) continue;
    if (endOffset !== undefined && runStart >= endOffset) break;

    const localStart = Math.max(0, startOffset - runStart);
    const localEnd =
      endOffset === undefined
        ? run.text.length
        : Math.min(run.text.length, endOffset - runStart);

    if (localStart >= localEnd) continue;

    if (localStart === 0 && localEnd === run.text.length) {
      parts.push(run.html);
      continue;
    }

    const slice = run.text.slice(localStart, localEnd);
    parts.push(wrapRunText(run.html, slice));
  }

  return parts.join("");
}

function paragraphInnerHtml(paragraph: XmlObject): string {
  const parts: string[] = [];
  for (const run of asArray(paragraph["w:r"])) {
    parts.push(runToHtml(run as XmlObject));
  }
  for (const hyperlink of asArray(paragraph["w:hyperlink"])) {
    const link = hyperlink as XmlObject;
    const inner = asArray(link["w:r"]).map((run) => runToHtml(run as XmlObject)).join("");
    if (inner) parts.push(inner);
  }
  return parts.join("");
}

type NumberingLevelInfo = { ordered: boolean };
type NumberingMap = Map<string, Map<number, NumberingLevelInfo>>;

function parseNumberingMap(numberingXml?: string): NumberingMap {
  const map: NumberingMap = new Map();
  if (!numberingXml) return map;

  const root = richParser.parse(numberingXml) as XmlObject;
  const numbering = root["w:numbering"] as XmlObject | undefined;
  if (!numbering) return map;

  const abstractLevels = new Map<string, Map<number, NumberingLevelInfo>>();
  for (const abstractNum of asArray(numbering["w:abstractNum"])) {
    const abs = abstractNum as XmlObject;
    const absId = String(abs["@_w:abstractNumId"] ?? "");
    const levels = new Map<number, NumberingLevelInfo>();
    for (const lvl of asArray(abs["w:lvl"])) {
      const lvlObj = lvl as XmlObject;
      const ilvl = Number(lvlObj["@_w:ilvl"] ?? 0);
      const numFmt = (lvlObj["w:numFmt"] as XmlObject | undefined)?.["@_w:val"];
      const ordered =
        typeof numFmt === "string" &&
        numFmt !== "bullet" &&
        numFmt !== "none" &&
        !numFmt.includes("bullet");
      levels.set(ilvl, { ordered });
    }
    if (absId) abstractLevels.set(absId, levels);
  }

  for (const num of asArray(numbering["w:num"])) {
    const numObj = num as XmlObject;
    const numId = String(numObj["@_w:numId"] ?? "");
    const abstractId = String(
      (numObj["w:abstractNumId"] as XmlObject | undefined)?.["@_w:val"] ?? "",
    );
    const levels = abstractLevels.get(abstractId);
    if (numId && levels) map.set(numId, levels);
  }

  return map;
}

function getListInfo(
  paragraph: XmlObject,
  numberingMap: NumberingMap,
): { isListItem: boolean; listOrdered: boolean; listLevel: number } {
  const pPr = paragraph["w:pPr"] as XmlObject | undefined;
  const numPr = pPr?.["w:numPr"] as XmlObject | undefined;
  if (!numPr) {
    return { isListItem: false, listOrdered: false, listLevel: 0 };
  }

  const ilvl = Number((numPr["w:ilvl"] as XmlObject | undefined)?.["@_w:val"] ?? 0);
  const numId = String((numPr["w:numId"] as XmlObject | undefined)?.["@_w:val"] ?? "");
  const levelInfo = numberingMap.get(numId)?.get(ilvl);
  const pStyle = (pPr?.["w:pStyle"] as XmlObject | undefined)?.["@_w:val"];
  const ordered = levelInfo?.ordered ?? pStyle === "Heading2";

  return { isListItem: true, listOrdered: ordered, listLevel: ilvl };
}

function paragraphToFormatted(
  paragraph: XmlObject,
  numberingMap: NumberingMap,
): FormattedParagraph {
  const innerHtml = paragraphInnerHtml(paragraph);
  const text = extractText(paragraph).trim();
  const listInfo = getListInfo(paragraph, numberingMap);
  return {
    text,
    innerHtml,
    isListItem: listInfo.isListItem,
    listOrdered: listInfo.listOrdered,
    listLevel: listInfo.listLevel,
  };
}

export function parseRichXml(xml: string): XmlObject {
  return richParser.parse(xml) as XmlObject;
}

export function collectFormattedParagraphs(
  root: XmlValue | undefined,
  numberingXml?: string,
): FormattedParagraph[] {
  return collectFormattedParagraphEntries(root, numberingXml).map((entry) => entry.formatted);
}

export interface FormattedParagraphEntry {
  formatted: FormattedParagraph;
  raw: XmlObject;
}

export function collectFormattedParagraphEntries(
  root: XmlValue | undefined,
  numberingXml?: string,
): FormattedParagraphEntry[] {
  const numberingMap = parseNumberingMap(numberingXml);
  const paragraphs: FormattedParagraphEntry[] = [];

  function walk(node: XmlValue | undefined): void {
    if (node === undefined || node === null) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object") return;

    const obj = node as XmlObject;
    for (const paragraph of asArray(obj["w:p"])) {
      const raw = paragraph as XmlObject;
      const formatted = paragraphToFormatted(raw, numberingMap);
      if (formatted.text || formatted.innerHtml.trim()) {
        paragraphs.push({ formatted, raw });
      }
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key !== "w:p") walk(value);
    }
  }

  walk(root);
  return paragraphs;
}

/** Merge consecutive formatted paragraphs into one HTML fragment (lists grouped). */
export function joinFormattedHtml(paragraphs: FormattedParagraph[]): string {
  if (!paragraphs.length) return "";

  const parts: string[] = [];
  let listStack: Array<{ tag: "ul" | "ol"; level: number }> = [];

  const closeLists = (targetLevel = -1) => {
    while (listStack.length > 0 && listStack[listStack.length - 1].level > targetLevel) {
      const { tag } = listStack.pop()!;
      parts.push(`</${tag}>`);
    }
  };

  for (const paragraph of paragraphs) {
    const inner = paragraph.innerHtml;
    if (!inner.trim()) continue;

    if (paragraph.isListItem) {
      const tag = paragraph.listOrdered ? "ol" : "ul";
      const level = paragraph.listLevel;

      if (!listStack.length || listStack[listStack.length - 1].level < level) {
        parts.push(`<${tag}>`);
        listStack.push({ tag, level });
      } else if (listStack[listStack.length - 1].level > level) {
        closeLists(level);
        if (!listStack.length || listStack[listStack.length - 1].tag !== tag) {
          parts.push(`<${tag}>`);
          listStack.push({ tag, level });
        }
      } else if (listStack[listStack.length - 1].tag !== tag) {
        closeLists(level - 1);
        parts.push(`<${tag}>`);
        listStack.push({ tag, level });
      }

      parts.push(`<li>${inner}</li>`);
    } else {
      closeLists();
      parts.push(`<p>${inner}</p>`);
    }
  }

  closeLists();
  return parts.join("");
}

export function singleParagraphHtml(paragraph: FormattedParagraph): string {
  if (!paragraph.innerHtml.trim()) return "";
  if (paragraph.isListItem) {
    const tag = paragraph.listOrdered ? "ol" : "ul";
    return `<${tag}><li>${paragraph.innerHtml}</li></${tag}>`;
  }
  return `<p>${paragraph.innerHtml}</p>`;
}

export function joinFormattedText(paragraphs: FormattedParagraph[]): string {
  return paragraphs.map((p) => p.text).join("\n").trim();
}

function getGridSpan(cell: XmlObject): number {
  const tcPr = cell["w:tcPr"] as XmlObject | undefined;
  const gridSpan = tcPr?.["w:gridSpan"] as XmlObject | undefined;
  const val = Number(gridSpan?.["@_w:val"] ?? 1);
  return Number.isFinite(val) && val > 1 ? val : 1;
}

function isVerticalMergeContinue(cell: XmlObject): boolean {
  const tcPr = cell["w:tcPr"] as XmlObject | undefined;
  const vMerge = tcPr?.["w:vMerge"] as XmlObject | undefined;
  if (!vMerge) return false;
  const val = (vMerge as XmlObject)["@_w:val"];
  return val !== "restart";
}

function normalizeRowCellCount(
  cells: { text: string; html: string }[],
  targetCount: number,
): { text: string; html: string }[] {
  if (targetCount <= 0) return cells;

  const result = cells.slice();
  while (result.length < targetCount) {
    result.push({ text: "", html: "" });
  }

  if (result.length <= targetCount) return result;

  const keep = result.slice(0, targetCount);
  const overflow = result.slice(targetCount);
  const last = keep[targetCount - 1];

  for (const extra of overflow) {
    const extraPlain = extra.text.trim() || stripHtml(extra.html).trim();
    if (!extraPlain) continue;
    last.text = [last.text, extra.text].filter(Boolean).join("\n").trim();
    last.html = `${last.html}${extra.html}`;
  }

  return keep;
}

export function collectFormattedTables(
  root: XmlValue | undefined,
  numberingXml?: string,
): { text: string; html: string }[][][] {
  const numberingMap = parseNumberingMap(numberingXml);
  const tables: { text: string; html: string }[][][] = [];

  function walk(node: XmlValue | undefined): void {
    if (node === undefined || node === null) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object") return;

    const obj = node as XmlObject;
    for (const table of asArray(obj["w:tbl"])) {
      const rows: { text: string; html: string }[][] = [];
      const tableObj = table as XmlObject;
      for (const row of asArray(tableObj["w:tr"])) {
        const cells: { text: string; html: string }[] = [];
        const rowObj = row as XmlObject;
        for (const cell of asArray(rowObj["w:tc"])) {
          const cellObj = cell as XmlObject;
          if (isVerticalMergeContinue(cellObj)) continue;
          const cellParagraphs = asArray(cellObj["w:p"]).map((p) =>
            paragraphToFormatted(p as XmlObject, numberingMap),
          );
          const text = joinFormattedText(cellParagraphs);
          const html = joinFormattedHtml(cellParagraphs) || escapeHtml(text);
          const span = getGridSpan(cellObj);
          cells.push({ text: text.trim(), html });
          for (let index = 1; index < span; index += 1) {
            cells.push({ text: "", html: "" });
          }
        }
        if (cells.some((cell) => cell.text)) rows.push(cells);
      }
      if (rows.length > 0) {
        const colCount = rows[0].length;
        for (let index = 0; index < rows.length; index += 1) {
          rows[index] = normalizeRowCellCount(rows[index], colCount);
        }
      }
      if (rows.length > 0) tables.push(rows);
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key !== "w:tbl") walk(value);
    }
  }

  walk(root);
  return tables;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
