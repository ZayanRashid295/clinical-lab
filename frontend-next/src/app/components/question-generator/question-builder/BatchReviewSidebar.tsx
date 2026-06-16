"use client";

import { CheckCircle2, Circle, Loader2, AlertCircle, Upload } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { ConvertFileResult } from "./types";
import type { BatchItemStatus } from "./batch-review-utils";

interface BatchReviewSidebarProps {
  results: ConvertFileResult[];
  statuses: Record<string, BatchItemStatus>;
  activeId: string | null;
  loadingId: string | null;
  saving: boolean;
  onSelect: (questionId: string) => void;
  onUploadMore: () => void;
  onFinish: () => void;
}

export function BatchReviewSidebar({
  results,
  statuses,
  activeId,
  loadingId,
  saving,
  onSelect,
  onUploadMore,
  onFinish,
}: BatchReviewSidebarProps) {
  const succeeded = results.filter((r) => r.success && r.questionId);
  const failed = results.filter((r) => !r.success);
  const savedCount = succeeded.filter(
    (r) => r.questionId && statuses[r.questionId] === "saved",
  ).length;

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-muted/30 dark:border-gray-700 dark:bg-gray-900/40">
      <div className="border-b border-border p-4 dark:border-gray-700">
        <h2 className="text-sm font-semibold">Batch review</h2>
        <p className="mt-1 text-xs text-muted-foreground dark:text-gray-400">
          {savedCount} of {succeeded.length} saved
          {failed.length > 0 && ` · ${failed.length} failed`}
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled={saving}
            onClick={onUploadMore}
          >
            <Upload className="mr-1 h-3 w-3" />
            Upload more
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1 text-xs"
            disabled={saving}
            onClick={onFinish}
          >
            Done
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {failed.length > 0 && (
          <section>
            <h3 className="mb-2 px-2 text-xs font-medium text-red-600 dark:text-red-400">
              Failed validation
            </h3>
            <ul className="space-y-1">
              {failed.map((result) => (
                <li
                  key={result.sourceName}
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/80 p-2 text-left dark:border-red-900 dark:bg-red-950/20"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{result.sourceName}</p>
                    <p className="mt-0.5 text-[11px] text-red-700 dark:text-red-300 line-clamp-2">
                      {result.error ?? result.validation?.summary ?? "Validation failed"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {succeeded.length > 0 && (
          <section>
            <h3 className="mb-2 px-2 text-xs font-medium text-green-700 dark:text-green-400">
              Ready to review
            </h3>
            <ul className="space-y-1">
              {succeeded.map((result) => {
                const id = result.questionId!;
                const isActive = activeId === id;
                const isSaved = statuses[id] === "saved";
                const isLoading = loadingId === id;

                return (
                  <li key={result.sourceName}>
                    <button
                      type="button"
                      disabled={isLoading || saving}
                      className={`flex w-full items-center gap-2 rounded-lg border p-2.5 text-left transition-colors disabled:opacity-60 ${
                        isActive
                          ? "border-primary bg-primary/10 dark:bg-primary/20"
                          : isSaved
                            ? "border-green-300 bg-green-50/60 hover:bg-green-50 dark:border-green-800 dark:bg-green-950/20 dark:hover:bg-green-950/30"
                            : "border-border bg-card hover:bg-muted/60 dark:border-gray-700 dark:bg-gray-800/60"
                      }`}
                      onClick={() => onSelect(id)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                      ) : isSaved ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                      ) : isActive ? (
                        <Circle className="h-4 w-4 shrink-0 fill-primary text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{id}</p>
                          {isSaved && (
                            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              Saved
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {result.sourceName}
                        </p>
                      </div>
                      {result.validation?.warnings.length ? (
                        <span className="shrink-0 text-[10px] text-amber-600 dark:text-amber-400">
                          {result.validation.warnings.length}w
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
