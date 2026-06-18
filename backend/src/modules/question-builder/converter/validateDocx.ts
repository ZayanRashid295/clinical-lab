import type { ValidationIssue, ValidationResult } from "./types";
import {
  ANSWER_RE,
  CLASSIC_TRIAD_RE,
  DIAGRAM_RE,
  METADATA_LABELS,
  QUESTION_NUM_RE,
  REQUIRED_METADATA_LABELS,
  collectMetadataPresence,
  findQuestionId,
  findSectionIndex,
  findFirstKeyConceptIndex,
  findMetadataBlockStart,
  findPrimaryKeyConceptIndex,
  isClassicTriadHeadingLine,
  isKeyConceptHeading,
  isKeywordsSectionFooterLine,
  isMetadataLine,
  parseOptionLine,
  splitStemAndOptionTexts,
} from "./parser-utils";

function issue(
  code: string,
  section: string,
  severity: ValidationIssue["severity"],
  message: string,
  fix: string,
): ValidationIssue {
  return { code, section, severity, message, fix };
}

function validateParagraphs(paragraphs: string[]): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const addError = (code: string, section: string, message: string, fix: string) => {
    errors.push(issue(code, section, "error", message, fix));
  };

  const addWarning = (code: string, section: string, message: string, fix: string) => {
    warnings.push(issue(code, section, "warning", message, fix));
  };

  const questionId = findQuestionId(paragraphs);
  if (!questionId) {
    addError(
      "MISSING_QUESTION_ID",
      "Question Id",
      "Question Id is missing before the question stem.",
      'Add a line: Question Id: 506038 (use a unique ID).',
    );
  }

  const stemIndex = paragraphs.findIndex((p) => QUESTION_NUM_RE.test(p));
  if (stemIndex === -1) {
    addError(
      "MISSING_STEM",
      "Question Stem",
      'Question stem line not found. Expected format: Q 01: [vignette text]',
      "Start the stem with Q 01: (or Q 02:, Q 12A:, etc.) on its own paragraph.",
    );
  } else if (stemIndex > 10) {
    addWarning(
      "STEM_TOO_FAR",
      "Question Stem",
      "Question stem appears far from the top of the document.",
      "Place Question Id and stem near the beginning of the file.",
    );
  }

  let answerIndex = -1;
  if (stemIndex !== -1) {
    answerIndex = paragraphs.findIndex((p) => ANSWER_RE.test(p));
    if (answerIndex === -1) {
      addError(
        "MISSING_ANSWER",
        "Answer Key",
        "ANSWER: line not found.",
        "Add ANSWER: A (or B, C, D, E) immediately after the five options.",
      );
    } else {
      const { optionTexts } = splitStemAndOptionTexts(paragraphs, stemIndex, answerIndex);
      if (optionTexts.length !== 5) {
        addError(
          "OPTION_COUNT",
          "Options",
          `Expected exactly 5 options, found ${optionTexts.length}.`,
          "Place exactly five option lines between the stem and ANSWER: (one per paragraph).",
        );
      }
    }
  }

  if (answerIndex !== -1 && !ANSWER_RE.test(paragraphs[answerIndex])) {
    addError(
      "INVALID_ANSWER",
      "Answer Key",
      "ANSWER line is malformed.",
      "Use format: ANSWER: A (single letter A–E).",
    );
  }

  let keywordsStart = findSectionIndex(paragraphs, "Keywords in the Stem to identify correct option");
  if (keywordsStart === null) {
    keywordsStart = findSectionIndex(paragraphs, "Keywords in the Stem");
  }
  if (keywordsStart === null) {
    addError(
      "MISSING_KEYWORDS",
      "Keywords",
      "Keywords section heading not found.",
      "Add heading: Keywords in the Stem to identify correct option",
    );
  } else {
    const explanationStart = findSectionIndex(paragraphs, "Explanation");
    if (explanationStart !== null && explanationStart > keywordsStart + 1) {
      const keywordLines = paragraphs.slice(keywordsStart + 1, explanationStart).filter(
        (p) => !p.toLowerCase().startsWith("explanation"),
      );
      const contentLines = keywordLines.filter(
        (p) =>
          !isClassicTriadHeadingLine(p) &&
          !isKeywordsSectionFooterLine(p) &&
          !CLASSIC_TRIAD_RE.test(p) &&
          p !== "Classic Triad",
      );
      if (contentLines.length === 0) {
        addWarning(
          "EMPTY_KEYWORDS",
          "Keywords",
          "Keywords section has no content.",
          "Add at least one keyword bullet below the Keywords heading.",
        );
      }
    }
  }

  const explanationStart = findSectionIndex(paragraphs, "Explanation");
  if (explanationStart === null) {
    addError(
      "MISSING_EXPLANATION",
      "Explanations",
      "Explanation section heading not found.",
      "Add a paragraph with exactly: Explanation",
    );
  } else {
    const firstKeyConcept = findPrimaryKeyConceptIndex(paragraphs, explanationStart);

    const foundOptions = new Set<string>();
    for (const paragraph of paragraphs.slice(explanationStart + 1, firstKeyConcept)) {
      const parsed = parseOptionLine(paragraph);
      if (parsed) foundOptions.add(parsed.letter);
    }

    for (const letter of ["A", "B", "C", "D", "E"]) {
      if (!foundOptions.has(letter)) {
        addError(
          `MISSING_OPTION_${letter}`,
          "Explanations",
          `Explanation for Option ${letter} is missing.`,
          `Add a block starting with (Option ${letter}) [title]: followed by explanation text.`,
        );
      }
    }
  }

  const keyConceptSearchFrom = explanationStart ?? 0;
  const keyConceptIndex = findPrimaryKeyConceptIndex(paragraphs, keyConceptSearchFrom);
  if (keyConceptIndex >= paragraphs.length) {
    addError(
      "MISSING_KEY_CONCEPT",
      "Key Concept",
      "Key Concept heading not found.",
      "Add a paragraph: Key Concept — then the summary text on the next line(s).",
    );
  } else {
    let metadataStart = findMetadataBlockStart(paragraphs, keyConceptIndex + 1);
    if (metadataStart === null) {
      metadataStart = findMetadataBlockStart(paragraphs, keyConceptSearchFrom + 1);
    }
    if (metadataStart === null) {
      addError(
        "MISSING_METADATA_BLOCK",
        "Metadata",
        "Metadata block not found after Key Concept.",
        "Add Category:, Product:, System:, etc. immediately after Key Concept text.",
      );
    } else {
      const keyConceptText = paragraphs
        .slice(keyConceptIndex + 1, metadataStart)
        .map((p) => p.trim())
        .filter(Boolean)
        .join(" ");
      if (!keyConceptText) {
        addWarning(
          "EMPTY_KEY_CONCEPT",
          "Key Concept",
          "Key Concept heading has no content.",
          "Add the key concept summary on the line(s) below the Key Concept heading.",
        );
      }
    }
  }

  const { present: metadataPresent, hasCompetency, hasProductOrSubject } =
    collectMetadataPresence(paragraphs);

  for (const label of REQUIRED_METADATA_LABELS) {
    if (metadataPresent.has(label)) continue;
    if (label === "Category" && hasProductOrSubject) continue;
    if (label === "System" && metadataPresent.has("Topic")) continue;
    addError(
      `MISSING_META_${label.replace(/\s/g, "_").toUpperCase()}`,
      "Metadata",
      `Missing metadata field: ${label}: (Product may use Subject: instead)`,
      `Add line: ${label}: [value]`,
    );
  }

  for (const label of METADATA_LABELS) {
    if (
      !(REQUIRED_METADATA_LABELS as readonly string[]).includes(label) &&
      !metadataPresent.has(label)
    ) {
      addWarning(
        `MISSING_META_${label.replace(/\s/g, "_").toUpperCase()}`,
        "Metadata",
        `Missing optional metadata field: ${label}:`,
        `Add line: ${label}: [value]`,
      );
    }
  }

  if (!hasCompetency) {
    addWarning(
      "MISSING_COMPETENCY",
      "Metadata",
      "Missing Competency Domain (or Domain: Diagnosis/Management).",
      "Add: Competency Domain: Diagnosis — or Domain: Diagnosis",
    );
  }

  if (!paragraphs.some((p) => DIAGRAM_RE.test(p))) {
    addWarning(
      "NO_DIAGRAM_CAPTION",
      "Diagram",
      "No diagram caption found (optional).",
      "If including an image, add caption starting with: This diagram illustrates …",
    );
  }

  const valid = errors.length === 0;
  return {
    valid,
    questionId: questionId ?? undefined,
    errors,
    warnings,
    summary: valid
      ? warnings.length
        ? `Valid with ${warnings.length} warning(s)`
        : "Document matches template"
      : `${errors.length} error(s) must be fixed before upload`,
  };
}

export async function validateDocxFromBuffer(
  buffer: Buffer,
  extractParagraphs: (buffer: Buffer) => Promise<string[]>,
): Promise<ValidationResult> {
  const paragraphs = await extractParagraphs(buffer);
  if (paragraphs.length === 0) {
    return {
      valid: false,
      errors: [
        issue(
          "EMPTY_DOCUMENT",
          "Document",
          "error",
          "Document appears to be empty.",
          "Add question content following the MCQ_Upload_Template.docx structure.",
        ),
      ],
      warnings: [],
      summary: "Document is empty",
    };
  }
  return validateParagraphs(paragraphs);
}
