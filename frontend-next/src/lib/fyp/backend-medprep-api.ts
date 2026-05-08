const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:43817"

type RequestOptions = {
  method?: string
  userId?: string
  body?: unknown
}

export async function medprepBackendRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.userId ? { "x-user-id": options.userId } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Backend request failed (${response.status})`
    throw new Error(message)
  }

  return data as T
}
