/** Append to dialogue LLM system prompts so UI renders cleanly. */
export const CLINICAL_PLAIN_TEXT_RULES = `
OUTPUT FORMAT (dialogue only):
- Plain spoken text only — no HTML, no markdown, no JSON, no code fences.
- Do not wrap the entire reply in quotation marks.
- Use straight apostrophes; avoid HTML entities (&quot;, &amp;, etc.).
- No role prefixes like "Patient:" or "Doctor:" in the reply body.`

/**
 * Normalizes LLM / DB text for clinical UI (quotes, entities, stray JSON fences).
 */
export function formatClinicalText(raw: unknown): string {
  if (raw == null) return ""
  let text = String(raw).trim()
  if (!text) return ""

  // Strip wrapping quotes from patient lines like `"Oh, doctor..."`
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'")) ||
    (text.startsWith("“") && text.endsWith("”"))
  ) {
    text = text.slice(1, -1).trim()
  }

  text = text
    .replace(/^```(?:json|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u00a0/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u0000/g, "")

  return text.trim()
}
