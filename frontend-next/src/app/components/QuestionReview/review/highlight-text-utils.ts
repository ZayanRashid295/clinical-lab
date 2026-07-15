import type { HighlightItem } from "./annotation-highlight";

export type HighlightSegment = {
  text: string;
  item?: HighlightItem;
};

/**
 * Find exact selected phrase in plain text.
 * Exact match first; whitespace-normalized only when spacing differs.
 */
export function findPhraseInText(text: string, phrase: string): number {
  const trimmed = phrase.trim();
  if (!trimmed || !text) return -1;

  const exact = text.indexOf(trimmed);
  if (exact !== -1) return exact;

  const normPhrase = trimmed.replace(/\s+/g, " ");
  let normText = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      if (normText.length === 0 || normText[normText.length - 1] !== " ") {
        map.push(i);
        normText += " ";
      }
    } else {
      map.push(i);
      normText += ch;
    }
  }
  const normIdx = normText.indexOf(normPhrase);
  if (normIdx === -1) return -1;
  return map[normIdx] ?? -1;
}

/** Resolve exact selected phrase position — no label/markdown rewriting. */
export function resolvePhraseRange(
  text: string,
  phrase: string
): { start: number; length: number } | null {
  const trimmed = phrase.trim();
  if (!trimmed || !text) return null;

  const start = findPhraseInText(text, trimmed);
  if (start === -1) return null;

  // For whitespace-normalized hits, length must cover the matched region in raw text
  const exact = text.indexOf(trimmed);
  if (exact === start) {
    return { start, length: trimmed.length };
  }

  const normPhrase = trimmed.replace(/\s+/g, " ");
  let normText = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      if (normText.length === 0 || normText[normText.length - 1] !== " ") {
        map.push(i);
        normText += " ";
      }
    } else {
      map.push(i);
      normText += ch;
    }
  }
  const normIdx = normText.indexOf(normPhrase);
  if (normIdx === -1) return null;
  const endNormPos = normIdx + normPhrase.length - 1;
  const end = (map[endNormPos] ?? start) + 1;
  return { start, length: end - start };
}

export function buildHighlightSegments(
  text: string,
  items: HighlightItem[]
): HighlightSegment[] {
  if (!text || !items.length) return [{ text }];

  type Range = { start: number; end: number; item: HighlightItem };
  const ranges: Range[] = [];

  for (const item of [...items].sort((a, b) => b.text.length - a.text.length)) {
    const phrase = item.text.trim();
    if (!phrase) continue;
    const resolved = resolvePhraseRange(text, phrase);
    if (!resolved) continue;
    const start = resolved.start;
    const end = start + resolved.length;
    const overlaps = ranges.some(
      (r) => !(end <= r.start || start >= r.end)
    );
    if (overlaps) continue;
    ranges.push({ start, end, item });
  }

  if (!ranges.length) return [{ text }];

  ranges.sort((a, b) => a.start - b.start);
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start) });
    }
    segments.push({
      text: text.slice(range.start, range.end),
      item: range.item,
    });
    cursor = range.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }
  return segments;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Plain text for display helpers. */
export function blockToPlainText(block: any): string {
  if (!block) return "";
  const data = block.data ?? {};

  if (typeof data.html === "string" && data.html.trim()) {
    return stripHtml(data.html);
  }
  if (typeof data.tableHtml === "string" && data.tableHtml.trim()) {
    return stripHtml(data.tableHtml);
  }
  if (typeof block.content === "string" && block.content.trim()) {
    return block.content.trim();
  }
  if (typeof data.content === "string" && data.content.trim()) {
    const raw = data.content.trim();
    if (/<[a-z][\s\S]*>/i.test(raw)) return stripHtml(raw);
    return raw;
  }
  if (typeof data.markdown === "string" && data.markdown.trim()) {
    return data.markdown.trim();
  }
  return "";
}

export function stemPlainText(
  question: {
    stem?: string;
    questionStemBlocks?: unknown[];
  },
  draftStem?: string
): string {
  if (draftStem?.trim()) return draftStem.trim();
  if (question.stem?.trim()) return question.stem.trim();
  const blocks = Array.isArray(question.questionStemBlocks)
    ? question.questionStemBlocks
    : [];
  return blocks.map(blockToPlainText).filter(Boolean).join("\n\n");
}
