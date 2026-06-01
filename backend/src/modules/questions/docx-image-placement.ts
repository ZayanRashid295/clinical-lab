/**
 * Deterministic DOCX image placeholder placement.
 * Images are positioned from HTML structure; LLM output is repaired when needed.
 */

export type DocxImageSection =
  | "question"
  | "explanation"
  | "keywords"
  | "options"
  | "preamble";

export interface DocxImagePlacement {
  placeholder: string;
  section: DocxImageSection;
  /** Plain-text snippet immediately before the image (for anchor injection). */
  anchorText: string;
}

const IMG_TAG_RE =
  /<img[^>]*src=["']\[IMAGE_PLACEHOLDER:([^\]]+)\]["'][^>]*\/?>/gi;

const MARKER_RE = /\[\[DOCX_IMAGE:([^\]]+)\]\]/g;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function placeholdersPresent(markdown: string, names: string[]): string[] {
  return names.filter(
    (name) =>
      !markdown.includes(`[IMAGE_PLACEHOLDER:${name}]`) &&
      !markdown.includes(`[[DOCX_IMAGE:${name}]]`),
  );
}

/** Infer which markdown section an image belongs to from HTML before the <img> tag. */
export function inferImageSectionFromHtmlContext(htmlBefore: string): DocxImageSection {
  const plain = stripHtml(htmlBefore);
  const lower = plain.toLowerCase();

  const rules: Array<{ section: DocxImageSection; patterns: RegExp[] }> = [
    {
      section: "options",
      patterns: [/options\s+and\s+explanations/i, /\boption\s+[a-e]\b/i],
    },
    {
      section: "explanation",
      patterns: [/\bexplanation\b/i, /choice-by-choice/i, /differential\s+diagnosis/i],
    },
    {
      section: "keywords",
      patterns: [/\bkeywords\b/i, /keywords\s+in\s+the\s+stem/i],
    },
    {
      section: "question",
      patterns: [/\bquestion\b/i, /clinical\s+case/i, /\bstem\b/i, /\bpatient\b/i],
    },
  ];

  let bestSection: DocxImageSection = "preamble";
  let bestIndex = -1;

  for (const { section, patterns } of rules) {
    for (const pattern of patterns) {
      const match = lower.match(pattern);
      if (match?.index !== undefined && match.index > bestIndex) {
        bestIndex = match.index;
        bestSection = section;
      }
    }
  }

  return bestSection;
}

