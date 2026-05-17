/**
 * Safely parse a fetch Response as JSON. Returns null when the body is HTML/text
 * (e.g. missing API route returning a Next.js document).
 */
export async function parseFetchJson<T = unknown>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? ""
  const text = await response.text()
  if (!text.trim()) return null
  if (!contentType.includes("application/json") && text.trimStart().startsWith("<")) {
    return null
  }
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
