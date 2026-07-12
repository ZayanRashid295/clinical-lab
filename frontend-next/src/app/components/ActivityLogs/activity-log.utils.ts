import {
  Activity,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileQuestion,
  Flag,
  GraduationCap,
  KeyRound,
  Layers,
  Shield,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ActivityLog } from "../../types/activity-log";

export interface ComponentMeta {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  dotClass: string;
}

const COMPONENT_META: Record<string, ComponentMeta> = {
  auth: {
    label: "Authentication",
    icon: KeyRound,
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
    dotClass: "bg-sky-500",
  },
  assessment: {
    label: "Assessment",
    icon: ClipboardList,
    badgeClass: "bg-violet-100 text-violet-800 border-violet-200",
    dotClass: "bg-violet-500",
  },
  qbank: {
    label: "Question Bank",
    icon: BookOpen,
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    dotClass: "bg-primary",
  },
  subscription: {
    label: "Subscription",
    icon: CreditCard,
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    dotClass: "bg-amber-500",
  },
  payment: {
    label: "Payment",
    icon: CreditCard,
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  user: {
    label: "User Management",
    icon: Users,
    badgeClass: "bg-indigo-100 text-indigo-900 border-indigo-200",
    dotClass: "bg-indigo-500",
  },
  role: {
    label: "Roles",
    icon: Shield,
    badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
    dotClass: "bg-purple-500",
  },
  content: {
    label: "Content",
    icon: Layers,
    badgeClass: "bg-teal-100 text-teal-900 border-teal-200",
    dotClass: "bg-teal-500",
  },
  medprep: {
    label: "MedPrep AI",
    icon: GraduationCap,
    badgeClass: "bg-rose-100 text-rose-900 border-rose-200",
    dotClass: "bg-rose-500",
  },
  mock_exam: {
    label: "Mock Exam",
    icon: FileQuestion,
    badgeClass: "bg-orange-100 text-orange-900 border-orange-200",
    dotClass: "bg-orange-500",
  },
  question_report: {
    label: "Question Report",
    icon: Flag,
    badgeClass: "bg-yellow-100 text-yellow-900 border-yellow-200",
    dotClass: "bg-yellow-500",
  },
  admin: {
    label: "Administration",
    icon: UserCog,
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
    dotClass: "bg-gray-500",
  },
};

export function getComponentMeta(component: string): ComponentMeta {
  return (
    COMPONENT_META[component] ?? {
      label: component,
      icon: Activity,
      badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
      dotClass: "bg-gray-400",
    }
  );
}

export function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatFullDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

/** Readable IP for audit UI (handles IPv6 loopback and mapped addresses). */
export function formatIpAddress(
  ip?: string | null,
  raw?: string | null,
  forwarded?: string | null,
): string | null {
  const primary = ip?.trim() || raw?.trim();
  if (!primary && !forwarded?.trim()) return null;

  const normalize = (value: string) => {
    const v = value.replace(/^::ffff:/i, "");
    if (v === "::1" || v === "0:0:0:0:0:0:0:1") {
      return "127.0.0.1 (localhost · IPv6 ::1)";
    }
    return v;
  };

  const parts: string[] = [];
  if (primary) parts.push(normalize(primary));
  if (raw?.trim() && raw.trim() !== primary) {
    parts.push(`Raw: ${normalize(raw.trim())}`);
  }
  if (forwarded?.trim()) {
    parts.push(`Forwarded: ${forwarded.trim()}`);
  }
  return parts.join(" · ") || null;
}

export function parseUserAgent(ua?: string | null): {
  browser: string;
  device: string;
  summary: string;
} {
  if (!ua) {
    return { browser: "Unknown", device: "Unknown device", summary: "Unknown device" };
  }

  let browser = "Browser";
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  else if (ua.includes("curl/")) browser = "API / curl";

  let device = "Desktop";
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    device = ua.includes("iPad") ? "Tablet" : "Mobile";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = "macOS";
  } else if (/Windows/i.test(ua)) {
    device = "Windows";
  } else if (/Linux/i.test(ua)) {
    device = "Linux";
  }

  return {
    browser,
    device,
    summary: `${browser} on ${device}`,
  };
}

