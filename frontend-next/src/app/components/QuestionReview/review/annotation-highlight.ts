export type HighlightItem = {
  id: string;
  text: string;
  targetKey: string;
  severity?: string;
};

const HIGHLIGHT_CLASS = "qa-feedback-highlight";
const HIGHLIGHT_SELECTOR = `mark.${HIGHLIGHT_CLASS}`;

/** Strip `:sel-N` suffix so block badges group text-selection issues. */
export function blockTargetKey(targetKey: string): string {
  const idx = targetKey.indexOf(":sel-");
  return idx === -1 ? targetKey : targetKey.slice(0, idx);
}

export function severityHighlightClass(severity?: string) {
  const base = `${HIGHLIGHT_CLASS} cursor-pointer rounded-sm px-0.5 font-medium box-decoration-clone`;
  switch (severity) {
    case "CRITICAL":
      return `${base} bg-red-200 text-red-950 border-b-2 border-red-600 dark:bg-red-300/95 dark:!text-slate-900 dark:border-red-700`;
    case "MAJOR":
      return `${base} bg-amber-200 text-amber-950 border-b-2 border-amber-600 dark:bg-amber-300/95 dark:!text-slate-900 dark:border-amber-700`;
    default:
      return `${base} bg-yellow-200 text-yellow-950 border-b-2 border-yellow-600 dark:bg-yellow-300/95 dark:!text-slate-900 dark:border-yellow-700`;
  }
}

/** Unwrap all highlight marks inside root, merging adjacent text nodes. */
export function removeHighlightsInRoot(root: HTMLElement) {
  const marks = [...root.querySelectorAll(HIGHLIGHT_SELECTOR)];
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    const text = document.createTextNode(mark.textContent ?? "");
    parent.replaceChild(text, mark);
    parent.normalize();
  }
}

function collectTextNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (parent?.closest(HIGHLIGHT_SELECTOR)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.textContent?.length) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let current: Node | null;
  while ((current = walker.nextNode())) {
    nodes.push(current as Text);
  }
  return nodes;
}

/** Collapse whitespace so DOM join vs Selection.toString() still align. */
function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Find the exact selected phrase in concatenated text nodes.
 * Exact substring first; whitespace-normalized only when spacing differs.
 * No markdown/label rewriting — selection text is authoritative.
 */
export function findPhraseOffsets(
  nodes: Text[],
  phrase: string
): { start: number; end: number } | null {
  const raw = nodes.map((n) => n.textContent ?? "").join("");
  const trimmed = phrase.trim();
  if (!trimmed) return null;

  const exactIdx = raw.indexOf(trimmed);
  if (exactIdx !== -1) {
    return { start: exactIdx, end: exactIdx + trimmed.length };
  }

  const normPhrase = normalizeForMatch(trimmed);
  if (!normPhrase) return null;

  let normRaw = "";
  const map: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (/\s/.test(ch)) {
      if (normRaw.length === 0 || normRaw[normRaw.length - 1] !== " ") {
        map.push(i);
        normRaw += " ";
      }
    } else {
      map.push(i);
      normRaw += ch;
    }
  }

  const normIdx = normRaw.indexOf(normPhrase);
  if (normIdx === -1) return null;

  const start = map[normIdx] ?? 0;
  const endNormPos = normIdx + normPhrase.length - 1;
  const end = (map[endNormPos] ?? start) + 1;
  return { start, end };
}

function wrapRangeWithMark(
  nodes: Text[],
  start: number,
  end: number,
  item: HighlightItem,
  onClick: (item: HighlightItem) => void
): boolean {
  if (end <= start) return false;

  let cursor = 0;
  let wrapped = false;

  for (const node of nodes) {
    const len = node.textContent?.length ?? 0;
    const nodeStart = cursor;
    const nodeEnd = cursor + len;
    cursor = nodeEnd;

    const overlapStart = Math.max(start, nodeStart);
    const overlapEnd = Math.min(end, nodeEnd);
    if (overlapEnd <= overlapStart) continue;

    const localStart = overlapStart - nodeStart;
    const localEnd = overlapEnd - nodeStart;
    const parent = node.parentNode;
    if (!parent || !node.textContent) continue;

    try {
      const text = node.textContent;
      const before = text.slice(0, localStart);
      const mid = text.slice(localStart, localEnd);
      const after = text.slice(localEnd);
      if (!mid) continue;

      const mark = document.createElement("mark");
      mark.className = severityHighlightClass(item.severity);
      mark.style.color = "rgb(15 23 42)";
      mark.dataset.highlightId = item.id;
      mark.title = "Click to view feedback";
      mark.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick(item);
      });
      mark.textContent = mid;

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(mark);
      if (after) frag.appendChild(document.createTextNode(after));
      parent.replaceChild(frag, node);
      wrapped = true;
    } catch {
      /* continue other nodes */
    }
  }

  return wrapped;
}

/** Apply clickable highlight marks for exact phrase matches inside root. */
export function applyTextHighlights(
  root: HTMLElement,
  items: HighlightItem[],
  onClick: (item: HighlightItem) => void
): () => void {
  removeHighlightsInRoot(root);

  const sorted = [...items]
    .filter((i) => i.text?.trim())
    .sort((a, b) => b.text.length - a.text.length);

  for (const item of sorted) {
    const phrase = item.text.trim();
    if (!phrase) continue;
    if (root.querySelector(`[data-highlight-id="${item.id}"]`)) continue;

    const nodes = collectTextNodes(root);
    if (!nodes.length) continue;

    const offsets = findPhraseOffsets(nodes, phrase);
    if (!offsets) continue;

    wrapRangeWithMark(nodes, offsets.start, offsets.end, item, onClick);
  }

  return () => {
    removeHighlightsInRoot(root);
  };
}

/** True when annotation belongs to this block (sel-suffix ok; no false prefix hits). */
export function matchesTarget(
  annotationTargetKey: string,
  targetKey: string
): boolean {
  const blockKey = blockTargetKey(targetKey);
  const annBlock = blockTargetKey(annotationTargetKey);
  if (annBlock === blockKey) return true;
  if (annotationTargetKey === targetKey) return true;
  return (
    annotationTargetKey.startsWith(`${blockKey}:`) &&
    annotationTargetKey.charAt(blockKey.length) === ":"
  );
}

/**
 * Only annotations with selectedText for this target become highlights.
 * No full-block body fallback — the reviewer's selection is the highlight.
 */
export function annotationsToHighlightItems(
  items: Array<{
    id: string;
    targetKey: string;
    selectedText?: string | null;
    severity?: string;
    body?: string | null;
  }>,
  targetKey: string
): HighlightItem[] {
  return items
    .filter((a) => matchesTarget(a.targetKey, targetKey))
    .filter((a) => a.selectedText?.trim())
    .map((a) => ({
      id: a.id,
      text: a.selectedText!.trim(),
      targetKey: a.targetKey,
      severity: a.severity,
    }));
}

export function filterAnnotationsForTarget(
  items: Array<{
    id: string;
    targetKey: string;
    selectedText?: string | null;
    severity?: string;
    body?: string | null;
  }>,
  targetKey: string
): HighlightItem[] {
  return annotationsToHighlightItems(items, targetKey);
}

export function highlightItemsKey(items: HighlightItem[]): string {
  return items
    .map((i) => `${i.id}\0${i.text}\0${i.targetKey}\0${i.severity ?? ""}`)
    .join("\n");
}

export function countAppliedHighlights(
  root: HTMLElement,
  items: HighlightItem[]
): number {
  return items.filter(
    (item) => root.querySelector(`[data-highlight-id="${item.id}"]`) !== null
  ).length;
}
