import type { ConvertFileResult } from "./types";

export type BatchItemStatus = "pending" | "saved";

export function initialStatuses(
  results: ConvertFileResult[],
): Record<string, BatchItemStatus> {
  const statuses: Record<string, BatchItemStatus> = {};
  for (const result of results) {
    if (result.success && result.questionId) {
      statuses[result.questionId] = "pending";
    }
  }
  return statuses;
}

export function nextPendingId(
  results: ConvertFileResult[],
  statuses: Record<string, BatchItemStatus>,
  afterId?: string | null,
): string | null {
  const succeeded = results.filter((r) => r.success && r.questionId);
  const startIdx =
    afterId != null
      ? Math.max(
          0,
          succeeded.findIndex((r) => r.questionId === afterId) + 1,
        )
      : 0;

  for (let i = startIdx; i < succeeded.length; i += 1) {
    const id = succeeded[i].questionId!;
    if (statuses[id] !== "saved") return id;
  }
  for (let i = 0; i < startIdx; i += 1) {
    const id = succeeded[i].questionId!;
    if (statuses[id] !== "saved") return id;
  }
  return null;
}

export function countSaved(
  results: ConvertFileResult[],
  statuses: Record<string, BatchItemStatus>,
): number {
  return results.filter(
    (r) => r.success && r.questionId && statuses[r.questionId] === "saved",
  ).length;
}
