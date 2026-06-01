/**
 * Preserve table/image order from DOCX HTML when the LLM reorders markdown.
 */

export type MediaSeqItem =
  | { type: "image"; key: string }
  | { type: "table"; index: number };

type MdSegment =
  | { kind: "text"; content: string }
  | { kind: "image"; key: string; content: string }
  | { kind: "table"; tableIndex: number; content: string };

const IMAGE_PLACEHOLDER_RE = /\[IMAGE_PLACEHOLDER:([^\]]+)\]/i;
const MD_IMAGE_RE = /!\[[^\]]*\]\([^)]+\)/;
const MD_TABLE_ROW_RE = /^\|.+\|$/;
const MD_TABLE_SEP_RE = /^\|[\s\-:|]+\|$/;

/** Document-order sequence of tables and images from mammoth HTML. */
export function getHtmlMediaSequence(html: string): MediaSeqItem[] {
  if (!html?.trim()) return [];

  const hits: { pos: number; item: MediaSeqItem }[] = [];
  let tableIndex = 0;

  const imgRe = /<img[^>]+src=["']\[IMAGE_PLACEHOLDER:([^"']+)\]["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html))) {
    hits.push({ pos: m.index, item: { type: "image", key: m[1] } });
  }

  const tableRe = /<table\b/gi;
  while ((m = tableRe.exec(html))) {
    hits.push({ pos: m.index, item: { type: "table", index: tableIndex++ } });
  }

  hits.sort((a, b) => a.pos - b.pos);
  return hits.map((h) => h.item);
}

function extractImageKey(line: string): string | null {
  const m = line.match(IMAGE_PLACEHOLDER_RE);
  return m?.[1] ?? null;
}

function isMostlyImageLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  const withoutImg = t.replace(MD_IMAGE_RE, "").replace(IMAGE_PLACEHOLDER_RE, "").trim();
  return withoutImg.length === 0 && (MD_IMAGE_RE.test(t) || IMAGE_PLACEHOLDER_RE.test(t));
}

function isMdTableRow(line: string): boolean {
  const t = line.trim();
  return MD_TABLE_ROW_RE.test(t) || MD_TABLE_SEP_RE.test(t);
}

function extractSegments(body: string): MdSegment[] {
  const lines = body.split("\n");
  const segments: MdSegment[] = [];
  let textLines: string[] = [];
  let i = 0;
  let tableCounter = 0;

  const flushText = () => {
    if (textLines.length === 0) return;
    const content = textLines.join("\n");
    textLines = [];
    if (content.trim()) segments.push({ kind: "text", content });
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    const imgKey = extractImageKey(line);
    if (imgKey && isMostlyImageLine(line)) {
      flushText();
      segments.push({ kind: "image", key: imgKey, content: line });
      i++;
      continue;
    }

    if (/<table[\s>]/i.test(trimmed)) {
      flushText();
      let html = line;
      i++;
      while (i < lines.length && !/<\/table>/i.test(html)) {
        html += "\n" + lines[i];
        i++;
      }
      segments.push({ kind: "table", tableIndex: tableCounter++, content: html });
      continue;
    }

    if (isMdTableRow(trimmed)) {
      flushText();
      const tableLines: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (isMdTableRow(t)) {
          tableLines.push(lines[i]);
          i++;
          continue;
        }
        if (t === "" && i + 1 < lines.length && isMdTableRow(lines[i + 1].trim())) {
          tableLines.push(lines[i]);
          i++;
          continue;
        }
        break;
      }
      segments.push({
        kind: "table",
        tableIndex: tableCounter++,
        content: tableLines.join("\n"),
      });
      continue;
    }

    textLines.push(line);
    i++;
  }

  flushText();
  return segments;
}

/** Match a consecutive image/table run to mammoth HTML order (images by key, tables by appearance). */
function sortMediaRun(run: MdSegment[], htmlSeq: MediaSeqItem[]): MdSegment[] {
  if (run.length < 2) return run;

  const htmlMedia = htmlSeq.filter((h) => h.type === "image" || h.type === "table");
  const used = new Set<number>();
  const ordered: MdSegment[] = [];

  for (const h of htmlMedia) {
    if (h.type === "image") {
      const idx = run.findIndex(
        (s, j) => s.kind === "image" && s.key === h.key && !used.has(j),
      );
      if (idx >= 0) {
        ordered.push(run[idx]);
        used.add(idx);
      }
      continue;
    }
    const idx = run.findIndex((s, j) => s.kind === "table" && !used.has(j));
    if (idx >= 0) {
      ordered.push(run[idx]);
      used.add(idx);
    }
  }

  for (let j = 0; j < run.length; j++) {
    if (!used.has(j)) ordered.push(run[j]);
  }

  return ordered.length > 0 ? ordered : run;
}

/** Reorder consecutive table/image chunks to match HTML document order. */
export function fixMediaOrderInMarkdown(markdown: string, htmlSeq: MediaSeqItem[]): string {
  const segments = extractSegments(markdown);
  if (segments.length < 2) return markdown;

  const hasMedia = segments.some((s) => s.kind !== "text");
  if (!hasMedia) return markdown;

  const result: MdSegment[] = [];
  let i = 0;
  while (i < segments.length) {
    if (segments[i].kind === "text") {
      result.push(segments[i]);
      i++;
      continue;
    }
    const run: MdSegment[] = [];
    while (i < segments.length && segments[i].kind !== "text") {
      run.push(segments[i]);
      i++;
    }
    result.push(...sortMediaRun(run, htmlSeq));
  }

  return result.map((s) => s.content).join("\n\n");
}

function fixMarkdownSection(
  markdown: string,
  sectionRe: RegExp,
  htmlSeq: MediaSeqItem[],
): string {
  const match = sectionRe.exec(markdown);
  if (!match || match.index === undefined) return markdown;

  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const next = rest.search(/^##\s+(?!#)/m);
  const end = next >= 0 ? start + next : markdown.length;
  const body = markdown.slice(start, end);
  if (!body.trim()) return markdown;

  const fixed = fixMediaOrderInMarkdown(body, htmlSeq);
  if (fixed === body) return markdown;
  return markdown.slice(0, start) + fixed + markdown.slice(end);
}

/** After LLM conversion, align table/image order with mammoth HTML for Question + Explanation. */
export function applyDocxHtmlOrderFixes(
  markdown: string,
  html: string,
  _imagePlaceholders?: string[],
): string {
  const htmlSeq = getHtmlMediaSequence(html);
  if (htmlSeq.length < 2) return markdown;

  let out = markdown;
  out = fixMarkdownSection(out, /^##\s+Question\s*$/im, htmlSeq);
  out = fixMarkdownSection(out, /^##\s+Explanation\s*$/im, htmlSeq);
  return out;
}
