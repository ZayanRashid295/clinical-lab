import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JSZip = require("jszip") as typeof import("jszip");
import type {
  ConvertFileResult,
  DifferentialRow,
  Explanation,
  FeatureRow,
  ImageRef,
  QuestionData,
  QuestionMetadata,
} from "./types";
import { validateDocxFromBuffer } from "./validateDocx";
import {
  buildGroupedHtmlFragments,
  collectFormattedParagraphEntries,
  collectFormattedTables,
  joinFormattedHtml,
  parseRichXml,
  singleParagraphHtml,
  sliceParagraphHtml,
  type FormattedParagraph,
  type FormattedParagraphEntry,
} from "./richTextUtils";
import {
  ANSWER_RE,
  COMPETENCY_DOMAIN_VALUES,
  DIAGRAM_RE,
  QUESTION_NUM_RE,
  QUESTION_ID_RE,
  findQuestionContentEnd,
  findQuestionId,
  findSectionIndex,
  findFirstKeyConceptIndex,
  findPrimaryKeyConceptIndex,
  isClassicTriadHeadingLine,
  isKeyConceptHeading,
  isKeywordsSectionFooterLine,
  isLikelyTriadContentLine,
  isMetadataLine,
  normalizeQuestionId,
  normalizeStemText,
  normalizeTriadTitle,
  parseOptionLine,
  splitStemAndOptionTexts,
} from "./parser-utils";

const METADATA_FIELDS: Record<string, keyof QuestionMetadata> = {
  Category: "category",
  Product: "product",
  System: "system",
  Topic: "topic",
  Subtopic: "subtopic",
  "MCQ Title": "mcqTitle",
  "Competency Domain": "competencyDomain",
  "Cognitive Level": "cognitiveLevel",
  "Clinical Skill": "clinicalSkill",
  "Difficulty Level": "difficultyLevel",
};

function afterFirstColon(text: string): string {
  const colonIndex = text.indexOf(":");
  return colonIndex >= 0 ? text.slice(colonIndex + 1).trim() : "";
}

async function readDocxPartsFromBuffer(
  buffer: Buffer,
): Promise<{ documentXml: string; numberingXml?: string }> {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("Missing word/document.xml");
  const documentXml = await file.async("string");
  const numberingFile = zip.file("word/numbering.xml");
  const numberingXml = numberingFile ? await numberingFile.async("string") : undefined;
  return { documentXml, numberingXml };
}

async function extractParagraphEntriesFromBuffer(
  buffer: Buffer,
): Promise<FormattedParagraphEntry[]> {
  const { documentXml, numberingXml } = await readDocxPartsFromBuffer(buffer);
  return collectFormattedParagraphEntries(parseRichXml(documentXml), numberingXml);
}

async function extractParagraphsFromBuffer(buffer: Buffer): Promise<string[]> {
  const entries = await extractParagraphEntriesFromBuffer(buffer);
  return entries.map((entry) => entry.formatted.text);
}

type RichCell = { text: string; html: string };
type RichTable = RichCell[][];

async function extractRichTablesFromBuffer(buffer: Buffer): Promise<RichTable[]> {
  const { documentXml, numberingXml } = await readDocxPartsFromBuffer(buffer);
  return collectFormattedTables(parseRichXml(documentXml), numberingXml);
}

async function extractTablesFromBuffer(buffer: Buffer): Promise<string[][][]> {
  const richTables = await extractRichTablesFromBuffer(buffer);
  return richTables.map((table) =>
    table.map((row) => row.map((cell) => cell.text)),
  );
}

function normalizeTableHeaderCell(cell: string): string {
  return cell.toLowerCase().trim().replace(/\s+/g, " ");
}

function isDifferentialTableHeader(first: string, second: string, third: string): boolean {
  if (first.includes("differential diagnosis")) return true;
  const isConditionCol =
    first === "condition" ||
    first.startsWith("condition /") ||
    first.startsWith("condition/") ||
    first.startsWith("condition (");
  if (!isConditionCol) return false;
  if (["differentiat", "distinguish", "differ"].some((token) => third.includes(token))) {
    return true;
  }
  if (
    ["distinguish", "differentiat", "key features", "key clinical features"].some((token) =>
      second.includes(token),
    )
  ) {
    return true;
  }
  return false;
}

function classifyTable(rows: string[][]): "feature" | "differential" | null {
  if (!rows.length || rows[0].length < 3) return null;
  const [first, second, third] = rows[0]
    .slice(0, 3)
    .map((cell) => normalizeTableHeaderCell(cell));
  if (isDifferentialTableHeader(first, second, third)) {
    return "differential";
  }
  if (
    first === "feature" ||
    first === "clinical feature" ||
    first === "clinical features" ||
    first === "mechanism" ||
    first === "severity category" ||
    first === "aspect" ||
    first === "parameter" ||
    first === "drug" ||
    first.includes("drug class") ||
    first.includes("investigation") ||
    second.includes("mechanism of action") ||
    second.includes("mechanism explanation") ||
    second === "key features" ||
    second.includes("typical finding") ||
    second.includes("expected change") ||
    second.includes("findings in") ||
    second === "key points" ||
    second.includes("clinical details") ||
    second.includes("management approach") ||
    third.includes("significance") ||
    third.includes("clinical relevance") ||
    third.includes("clinical importance") ||
    third.includes("pathophysiology") ||
    ["description", "details", "clinical description"].includes(second)
  ) {
    return "feature";
  }
  return null;
}

