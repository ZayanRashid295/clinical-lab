"use client";

import { filterAnnotationsForTarget } from "@/app/components/QuestionReview/review/annotation-highlight";
import { HighlightedText } from "@/app/components/QuestionReview/review/HighlightedText";

export type QaFeedbackHighlight = {
  id: string;
  targetKey: string;
  selectedText?: string | null;
  severity?: string;
};

type Props = {
  highlights: QaFeedbackHighlight[];
  reviewerName?: string | null;
};

export function QaFeedbackHighlightsBar({ highlights, reviewerName }: Props) {
  const withText = highlights.filter((h) => h.selectedText?.trim());
  if (!withText.length) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
        Reviewer feedback highlights
        {reviewerName ? ` — ${reviewerName}` : ""}
      </p>
      <p className="text-xs text-muted-foreground mt-1 mb-2">
        Flagged phrases are highlighted in yellow below and in Preview mode.
      </p>
      <ul className="space-y-1.5">
        {withText.map((item) => {
          const items = filterAnnotationsForTarget(
            [
              {
                id: item.id,
                targetKey: item.targetKey,
                selectedText: item.selectedText,
                severity: item.severity,
              },
            ],
            item.targetKey
          );
          return (
            <li
              key={item.id}
              className="text-xs rounded-md border border-border/60 bg-background/80 px-2 py-1.5"
            >
              <span className="text-muted-foreground">{item.targetKey} · </span>
              <HighlightedText
                text={item.selectedText!.trim()}
                items={items}
                className="inline text-sm dark:text-slate-200"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
