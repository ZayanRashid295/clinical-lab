import { XMLParser } from "fast-xml-parser";
import { DIAGRAM_RE, isInterimTableSectionHeading, isMetadataLine, isProseParagraph, QUESTION_ID_RE, normalizeQuestionId } from "./parser-utils";
import {
  joinFormattedHtml,
  joinFormattedText,
  paragraphToFormatted,
  type FormattedParagraph,
  type FormattedParagraphEntry,
} from "./richTextUtils";

type XmlObject = Record<string, unknown>;

function asXmlObject(value: unknown): XmlObject {
  return value as XmlObject;
}

const blockParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: false,
  trimValues: false,
});

export type RichCell = { text: string; html: string };
export type RichTable = RichCell[][];

export type BodyBlock =
  | {
      kind: "paragraph";
      entry: FormattedParagraphEntry;
      hasImage: boolean;
    }
  | {
      kind: "table";
      rows: RichTable;
    };

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

function isVerticalMergeContinue(cell: XmlObject): boolean {
  const tcPr = cell["w:tcPr"] as XmlObject | undefined;
  const merge = tcPr?.["w:vMerge"] as XmlObject | undefined;
  return merge?.["@_w:val"] === "continue";
}

function getGridSpan(cell: XmlObject): number {
  const tcPr = cell["w:tcPr"] as XmlObject | undefined;
  const span = tcPr?.["w:gridSpan"] as XmlObject | undefined;
  const value = span?.["@_w:val"];
  return typeof value === "number" ? value : Number(value ?? 1) || 1;
}

function normalizeRowCellCount(cells: RichCell[], targetCount: number): RichCell[] {
  const result = [...cells];
  while (result.length < targetCount) {
    result.push({ text: "", html: "" });
  }
  return result.slice(0, targetCount);
}

function paragraphHasImage(raw: unknown): boolean {
  const xml = JSON.stringify(raw);
  return xml.includes('"w:drawing"') || xml.includes('"w:pict"') || xml.includes('"w:object"');
}