function tableToFeatureRecords(rows: string[][], richRows?: RichCell[][]): FeatureRow[] {
  const records: FeatureRow[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.length < 3) continue;
    const [first, second, third] = row.slice(0, 3).map((cell) => cell.trim());
    if (!first && !second && !third) continue;
    const rich = richRows?.[index];
    records.push({
      feature: first,
      ...(rich?.[0]?.html ? { featureHtml: rich[0].html } : {}),
      description: second,
      ...(rich?.[1]?.html ? { descriptionHtml: rich[1].html } : {}),
      clinicalImportance: third,
      ...(rich?.[2]?.html ? { clinicalImportanceHtml: rich[2].html } : {}),
    });
  }
  return records;
}

function tableToDifferentialRecords(
  rows: string[][],
  richRows?: RichCell[][],
): DifferentialRow[] {
  const records: DifferentialRow[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.length < 3) continue;
    const [first, second, third] = row.slice(0, 3).map((cell) => cell.trim());
    if (!first && !second && !third) continue;
    const rich = richRows?.[index];
    records.push({
      condition: first,
      ...(rich?.[0]?.html ? { conditionHtml: rich[0].html } : {}),
      distinguishingFeatures: second,
      ...(rich?.[1]?.html ? { distinguishingFeaturesHtml: rich[1].html } : {}),
      keyDifferences: third,
      ...(rich?.[2]?.html ? { keyDifferencesHtml: rich[2].html } : {}),
    });
  }
  return records;
}

async function parseTablesFromBuffer(
  buffer: Buffer,
  options?: { multiQuestion?: boolean },
) {
  let featureTable: FeatureRow[] = [];
  let differentialTable: DifferentialRow[] = [];
  let tables = await extractTablesFromBuffer(buffer);
  let richTables = await extractRichTablesFromBuffer(buffer);

  if (options?.multiQuestion) {
    let sawFeature = false;
    let sawDiff = false;
    const scoped: string[][][] = [];
    const scopedRich: RichTable[] = [];
    for (let index = 0; index < tables.length; index += 1) {
      const rows = tables[index];
      scoped.push(rows);
      scopedRich.push(richTables[index] ?? []);
      const tableType = classifyTable(rows);
      if (tableType === "feature") sawFeature = true;
      if (tableType === "differential") sawDiff = true;
      if (sawFeature && sawDiff) break;
    }
    tables = scoped.length ? scoped : tables.slice(0, 1);
    richTables = scopedRich.length ? scopedRich : richTables.slice(0, 1);
  }

  for (let index = 0; index < tables.length; index += 1) {
    const rows = tables[index];
    const richRows = richTables[index];
    const tableType = classifyTable(rows);
    if (tableType === "feature" && featureTable.length === 0) {
      featureTable = tableToFeatureRecords(rows, richRows);
    } else if (tableType === "differential" && differentialTable.length === 0) {
      differentialTable = tableToDifferentialRecords(rows, richRows);
    }
  }
  return { featureTable, differentialTable };
}

function countDiagramCaptions(paragraphs: string[]): number {
  return paragraphs.filter((paragraph) => DIAGRAM_RE.test(paragraph)).length;
}

function extractPreDiagramFeatureName(preDiagram: string[]): string | undefined {
  const parts: string[] = [];
  for (let index = preDiagram.length - 1; index >= 0; index -= 1) {
    const line = preDiagram[index]?.trim();
    if (!line) continue;
    if (
      isProseContentLine(line) ||
      isTableHeaderLabel(line) ||
      isSecondaryKeyConceptHeading(line) ||
      isDifferentialDelimiter(line)
    ) {
      break;
    }
    if (parts.length && parts[0].toLowerCase() === line.toLowerCase()) continue;
    parts.unshift(line.replace(/:$/, "").trim());
    if (parts.length >= 4) break;
  }
  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.some((entry) => entry.toLowerCase() === part.toLowerCase())) {
      unique.push(part);
    }
  }
  return normalizeTableName(unique);
}

async function extractImagesFromBuffer(
  buffer: Buffer,
  imagesDir: string,
  maxImages?: number,
): Promise<ImageRef[]> {
  await mkdir(imagesDir, { recursive: true });
  const zip = await JSZip.loadAsync(buffer);
  const mediaFiles = Object.keys(zip.files)
    .filter((name) => name.startsWith("word/media/") && !zip.files[name].dir)
    .sort();

  const limit = maxImages ?? mediaFiles.length;
  const extracted: ImageRef[] = [];
  for (const [index, mediaPath] of mediaFiles.entries()) {
    if (extracted.length >= limit) break;
    const sourceName = path.basename(mediaPath);
    const extension = path.extname(mediaPath) || ".bin";
    const targetName = `image${index + 1}${extension}`;
    const targetPath = path.join(imagesDir, targetName);
    const content = await zip.file(mediaPath)!.async("nodebuffer");
    await writeFile(targetPath, content);
    extracted.push({
      filename: targetName,
      path: `images/${targetName}`,
      sourceName,
    });
  }
  return extracted;
}

