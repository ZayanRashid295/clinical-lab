import { XMLParser } from "fast-xml-parser";

type XmlValue = string | number | boolean | XmlObject | XmlValue[];
interface XmlObject {
  [key: string]: XmlValue | undefined;
}

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: false,
  trimValues: false,
});

export function parseXml(xml: string): XmlObject {
  return parser.parse(xml) as XmlObject;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function extractText(node: XmlValue | undefined): string {
  if (node === undefined || node === null) return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((item) => extractText(item)).join("");
  }

  const obj = node as XmlObject;
  if ("w:t" in obj) {
    return asArray(obj["w:t"]).map((item) => extractText(item)).join("");
  }

  let text = "";
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("@_")) continue;
    text += extractText(value);
  }
  return text;
}

export function collectParagraphs(root: XmlValue | undefined): string[] {
  const paragraphs: string[] = [];

  function walk(node: XmlValue | undefined): void {
    if (node === undefined || node === null) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object") return;

    const obj = node as XmlObject;
    for (const paragraph of asArray(obj["w:p"])) {
      const text = extractText(paragraph).trim();
      if (text) paragraphs.push(text);
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key !== "w:p") walk(value);
    }
  }

  walk(root);
  return paragraphs;
}

export function collectTables(root: XmlValue | undefined): string[][][] {
  const tables: string[][][] = [];

  function walk(node: XmlValue | undefined): void {
    if (node === undefined || node === null) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object") return;

    const obj = node as XmlObject;
    for (const table of asArray(obj["w:tbl"])) {
      const rows: string[][] = [];
      const tableObj = table as XmlObject;
      for (const row of asArray(tableObj["w:tr"])) {
        const cells: string[] = [];
        const rowObj = row as XmlObject;
        for (const cell of asArray(rowObj["w:tc"])) {
          cells.push(extractText(cell).trim());
        }
        if (cells.some((cell) => cell)) rows.push(cells);
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
