/**
 * Typed failure from POST /api/conversations (and similar) so UI can show modals instead of raw HTTP errors.
 */
export class MedPrepConversationRequestError extends Error {
  readonly status: number
  readonly code?: string
  readonly payload: Record<string, unknown> | null

  constructor(
    message: string,
    status: number,
    options?: { code?: string; payload?: Record<string, unknown> | null }
  ) {
    super(message)
    this.name = "MedPrepConversationRequestError"
    this.status = status
    this.code = options?.code
    this.payload = options?.payload ?? null
  }

  static is(e: unknown): e is MedPrepConversationRequestError {
    if (e instanceof MedPrepConversationRequestError) return true
    if (typeof e !== "object" || e === null) return false
    const o = e as Record<string, unknown>
    return (
      o.name === "MedPrepConversationRequestError" &&
      typeof o.message === "string" &&
      typeof o.status === "number"
    )
  }
}

export type ConversationBlockedModalState = {
  variant: "case_limit" | "subscription" | "generic"
  title: string
  description: string
}

function tryParseLegacyHttpError(message: string): {
  status: number
  message: string
  code?: string
  payload: Record<string, unknown> | null
} | null {
  const m = message.match(/^HTTP (\d+): (.+)$/s)
  if (!m) return null
  const status = Number.parseInt(m[1], 10)
  const rawBody = m[2]
  try {
    const j = JSON.parse(rawBody) as Record<string, unknown>
    const inner =
      typeof j.message === "string"
        ? j.message
        : typeof j.error === "string"
          ? j.error
          : rawBody
    return {
      status: Number.isFinite(status) ? status : 500,
      message: inner,
      code: typeof j.error === "string" ? j.error : undefined,
      payload: j,
    }
  } catch {
    return { status, message: rawBody, payload: null }
  }
}

/** Maps API errors to copy for MedPrepConversationBlockedModal. */
export function mapConversationFailureToModal(error: unknown): ConversationBlockedModalState {
  if (MedPrepConversationRequestError.is(error)) {
    const msg = error.message.trim()
    const status = error.status
    if (status === 403 && /case limit|limit reached|distinct cases/i.test(msg)) {
      return {
        variant: "case_limit",
        title: "Case limit reached",
        description:
          msg ||
          "Your plan allows a limited number of new cases in this mode for the current period. The limit resets at the start of the next billing period or cycle shown in your subscription.",
      }
    }
    if (status === 403 || error.code === "FORBIDDEN") {
      return {
        variant: "subscription",
        title: "Session not available",
        description:
          msg ||
          "This session can’t be started with your current plan. You may need a different package or an upgrade.",
      }
    }
    if (status === 401) {
      return {
        variant: "subscription",
        title: "Sign-in required",
        description: "Please sign in again to continue using MedPrep.",
      }
    }
    return {
      variant: "generic",
      title: "Couldn’t start the session",
      description: msg || "Please try again in a moment.",
    }
  }

  if (error instanceof Error) {
    const legacy = tryParseLegacyHttpError(error.message)
    if (legacy) {
      return mapConversationFailureToModal(
        new MedPrepConversationRequestError(legacy.message, legacy.status, {
          code: legacy.code,
          payload: legacy.payload,
        })
      )
    }
    return {
      variant: "generic",
      title: "Couldn’t start the session",
      description: error.message || "Please try again.",
    }
  }

  return {
    variant: "generic",
    title: "Couldn’t start the session",
    description: "Something went wrong. Please try again.",
  }
}

/** Same mapping as {@link mapConversationFailureToModal} but never throws (safe for catch blocks). */
export function safeMapConversationFailureToModal(
  error: unknown
): ConversationBlockedModalState {
  try {
    return mapConversationFailureToModal(error)
  } catch {
    return {
      variant: "generic",
      title: "Couldn't start the session",
      description:
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
    }
  }
}
