"use client";

import { useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { CommentBadge } from "./CommentBadge";
import { HighlightedContent } from "./HighlightedContent";
import { useReviewContext } from "./ReviewContext";
import { anchorYFromEvent } from "./review-panel-position";
import { annotationsToHighlightItems } from "./annotation-highlight";

type Props = {
  label: string;
  text: string;
  correct: boolean;
  selected?: boolean;
  showCorrect?: boolean;
};

export function ReviewableOption({
  label,
  text,
  correct,
  selected,
  showCorrect,
}: Props) {
  const { openDrawer, countForTarget, annotationsForBlock } = useReviewContext();
  const targetKey = `option:${label}`;
  const count = countForTarget(targetKey);
  const highlight = showCorrect && correct;
  const displayText = `${label}. ${text}`;

  const highlightItems = useMemo(
    () => annotationsToHighlightItems(annotationsForBlock(targetKey), targetKey),
    [annotationsForBlock, targetKey]
  );

  const handleHighlightClick = useCallback(
    (item: { id: string; text: string; targetKey: string }) => {
      openDrawer({
        targetType: "OPTION",
        targetKey: item.targetKey,
        section: `Option ${label}`,
        selectedText: item.text,
        preview: displayText,
        highlightAnnotationId: item.id,
        viewOnly: true,
      });
    },
    [openDrawer, label, displayText]
  );

  return (
    <div
      data-review-section={`Option ${label}`}
      data-review-target={targetKey}
      data-review-type="OPTION"
      className={cn(
        "group relative flex items-start gap-2 rounded-lg border p-3 transition-colors hover:border-primary/30 dark:hover:border-primary/40",
        selected && "border-primary/50 bg-primary/5 dark:bg-primary/10",
        highlight && "border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/30"
      )}
    >
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
          highlight
            ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
            : "border-border dark:border-slate-600"
        )}
      >
        {highlight ? <Check className="h-3.5 w-3.5" /> : label}
      </div>
      <HighlightedContent
        highlightItems={highlightItems}
        onItemClick={handleHighlightClick}
        className="flex-1 min-w-0 pr-8 text-sm text-slate-800 dark:text-slate-200"
      >
        <p>
          <span className="font-semibold">{label}.</span> {text}
        </p>
      </HighlightedContent>
      <CommentBadge count={count} className="absolute top-2 right-10" />
      <button
        type="button"
        aria-label={`Comment on option ${label}`}
        onClick={(e) =>
          openDrawer({
            targetType: "OPTION",
            targetKey,
            section: `Option ${label}`,
            preview: displayText,
            anchorY: anchorYFromEvent(e),
          })
        }
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium text-primary px-2 py-1 rounded-md bg-background/90 border dark:bg-slate-900/90 dark:border-slate-700"
      >
        Comment
      </button>
    </div>
  );
}
