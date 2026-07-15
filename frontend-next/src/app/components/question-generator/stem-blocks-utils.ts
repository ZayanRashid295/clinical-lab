/**
 * Question stem block utilities — single pipeline from markdown/string to UI.
 * Ensures the stem is never rendered as one sentence per line in edit or preview.
 * Stem = all content before "## Options and Explanations"; that heading is never shown in UI.
 */

/** Strip "## Options and Explanations" from stem string so it never appears in edit or preview. */
export function stripOptionsAndExplanationsFromStemString(stem: string): string {
  if (!stem || !stem.trim()) return stem
  return stem
    .replace(/\n\s*#+\s*Options and Explanations\s*(?=\n|$)/gim, "\n")
    .replace(/\n\s*\*\*Options and Explanations\*\*\s*(?=\n|$)/gim, "\n")
    .replace(/\n\s*Options and Explanations\s*(?=\n|$)/gim, "\n")
    .replace(/^\s*#+\s*Options and Explanations\s*(?=\n|$)/gim, "")
    .replace(/^\s*\*\*Options and Explanations\*\*\s*(?=\n|$)/gim, "")
    .replace(/^\s*Options and Explanations\s*(?=\n|$)/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** True if block content is only the "Options and Explanations" heading (to hide from stem). */
export function isOptionsAndExplanationsBlock(block: any): boolean {
  if (!block || !block.data) return false
  const md = String(block.data.markdown ?? block.data.content ?? "").trim()
  const html = String(block.data.html ?? "").trim()
  const plainFromMd = md.replace(/^#+\s*/i, "").replace(/\*\*/g, "").trim()
  const plainFromHtml = html.replace(/<[^>]+>/g, "").trim()
  const text = (plainFromMd || plainFromHtml).trim()
  return text.toLowerCase() === "options and explanations"
}

/** Strip "Options and Explanations" from a block's markdown/html so it never appears in stem UI. */
export function stripOptionsAndExplanationsFromBlock(block: any): any {
  if (!block?.data) return block
  const strip = (s: string) =>
    (s ?? "")
      .replace(/\n\s*#+\s*Options and Explanations\s*(?=\n|$)/gim, "\n")
      .replace(/\n\s*\*\*Options and Explanations\*\*\s*(?=\n|$)/gim, "\n")
      .replace(/\n\s*Options and Explanations\s*(?=\n|$)/gim, "\n")
      .replace(/^\s*#+\s*Options and Explanations\s*(?=\n|$)/gim, "")
      .replace(/^\s*\*\*Options and Explanations\*\*\s*(?=\n|$)/gim, "")
      .replace(/^\s*Options and Explanations\s*(?=\n|$)/gim, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  const stripHtml = (s: string) =>
    (s ?? "")
      .replace(/<h[1-6][^>]*>\s*Options and Explanations\s*<\/h[1-6]>/gim, "")
      .replace(/<p[^>]*>\s*(<strong[^>]*>)?\s*Options and Explanations\s*(<\/strong>)?\s*<\/p>/gim, "")
      .replace(/<div[^>]*>\s*Options and Explanations\s*<\/div>/gim, "")
      .trim()
  const data = { ...block.data }
  if (typeof data.markdown === "string") data.markdown = strip(data.markdown)
  if (typeof data.html === "string") data.html = stripHtml(data.html)
  if (typeof data.content === "string") data.content = data.content.includes("<") ? stripHtml(data.content) : strip(data.content)
  return { ...block, data }
}

/** Normalize stem text: one paragraph = one line (collapse single \n to space, keep \n\n). */
export function normalizeStemToParagraphs(text: string): string {
  if (!text || !text.trim()) return text
  return text
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
}

/**
 * Convert a stem string (from markdown parser or API) to stem blocks for the UI.
 * Returns one block per logical paragraph; each block's markdown has no single newlines
 * (so it never renders line-by-line).
 */
export function stemStringToStemBlocks(stem: string): Array<{ id: string; type: "text"; order: number; data: { markdown: string; html?: string } }> {
  const cleaned = stripOptionsAndExplanationsFromStemString(stem ?? "")
  if (!cleaned || !cleaned.trim()) {
    return [
      {
        id: `stem-${Date.now()}`,
        type: "text",
        order: 0,
        data: { markdown: "", html: "" },
      },
    ]
  }
  const normalized = normalizeStemToParagraphs(cleaned)
  const paragraphs = normalized.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const blockIdBase = Date.now()
  return paragraphs.map((markdown, idx) => ({
    id: `stem-${blockIdBase}-${idx}`,
    type: "text" as const,
    order: idx,
    data: { markdown, html: "" },
  }))
}

function isTextBlock(block: any): boolean {
  const t = (block?.type ?? "").toString().toLowerCase()
  return t === "text"
}

/** Map API/DB enums (TEXT, TABLE, IMAGES) to renderer types (text, table, images). */
export function normalizeStemBlockType(type: unknown): string {
  const t = String(type ?? "").toLowerCase()
  if (t === "text" || t === "table" || t === "images" || t === "image") return t
  return t || "text"
}

function withNormalizedType(block: any): any {
  if (!block || typeof block !== "object") return block
  return { ...block, type: normalizeStemBlockType(block.type) }
}

function blockHasTextContent(block: any): boolean {
  if (!block?.data) return false
  const md = String(block.data.markdown ?? "").trim()
  const content = String(block.data.content ?? "").trim()
  const html = String(block.data.html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return Boolean(md || content || html)
}

/**
 * Normalize existing stem blocks for display/edit: merge consecutive text blocks into one
 * and ensure markdown has no single newlines (so one paragraph does not render line-by-line).
 */
export function normalizeStemBlocksForDisplay(blocks: any[]): any[] {
  if (!Array.isArray(blocks) || blocks.length === 0) return blocks
  // Strip "Options and Explanations" from each block and drop blocks that are only that heading
  let list = blocks
    .map(withNormalizedType)
    .map(stripOptionsAndExplanationsFromBlock)
    .filter((b) => {
      if (isOptionsAndExplanationsBlock(b)) return false
      return blockHasTextContent(b)
    })
  if (list.length === 0) {
    const fallback = blocks
      .map(withNormalizedType)
      .map(stripOptionsAndExplanationsFromBlock)
      .find((b) => blockHasTextContent(b) || b?.data?.html)
    return fallback ? [fallback] : []
  }
  if (list.length === 1) {
    const b = list[0]
    if (isTextBlock(b) && (b?.data?.markdown ?? b?.data?.content)) {
      const md = normalizeStemToParagraphs(String(b.data.markdown ?? b.data.content ?? ""))
      return [{ ...b, type: "text", data: { ...b.data, markdown: md, html: b?.data?.html || "" } }]
    }
    return list
  }
  const result: any[] = []
  let i = 0
  while (i < list.length) {
    const block = list[i]
    if (!isTextBlock(block)) {
      result.push(block)
      i++
      continue
    }
    const run: any[] = [block]
    let j = i + 1
    while (j < list.length && isTextBlock(list[j])) {
      run.push(list[j])
      j++
    }
    const mergedMarkdown = run
      .map((b) => (b?.data?.markdown ?? b?.data?.content ?? "").trim())
      .filter(Boolean)
      .join(" ")
    const mergedHtml = run
      .map((b) => String(b?.data?.html ?? "").trim())
      .filter(Boolean)
      .join("")
    const normalizedMarkdown = normalizeStemToParagraphs(mergedMarkdown)
    result.push({
      ...run[0],
      type: "text",
      data: {
        ...run[0].data,
        markdown: normalizedMarkdown,
        // Keep HTML when we merged markdown-less HTML-only blocks
        html: normalizedMarkdown ? "" : mergedHtml,
        content: "",
      },
    })
    i = j
  }
  return result
}