function findMetadataRange(paragraphs: string[], searchFrom: number): [number | null, number | null] {
  let start: number | null = null;
  for (let index = searchFrom; index < paragraphs.length; index += 1) {
    if (isMetadataLine(paragraphs[index])) {
      start = index;
      break;
    }
  }
  if (start === null) return [null, null];
  let end = start;
  while (end < paragraphs.length && isMetadataLine(paragraphs[end])) end += 1;
  return [start, end];
}

function parseKeyConceptText(
  entries: FormattedParagraphEntry[],
  keyConceptIndex: number,
  metadataStart: number,
): { text: string; html?: string } {
  const slice = entries.slice(keyConceptIndex + 1, metadataStart);
  const text = slice
    .map((entry) => entry.formatted.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
  const html = joinFormattedHtml(slice.map((entry) => entry.formatted)) || undefined;
  return { text, html };
}

function findDiagramCaption(entries: FormattedParagraphEntry[]): {
  text: string | null;
  html?: string;
} {
  for (const entry of entries) {
    if (DIAGRAM_RE.test(entry.formatted.text)) {
      return {
        text: entry.formatted.text.trim(),
        html: singleParagraphHtml(entry.formatted) || undefined,
      };
    }
  }
  return { text: null };
}

function normalizeTableName(parts: string[]): string | undefined {
  const name = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return name || undefined;
}

function isSecondaryKeyConceptHeading(paragraph: string): boolean {
  const line = paragraph.toLowerCase().trim();
  return (
    line === "key concept" ||
    line === "key point" ||
    line === "key points" ||
    /^key (concept summary|clinical insight|diagnostic insight|takeaway)$/.test(line)
  );
}

function isTableHeaderLabel(line: string): boolean {
  const trimmed = line.trim();
  if (
    trimmed === "Feature" ||
    trimmed === "Clinical Feature" ||
    trimmed === "Details" ||
    trimmed === "Differential Diagnosis" ||
    trimmed === "Condition" ||
    trimmed === "Notes" ||
    trimmed === "Note" ||
    trimmed === "Summary" ||
    trimmed === "Brief Key Points" ||
    trimmed === "Key Point" ||
    trimmed === "Key Points" ||
    trimmed === "Investigation" ||
    trimmed === "Description" ||
    trimmed === "Morphology" ||
    trimmed === "Distribution"
  ) {
    return true;
  }
  return (
    /^Notes\s*\//i.test(trimmed) ||
    /^Purpose\s*\//i.test(trimmed) ||
    /^Key Points\s*\//i.test(trimmed)
  );
}

function getPreDiagramTitleRegion(rest: string[]): string[] {
  const diagramIdx = rest.findIndex((paragraph) => DIAGRAM_RE.test(paragraph));
  if (diagramIdx >= 0) return rest.slice(0, diagramIdx);

  const tableHeaderIdx = rest.findIndex((line) => isTableHeaderLabel(line));
  return tableHeaderIdx >= 0 ? rest.slice(0, tableHeaderIdx) : rest;
}

function isDifferentialDelimiter(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^differential diagnosis(\s+of)?$/i.test(trimmed) ||
    /^differential diagnosis of\b/i.test(trimmed)
  );
}

function isProseContentLine(line: string): boolean {
  if (line.length > 180) return true;
  if (line.length > 90 && /[.!:]\s/.test(line)) return true;
  if (line.endsWith(":") && line.length > 40) return true;
  if (/\bis based on\b/i.test(line)) return true;
  if (/\bmust be distinguished\b/i.test(line)) return true;
  if (/\bis distinguished by\b/i.test(line)) return true;
  if (line.endsWith(".") && line.split(/\s+/).length >= 6) return true;
  return false;
}

function isBadFeatureName(name?: string): boolean {
  if (!name) return true;
  if (/^Notes\b|^Note\b|^Summary\b/i.test(name)) return true;
  if (/Differentiation is based on|must be distinguished|is distinguished by/i.test(name)) return true;
  if (/\. [A-Z(]/.test(name)) return true;
  return false;
}

function skipLongContentLines(lines: string[], startIndex: number): number {
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }
    if (
      isProseContentLine(line) ||
      isSecondaryKeyConceptHeading(line) ||
      isMetadataLine(line) ||
      isTableHeaderLabel(line)
    ) {
      index += 1;
      continue;
    }
    break;
  }
  return index;
}

function scoreFeatureName(name?: string): number {
  if (!name) return -1;
  let score = name.length;
  if (name.includes("–") || name.includes("-")) score += 50;
  if (/Recognition|Diagnosis|Management|Approach/i.test(name)) score += 30;
  if (/Differential Diagnosis/i.test(name)) score -= 60;
  if (name.split(/\s+/).length > 6 && !name.includes("–") && !name.includes("-")) {
    score -= 80;
  }
  return score;
}

