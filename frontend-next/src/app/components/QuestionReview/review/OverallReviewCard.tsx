"use client";

import { Star } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/utils/cn";
import type {
  OverallReviewState,
  ReviewApproval,
  ReviewDifficulty,
} from "./review-types";

type Props = {
  value: OverallReviewState;
  onChange?: (next: OverallReviewState) => void;
  onSave?: () => void;
  saving?: boolean;
  /** When true, show the reviewer's submitted overall review (no edits/save). */
  readOnly?: boolean;
  reviewerName?: string | null;
};

function StarRating({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium mb-1.5 text-slate-900 dark:text-slate-100">
        {label}
      </p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => !readOnly && onChange?.(n)}
            disabled={readOnly}
            className="p-0.5 disabled:cursor-default"
            aria-label={`${n} stars`}
          >
            <Star
              className={cn(
                "h-5 w-5",
                n <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const DIFFICULTY_OPTIONS = [
  ["TOO_EASY", "Too easy"],
  ["APPROPRIATE", "Appropriate"],
  ["TOO_DIFFICULT", "Too difficult"],
] as const;

const APPROVAL_OPTIONS = [
  ["APPROVE", "Approve"],
  ["NEEDS_REVISION", "Needs revision"],
  ["REJECT", "Reject"],
] as const;

export function OverallReviewCard({
  value,
  onChange,
  onSave,
  saving,
  readOnly = false,
  reviewerName,
}: Props) {
  const set = (next: OverallReviewState) => {
    if (!readOnly) onChange?.(next);
  };

  return (
    <section className="rounded-2xl border bg-card p-5 space-y-5 dark:bg-slate-900/40 dark:border-slate-800">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Overall question review
          {reviewerName?.trim() ? (
            <span className="font-medium text-muted-foreground dark:text-slate-400">
              {" "}
              ({reviewerName.trim()})
            </span>
          ) : null}
        </h3>
        <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
          {readOnly
            ? "Reviewer's summary ratings and comment for this question."
            : "Rate the full question and leave a summary. Your comment is required before moving to the next question."}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StarRating
          label="Question quality"
          value={value.questionQualityRating}
          onChange={(n) => set({ ...value, questionQualityRating: n })}
          readOnly={readOnly}
        />
        <StarRating
          label="Explanation quality"
          value={value.explanationQualityRating}
          onChange={(n) => set({ ...value, explanationQualityRating: n })}
          readOnly={readOnly}
        />
        <StarRating
          label="Image quality"
          value={value.imageQualityRating}
          onChange={(n) => set({ ...value, imageQualityRating: n })}
          readOnly={readOnly}
        />
      </div>

      <div>
        <p className="text-xs font-medium mb-2 text-slate-900 dark:text-slate-100">
          Difficulty
        </p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              disabled={readOnly}
              onClick={() =>
                set({ ...value, difficultyRating: k as ReviewDifficulty })
              }
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border disabled:cursor-default",
                value.difficultyRating === k
                  ? "bg-primary text-primary-foreground border-primary"
                  : "dark:border-slate-700 dark:text-slate-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-2 text-slate-900 dark:text-slate-100">
          Approval status
        </p>
        <div className="flex flex-wrap gap-2">
          {APPROVAL_OPTIONS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              disabled={readOnly}
              onClick={() =>
                set({ ...value, approvalStatus: k as ReviewApproval })
              }
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border disabled:cursor-default",
                value.approvalStatus === k
                  ? k === "APPROVE"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : k === "REJECT"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-amber-500 text-white border-amber-500"
                  : "dark:border-slate-700 dark:text-slate-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-2 text-slate-900 dark:text-slate-100">
          Overall comments{" "}
          {!readOnly && <span className="text-destructive">*</span>}
        </p>
        {readOnly ? (
          <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2.5 text-sm whitespace-pre-wrap text-slate-900 dark:text-slate-100 dark:bg-slate-900/80 dark:border-slate-700 min-h-[6rem]">
            {value.overallComment.trim() || (
              <span className="text-muted-foreground italic">
                No overall comment submitted.
              </span>
            )}
          </div>
        ) : (
          <Textarea
            value={value.overallComment}
            onChange={(e) => set({ ...value, overallComment: e.target.value })}
            rows={4}
            placeholder="Summary feedback for this entire question…"
            className="text-slate-900 dark:text-slate-100 dark:bg-slate-900/80 dark:border-slate-700"
          />
        )}
      </div>

      {!readOnly && onSave && (
        <Button
          onClick={onSave}
          disabled={saving || !value.overallComment.trim()}
        >
          {saving ? "Saving…" : "Save overall review"}
        </Button>
      )}
    </section>
  );
}
