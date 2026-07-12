export const QA_ISSUE_STATUSES = [
  "NEW",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_MEDICAL_REVIEW",
  "RESOLVED",
  "VERIFIED",
  "CLOSED",
  "REJECTED",
] as const;

export function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function severityStyles(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30";
    case "MAJOR":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30";
    default:
      return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
  }
}

export function statusStyles(status: string) {
  switch (status) {
    case "NEW":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    case "RESOLVED":
    case "VERIFIED":
    case "CLOSED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "REJECTED":
      return "bg-red-500/10 text-red-700 dark:text-red-300";
    case "WAITING_MEDICAL_REVIEW":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-300";
    default:
      return "bg-amber-500/10 text-amber-800 dark:text-amber-200";
  }
}

export function heatmapStyles(level: string) {
  switch (level) {
    case "high":
      return "border-red-500/40 bg-red-500/5";
    case "medium":
      return "border-amber-500/40 bg-amber-500/5";
    case "low":
      return "border-yellow-500/30 bg-yellow-500/5";
    default:
      return "border-emerald-500/20 bg-emerald-500/5";
  }
}

export function heatmapEmoji(level: string) {
  switch (level) {
    case "high":
      return "🔴";
    case "medium":
      return "🟠";
    case "low":
      return "🟡";
    default:
      return "🟢";
  }
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type QuestionEditDraft = {
  stem: string;
  title?: string;
  options: Array<{ label: string; text: string; correct: boolean }>;
  explanationBlocks: Record<string, string>;
};

export function buildQuestionEditDraft(question: {
  stem?: string;
  title?: string | null;
  options: Array<{ label: string; text: string; correct: boolean }>;
  explanation?: Array<{ id?: string; type?: string; content?: string; data?: { content?: string; text?: string } }>;
}): QuestionEditDraft {
  const explanationBlocks: Record<string, string> = {};
  for (const block of question.explanation ?? []) {
    const id = block.id ?? "";
    if (!id) continue;
    if (block.type === "text" || block.type === "markdown") {
      explanationBlocks[id] =
        block.content ?? block.data?.content ?? block.data?.text ?? "";
    }
  }
  return {
    stem: question.stem ?? "",
    title: question.title ?? undefined,
    options: question.options.map((o) => ({ ...o })),
    explanationBlocks,
  };
}

export function draftFromSnapshot(
  snapshot: Record<string, unknown> | null | undefined,
  question: Parameters<typeof buildQuestionEditDraft>[0]
): QuestionEditDraft {
  const base = buildQuestionEditDraft(question);
  if (!snapshot) return base;
  return {
    stem: typeof snapshot.stem === "string" ? snapshot.stem : base.stem,
    title: typeof snapshot.title === "string" ? snapshot.title : base.title,
    options: Array.isArray(snapshot.options)
      ? (snapshot.options as QuestionEditDraft["options"])
      : base.options,
    explanationBlocks:
      snapshot.explanationBlocks &&
      typeof snapshot.explanationBlocks === "object" &&
      !Array.isArray(snapshot.explanationBlocks)
        ? (snapshot.explanationBlocks as Record<string, string>)
        : base.explanationBlocks,
  };
}

/** Naive line diff for draft previews */
export function diffLines(before: string, after: string) {
  const a = before.split("\n");
  const b = after.split("\n");
  const max = Math.max(a.length, b.length);
  const lines: Array<{ type: "same" | "add" | "remove"; text: string }> = [];
  for (let i = 0; i < max; i++) {
    const left = a[i];
    const right = b[i];
    if (left === right) {
      if (left !== undefined) lines.push({ type: "same", text: left });
    } else {
      if (left !== undefined) lines.push({ type: "remove", text: left });
      if (right !== undefined) lines.push({ type: "add", text: right });
    }
  }
  return lines;
}