function findFeatureTitleStart(lines: string[], startIndex: number): number {
  const direct = collectTitleLines(lines, startIndex);
  if (direct.lines.length > 0 && direct.lines.length <= 4) {
    const joined = direct.lines.join(" ");
    if (
      joined.includes("–") ||
      joined.includes("-") ||
      /Recognition|Diagnosis|Management|Approach/i.test(joined)
    ) {
      return startIndex;
    }
  }

  for (let index = lines.length - 1; index >= startIndex; index -= 1) {
    const line = lines[index]?.trim();
    if (!line || isProseContentLine(line)) continue;
    if (line.includes("–") || (line.includes("-") && !/^X-ray\b/i.test(line))) {
      const prev = lines[index - 1]?.trim();
      if (
        index > startIndex &&
        prev &&
        !isProseContentLine(prev) &&
        (/^[a-z(]/.test(prev) || prev.includes("–") || prev.includes("-"))
      ) {
        return index - 1;
      }
      return index;
    }
  }

  return startIndex;
}

function chooseFeatureTableName(
  forward?: string,
  trailing?: string,
  beforeDiff?: string,
): string | undefined {
  if (forward && !isBadFeatureName(forward) && scoreFeatureName(forward) > 0) {
    return forward;
  }
  const fallback = [trailing, beforeDiff, forward]
    .filter(Boolean)
    .map((name) => ({ name: name as string, score: scoreFeatureName(name) }))
    .sort((a, b) => b.score - a.score);
  return fallback[0]?.name;
}

function chooseDiagramName(
  forward?: string,
  trailing?: string,
  beforeDiff?: string,
): string | undefined {
  if (trailing && scoreFeatureName(trailing) > 0) return trailing;
  if (forward && scoreFeatureName(forward) > 0) return forward;
  return beforeDiff;
}

function extractTrailingTitleLines(preDiagram: string[]): string[] {
  if (!preDiagram.length) return [];

  const last = preDiagram[preDiagram.length - 1]?.trim();
  if (!last || isProseContentLine(last) || DIAGRAM_RE.test(last)) return [];

  const parts = [last];
  if (preDiagram.length >= 2) {
    const prev = preDiagram[preDiagram.length - 2]?.trim();
    if (
      prev &&
      !isProseContentLine(prev) &&
      !isSecondaryKeyConceptHeading(prev) &&
      !isDifferentialDelimiter(prev) &&
      !isTableHeaderLabel(prev) &&
      prev.length < 80 &&
      !prev.endsWith(".") &&
      (/^[a-z(]/.test(prev) || prev.includes("–") || prev.includes("-"))
    ) {
      parts.unshift(prev);
    }
  }
  return parts;
}

function collectTitleLines(
  lines: string[],
  startIndex: number,
): { lines: string[]; nextIndex: number } {
  const parts: string[] = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }
    if (
      isProseContentLine(line) ||
      isSecondaryKeyConceptHeading(line) ||
      isMetadataLine(line) ||
      isDifferentialDelimiter(line) ||
      isTableHeaderLabel(line)
    ) {
      break;
    }
    parts.push(line);
    index += 1;
  }
  return { lines: parts, nextIndex: index };
}

function collectInitialTitleRun(lines: string[]): string[] {
  const parts: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (
      isTableHeaderLabel(trimmed) ||
      isProseContentLine(trimmed) ||
      isSecondaryKeyConceptHeading(trimmed) ||
      isDifferentialDelimiter(trimmed)
    ) {
      break;
    }
    parts.push(trimmed);
  }
  return parts;
}

function extendDiffEnd(preDiagram: string[], ddDelimiterIdx: number): number {
  const delimiterLine = preDiagram[ddDelimiterIdx]?.trim() ?? "";
  if (/^differential diagnosis of\s+\S+/i.test(delimiterLine)) {
    return ddDelimiterIdx;
  }

  let diffEnd = ddDelimiterIdx;
  if (diffEnd + 1 < preDiagram.length) {
    const next = preDiagram[diffEnd + 1].trim();
    if (
      next.length <= 120 &&
      !isTableHeaderLabel(next) &&
      !isSecondaryKeyConceptHeading(next) &&
      !isDifferentialDelimiter(next) &&
      !isProseContentLine(next)
    ) {
      diffEnd += 1;
    }
  }
  return diffEnd;
}

function buildDifferentialTableName(
  preDiagram: string[],
  ddDelimiterIdx: number,
  diffEnd: number,
): string | undefined {
  const titleBeforeDiff = collectInitialTitleRun(
    preDiagram.slice(0, ddDelimiterIdx).filter((line) => !isMetadataLine(line)),
  );
  const diffSection = preDiagram
    .slice(ddDelimiterIdx, diffEnd + 1)
    .filter((line) => !isMetadataLine(line));
  return normalizeTableName([...titleBeforeDiff, ...diffSection]);
}

/**
 * After metadata, table titles appear as paragraphs before the diagram caption.
 * Layout A: diff title → optional secondary Key Concept block → feature/diagram title.
 * Layout B: diff title (through "Differential Diagnosis of …") → feature/diagram title.
 */
