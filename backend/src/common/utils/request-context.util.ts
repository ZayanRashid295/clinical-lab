import type { Request } from "express";
import type { ActivityLogContext } from "../../modules/activity-log/activity-log.types";

/** Normalize loopback / IPv4-mapped addresses for readable audit display. */
export function normalizeIpForDisplay(ip?: string | null): string | null {
  if (!ip?.trim()) return null;
  const trimmed = ip.trim();
  const withoutMapped = trimmed.replace(/^::ffff:/i, "");
  if (
    withoutMapped === "::1" ||
    withoutMapped === "0:0:0:0:0:0:0:1" ||
    withoutMapped === "127.0.0.1"
  ) {
    return "127.0.0.1 (localhost · IPv6 ::1)";
  }
  return withoutMapped;
}

export function extractRequestContext(req: Request): ActivityLogContext {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedChain =
    typeof forwarded === "string"
      ? forwarded.trim()
      : Array.isArray(forwarded)
        ? forwarded.join(", ")
        : undefined;

  const rawIp =
    (forwardedChain ? forwardedChain.split(",")[0]?.trim() : undefined) ||
    req.ip ||
    req.socket?.remoteAddress ||
    undefined;

  const userAgent = req.headers["user-agent"];

  return {
    ipAddress: normalizeIpForDisplay(rawIp) ?? rawIp,
    ipAddressRaw: rawIp,
    ipForwardedFor: forwardedChain,
    userAgent: typeof userAgent === "string" ? userAgent : undefined,
  };
}
