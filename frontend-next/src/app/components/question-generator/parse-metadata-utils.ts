export interface KeywordEntry {
  keyword: string;
  explanation: string;
}

export interface DocxHierarchyMetadata {
  category?: string;
  product?: string;
  system?: string;
  topic?: string;
  subtopic?: string;
  mcqTitle?: string;
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

function cleanMetadataValue(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractLabelValue(source: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const htmlRe = new RegExp(`<strong>\\s*${escaped}\\s*:?\\s*</strong>\\s*([^<]+)`, "i");
    const htmlMatch = source.match(htmlRe);
    if (htmlMatch?.[1]) {
      const v = cleanMetadataValue(htmlMatch[1]);
      if (v) return v;
    }

    const plainRe = new RegExp(`^\\s*(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*:\\s*(.+)$`, "im");
    const plainMatch = source.match(plainRe);
    if (plainMatch?.[1]) {
      const v = cleanMetadataValue(plainMatch[1]);
      if (v) return v;
    }
  }
  return undefined;
}

/** Extract Category / Product / System / Topic / Sub-Topic / MCQ Title from DOCX HTML or markdown. */
export function extractDocxHierarchyMetadata(source: string): DocxHierarchyMetadata {
  if (!source?.trim()) return {};

  const meta: DocxHierarchyMetadata = {};
  const category = extractLabelValue(source, ["Category"]);
  const product = extractLabelValue(source, ["Product"]);
  const system = extractLabelValue(source, ["System"]);
  const topic = extractLabelValue(source, ["Topic"]);
  const subtopic = extractLabelValue(source, ["Sub-Topic", "Subtopic", "Sub topic"]);
  const mcqTitle = extractLabelValue(source, ["MCQ Title", "MCQ title"]);

  if (category) meta.category = category;
  if (product) meta.product = product;
  if (system) meta.system = system;
  if (topic) meta.topic = topic;
  if (subtopic) meta.subtopic = subtopic;
  if (mcqTitle) meta.mcqTitle = mcqTitle;
  return meta;
}

export function mergeParsedHierarchy(
  parsed: DocxHierarchyMetadata,
  fromSource: DocxHierarchyMetadata,
): DocxHierarchyMetadata {
  return {
    category: parsed.category || fromSource.category,
    product: parsed.product || fromSource.product,
    system: parsed.system || fromSource.system,
    topic: parsed.topic || fromSource.topic,
    subtopic: parsed.subtopic || fromSource.subtopic,
    mcqTitle: parsed.mcqTitle || fromSource.mcqTitle,
  };
}

/** Parse "Category: value" or "**Category:** value" from a markdown line. */
export function parseHierarchyLabelLine(
  line: string,
): { label: string; value: string } | null {
  const trimmed = line.trim();
  const match = trimmed.match(
    /^(?:\*\*)?(Category|Product|System|Topic|Sub-?Topic|MCQ\s*Title)(?:\*\*)?\s*:\s*(.+)$/i,
  );
  if (!match) return null;
  const value = decodeHtmlEntities(match[2].trim());
  if (!value) return null;
  return { label: match[1].trim(), value };
}

/**
 * Extract only the first segment of a system string for strict matching.
 * - Takes the part before any dash separator ( - , – , — ).
 * - Removes anything in parentheses so the result is e.g. "Female Reproductive System" only.
 * Nothing is hardcoded; used so parsed system maps to a single chapter name.
 */
export function extractSystemFirstSegment(system: string | undefined): string {
  if (!system || typeof system !== "string") return "";
  const trimmed = system.trim();
  if (!trimmed) return "";
  const segments = trimmed.split(/\s*[-–—]\s+/);
  const first = (segments[0] ?? "").trim();
  // Strip parenthetical content (e.g. "(Labour Physiology and Stages)")
  return first.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

export function parseTagsFromString(tagString: string): string[] {
  if (!tagString || typeof tagString !== "string") return [];
  const raw = tagString.split(",").map((t) => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of raw) {
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(t);
    }
  }
  return result;
}

export function parseTagsFromYamlLine(yamlLine: string): string[] | null {
  if (!yamlLine || !yamlLine.includes("tags:")) return null;
  const trimmed = yamlLine.trim();
  const bracketMatch = trimmed.match(/tags:\s*\[\s*([\s\S]*?)\s*\]/i);
  if (bracketMatch) {
    const inner = bracketMatch[1].trim();
    if (!inner) return [];
    return parseTagsFromString(inner);
  }
  const plainMatch = trimmed.match(/tags:\s*(.+)/);
  if (plainMatch) return parseTagsFromString(plainMatch[1].trim());
  return null;
}

/** Skip lines that are section headers or boilerplate, not keyword entries */
const KEYWORD_SKIP_PATTERN = /^(Classic|This|These|Explanation|Choice-by-Choice|Subject|Topic|System|Keywords|Answer|Correct)\b/i;

/**
 * Parse a single line into keyword + explanation. Used by both MD and DOCX for consistency.
 * Supports:
 * - "keyword" – explanation  (en/em dash, arrow, hyphen)
 * - **"keyword"** – explanation  (markdown bold)
 * - - "keyword" – explanation  (list item)
 * - keyword: explanation  (colon)
 * - keyword - explanation  (hyphen, keyword < 80 chars)
 */
export function parseKeywordLine(line: string): KeywordEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (KEYWORD_SKIP_PATTERN.test(trimmed)) return null;

  // Strip optional list prefix: "- " or "* "
  let content = trimmed.replace(/^[-*]\s+/, "").trim();
  // Strip optional markdown bold around first part: **"keyword"** or **keyword**
  content = content.replace(/^\*\*([^*]+)\*\*\s*/, "$1 ");

  // 1) Quoted or unquoted word(s) followed by dash/arrow then explanation (most reliable)
  const sepMatch = content.match(/^["']?(.+?)["']?\s*[\u2013\u2014\u2192\-]\s*(.+)$/);
  if (sepMatch) {
    const keyword = sepMatch[1].trim().replace(/^["']|["']$/g, "");
    const explanation = sepMatch[2].trim();
    if (keyword && explanation) {
      return { keyword, explanation };
    }
  }

  // 2) keyword: explanation (colon)
  const colonMatch = content.match(/^(.+?):\s*(.+)$/);
  if (colonMatch && colonMatch[1].length < 80) {
    const keyword = colonMatch[1].trim().replace(/^["']|["']$/g, "");
    const explanation = colonMatch[2].trim();
    if (keyword && explanation) return { keyword, explanation };
  }

  // 3) keyword - explanation (hyphen, keyword not too long)
  const hyphen = content.match(/^(.+?)\s+-\s+(.+)$/);
  if (hyphen && hyphen[1].trim().length < 80) {
    const keyword = hyphen[1].trim().replace(/^["']|["']$/g, "");
    const explanation = hyphen[2].trim();
    if (keyword && explanation) return { keyword, explanation };
  }

  return null;
}

/**
 * Parse a block of text (from "Keywords" section in MD or DOCX) into keyword entries.
 * Deduplicates by keyword (case-insensitive). Same logic for both sources = consistent results.
 */
export function parseKeywordBlock(text: string): KeywordEntry[] {
  if (!text || typeof text !== "string") return [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: KeywordEntry[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const entry = parseKeywordLine(line);
    if (entry) {
      const key = entry.keyword.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(entry);
      }
    }
  }
  return result;
}