function extractTableNamesAfterMetadata(
  paragraphs: string[],
  metadataEnd: number | null,
): {
  featureTableName?: string;
  differentialDiagnosisTableName?: string;
  diagramName?: string;
} {
  if (metadataEnd === null || metadataEnd >= paragraphs.length) {
    return {};
  }

  const rest = paragraphs.slice(metadataEnd);
  const preDiagram = getPreDiagramTitleRegion(rest);
  if (!preDiagram.length) return {};

  const secondaryKeyConceptIdx = preDiagram.findIndex((paragraph) =>
    isSecondaryKeyConceptHeading(paragraph),
  );

  if (secondaryKeyConceptIdx > 0) {
    const ddBeforeKc = preDiagram.findIndex(
      (line, index) => index < secondaryKeyConceptIdx && isDifferentialDelimiter(line),
    );
    const differentialTableName =
      ddBeforeKc !== -1
        ? buildDifferentialTableName(
            preDiagram,
            ddBeforeKc,
            extendDiffEnd(preDiagram, ddBeforeKc),
          )
        : normalizeTableName(
            preDiagram.slice(0, secondaryKeyConceptIdx).filter((line) => !isMetadataLine(line)),
          );
    const featureIndex = findFeatureTitleStart(
      preDiagram,
      skipLongContentLines(preDiagram, secondaryKeyConceptIdx + 1),
    );
    const forwardName = normalizeTableName(
      collectTitleLines(preDiagram, featureIndex).lines,
    );
    const trailingName = normalizeTableName(extractTrailingTitleLines(preDiagram));
    const featureTableName = chooseFeatureTableName(forwardName, trailingName);
    const diagramName = chooseDiagramName(forwardName, trailingName) || featureTableName;

    return {
      differentialDiagnosisTableName: differentialTableName,
      featureTableName,
      diagramName,
    };
  }

  const ddDelimiterIdx = preDiagram.findIndex((line) => isDifferentialDelimiter(line));
  if (ddDelimiterIdx === -1) {
    const preDiagramName = extractPreDiagramFeatureName(preDiagram);
    const trailingName = normalizeTableName(extractTrailingTitleLines(preDiagram));
    const name =
      chooseFeatureTableName(preDiagramName, trailingName) || preDiagramName || trailingName;
    return { featureTableName: name, diagramName: chooseDiagramName(preDiagramName, trailingName) || name };
  }

  let diffEnd = extendDiffEnd(preDiagram, ddDelimiterIdx);

  const differentialTableName = buildDifferentialTableName(preDiagram, ddDelimiterIdx, diffEnd);

  let featureStart = diffEnd + 1;
  const secondaryKcAfterDiff = preDiagram.findIndex(
    (line, index) => index >= featureStart && isSecondaryKeyConceptHeading(line),
  );
  if (secondaryKcAfterDiff !== -1) {
    featureStart = skipLongContentLines(preDiagram, secondaryKcAfterDiff + 1);
  }
  featureStart = findFeatureTitleStart(preDiagram, featureStart);

  const forwardName = normalizeTableName(collectTitleLines(preDiagram, featureStart).lines);
  const trailingName = normalizeTableName(extractTrailingTitleLines(preDiagram));
  const beforeDiffName = normalizeTableName(
    collectInitialTitleRun(
      preDiagram.slice(0, ddDelimiterIdx).filter((line) => !isMetadataLine(line)),
    ),
  );
  const featureTableName = chooseFeatureTableName(forwardName, trailingName, beforeDiffName);
  const diagramName = chooseDiagramName(forwardName, trailingName, beforeDiffName) || featureTableName;

  return {
    differentialDiagnosisTableName: differentialTableName,
    featureTableName,
    diagramName,
  };
}

function optionPrefixOffset(text: string): number {
  const match = text.match(/^[A-E][.)]\s*/);
  return match ? match[0].length : 0;
}

function stemContentOffset(text: string, rawStem: string): number {
  const trimmed = rawStem.trim();
  const index = text.indexOf(trimmed);
  if (index >= 0) return index;
  const match = text.match(QUESTION_NUM_RE);
  if (match) return match[0].length;
  return 0;
}

function splitStemAndOptionEntries(
  entries: FormattedParagraphEntry[],
  stemIndex: number,
  answerIndex: number,
): { stemContinuationEntries: FormattedParagraphEntry[]; optionEntries: FormattedParagraphEntry[] } {
  const betweenEntries = entries
    .slice(stemIndex + 1, answerIndex)
    .filter((entry) => Boolean(entry.formatted.text.trim()));

  const paragraphs = entries.map((entry) => entry.formatted.text);
  const { stemContinuations, optionTexts } = splitStemAndOptionTexts(
    paragraphs,
    stemIndex,
    answerIndex,
  );

  if (stemContinuations.length === 0 && optionTexts.length === betweenEntries.length) {
    return { stemContinuationEntries: [], optionEntries: betweenEntries };
  }

  const optionEntries = betweenEntries.slice(-optionTexts.length);
  const stemContinuationEntries = betweenEntries.slice(0, betweenEntries.length - optionTexts.length);
  return { stemContinuationEntries, optionEntries };
}