/** Map each placeholder to section + anchor from full HTML (before TPM truncation). */
export function extractImagePlacementsFromHtml(
  html: string,
  placeholders: string[],
): DocxImagePlacement[] {
  const placements: DocxImagePlacement[] = [];
  const seen = new Set<string>();

  for (const placeholder of placeholders) {
    const escaped = escapeRegex(placeholder);
    const re = new RegExp(
      `<img[^>]*src=["']\\[IMAGE_PLACEHOLDER:${escaped}\\]["'][^>]*\\/?>`,
      "gi",
    );
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      const key = `${placeholder}@${match.index}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const before = html.substring(Math.max(0, match.index - 2500), match.index);
      placements.push({
        placeholder,
        section: inferImageSectionFromHtmlContext(before),
        anchorText: stripHtml(before).slice(-100),
      });
    }
  }

  // One placement per placeholder (first occurrence in document order)
  const byName = new Map<string, DocxImagePlacement>();
  for (const p of placements) {
    if (!byName.has(p.placeholder)) byName.set(p.placeholder, p);
  }
  return placeholders
    .map((name) => byName.get(name))
    .filter((p): p is DocxImagePlacement => !!p);
}

/** Replace <img> tags with LLM-friendly markers that survive HTML normalization. */
export function insertImageMarkersInHtml(html: string): string {
  return html.replace(IMG_TAG_RE, (_, name: string) => `<p>[[DOCX_IMAGE:${name}]]</p>`);
}

/** Convert [[DOCX_IMAGE:name]] and fix common LLM image syntax to canonical form. */
export function resolveImageMarkersInMarkdown(markdown: string): string {
  let result = markdown.replace(
    MARKER_RE,
    (_, name: string) => `![Image]([IMAGE_PLACEHOLDER:${name}])`,
  );

  // LLM sometimes outputs a standalone placeholder line without markdown image syntax
  result = result.replace(
    /(^|\n)\s*\[IMAGE_PLACEHOLDER:([^\]]+)\]\s*(?=\n|$)/g,
    "$1![Image]([IMAGE_PLACEHOLDER:$2])",
  );

  return result;
}

function findSectionBounds(
  markdown: string,
  section: DocxImageSection,
): { start: number; end: number } | null {
  const headerPatterns: Record<DocxImageSection, RegExp> = {
    question: /^##\s+Question\s*$/im,
    explanation: /^##\s+Explanation\s*$/im,
    keywords: /^###\s+Keywords/im,
    options: /^##\s+Options and Explanations\s*$/im,
    preamble: /^#\s+/m,
  };

  const headerRe = headerPatterns[section];
  const headerMatch = markdown.match(headerRe);
  if (!headerMatch || headerMatch.index === undefined) {
    if (section === "preamble") {
      const q = markdown.match(/^##\s+Question\s*$/im);
      return q?.index !== undefined ? { start: 0, end: q.index } : { start: 0, end: markdown.length };
    }
    return null;
  }

  const start = headerMatch.index + headerMatch[0].length;
  const after = markdown.slice(start);
  const nextHeader = after.match(/^##\s+/m);
  const end = nextHeader?.index !== undefined ? start + nextHeader.index : markdown.length;
  return { start, end };
}

function injectAtAnchor(
  markdown: string,
  bounds: { start: number; end: number },
  anchorText: string,
  imageLine: string,
): string | null {
  if (!anchorText || anchorText.length < 12) return null;

  const sectionMd = markdown.slice(bounds.start, bounds.end);
  const anchorNorm = anchorText.toLowerCase().replace(/\s+/g, " ").trim();
  const sliceLen = Math.min(60, anchorNorm.length);
  const needle = anchorNorm.slice(-sliceLen);
  if (needle.length < 12) return null;

  const sectionLower = sectionMd.toLowerCase().replace(/\s+/g, " ");
  const localIdx = sectionLower.lastIndexOf(needle);
  if (localIdx < 0) return null;

  const insertAt = bounds.start + localIdx + needle.length;
  return markdown.slice(0, insertAt) + imageLine + markdown.slice(insertAt);
}

function defaultInsertPoint(
  markdown: string,
  section: DocxImageSection,
): number {
  if (section === "question") {
    const q = markdown.match(/^##\s+Question\s*$/im);
    if (q?.index !== undefined) {
      const opts = markdown.indexOf("## Options", q.index);
      return opts > q.index ? opts : q.index + q[0].length + 1;
    }
  }
  if (section === "explanation") {
    const ex = markdown.match(/^##\s+Explanation\s*$/im);
    if (ex?.index !== undefined) {
      const choice = markdown.indexOf("## Choice-by-Choice", ex.index);
      return choice > ex.index ? choice : ex.index + ex[0].length + 1;
    }
  }
  if (section === "keywords") {
    const kw = markdown.match(/^###\s+Keywords/im);
    if (kw?.index !== undefined) return kw.index + kw[0].length + 1;
  }
  if (section === "options") {
    const op = markdown.match(/^##\s+Options and Explanations\s*$/im);
    if (op?.index !== undefined) return op.index + op[0].length + 1;
  }
  const ex = markdown.match(/^##\s+Explanation\s*$/im);
  if (ex?.index !== undefined) return ex.index + ex[0].length + 1;
  const q = markdown.match(/^##\s+Question\s*$/im);
  if (q?.index !== undefined) return q.index + q[0].length + 1;
  return markdown.length;
}

/**
 * Ensure every expected placeholder exists in markdown at the correct section.
 * Uses HTML-derived placements (full HTML, not truncated).
 */
export function ensureImagePlaceholdersInMarkdown(
  markdown: string,
  htmlContent: string,
  placeholders: string[],
  placements?: DocxImagePlacement[],
): { markdown: string; placedFromHtml: number; alreadyPresent: number } {
  if (!placeholders.length) {
    return { markdown, placedFromHtml: 0, alreadyPresent: 0 };
  }

  let result = resolveImageMarkersInMarkdown(markdown);
  const resolved = extractImagePlacementsFromHtml(htmlContent, placeholders);
  const plan = placements?.length ? placements : resolved;

  const missing = placeholdersPresent(result, placeholders);
  const alreadyPresent = placeholders.length - missing.length;

  if (missing.length === 0) {
    return { markdown: result, placedFromHtml: 0, alreadyPresent };
  }

  let placedFromHtml = 0;
  const imageLine = (name: string) => `\n\n![Image]([IMAGE_PLACEHOLDER:${name}])\n\n`;

  for (const name of missing) {
    const placement = plan.find((p) => p.placeholder === name) ?? {
      placeholder: name,
      section: "explanation" as DocxImageSection,
      anchorText: "",
    };

    const line = imageLine(name);
    let injected: string | null = null;

    const bounds = findSectionBounds(result, placement.section);
    if (bounds) {
      injected = injectAtAnchor(result, bounds, placement.anchorText, line);
    }

    if (!injected) {
      const point = defaultInsertPoint(result, placement.section);
      result = result.slice(0, point) + line + result.slice(point);
    } else {
      result = injected;
    }
    placedFromHtml++;
  }

  return { markdown: result, placedFromHtml, alreadyPresent };
}

/** Build system-message addendum listing required image outputs. */
export function buildImageSystemAddendum(placeholders: string[]): string {
  if (!placeholders.length) return "";
  const list = placeholders
    .map((n) => `![Image]([IMAGE_PLACEHOLDER:${n}])`)
    .join("\n");
  return (
    `\n\nIMAGE PLACEHOLDERS (MANDATORY): The source HTML contains ${placeholders.length} image(s) marked as [[DOCX_IMAGE:filename]]. ` +
    `You MUST include each one exactly once in your Markdown output using this exact syntax:\n${list}\n` +
    `Copy [[DOCX_IMAGE:filename]] from the HTML as ![Image]([IMAGE_PLACEHOLDER:filename]). ` +
    `Place each image in the same section as in the source (Question stem vs Explanation). Never omit or describe images in prose only.`
  );
}
