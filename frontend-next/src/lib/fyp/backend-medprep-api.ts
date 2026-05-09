const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:43817"

const DEFAULT_TIMEOUT_MS = 15_000

type RequestOptions = {
  method?: string
  userId?: string
  body?: unknown
  /** Abort after this many ms (default 15000). */
  timeoutMs?: number
}

export async function medprepBackendRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.userId ? { "x-user-id": options.userId } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `Backend request failed (${response.status})`
      throw new Error(message)
    }

    return data as T
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Backend request timed out after ${timeoutMs}ms`)
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}