function parseQuestionBlock(entries: FormattedParagraphEntry[]) {
  const paragraphs = entries.map((entry) => entry.formatted.text);
  const questionId = findQuestionId(paragraphs);
  if (!questionId) throw new Error("Could not find Question Id");

  const stemIndex = paragraphs.findIndex((paragraph) => QUESTION_NUM_RE.test(paragraph));
  if (stemIndex === -1) throw new Error("Could not find question stem");

  const stemMatch = paragraphs[stemIndex].match(QUESTION_NUM_RE);
  if (!stemMatch) throw new Error("Could not parse question stem");

  const answerIndex = paragraphs.findIndex((paragraph) => ANSWER_RE.test(paragraph));
  if (answerIndex === -1) throw new Error("Could not find answer");

  const { stemContinuationEntries, optionEntries } = splitStemAndOptionEntries(
    entries,
    stemIndex,
    answerIndex,
  );
  const options = optionEntries.map((entry) =>
    entry.formatted.text.trim().replace(/^[A-E][.)]\s*/, ""),
  );

  if (options.length !== 5) {
    throw new Error(`Expected 5 options, found ${options.length}`);
  }

  const answerMatch = paragraphs[answerIndex].match(ANSWER_RE);
  if (!answerMatch) throw new Error("Could not parse answer");

  const stemEntry = entries[stemIndex];
  const stemOffset = stemContentOffset(stemEntry.formatted.text, stemMatch[2]);
  const stemInnerHtml = sliceParagraphHtml(stemEntry.raw, stemOffset);
  const stemHtmlParts: string[] = [];
  if (stemInnerHtml) stemHtmlParts.push(`<p>${stemInnerHtml}</p>`);
  for (const entry of stemContinuationEntries) {
    const html = singleParagraphHtml(entry.formatted);
    if (html) stemHtmlParts.push(html.startsWith("<") ? html : `<p>${html}</p>`);
  }
  const stemHtml = stemHtmlParts.length ? stemHtmlParts.join("") : undefined;
  const stemTextParts = [
    normalizeStemText(stemMatch[2]),
    ...stemContinuationEntries.map((entry) => entry.formatted.text.trim()),
  ].filter(Boolean);

  const optionsHtml = optionEntries.map((entry) => {
    const offset = optionPrefixOffset(entry.formatted.text);
    const inner = sliceParagraphHtml(entry.raw, offset);
    return inner ? `<p>${inner}</p>` : undefined;
  });

  return {
    questionId,
    questionNumber: stemMatch[1],
    stem: stemTextParts.join("\n"),
    stemHtml,
    options,
    optionsHtml,
    correctAnswer: answerMatch[1].toUpperCase(),
  };
}

function parseKeywords(
  entries: FormattedParagraphEntry[],
  startIndex: number,
  endIndex: number,
) {
  const paragraphs = entries.map((entry) => entry.formatted.text);
  const keywords: string[] = [];
  const keywordParagraphs: FormattedParagraph[] = [];
  let classicTriad: string | undefined;
  let classicTriadHtml: string | undefined;
  let classicTriadTitle: string | undefined;
  let index = startIndex;

  while (index < endIndex) {
    const entry = entries[index];
    const paragraph = paragraphs[index];
    if (paragraph.toLowerCase().startsWith("explanation")) break;

    if (isClassicTriadHeadingLine(paragraph)) {
      const title = normalizeTriadTitle(paragraph);
      classicTriadTitle = classicTriadTitle ? `${classicTriadTitle} — ${title}` : title;

      const colonIndex = paragraph.lastIndexOf(":");
      const inline =
        colonIndex >= 0 && colonIndex < paragraph.length - 1
          ? paragraph.slice(colonIndex + 1).trim()
          : "";
      if (inline && isLikelyTriadContentLine(inline)) {
        classicTriad = classicTriad ? `${classicTriad}\n${inline}` : inline;
        const inlineOffset = colonIndex + 1;
        const inlineHtml = sliceParagraphHtml(entry.raw, inlineOffset).trim();
        const htmlPart = inlineHtml ? `<p>${inlineHtml}</p>` : `<p>${inline}</p>`;
        classicTriadHtml = classicTriadHtml ? `${classicTriadHtml}${htmlPart}` : htmlPart;
        index += 1;
        continue;
      }

      index += 1;
      const contentLines: FormattedParagraph[] = [];
      while (index < endIndex) {
        const nextParagraph = paragraphs[index]?.trim() ?? "";
        if (!nextParagraph) {
          index += 1;
          continue;
        }
        if (nextParagraph.toLowerCase().startsWith("explanation")) break;
        if (isKeywordsSectionFooterLine(nextParagraph)) break;

        if (isClassicTriadHeadingLine(nextParagraph)) {
          const subtitle = normalizeTriadTitle(nextParagraph);
          classicTriadTitle = classicTriadTitle
            ? `${classicTriadTitle} — ${subtitle}`
            : subtitle;
          index += 1;
          continue;
        }

        contentLines.push(entries[index].formatted);
        index += 1;

        if (isLikelyTriadContentLine(nextParagraph) && /\s\+\s/.test(nextParagraph)) {
          break;
        }
      }

      if (contentLines.length > 0) {
        const text = contentLines
          .map((line) => line.text)
          .filter(Boolean)
          .join("\n")
          .trim();
        const html = joinFormattedHtml(contentLines);
        classicTriad = classicTriad ? `${classicTriad}\n${text}` : text;
        classicTriadHtml = classicTriadHtml
          ? `${classicTriadHtml}${html || ""}`
          : html || undefined;
      }
      continue;
    }

    if (isKeywordsSectionFooterLine(paragraph)) {
      index += 1;
      continue;
    }

    keywords.push(paragraph.trim());
    keywordParagraphs.push(entry.formatted);
    index += 1;
  }

  const keywordsHtml = buildGroupedHtmlFragments(keywordParagraphs);

  return { keywords, keywordsHtml, classicTriad, classicTriadHtml, classicTriadTitle };
}

