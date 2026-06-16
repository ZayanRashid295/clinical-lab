"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { ConvertFileResult } from "./types";
import { ValidationReport } from "./ValidationReport";

interface UploadResultsProps {
  results: ConvertFileResult[];
  loadingEditId?: string | null;
  onClose: () => void;
  onEditQuestion?: (questionId: string) => void;
}

export function UploadResults({
  results,
  loadingEditId,
  onClose,
  onEditQuestion,
}: UploadResultsProps) {
  if (!results.length) return null;

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-gray-800 border border-border dark:border-gray-700 rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold">Upload Results</h2>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400">
                {succeeded.length} converted
              </span>
              {failed.length > 0 && (
                <span className="text-red-600 dark:text-red-400 ml-2">
                  · {failed.length} failed validation
                </span>
              )}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {failed.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                Template errors — fix before re-uploading
              </h3>
              <div className="space-y-3">
                {failed.map((result) => (
                  <ValidationReport
                    key={result.sourceName}
                    fileName={result.sourceName}
                    validation={
                      result.validation ?? {
                        valid: false,
                        errors: [
                          {
                            code: "UNKNOWN",
                            section: "Document",
                            severity: "error",
                            message: result.error ?? "Conversion failed",
                            fix: "Follow MCQ_Upload_Template.docx",
                          },
                        ],
                        warnings: [],
                        summary: result.error ?? "Failed",
                      }
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {succeeded.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                Successfully converted
              </h3>
              <div className="grid gap-2">
                {succeeded.map((result) => (
                  <button
                    key={result.sourceName}
                    type="button"
                    disabled={loadingEditId === result.questionId}
                    className="flex items-center gap-3 p-3 rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors text-left w-full disabled:opacity-60"
                    onClick={() => result.questionId && onEditQuestion?.(result.questionId)}
                  >
                    <span className="text-green-600 font-bold">
                      {loadingEditId === result.questionId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "✓"
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <strong className="text-sm">{result.questionId}</strong>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.sourceName}
                      </p>
                    </div>
                    {result.validation?.warnings.length ? (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 shrink-0">
                        {result.validation.warnings.length} warning(s)
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              {succeeded.some((r) => r.validation?.warnings.length) && (
                <div className="mt-3 space-y-3">
                  {succeeded
                    .filter((r) => r.validation && r.validation.warnings.length > 0)
                    .map((result) => (
                      <ValidationReport
                        key={`warn-${result.sourceName}`}
                        fileName={result.sourceName}
                        validation={result.validation!}
                      />
                    ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
