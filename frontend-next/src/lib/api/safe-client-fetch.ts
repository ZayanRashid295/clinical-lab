export type SafeFetchFailure = "network" | "timeout" | "aborted"

export type SafeFetchResult =
  | { ok: true; response: Response }
  | { ok: false; error: SafeFetchFailure }

/**
 * Browser fetch that never throws on network / timeout (dev server restart, offline, etc.).
 */
export async function safeClientFetch(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<SafeFetchResult> {
  const timeoutMs = init?.timeoutMs ?? 25_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const parentSignal = init?.signal
  const onParentAbort = () => controller.abort()
  parentSignal?.addEventListener("abort", onParentAbort)

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })
    return { ok: true, response }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, error: parentSignal?.aborted ? "aborted" : "timeout" }
    }
    return { ok: false, error: "network" }
  } finally {
    clearTimeout(timer)
    parentSignal?.removeEventListener("abort", onParentAbort)
  }
}
