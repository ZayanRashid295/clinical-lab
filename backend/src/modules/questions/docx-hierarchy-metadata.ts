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

function extractLabelValue(
  source: string,
  labels: string[],
): string | undefined {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const htmlRe = new RegExp(
      `<strong>\\s*${escaped}\\s*:?\\s*</strong>\\s*([^<]+)`,
      "i",
    );
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

  const category = extractLabelValue(source, ["Category"]);
  const product = extractLabelValue(source, ["Product"]);
  const system = extractLabelValue(source, ["System"]);
  const topic = extractLabelValue(source, ["Topic"]);
  const subtopic = extractLabelValue(source, ["Sub-Topic", "Subtopic", "Sub topic"]);
  const mcqTitle = extractLabelValue(source, ["MCQ Title", "MCQ title"]);

  const meta: DocxHierarchyMetadata = {};
  if (category) meta.category = category;
  if (product) meta.product = product;
  if (system) meta.system = system;
  if (topic) meta.topic = topic;
  if (subtopic) meta.subtopic = subtopic;
  if (mcqTitle) meta.mcqTitle = mcqTitle;
  return meta;
}

export function formatHierarchyMetadataBlock(meta: DocxHierarchyMetadata): string {
  const lines: string[] = [];
  if (meta.category) lines.push(`Category: ${meta.category}`);
  if (meta.product) lines.push(`Product: ${meta.product}`);
  if (meta.system) lines.push(`System: ${meta.system}`);
  if (meta.topic) lines.push(`Topic: ${meta.topic}`);
  if (meta.subtopic) lines.push(`Sub-Topic: ${meta.subtopic}`);
  if (meta.mcqTitle) lines.push(`MCQ Title: ${meta.mcqTitle}`);
  return lines.join("\n");
}

export function markdownHasHierarchyMetadata(markdown: string): boolean {
  return /^\s*(?:\*\*)?Category(?:\*\*)?\s*:/im.test(markdown);
}

/** Rough token estimate (~4 chars per token for English/HTML). */
export function estimateTokenCount(text: string): number {
  return Math.ceil((text?.length || 0) / 4);
}

/** Legacy gpt-4 has 8k total context; gpt-4o / gpt-4-turbo support 128k+. */
export function getModelContextLimit(model: string): number {
  const id = model.toLowerCase();
  if (id === "gpt-4" || /^gpt-4-\d{4}$/.test(id)) {
    return 8192;
  }
  return 128000;
}

export function getDocxCompletionMaxTokens(model: string, promptText: string): number {
  const contextLimit = getModelContextLimit(model);
  const inputTokens = estimateTokenCount(promptText);
  const reserved = inputTokens + 512;
  const available = contextLimit - reserved;
  // Cap completion; large questions need ~4–8k output tokens
  return Math.min(8192, Math.max(1024, available));
}

/** Strip verbose HTML markup before token-heavy LLM calls. Preserves structure and image placeholders. */
export function normalizeHtmlForLlm(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(
      /\s(?:class|style|id|width|height|align|valign|border|cellpadding|cellspacing|colspan|rowspan|data-[a-z-]+)="[^"]*"/gi,
      "",
    )
    .replace(/<(\/?)(?:span|div|font|o:p)[^>]*>/gi, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

/** Org TPM tier for gpt-4o (override via OPENAI_DOCX_TPM_LIMIT). */
export function getDocxTpmLimit(): number {
  const raw = process.env.OPENAI_DOCX_TPM_LIMIT;
  const parsed = raw ? parseInt(raw, 10) : 30000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
}

export function getDocxTpmSafetyMargin(): number {
  const raw = process.env.OPENAI_DOCX_TPM_SAFETY;
  const parsed = raw ? parseInt(raw, 10) : 2000;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2000;
}

/** Max HTML chars that fit within OpenAI TPM budget given static prompt + completion reserve. */
export function computeMaxHtmlCharsForTpm(
  tpmLimit: number,
  promptOverheadTokens: number,
  maxCompletionTokens: number,
  safetyMargin = 2000,
): number {
  const maxInputTokens = tpmLimit - safetyMargin - maxCompletionTokens;
  const htmlTokenBudget = Math.max(2048, maxInputTokens - promptOverheadTokens);
  return Math.min(100000, htmlTokenBudget * 4);
}

/** Shrink HTML payload when approaching context limits (metadata extracted separately). */
export function compactHtmlForLlm(html: string, maxChars = 100000): string {
  let compact = normalizeHtmlForLlm(html);
  if (compact.length > maxChars) {
    compact =
      compact.slice(0, maxChars) +
      "<!-- [Content truncated for model context; hierarchy metadata preserved separately] -->";
  }
  return compact;
}

/** Insert hierarchy lines after YAML frontmatter so the frontend parser can read them. */
export function ensureHierarchyMetadataInMarkdown(
  markdown: string,
  meta: DocxHierarchyMetadata,
): string {
  const block = formatHierarchyMetadataBlock(meta);
  if (!block) return markdown;
  if (markdownHasHierarchyMetadata(markdown)) return markdown;

  if (markdown.startsWith("---")) {
    const closeIdx = markdown.indexOf("\n---", 3);
    if (closeIdx !== -1) {
      const insertAt = closeIdx + "\n---".length;
      return `${markdown.slice(0, insertAt)}\n\n${block}\n${markdown.slice(insertAt)}`;
    }
  }

  return `${block}\n\n${markdown}`;
}
