export interface KeywordEntry {
  keyword: string;
  explanation: string;
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
  const bracketMatch = trimmed.match(/tags:\s*\[\s*(.*?)\s*\]/s);
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