function parseExplanations(
  entries: FormattedParagraphEntry[],
  startIndex: number,
  endIndex: number,
): Record<string, Explanation> {
  const paragraphs = entries.map((entry) => entry.formatted.text);
  const explanations: Record<string, Explanation> = {};
  let currentLetter: string | null = null;
  let currentTitle: string | null = null;
  let bodyParagraphs: FormattedParagraph[] = [];
  let reasoningParagraphs: FormattedParagraph[] = [];
  let systemInvolved: string | undefined;
  let systemInvolvedHtml: string | undefined;
  let mode: "body" | "reasoning" = "body";

  const flush = () => {
    if (!currentLetter) return;
    const body = bodyParagraphs.map((p) => p.text).filter(Boolean).join("\n").trim();
    const bodyHtml = joinFormattedHtml(bodyParagraphs) || undefined;
    const entry: Explanation = { title: currentTitle ?? "", body };
    if (bodyHtml) entry.bodyHtml = bodyHtml;
    const clinicalReasoning = reasoningParagraphs
      .map((p) => p.text)
      .filter(Boolean)
      .join("\n")
      .trim();
    if (clinicalReasoning) {
      entry.clinicalReasoning = clinicalReasoning;
      const clinicalReasoningHtml = joinFormattedHtml(reasoningParagraphs);
      if (clinicalReasoningHtml) entry.clinicalReasoningHtml = clinicalReasoningHtml;
    }
    if (systemInvolved) {
      entry.systemInvolved = systemInvolved;
      if (systemInvolvedHtml) entry.systemInvolvedHtml = systemInvolvedHtml;
    }
    explanations[currentLetter] = entry;
    currentLetter = null;
    currentTitle = null;
    bodyParagraphs = [];
    reasoningParagraphs = [];
    systemInvolved = undefined;
    systemInvolvedHtml = undefined;
    mode = "body";
  };

  for (let index = startIndex; index < endIndex; index += 1) {
    const paragraph = paragraphs[index];
    const formatted = entries[index].formatted;
    const optionMatch = parseOptionLine(paragraph);
    if (optionMatch) {
      flush();
      currentLetter = optionMatch.letter;
      currentTitle = optionMatch.title;
      mode = "body";
      continue;
    }
    if (!currentLetter) continue;

    const lowered = paragraph.toLowerCase().trim();
    if (lowered.startsWith("clinical reasoning")) {
      mode = "reasoning";
      const inline = afterFirstColon(paragraph);
      if (inline) {
        const offset = paragraph.indexOf(":") + 1;
        const inlineHtml = sliceParagraphHtml(entries[index].raw, offset).trim();
        reasoningParagraphs.push({
          ...formatted,
          text: inline,
          innerHtml: inlineHtml || formatted.innerHtml,
        });
      }
      continue;
    }
    if (lowered.startsWith("system involved:") || lowered.startsWith("system:")) {
      systemInvolved = afterFirstColon(paragraph);
      const offset = paragraph.indexOf(":") + 1;
      const html = sliceParagraphHtml(entries[index].raw, offset).trim();
      systemInvolvedHtml = html ? `<p>${html}</p>` : undefined;
      mode = "body";
      continue;
    }

    if (mode === "reasoning") reasoningParagraphs.push(formatted);
    else bodyParagraphs.push(formatted);
  }

  flush();
  return explanations;
}

function enrichMetadata(metadata: QuestionMetadata, paragraphs: string[]): void {
  if (!metadata.category) {
    for (const paragraph of paragraphs.slice(0, 15)) {
      const trimmed = paragraph.trim();
      if (QUESTION_ID_RE.test(trimmed) || QUESTION_NUM_RE.test(trimmed)) continue;
      if (/FCPS-?1|JCAT|NRE/i.test(trimmed)) {
        metadata.category = "FCPS-1/ JCAT";
        break;
      }
    }
  }
  if (!metadata.system && metadata.topic) {
    const topicPath = `${metadata.topic} ${metadata.subtopic ?? ""}`;
    if (/asthma|pulmon|respir|bronch/i.test(topicPath)) {
      metadata.system = "Respiratory System (Pulmonology)";
    }
  }
}

function parseMetadata(paragraphs: string[], startIndex: number, endIndex: number): QuestionMetadata {
  const metadata: QuestionMetadata = {};
  for (const paragraph of paragraphs.slice(startIndex, endIndex)) {
    if (paragraph.startsWith("Domain:")) {
      const value = paragraph.slice("Domain:".length).trim();
      if (COMPETENCY_DOMAIN_VALUES.has(value.toLowerCase())) {
        metadata.competencyDomain = value;
      } else {
        metadata.domain = value;
      }
      continue;
    }
    if (paragraph.startsWith("Subject:")) {
      metadata.product = metadata.product || paragraph.slice("Subject:".length).trim();
      continue;
    }
    for (const [label, key] of Object.entries(METADATA_FIELDS)) {
      const prefix = `${label}:`;
      if (paragraph.startsWith(prefix)) {
        metadata[key] = paragraph.slice(prefix.length).trim();
        break;
      }
    }
  }
  enrichMetadata(metadata, paragraphs);
  return metadata;
}

