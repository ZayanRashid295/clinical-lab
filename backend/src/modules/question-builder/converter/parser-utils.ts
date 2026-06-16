export const ANSWER_RE = /^ANSWER:\s*([A-E])\s*$/i;
export const QUESTION_ID_RE = /Question Id:\s*(\S+)/i;
export const QUESTION_NUM_RE = /^Q\s*([\dA]+):\s*(.+)$/i;
export const DIAGRAM_RE =
  /^(?:This (?:medical educational )?|The )diagram (?:illustrates|highlights|shows|depicts|provides)\b/i;
export const CLASSIC_TRIAD_RE = /^Classic Triad/i;
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
  "Subtopic",
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
  return paragraph.toLowerCase().trim().startsWith("key concept");
}

export function isMetadataLine(paragraph: string): boolean {
  if (paragraph.startsWith("Domain:")) return true;
  if (paragraph.startsWith("Competency Domain:")) return true;
  if (paragraph.startsWith("Subject:")) return true;
  return METADATA_LABELS.some((label) => paragraph.startsWith(`${label}:`));
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

export function parseOptionLine(paragraph: string): { letter: string; title: string } | null {
  const match = paragraph.match(/^\(Option ([A-E0O])\)\s*[.:]?\s*(.+?):?\s*$/);
  if (!match) return null;
  let letter = match[1].toUpperCase();
  if (letter === "0" || letter === "O") letter = "E";
  return { letter, title: match[2].trim() };
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
