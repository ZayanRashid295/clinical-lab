import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JSZip = require("jszip") as typeof import("jszip");
import type {
  ConvertFileResult,
  Explanation,
  ImageRef,
  QuestionData,
  QuestionMetadata,
} from "./types";
import {
  blockIndexForParagraphOrder,
  collectOrderedBodyBlocks,
  findBlockContentEnd,
  findMetadataBlockRange,
  parseTablesAndDiagramFromBlocks,
  type BodyBlock,
} from "./bodyBlockParser";
import { validateDocxFromBuffer } from "./validateDocx";
import {
  buildGroupedHtmlFragments,
  collectFormattedParagraphEntries,
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
  isSystemInvolvedHeading,
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

function countDiagramImageBlocks(blocks: BodyBlock[], fromIndex: number, toIndex: number): number {
  let sawTable = false;
  let count = 0;
  for (let index = fromIndex; index < toIndex; index += 1) {
    const block = blocks[index];
    if (block.kind === "table") sawTable = true;
    if (sawTable && block.kind === "paragraph" && block.hasImage) count += 1;
  }
  return count;
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

function mergeExplanations(existing: Explanation, incoming: Explanation): Explanation {
  const merged: Explanation = { ...incoming };
  if (!merged.title.trim() && existing.title.trim()) merged.title = existing.title;
  if ((existing.body?.length ?? 0) > (merged.body?.length ?? 0)) {
    merged.body = existing.body;
    if (existing.bodyHtml) merged.bodyHtml = existing.bodyHtml;
  }
  if (!merged.clinicalReasoning && existing.clinicalReasoning) {
    merged.clinicalReasoning = existing.clinicalReasoning;
    if (existing.clinicalReasoningHtml) merged.clinicalReasoningHtml = existing.clinicalReasoningHtml;
  }
  if (!merged.systemInvolved && existing.systemInvolved) {
    merged.systemInvolved = existing.systemInvolved;
    if (existing.systemInvolvedHtml) merged.systemInvolvedHtml = existing.systemInvolvedHtml;
  }
  return merged;
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
  let mode: "body" | "reasoning" | "system" = "body";

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
    const prior = explanations[currentLetter];
    explanations[currentLetter] = prior ? mergeExplanations(prior, entry) : entry;
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
    if (isSystemInvolvedHeading(paragraph)) {
      mode = "body";
      const inline = afterFirstColon(paragraph);
      if (inline) {
        systemInvolved = inline;
        const offset = paragraph.indexOf(":") + 1;
        const html = sliceParagraphHtml(entries[index].raw, offset).trim();
        systemInvolvedHtml = html ? `<p>${html}</p>` : undefined;
      } else {
        mode = "system";
      }
      continue;
    }

    if (mode === "system") {
      systemInvolved = paragraph.trim();
      const html = singleParagraphHtml(formatted);
      systemInvolvedHtml = html ? `<p>${html.replace(/^<p>|<\/p>$/g, "")}</p>` : undefined;
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
  let keyConceptTitle: string | undefined;
  if (firstKeyConceptIndex < paragraphs.length && metadataStart !== null) {
    const heading = paragraphs[firstKeyConceptIndex]?.trim();
    if (heading && isKeyConceptHeading(heading)) {
      keyConceptTitle = normalizeTriadTitle(heading);
    }
    const keyConceptData = parseKeyConceptText(entries, firstKeyConceptIndex, metadataStart);
    keyConcept = keyConceptData.text;
    keyConceptHtml = keyConceptData.html;
  }

  let metadata: QuestionMetadata = {};
  if (metadataStart !== null && metadataEnd !== null) {
    metadata = parseMetadata(paragraphs, metadataStart, metadataEnd);
  }

  const { documentXml, numberingXml } = await readDocxPartsFromBuffer(buffer);
  const bodyBlocks = collectOrderedBodyBlocks(documentXml, numberingXml);
  const metadataSearchFrom = blockIndexForParagraphOrder(bodyBlocks, firstKeyConceptIndex);
  const metadataBlockRange = findMetadataBlockRange(bodyBlocks, metadataSearchFrom);
  const contentEndBlockIndex = metadataBlockRange
    ? findBlockContentEnd(bodyBlocks, question.questionId, metadataBlockRange.end)
    : bodyBlocks.length;
  const supplemental = parseTablesAndDiagramFromBlocks(
    bodyBlocks,
    contentEndBlockIndex,
    metadataSearchFrom,
  );
  const diagramImageCount = metadataBlockRange
    ? countDiagramImageBlocks(bodyBlocks, metadataBlockRange.end, contentEndBlockIndex)
    : 0;

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
    ...(keyConceptTitle ? { keyConceptTitle } : {}),
    metadata,
  };

  if (keywordData.classicTriad) {
    result.classicTriad = keywordData.classicTriad;
    if (keywordData.classicTriadHtml) result.classicTriadHtml = keywordData.classicTriadHtml;
    if (keywordData.classicTriadTitle) result.classicTriadTitle = keywordData.classicTriadTitle;
  }
  if (supplemental.table1) result.table1 = supplemental.table1;
  if (supplemental.table2) result.table2 = supplemental.table2;
  if (supplemental.diagram) result.diagram = supplemental.diagram;

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

  const images = await extractImagesFromBuffer(buffer, imagesDir, diagramImageCount || undefined);
  if (images.length > 0 && questionData.diagram) {
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