async function parseDocxFromBuffer(
  buffer: Buffer,
): Promise<{ questionData: QuestionData; diagramImageCount: number }> {
  const entries = await extractParagraphEntriesFromBuffer(buffer);
  const paragraphs = entries.map((entry) => entry.formatted.text);
  const question = parseQuestionBlock(entries);

  let keywordsStart = findSectionIndex(paragraphs, "Keywords in the Stem to identify correct option");
  if (keywordsStart === null) {
    keywordsStart = findSectionIndex(paragraphs, "Keywords in the Stem");
  }
  const explanationStart = findSectionIndex(paragraphs, "Explanation");
  if (keywordsStart === null || explanationStart === null) {
    throw new Error("Could not locate keywords or explanation section");
  }

  const keywordData = parseKeywords(entries, keywordsStart + 1, explanationStart);
  const firstKeyConceptIndex = findPrimaryKeyConceptIndex(paragraphs, explanationStart);

  const explanations = parseExplanations(entries, explanationStart + 1, firstKeyConceptIndex);
  const [metadataStart, metadataEnd] = findMetadataRange(paragraphs, firstKeyConceptIndex + 1);

  let keyConcept = "";
  let keyConceptHtml: string | undefined;
  if (firstKeyConceptIndex < paragraphs.length && metadataStart !== null) {
    const keyConceptData = parseKeyConceptText(entries, firstKeyConceptIndex, metadataStart);
    keyConcept = keyConceptData.text;
    keyConceptHtml = keyConceptData.html;
  }

  let metadata: QuestionMetadata = {};
  if (metadataStart !== null && metadataEnd !== null) {
    metadata = parseMetadata(paragraphs, metadataStart, metadataEnd);
  }

  const contentEnd =
    metadataEnd !== null
      ? findQuestionContentEnd(paragraphs, question.questionId, metadataEnd)
      : paragraphs.length;
  const scopedEntries = entries.slice(0, contentEnd);
  const scopedParagraphs = scopedEntries.map((entry) => entry.formatted.text);
  const scopedAfterMetadata =
    metadataEnd !== null ? scopedEntries.slice(metadataEnd) : [];

  const isMultiQuestion = contentEnd < paragraphs.length;

  const { featureTable, differentialTable } = await parseTablesFromBuffer(buffer, {
    multiQuestion: isMultiQuestion,
  });
  const diagramCaption = findDiagramCaption(scopedEntries);
  const tableNames = extractTableNamesAfterMetadata(scopedParagraphs, metadataEnd);
  const diagramImageCount = Math.max(
    1,
    countDiagramCaptions(scopedAfterMetadata.map((entry) => entry.formatted.text)),
  );

  const result: QuestionData = {
    questionId: question.questionId,
    questionNumber: question.questionNumber,
    stem: question.stem,
    ...(question.stemHtml ? { stemHtml: question.stemHtml } : {}),
    options: question.options,
    ...(question.optionsHtml?.some(Boolean) ? { optionsHtml: question.optionsHtml } : {}),
    correctAnswer: question.correctAnswer,
    keywords: keywordData.keywords,
    ...(keywordData.keywordsHtml.length ? { keywordsHtml: keywordData.keywordsHtml } : {}),
    explanations,
    keyConcept,
    ...(keyConceptHtml ? { keyConceptHtml } : {}),
    metadata,
  };

  if (keywordData.classicTriad) {
    result.classicTriad = keywordData.classicTriad;
    if (keywordData.classicTriadHtml) result.classicTriadHtml = keywordData.classicTriadHtml;
    if (keywordData.classicTriadTitle) result.classicTriadTitle = keywordData.classicTriadTitle;
  }
  if (tableNames.featureTableName) result.featureTableName = tableNames.featureTableName;
  if (tableNames.differentialDiagnosisTableName) {
    result.differentialDiagnosisTableName = tableNames.differentialDiagnosisTableName;
  }
  if (featureTable.length > 0) result.featureTable = featureTable;
  if (differentialTable.length > 0) result.differentialDiagnosisTable = differentialTable;
  if (diagramCaption.text || tableNames.diagramName) {
    result.diagram = {
      ...(tableNames.diagramName ? { name: tableNames.diagramName } : {}),
      ...(diagramCaption.text ? { caption: diagramCaption.text } : {}),
      ...(diagramCaption.html ? { captionHtml: diagramCaption.html } : {}),
    };
  }

  return { questionData: result, diagramImageCount };
}

async function convertFromBuffer(
  buffer: Buffer,
  outputDir: string,
): Promise<{ questionId: string }> {
  const { questionData, diagramImageCount } = await parseDocxFromBuffer(buffer);
  const questionDir = path.join(outputDir, questionData.questionId);
  const imagesDir = path.join(questionDir, "images");
  await mkdir(imagesDir, { recursive: true });

  const images = await extractImagesFromBuffer(buffer, imagesDir, diagramImageCount);
  if (images.length > 0) {
    questionData.diagram = questionData.diagram ?? {};
    questionData.diagram.images = images;
    questionData.diagram.image = images[0].path;
  }

  const jsonPath = path.join(questionDir, "question.json");
  await writeFile(jsonPath, `${JSON.stringify(questionData, null, 2)}\n`, "utf-8");
  return { questionId: questionData.questionId };
}

export async function convertFilesInParallel(
  files: Array<{ buffer: Buffer; originalname: string }>,
  outputDir: string,
): Promise<ConvertFileResult[]> {
  await mkdir(outputDir, { recursive: true });

  return Promise.all(
    files.map(async (file) => {
      const validation = await validateDocxFromBuffer(
        file.buffer,
        extractParagraphsFromBuffer,
      );

      if (!validation.valid) {
        return {
          sourceName: file.originalname,
          success: false,
          validation,
          error: validation.summary,
        };
      }

      try {
        const result = await convertFromBuffer(file.buffer, outputDir);
        return {
          sourceName: file.originalname,
          questionId: result.questionId,
          success: true,
          validation,
        };
      } catch (error) {
        return {
          sourceName: file.originalname,
          success: false,
          validation,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
}
