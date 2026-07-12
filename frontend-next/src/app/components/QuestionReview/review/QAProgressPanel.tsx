"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { ReviewProgress } from "./review-types";

type Props = {
  questionIndex: number;
  questionTotal: number;
  answered: boolean;
  progress: ReviewProgress;
};

function Item({
  done,
  label,
  pending,
}: {
  done: boolean;
  label: string;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {done ? (
        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : (
        <Circle
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            pending ? "text-amber-500" : "text-muted-foreground"
          )}
        />
      )}
      <span
        className={cn(
          done
            ? "text-emerald-700 dark:text-emerald-300"
            : pending
              ? "text-amber-700 dark:text-amber-300"
              : "text-muted-foreground dark:text-slate-400"
        )}
      >
        {label}
        {done ? " ✓" : pending ? " Pending" : ""}
      </span>
    </div>
  );
}

export function QAProgressPanel({
  questionIndex,
  questionTotal,
  answered,
  progress,
}: Props) {
  return (
    <div className="rounded-xl border bg-card/80 px-4 py-3 dark:bg-slate-900/50 dark:border-slate-800">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Question {questionIndex + 1} of {questionTotal}
      </p>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
        <Item done={answered} label="Answered" />
        <Item done={progress.stemReviewed} label="Stem reviewed" />
        <Item done={progress.explanationReviewed} label="Explanation reviewed" />
        <Item done={progress.imagesReviewed} label="Images reviewed" />
        <Item
          done={progress.overallReviewed}
          label="Overall review"
          pending={!progress.overallReviewed}
        />
      </div>
    </div>
  );
}
