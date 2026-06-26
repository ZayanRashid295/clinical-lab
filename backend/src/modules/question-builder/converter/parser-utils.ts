export const ANSWER_RE = /^ANSWER:\s*([A-E])\s*$/i;
export const QUESTION_ID_RE = /Question Id:\s*(\S+)/i;
export const QUESTION_NUM_RE = /^Q\s*([\dA]+):\s*(.+)$/i;
export const DIAGRAM_RE =
  /^(?:This (?:medical educational )?|The )diagram\b/i;
export const CLASSIC_TRIAD_RE = /^Classic Triad/i;

export function isClassicTriadHeadingLine(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) return false;
  if (/^classic triad\b/i.test(trimmed)) return true;
  if (/^classic pattern\b/i.test(trimmed)) return true;
  if (/^optional classic triad\b/i.test(trimmed)) return true;
  if (/triad in stem/i.test(trimmed)) return true;
  if (/morphological triad/i.test(trimmed)) return true;
  if (/syndrome triad/i.test(trimmed)) return true;
  if (/^classic triad identified/i.test(trimmed)) return true;
  if (lower.includes("classic triad") && trimmed.length <= 120) return true;
  return false;
}

export function isKeywordsSectionFooterLine(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  if (!trimmed) return false;
  if (/^these keywords together\b/i.test(trimmed)) return true;
  if (/^reason\b/i.test(trimmed)) return true;
  if (/^presence of this triad\b/i.test(trimmed)) return true;
  return false;
}

export function isLikelyTriadContentLine(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  if (!trimmed) return false;
  if (isClassicTriadHeadingLine(trimmed)) return false;
  if (isKeywordsSectionFooterLine(trimmed)) return false;
  if (/\s\+\s/.test(trimmed)) return true;
  if (/→/.test(trimmed)) return true;
  if (/^[-•]\s/.test(trimmed)) return true;
  return false;
}

export function normalizeTriadTitle(paragraph: string): string {
  return paragraph.trim().replace(/:+\s*$/, "").trim();
}
export const STEM_ID_SUFFIX_RE = /\s*\(Question Id:\s*\S+\)\s*$/i;

export const METADATA_LABELS = [
  "Category",
  "Product",
  "System",
  "Topic",
  "Subtopic",
  "MCQ Title",
  "Cognitive Level",
  "Clinical Skill",
  "Difficulty Level",
] as const;

/** Required for validation errors; optional fields only warn when absent. */
export const REQUIRED_METADATA_LABELS = [
  "Category",
  "Product",
  "System",
  "Topic",
  "MCQ Title",
] as const;

export const COMPETENCY_DOMAIN_VALUES = new Set([
  "diagnosis",
  "management",
  "investigation",
  "investigations",
]);

export function findSectionIndex(paragraphs: string[], label: string): number | null {
  const index = paragraphs.findIndex((p) => p.toLowerCase() === label.toLowerCase());
  return index === -1 ? null : index;
}

export function isKeyConceptHeading(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "key concept" || /^key concept\s+of(?:\s+the)?\s+mcq$/i.test(trimmed)) {
    return true;
  }
  if (/^key concept\s*\([^)]+\)/i.test(trimmed)) return true;
  if (/^key concept\s*[—–-]\s*\S/i.test(trimmed) && !/^key concept\s*:/i.test(trimmed)) {
    return true;
  }
  // Inline "Key concept: explanation..." inside an option block is not the section heading.
  if (/^key concept\s*:/i.test(trimmed)) {
    return trimmed.slice(trimmed.indexOf(":") + 1).trim().length === 0;
  }
  return false;
}

export function findMetadataBlockStart(paragraphs: string[], searchFrom: number): number | null {
  for (let index = searchFrom; index < paragraphs.length; index += 1) {
    if (isMetadataLine(paragraphs[index])) return index;
  }
  return null;
}

/** Prefer the Key Concept block that precedes metadata (not table-section "Key Concept" labels). */
export function findPrimaryKeyConceptIndex(paragraphs: string[], explanationStart: number): number {
  const metadataStart = findMetadataBlockStart(paragraphs, explanationStart + 1);
  if (metadataStart !== null) {
    for (let index = metadataStart - 1; index > explanationStart; index -= 1) {
      const paragraph = paragraphs[index].trim();
      if (!paragraph) continue;
      if (isKeyConceptHeading(paragraph)) return index;
    }
  }

  for (let index = explanationStart + 1; index < paragraphs.length; index += 1) {
    const paragraph = paragraphs[index].trim();
    if (!paragraph) continue;
    if (isKeyConceptHeading(paragraph)) return index;
  }

  return findFirstKeyConceptIndex(paragraphs, explanationStart + 1);
}

export function findFirstKeyConceptIndex(paragraphs: string[], searchFrom = 0): number {
  for (let index = searchFrom; index < paragraphs.length; index += 1) {
    if (isKeyConceptHeading(paragraphs[index])) return index;
  }
  return paragraphs.length;
}

export function isMetadataLine(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  if (trimmed.startsWith("Domain:")) return true;
  if (trimmed.startsWith("Competency Domain:")) return true;
  if (trimmed.startsWith("Subject:")) return true;
  if (/^System\s*\/\s*Title:/i.test(trimmed)) return true;
  return METADATA_LABELS.some((label) => trimmed.startsWith(`${label}:`));
}

