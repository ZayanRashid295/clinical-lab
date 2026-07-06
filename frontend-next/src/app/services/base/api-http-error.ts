/**
 * Thrown by {@link BaseApiService} for non-OK HTTP responses so UI can
 * distinguish quota/forbidden (403) from generic failures without treating
 * them as React “runtime” crashes.
 */
export class ApiHttpError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.payload = payload;
  }

  static is(e: unknown): e is ApiHttpError {
    return e instanceof ApiHttpError;
  }
}

function rawApiMessage(e: unknown): string | undefined {
  if (ApiHttpError.is(e)) return e.message?.trim() || undefined;
  if (e instanceof Error && e.message?.trim()) return e.message.trim();
  return undefined;
}

function looksLikeGenericTransportFailure(raw: string): boolean {
  return /^request failed \(\d+\)$/i.test(raw.trim());
}

function statusFallback(status: number | undefined, fallback: string): string {
  switch (status) {
    case 400:
      return "We couldn’t complete that action. Check your input and try again.";
    case 401:
      return "Please sign in again to continue.";
    case 403:
      return "You don’t have access to that. It may be limited by your plan or permissions.";
    case 404:
      return "We couldn’t find that. It may have been removed or the link is outdated.";
    case 409:
      return "That conflicts with the latest data. Refresh the page and try again.";
    case 422:
      return "Some information isn’t valid. Check the form and try again.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 0:
      return "We couldn’t reach the server. Check your connection and try again.";
    default:
      if (status !== undefined && status >= 500) {
        return "Something went wrong on our side. Please try again in a few minutes.";
      }
      return fallback;
  }
}

/**
 * Safe message for toasts, alerts, and inline error text — maps known API copy to
 * clearer language and falls back by HTTP status when the body is unhelpful.
 */
export function userFacingApiMessage(
  e: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const raw = rawApiMessage(e) || "";
  const status = ApiHttpError.is(e) ? e.status : undefined;

  if (!raw || looksLikeGenericTransportFailure(raw)) {
    return statusFallback(status, fallback);
  }

  const lower = raw.toLowerCase();

  // Study groups
  if (/owner cannot leave|transfer ownership or delete/i.test(raw)) {
    return "You’re the group owner, so you can’t leave until you transfer ownership to another member or delete the group.";
  }

  // Auth / session
  if (/token has been revoked/i.test(lower)) {
    return "Your session was signed out for security. Please sign in again.";
  }
  if (/invalid credentials/i.test(lower)) {
    return "Email or password doesn’t match our records.";
  }
  if (/user not authenticated|user id not found/i.test(lower)) {
    return "Please sign in again to continue.";
  }

  // Ownership / permissions
  if (
    /\bnot yours\b/i.test(raw) ||
    /you can only (edit|delete) your own/i.test(lower)
  ) {
    return "You don’t have permission to do that with this content.";
  }

  // Not found (common Nest messages)
  if (
    /\bnot found\b/i.test(lower) &&
    (/(discussion|report|flashcard|note|session|attempt|exam|paper)\b/i.test(
      lower
    ) ||
      /question paper/i.test(lower))
  ) {
    return "That item wasn’t found. It may have been removed.";
  }
  if (/system with id/i.test(lower) && /not found/i.test(lower)) {
    return "That item wasn’t found.";
  }

  // Mock exams / attempts
  if (/already completed/i.test(lower)) {
    return "That attempt is already finished.";
  }
  if (/not available/i.test(lower) && status === 403) {
    return "That isn’t available on your account.";
  }

  // MedPrep / quotas
  if (/no case quota/i.test(lower)) {
    return "You’ve used your case quota for this mode. Upgrade your plan or try again later.";
  }

  // Registration
  if (/email already exists|account with this email already exists/i.test(lower)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (/invalid email format/i.test(lower)) {
    return "Please enter a valid email address.";
  }

  // Conflicts
  if (/system name is required|name is required/i.test(lower)) {
    return "Please fill in the required name field.";
  }

  // Default: trust concise API messages; replace noisy internals
  if (raw.length > 400 && status && status >= 500) {
    return statusFallback(status, fallback);
  }

  return raw;
}

/** Alias for {@link userFacingApiMessage} — use anywhere you showed API errors to users. */
export function getApiErrorMessage(
  e: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  return userFacingApiMessage(e, fallback);
}

/**
 * Use with shadcn `const { toast } = useToast()` so API failures never surface as
 * uncaught runtime errors in the Next overlay.
 */
export function toastApiError(
  toast: (args: {
    variant?: "default" | "destructive";
    title: string;
    description?: string;
  }) => void,
  e: unknown,
  title = "Something went wrong"
): void {
  toast({
    variant: "destructive",
    title,
    description: userFacingApiMessage(e),
  });
}

/**
 * True when the API denied access because the user's plan is missing required entitlements.
 * Uses the original API message on the error object (before user-facing mapping).
 */
export function isSubscriptionUpgradeRequiredError(e: unknown): boolean {
  if (!ApiHttpError.is(e) || e.status !== 403) return false;
  const msg = (e.message || "").toLowerCase();
  return (
    msg.includes("entitlement") ||
    msg.includes("missing entitlements") ||
    msg.includes("missing features") ||
    msg.includes("upgrade your subscription") ||
    msg.includes("access denied") ||
    msg.includes("required features") ||
    msg.includes("qbank") ||
    msg.includes("please upgrade")
  );
}

/** User-facing copy for plan / feature gates (403). Keeps API wording optional for support. */
export function subscriptionGateFromApiError(e: unknown): {
  title: string;
  description: string;
  detail?: string;
} {
  const detail = ApiHttpError.is(e) ? e.message : undefined;
  const msg = (detail || "").toLowerCase();

  if (msg.includes("qbank") || msg.includes("question bank")) {
    return {
      title: "Question bank access required",
      description:
        "Loading this test needs access to the question bank on your account. Your current plan doesn’t include that feature yet.",
      detail,
    };
  }

  if (ApiHttpError.is(e) && e.status === 403) {
    return {
      title: "Your plan doesn’t include this feature",
      description:
        "Upgrade your subscription to unlock the tools needed here. Nothing else in your account was changed.",
      detail,
    };
  }

  return {
    title: "Something went wrong",
    description: detail || "Please try again in a moment.",
    detail,
  };
}
