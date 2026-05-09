/**
 * Parses Next.js API `req.body` whether it is already an object or a JSON string.
 */
export function parseNextJsonBody(
  body: unknown
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    return { ok: true, data: body as Record<string, unknown> }
  }
  if (typeof body !== "string") {
    return { ok: false, error: "Request body must be a JSON object" }
  }
  try {
    const parsed: unknown = JSON.parse(body)
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ok: true, data: parsed as Record<string, unknown> }
    }
    return { ok: false, error: "JSON root must be an object" }
  } catch {
    return { ok: false, error: "Invalid JSON body" }
  }
}