const INTERIM_TABLE_SECTION_RE =
  /^(Key Clinical Interpretation|Brief Key Points?|Clinical Takeaway|Key Concept Summary|Key Points?)$/i;

export function isInterimTableSectionHeading(paragraph: string): boolean {
  return INTERIM_TABLE_SECTION_RE.test(paragraph.trim());
}

export function isProseParagraph(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("(") && trimmed.endsWith(")") && trimmed.length <= 120) return false;
  if (/\bis defined by\b/i.test(trimmed)) return true;
  if (trimmed.length > 80 && trimmed.includes(", ") && /\.\s/.test(trimmed)) return true;
  if (/^[a-z]/.test(trimmed) && trimmed.length > 30) return true;
  return /^(Used in|Target |Chosen after|The |This |Patients |Although |A known |A \d)/.test(trimmed);
}

export function normalizeQuestionId(raw: string): string {
  return raw.replace(/[)\].,;]+$/, "").trim();
}

export function findQuestionId(paragraphs: string[]): string | null {
  const stemIndex = paragraphs.findIndex((p) => QUESTION_NUM_RE.test(p));
  const searchEnd = stemIndex >= 0 ? stemIndex : Math.min(paragraphs.length, 20);
  for (let index = 0; index < searchEnd; index += 1) {
    const match = paragraphs[index].match(QUESTION_ID_RE);
    if (match) return normalizeQuestionId(match[1]);
  }
  return null;
}

/** End index (exclusive) for the first question when a DOCX bundles multiple MCQs. */
export function findQuestionContentEnd(
  paragraphs: string[],
  questionId: string,
  searchFrom = 0,
): number {
  for (let index = searchFrom; index < paragraphs.length; index += 1) {
    const paragraph = paragraphs[index].trim();
    if (/^SECTION\s+\d+/i.test(paragraph)) return index;
    const idMatch = paragraph.match(QUESTION_ID_RE);
    if (idMatch && normalizeQuestionId(idMatch[1]) !== questionId) return index;
  }
  return paragraphs.length;
}

/** Per-answer "System involved:" heading (not question-level metadata "System:"). */
export function isSystemInvolvedHeading(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  if (/^system involved\s*:/i.test(trimmed)) return true;
  return /^system involved\s*$/i.test(trimmed);
}

export function parseOptionLine(paragraph: string): { letter: string; title: string } | null {
  const parenMatch = paragraph.match(/^\(Option ([A-E0O])\)\s*[.:]?\s*(.+?):?\s*$/);
  if (parenMatch) {
    let letter = parenMatch[1].toUpperCase();
    if (letter === "0" || letter === "O") letter = "E";
    return { letter, title: parenMatch[2].trim() };
  }

  const shortMatch = paragraph.match(/^([A-E])\)\s*(.+?)\s*$/);
  if (shortMatch) {
    return { letter: shortMatch[1], title: shortMatch[2].replace(/:$/, "").trim() };
  }

  return null;
}

export function splitStemAndOptionTexts(
  paragraphs: string[],
  stemIndex: number,
  answerIndex: number,
): { stemContinuations: string[]; optionTexts: string[] } {
  const between = paragraphs
    .slice(stemIndex + 1, answerIndex)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (between.length <= 5) {
    return { stemContinuations: [], optionTexts: between };
  }

  const letterOptionStart = between.findIndex((line) => /^[A-E][.)]\s+\S/.test(line));
  if (letterOptionStart >= 0) {
    const optionTexts = between.slice(letterOptionStart);
    if (optionTexts.length === 5) {
      return {
        stemContinuations: between.slice(0, letterOptionStart),
        optionTexts,
      };
    }
  }

  return {
    stemContinuations: between.slice(0, -5),
    optionTexts: between.slice(-5),
  };
}

export function normalizeStemText(raw: string): string {
  return raw
    .trim()
    .replace(/^(?:Q\s*[\dA]+:\s*)+/i, "")
    .replace(STEM_ID_SUFFIX_RE, "")
    .trim()
    .replace(/\s+/g, " ");
}

export function collectMetadataPresence(paragraphs: string[]): {
  present: Set<string>;
  hasCompetency: boolean;
  hasProductOrSubject: boolean;
} {
  const present = new Set<string>();
  let hasCompetency = false;
  let hasProductOrSubject = false;

  for (const paragraph of paragraphs) {
    for (const label of METADATA_LABELS) {
      if (paragraph.startsWith(`${label}:`)) present.add(label);
    }
    if (paragraph.startsWith("Subject:")) {
      present.add("Product");
      hasProductOrSubject = true;
    }
    if (paragraph.startsWith("Product:")) hasProductOrSubject = true;
    if (paragraph.startsWith("Competency Domain:")) {
      hasCompetency = true;
      present.add("Competency Domain");
    }
    if (paragraph.startsWith("Domain:")) {
      const value = paragraph.slice("Domain:".length).trim();
      if (COMPETENCY_DOMAIN_VALUES.has(value.toLowerCase())) {
        hasCompetency = true;
        present.add("Competency Domain");
      } else {
        present.add("Domain");
      }
    }
  }

  return { present, hasCompetency, hasProductOrSubject };
}