function parseParagraphFragment(xml: string, numberingMap: Map<string, Map<number, { ordered: boolean }>>) {
  const wrapped = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${xml}</w:document>`;
  const root = blockParser.parse(wrapped) as XmlObject;
  const paragraph = asXmlObject((root["w:document"] as XmlObject)?.["w:p"]);
  const formatted = paragraphToFormatted(paragraph as Parameters<typeof paragraphToFormatted>[0], numberingMap);
  return { formatted, raw: paragraph as Parameters<typeof paragraphToFormatted>[0] };
}

function parseTableFragment(
  xml: string,
  numberingMap: Map<string, Map<number, { ordered: boolean }>>,
): RichTable {
  const wrapped = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${xml}</w:document>`;
  const root = blockParser.parse(wrapped) as XmlObject;
  const table = asXmlObject((root["w:document"] as XmlObject)?.["w:tbl"]);
  const rows: RichTable = [];

  for (const row of asArray(table["w:tr"])) {
    const cells: RichCell[] = [];
    const rowObj = row as XmlObject;
    for (const cell of asArray(rowObj["w:tc"])) {
      const cellObj = cell as XmlObject;
      if (isVerticalMergeContinue(cellObj)) continue;
      const cellParagraphs = asArray(cellObj["w:p"]).map((paragraph) =>
        paragraphToFormatted(
          paragraph as Parameters<typeof paragraphToFormatted>[0],
          numberingMap,
        ),
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

  return rows;
}

function extractDirectBodyChildXml(bodyInner: string): Array<{ tag: "p" | "tbl"; xml: string }> {
  const children: Array<{ tag: "p" | "tbl"; xml: string }> = [];
  let pos = 0;

  while (pos < bodyInner.length) {
    while (pos < bodyInner.length && /\s/.test(bodyInner[pos])) pos += 1;
    if (bodyInner.startsWith("</w:body>", pos)) break;
    if (bodyInner.startsWith("<w:sectPr", pos)) {
      const end = bodyInner.indexOf("</w:sectPr>", pos);
      pos = end === -1 ? bodyInner.length : end + "</w:sectPr>".length;
      continue;
    }

    const paragraphOpen = bodyInner.startsWith("<w:p", pos);
    const tableOpen = bodyInner.startsWith("<w:tbl", pos);
    if (!paragraphOpen && !tableOpen) {
      pos += 1;
      continue;
    }

    const tag = paragraphOpen ? "p" : "tbl";
    const closeTag = tag === "p" ? "</w:p>" : "</w:tbl>";
    const closeIndex = bodyInner.indexOf(closeTag, pos);
    if (closeIndex === -1) break;
    children.push({
      tag,
      xml: bodyInner.slice(pos, closeIndex + closeTag.length),
    });
    pos = closeIndex + closeTag.length;
  }

  return children;
}

function parseNumberingMap(numberingXml?: string) {
  const map = new Map<string, Map<number, { ordered: boolean }>>();
  if (!numberingXml) return map;

  const root = blockParser.parse(numberingXml) as XmlObject;
  const numbering = root["w:numbering"] as XmlObject | undefined;
  if (!numbering) return map;

  const abstractLevels = new Map<string, Map<number, { ordered: boolean }>>();
  for (const abstractNum of asArray(numbering["w:abstractNum"])) {
    const abs = abstractNum as XmlObject;
    const absId = String(abs["@_w:abstractNumId"] ?? "");
    const levels = new Map<number, { ordered: boolean }>();
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

export function collectOrderedBodyBlocks(
  documentXml: string,
  numberingXml?: string,
): BodyBlock[] {
  const bodyStart = documentXml.indexOf("<w:body");
  const bodyOpenEnd = documentXml.indexOf(">", bodyStart);
  const bodyClose = documentXml.indexOf("</w:body>", bodyOpenEnd);
  if (bodyStart === -1 || bodyOpenEnd === -1 || bodyClose === -1) return [];

  const bodyInner = documentXml.slice(bodyOpenEnd + 1, bodyClose);
  const childXml = extractDirectBodyChildXml(bodyInner);
  const numberingMap = parseNumberingMap(numberingXml);
  const blocks: BodyBlock[] = [];

  for (const child of childXml) {
    if (child.tag === "p") {
      const { formatted, raw } = parseParagraphFragment(child.xml, numberingMap);
      if (!formatted.text.trim() && !paragraphHasImage(raw)) continue;
      blocks.push({
        kind: "paragraph",
        entry: { formatted, raw },
        hasImage: paragraphHasImage(raw),
      });
      continue;
    }

    const rows = parseTableFragment(child.xml, numberingMap);
    if (rows.length > 0) blocks.push({ kind: "table", rows });
  }

  return blocks;
}

export interface ParsedTableContent {
  heading: string;
  headingHtml?: string;
  columns: string[];
  columnsHtml?: string[];
  rows: Array<{ cells: string[]; cellsHtml?: string[] }>;
}

export interface ParsedDiagramContent {
  heading?: string;
  headingHtml?: string;
  description?: string;
  descriptionHtml?: string;
}

function joinHeading(paragraphs: FormattedParagraph[]): {
  heading: string;
  headingHtml?: string;
} {
  const heading = paragraphs
    .map((paragraph) => paragraph.text.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  const headingHtml = joinFormattedHtml(paragraphs) || undefined;
  return { heading, headingHtml };
}

function tableBlockToContent(
  headingParagraphs: FormattedParagraph[],
  rows: RichTable,
): ParsedTableContent | undefined {
  if (!rows.length) return undefined;
  const { heading, headingHtml } = joinHeading(headingParagraphs);
  const header = rows[0];
  const columns = header.map((cell) => cell.text.trim());
  const columnsHtml = header.map((cell) => cell.html);
  const dataRows = rows.slice(1).map((row) => ({
    cells: row.map((cell) => cell.text.trim()),
    cellsHtml: row.map((cell) => cell.html),
  }));
  return { heading, headingHtml, columns, columnsHtml, rows: dataRows };
}

export function findMetadataBlockRange(
  blocks: BodyBlock[],
  searchFrom = 0,
): { start: number; end: number } | null {
  let start = -1;
  let end = -1;
  for (let index = searchFrom; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.kind !== "paragraph") continue;
    if (isMetadataLine(block.entry.formatted.text)) {
      if (start === -1) start = index;
      end = index;
      continue;
    }
    if (start !== -1) break;
  }
  return start === -1 ? null : { start, end };
}

export function blockIndexForParagraphOrder(blocks: BodyBlock[], paragraphOrder: number): number {
  let count = 0;
  for (let index = 0; index < blocks.length; index += 1) {
    if (blocks[index].kind !== "paragraph") continue;
    if (count === paragraphOrder) return index;
    count += 1;
  }
  return blocks.length;
}

function findNextTableIndex(blocks: BodyBlock[], fromIndex: number): number {
  for (let index = fromIndex; index < blocks.length; index += 1) {
    if (blocks[index].kind === "table") return index;
  }
  return -1;
}

function collectHeadingBeforeTable(blocks: BodyBlock[], tableIndex: number): FormattedParagraph[] {
  const paragraphs: FormattedParagraph[] = [];
  for (let index = tableIndex - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (block.kind !== "paragraph") break;
    const text = block.entry.formatted.text.trim();
    if (!text) continue;
    if (isMetadataLine(text) || block.hasImage || DIAGRAM_RE.test(text)) break;
    if (isInterimTableSectionHeading(text) || isProseParagraph(text)) break;
    paragraphs.unshift(block.entry.formatted);
  }
  return paragraphs;
}

export function findBlockContentEnd(
  blocks: BodyBlock[],
  questionId: string,
  searchFrom: number,
): number {
  for (let index = searchFrom + 1; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.kind !== "paragraph") continue;
    const text = block.entry.formatted.text.trim();
    if (/^SECTION\s+\d+/i.test(text)) return index;
    const match = text.match(QUESTION_ID_RE);
    if (match && normalizeQuestionId(match[1]) !== questionId) return index;
  }
  return blocks.length;
}

export function parseTablesAndDiagramFromBlocks(
  blocks: BodyBlock[],
  contentEndIndex = blocks.length,
  metadataSearchFrom = 0,
): {
  table1?: ParsedTableContent;
  table2?: ParsedTableContent;
  diagram?: ParsedDiagramContent;
} {
  const scoped = blocks.slice(0, contentEndIndex);
  const metadata = findMetadataBlockRange(scoped, metadataSearchFrom);
  if (!metadata) return {};

  let index = metadata.end + 1;
  const result: {
    table1?: ParsedTableContent;
    table2?: ParsedTableContent;
    diagram?: ParsedDiagramContent;
  } = {};

  const table1Index = findNextTableIndex(scoped, index);
  if (table1Index !== -1) {
    const table1Block = scoped[table1Index];
    if (table1Block.kind === "table") {
      result.table1 = tableBlockToContent(
        collectHeadingBeforeTable(scoped, table1Index),
        table1Block.rows,
      );
      index = table1Index + 1;
    }
  }

  const table2Index = findNextTableIndex(scoped, index);
  if (table2Index !== -1) {
    const table2Block = scoped[table2Index];
    if (table2Block.kind === "table") {
      result.table2 = tableBlockToContent(
        collectHeadingBeforeTable(scoped, table2Index),
        table2Block.rows,
      );
      index = table2Index + 1;
    }
  }

  while (index < scoped.length) {
    const block = scoped[index];
    if (block.kind === "paragraph" && block.hasImage) break;
    index += 1;
  }

  if (index >= scoped.length) return result;
  const imageBlock = scoped[index];
  if (imageBlock.kind !== "paragraph" || !imageBlock.hasImage) return result;

  index += 1;
  while (index < scoped.length) {
    const block = scoped[index];
    if (block.kind !== "paragraph") break;
    if (!block.entry.formatted.text.trim()) {
      index += 1;
      continue;
    }
    break;
  }

  const diagramHeading: FormattedParagraph[] = [];
  while (index < scoped.length) {
    const block = scoped[index];
    if (block.kind !== "paragraph") break;
    const text = block.entry.formatted.text.trim();
    if (!text) {
      index += 1;
      continue;
    }
    if (DIAGRAM_RE.test(text)) break;
    diagramHeading.push(block.entry.formatted);
    index += 1;
  }

  let description: string | undefined;
  let descriptionHtml: string | undefined;
  const descriptionBlock = scoped[index];
  if (descriptionBlock?.kind === "paragraph") {
    const text = descriptionBlock.entry.formatted.text.trim();
    if (DIAGRAM_RE.test(text)) {
      description = text;
      descriptionHtml =
        joinFormattedHtml([descriptionBlock.entry.formatted]) || undefined;
    }
  }

  const { heading, headingHtml } = joinHeading(diagramHeading);
  if (heading || description) {
    result.diagram = {
      ...(heading ? { heading, headingHtml } : {}),
      ...(description ? { description, descriptionHtml } : {}),
    };
  }

  return result;
}

export function findBlockIndexForParagraph(
  blocks: BodyBlock[],
  paragraphIndex: number,
): number {
  let seen = 0;
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.kind !== "paragraph") continue;
    if (seen === paragraphIndex) return index;
    seen += 1;
  }
  return blocks.length;
}
