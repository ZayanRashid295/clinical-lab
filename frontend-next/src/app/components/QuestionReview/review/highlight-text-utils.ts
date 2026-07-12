import type { HighlightItem } from "./annotation-highlight";
import { severityHighlightClass } from "./annotation-highlight";

export type HighlightSegment = {
  text: string;
  item?: HighlightItem;
};

/** Find phrase in plain text — exact match, then whitespace-normalized. */
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

/** Resolve phrase position — tries exact match, label-stripped, and label-prefixed variants. */
export function resolvePhraseRange(
  text: string,
  phrase: string
): { start: number; length: number } | null {
  const trimmed = phrase.trim();
  if (!trimmed || !text) return null;

  let start = findPhraseInText(text, trimmed);
  if (start !== -1) return { start, length: trimmed.length };

  const stripped = trimmed.replace(/^[A-H]\.\s*/i, "").trim();
  if (stripped && stripped !== trimmed) {
    start = findPhraseInText(text, stripped);
    if (start !== -1) return { start, length: stripped.length };
  }

  const labelMatch = text.match(/^([A-H])\.\s*/i);
  if (labelMatch && !/^[A-H]\.\s/i.test(trimmed)) {
    const prefixed = `${labelMatch[0]}${trimmed}`;
    start = findPhraseInText(text, prefixed);
    if (start !== -1) return { start, length: prefixed.length };
  }

  return null;
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

type AnnotationLike = {
  id: string;
  targetKey: string;
  selectedText?: string | null;
  severity?: string;
};

/** Match annotations by phrase in plain text — handles mis-tagged targets (e.g. option text saved as Explanation). */
export function highlightItemsMatchingPlainText(
  items: AnnotationLike[],
  plainText: string
): HighlightItem[] {
  const text = plainText.trim();
  if (!text) return [];

  return items
    .filter((a) => {
      const phrase = a.selectedText?.trim();
      if (!phrase) return false;
      return resolvePhraseRange(text, phrase) !== null;
    })
    .map((a) => ({
      id: a.id,
      text: a.selectedText!.trim(),
      targetKey: a.targetKey,
      severity: a.severity,
    }));
}

export function mergeHighlightItems(
  ...lists: HighlightItem[][]
): HighlightItem[] {
  const seen = new Set<string>();
  const merged: HighlightItem[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function blockToPlainText(block: any): string {
  if (!block) return "";
  const data = block.data ?? {};
  if (typeof block.content === "string" && block.content.trim()) {
    return block.content.trim();
  }
  if (typeof data.markdown === "string" && data.markdown.trim()) {
    return data.markdown.trim();
  }
  if (typeof data.content === "string" && data.content.trim()) {
    return data.content.trim();
  }
  if (typeof data.html === "string" && data.html.trim()) {
    return stripHtml(data.html);
  }
  if (typeof data.tableHtml === "string" && data.tableHtml.trim()) {
    return stripHtml(data.tableHtml);
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