function contextPhrase(log: ActivityLog): string | null {
  const ctx = log.contextLabel ?? log.contextId;
  if (!ctx) return null;
  return `"${ctx}"`;
}

export function buildActivityNarrative(log: ActivityLog): string {
  const actor = log.userFullName ?? "Someone";
  const affected = log.affectedUserFullName;
  const ctx = contextPhrase(log);

  switch (log.eventName) {
    case "user_logged_in":
      return `${actor} signed in`;
    case "user_logged_out":
      return `${actor} signed out`;
    case "user_registered":
      return `${actor} created an account`;
    case "profile_updated":
      return `${actor} updated their profile`;
    case "quiz_created":
      return ctx ? `${actor} created a test ${ctx}` : `${actor} created a new test`;
    case "quiz_started":
      return ctx ? `${actor} started a test ${ctx}` : `${actor} started a test`;
    case "quiz_submitted":
      return ctx ? `${actor} submitted a test ${ctx}` : `${actor} submitted a test`;
    case "quiz_viewed":
      return ctx ? `${actor} viewed results for ${ctx}` : `${actor} viewed test results`;
    case "question_created":
      return ctx ? `${actor} added a question ${ctx}` : `${actor} added a new question`;
    case "question_updated":
      return ctx ? `${actor} updated a question ${ctx}` : `${actor} updated a question`;
    case "question_deleted":
      return ctx ? `${actor} removed a question ${ctx}` : `${actor} removed a question`;
    case "question_imported":
      return `${actor} imported questions from DOCX`;
    case "subscription_created":
      return affected && affected !== actor
        ? `${actor} assigned a subscription to ${affected}`
        : ctx
          ? `${actor} subscribed to ${ctx}`
          : `${actor} started a subscription`;
    case "subscription_updated":
      return ctx ? `${actor} updated subscription ${ctx}` : `${actor} updated a subscription`;
    case "subscription_cancelled":
      return ctx ? `${actor} cancelled subscription ${ctx}` : `${actor} cancelled a subscription`;
    case "payment_processed":
      return `${actor} completed a payment`;
    case "payment_failed":
      return `${actor}'s payment failed`;
    case "user_created":
      return affected ? `${actor} created user ${affected}` : `${actor} created a user`;
    case "user_updated":
      return affected ? `${actor} updated user ${affected}` : `${actor} updated a user account`;
    case "user_deactivated":
      return affected ? `${actor} deactivated ${affected}` : `${actor} deactivated a user`;
    case "topic_created":
      return ctx ? `${actor} created topic ${ctx}` : `${actor} created a topic`;
    case "subtopic_created":
      return ctx ? `${actor} created subtopic ${ctx}` : `${actor} created a subtopic`;
    case "question_report_created":
      return ctx ? `${actor} reported a question (${ctx})` : `${actor} submitted a question report`;
    case "mock_exam_completed":
      return ctx ? `${actor} completed mock exam ${ctx}` : `${actor} completed a mock exam`;
    default:
      return log.eventLabel || `${actor} performed an action`;
  }
}

export function buildActivitySubtext(log: ActivityLog): string | null {
  if (
    log.affectedUserFullName &&
    log.affectedUserId &&
    log.affectedUserId !== log.userId
  ) {
    return `Affected user: ${log.affectedUserFullName}`;
  }

  const meta = log.metadata as Record<string, unknown> | null;
  if (meta?.score != null && meta?.totalQuestions != null) {
    return `Score: ${meta.score}% · ${meta.correctAnswers ?? "—"}/${meta.totalQuestions} correct`;
  }
  if (meta?.succeeded != null && meta?.total != null) {
    return `${meta.succeeded} of ${meta.total} files imported successfully`;
  }

  return null;
}
