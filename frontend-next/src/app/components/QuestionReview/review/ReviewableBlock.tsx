"use client";

import { useCallback, useMemo } from "react";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { CommentBadge } from "./CommentBadge";
import { AnnotationHighlighter } from "./AnnotationHighlighter";
import type { ReviewAnnotationTarget } from "./review-types";
import { useReviewContext } from "./ReviewContext";
import { anchorYFromEvent } from "./review-panel-position";
import { annotationsToHighlightItems } from "./annotation-highlight";

type Props = {
  section: string;
  targetType: ReviewAnnotationTarget;
  targetKey: string;
  label?: string;
  children: React.ReactNode;
  className?: string;
  onMarkReviewed?: () => void;
};

export function ReviewableBlock({
  section,
  targetType,
  targetKey,
  label,
  children,
  className,
  onMarkReviewed,
}: Props) {
  const { openDrawer, countForTarget, annotationsForBlock } = useReviewContext();
  const count = countForTarget(targetKey);
  const highlightItems = useMemo(
    () => annotationsToHighlightItems(annotationsForBlock(targetKey), targetKey),
    [annotationsForBlock, targetKey]
  );

  const handleHighlightClick = useCallback(
    (item: { id: string; text: string; targetKey: string }) => {
      openDrawer({
        targetType,
        targetKey: item.targetKey,
        section,
        selectedText: item.text,
        highlightAnnotationId: item.id,
        viewOnly: true,
      });
    },
    [openDrawer, targetType, section]
  );

  return (
    <section
      data-review-section={section}
      data-review-target={targetKey}
      data-review-type={targetType}
      className={cn(
        "group relative rounded-xl border border-transparent transition-colors hover:border-border/60 dark:hover:border-slate-700/80",
        className
      )}
    >
      {(label || onMarkReviewed) && (
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          {label && (
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
              {label}
            </h3>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <CommentBadge count={count} />
            {onMarkReviewed && (
              <button
                type="button"
                onClick={onMarkReviewed}
                className="text-[10px] text-muted-foreground hover:text-foreground dark:text-slate-500 dark:hover:text-slate-300"
              >
                Mark reviewed
              </button>
            )}
          </div>
        </div>
      )}
      <div className="relative">
        <AnnotationHighlighter
          items={highlightItems}
          onItemClick={handleHighlightClick}
        >
          {children}
        </AnnotationHighlighter>
        <button
          type="button"
          aria-label="Add feedback"
          onClick={(e) =>
            openDrawer({
              targetType,
              targetKey,
              section,
              preview: label,
              anchorY: anchorYFromEvent(e),
            })
          }
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1.5 bg-background/90 border shadow-sm hover:bg-muted dark:bg-slate-900/90 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <MessageSquarePlus className="h-4 w-4 text-primary" />
        </button>
        {!label && count > 0 && (
          <div className="absolute top-2 left-2">
            <CommentBadge count={count} />
          </div>
        )}
      </div>
    </section>
  );
}
