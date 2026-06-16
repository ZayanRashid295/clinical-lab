/** Coerce DOCX/API metadata labels to display strings. */
export function coerceLabelString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const name = (value as { name?: unknown }).name;
    if (typeof name === "string") return name.trim();
  }
  return "";
}
