"use client";

import { useCallback, useMemo } from "react";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import RichContentRenderer from "@/app/components/question-generator/rich-content-renderer";
import { AnnotationHighlighter } from "./AnnotationHighlighter";
import { CommentBadge } from "./CommentBadge";
import { useReviewContext } from "./ReviewContext";
import {
  annotationsToHighlightItems,
  blockTargetKey,
  type HighlightItem,
} from "./annotation-highlight";
import { anchorYFromEvent } from "./review-panel-position";

type Option = { label: string; text: string; correct: boolean };

type AnnotationLike = {
  id: string;
  targetKey: string;
  selectedText?: string | null;
  severity?: string;
};

export function perAnswerOptionTargetKey(blockId: string, label: string) {
  return `per-answer:${blockId}:option:${label}`;
}

export function perAnswerBlockTargetKey(blockId: string) {
  return `per-answer:${blockId}`;
}

function optionCorpus(option: Option, explanation: unknown): string {
  const parts = [`Option ${option.label}: ${option.text}`];
  if (Array.isArray(explanation)) {
    for (const block of explanation as any[]) {
      const d = block?.data ?? {};
      parts.push(String(d.markdown ?? d.content ?? ""));
      parts.push(String(d.html ?? "").replace(/<[^>]+>/g, " "));
    }
  } else if (explanation) {
    parts.push(String(explanation));
  }
  return parts.join("\n").replace(/\s+/g, " ").trim();
}

function explanationToBlocks(explanation: unknown, label: string) {
  if (Array.isArray(explanation)) {
    return (explanation as any[]).map((b: any, i: number) => ({
      ...b,
      type: String(b?.type ?? "text").toLowerCase(),
      id: b?.id ?? `pae-${label}-${i}`,
    }));
  }
  return [
    {
      id: `pae-${label}`,
      type: "text",
      data: { markdown: String(explanation ?? ""), html: "" },
    },
  ];
}

function hasExplanationContent(explanation: unknown): boolean {
  if (Array.isArray(explanation)) return explanation.length > 0;
  return Boolean(String(explanation ?? "").trim());
}

function phraseInCorpus(corpus: string, phrase: string): boolean {
  if (!phrase.trim() || !corpus) return false;
  if (corpus.includes(phrase.trim())) return true;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  return norm(corpus).includes(norm(phrase));
}

export function collectPerAnswerHighlights(
  annotations: AnnotationLike[],
  blockId: string,
  option: Option,
  explanation: unknown
): HighlightItem[] {
  const optionKey = perAnswerOptionTargetKey(blockId, option.label);
  const blockKey = perAnswerBlockTargetKey(blockId);
  const byId = new Map<string, HighlightItem>();

  for (const item of annotationsToHighlightItems(annotations, optionKey)) {
    byId.set(item.id, item);
  }
  for (const item of annotationsToHighlightItems(annotations, blockKey)) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }

  const corpus = optionCorpus(option, explanation);
  for (const a of annotations) {
    const phrase = a.selectedText?.trim();
    if (!phrase || byId.has(a.id)) continue;
    if (phraseInCorpus(corpus, phrase)) {
      byId.set(a.id, {
        id: a.id,
        text: phrase,
        targetKey: a.targetKey,
        severity: a.severity,
      });
    }
  }

  return [...byId.values()];
}

type SharedCardProps = {
  blockId: string;
  option: Option;
  explanation: unknown;
  selected?: boolean;
  highlightItems: HighlightItem[];
  feedbackCount: number;
  interactive?: boolean;
  onHighlightClick?: (item: HighlightItem) => void;
  onComment?: (e: React.MouseEvent) => void;
};

function PerAnswerOptionShell({
  blockId,
  option,
  explanation,
  selected,
  highlightItems,
  feedbackCount,
  interactive,
  onHighlightClick,
  onComment,
}: SharedCardProps) {
  const optionKey = perAnswerOptionTargetKey(blockId, option.label);
  const hasContent = hasExplanationContent(explanation);

  return (
    <div
      data-review-section={`Option ${option.label} breakdown`}
      data-review-target={optionKey}
      data-review-type="EXPLANATION"
      data-target-key={optionKey}
      className={cn(
        "group relative rounded-lg border p-3 scroll-mt-24 transition-colors",
        selected && "border-primary/40 bg-primary/5",
        feedbackCount > 0 || highlightItems.length > 0
          ? "border-amber-400/50 ring-1 ring-amber-300/40"
          : "border-border/60 hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm text-slate-900 dark:text-slate-100">
          <span className="font-semibold">Option {option.label}:</span>{" "}
          {option.text}{" "}
          <span
            className={
              option.correct
                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                : "text-red-600 dark:text-red-400 font-medium"
            }
          >
            ({option.correct ? "Correct" : "Incorrect"})
          </span>
        </p>
        {interactive && (
          <div className="flex items-center gap-1 shrink-0">
            <CommentBadge count={feedbackCount} />
            <button
              type="button"
              aria-label={`Comment on option ${option.label} explanation`}
              onClick={onComment}
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1 bg-background/90 border shadow-sm"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
        )}
        {!interactive && feedbackCount > 0 && (
          <CommentBadge count={feedbackCount} />
        )}
      </div>

      <AnnotationHighlighter
        items={highlightItems}
        onItemClick={onHighlightClick ?? (() => undefined)}
      >
        {hasContent ? (
          <div className="text-sm text-slate-800 dark:text-slate-200">
            <RichContentRenderer
              content={explanationToBlocks(explanation, option.label)}
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No explanation for this option.
          </p>
        )}
      </AnnotationHighlighter>
    </div>
  );
}

type BreakdownProps = {
  blockId: string;
  options: Option[];
  perAnswerExplanations: Record<string, unknown>;
  selectedAnswer?: string | null;
};

/** Reviewer: interactive per-option targeting + highlights. */
export function ReviewableAnswerBreakdown({
  blockId,
  options,
  perAnswerExplanations,
  selectedAnswer = null,
}: BreakdownProps) {
  const { openDrawer, countForTarget, annotationsForBlock, annotations } =
    useReviewContext();
  const blockKey = perAnswerBlockTargetKey(blockId);

  return (
    <div className="space-y-3" data-target-key={blockKey}>
      <h3 className="text-sm font-bold text-center uppercase tracking-wide text-slate-900 dark:text-slate-100">
        Answer Breakdown
      </h3>
      {options.map((option) => {
        const optionKey = perAnswerOptionTargetKey(blockId, option.label);
        const explanation = perAnswerExplanations[option.label];
        const highlightItems = collectPerAnswerHighlights(
          annotations,
          blockId,
          option,
          explanation
        );
        const feedbackCount =
          countForTarget(optionKey) ||
          annotationsToHighlightItems(annotationsForBlock(blockKey), blockKey)
            .filter((item) =>
              phraseInCorpus(optionCorpus(option, explanation), item.text)
            ).length;

        return (
          <PerAnswerOptionShell
            key={option.label}
            blockId={blockId}
            option={option}
            explanation={explanation}
            selected={selectedAnswer === option.label}
            highlightItems={highlightItems}
            feedbackCount={Math.max(feedbackCount, highlightItems.length)}
            interactive
            onHighlightClick={(item) =>
              openDrawer({
                targetType: "EXPLANATION",
                targetKey: item.targetKey,
                section: `Option ${option.label} breakdown`,
                selectedText: item.text,
                highlightAnnotationId: item.id,
                viewOnly: true,
              })
            }
            onComment={(e) =>
              openDrawer({
                targetType: "EXPLANATION",
                targetKey: optionKey,
                section: `Option ${option.label} breakdown`,
                preview: option.text,
                anchorY: anchorYFromEvent(e),
              })
            }
          />
        );
      })}
    </div>
  );
}

type AdminBreakdownProps = BreakdownProps & {
  annotations: AnnotationLike[];
  activeTargetKey?: string | null;
  onSelectTarget?: (targetKey: string, issueId?: string) => void;
  countFor?: (key: string) => number;
};

/** Admin: same layout + highlights, scroll targets aligned with reviewer keys. */
export function AdminAnswerBreakdown({
  blockId,
  options,
  perAnswerExplanations,
  annotations,
  activeTargetKey,
  onSelectTarget,
  countFor,
}: AdminBreakdownProps) {
  const blockKey = perAnswerBlockTargetKey(blockId);

  const sorted = useMemo(() => {
    const correct = options.find((o) => o.correct);
    const rest = options.filter((o) => !o.correct);
    return correct ? [correct, ...rest] : options;
  }, [options]);

  const handleHighlightClick = useCallback(
    (item: HighlightItem) => {
      onSelectTarget?.(item.targetKey, item.id);
    },
    [onSelectTarget]
  );

  return (
    <div className="space-y-3" data-target-key={blockKey}>
      <h3 className="text-sm font-bold text-center uppercase tracking-wide">
        Answer Breakdown
      </h3>
      {sorted.map((option) => {
        const optionKey = perAnswerOptionTargetKey(blockId, option.label);
        const explanation = perAnswerExplanations[option.label];
        const highlightItems = collectPerAnswerHighlights(
          annotations,
          blockId,
          option,
          explanation
        );
        const feedbackCount = Math.max(
          countFor?.(optionKey) ?? 0,
          highlightItems.length
        );
        const active =
          !!activeTargetKey &&
          (activeTargetKey === optionKey ||
            activeTargetKey.startsWith(`${optionKey}:`) ||
            blockTargetKey(activeTargetKey) === optionKey ||
            blockTargetKey(activeTargetKey) === blockKey ||
            activeTargetKey === blockKey ||
            activeTargetKey.startsWith(`${blockKey}:`));

        return (
          <div
            key={option.label}
            className={cn(active && "ring-2 ring-primary/30 rounded-lg")}
            onClick={() => onSelectTarget?.(optionKey)}
          >
            <PerAnswerOptionShell
              blockId={blockId}
              option={option}
              explanation={explanation}
              highlightItems={highlightItems}
              feedbackCount={feedbackCount}
              interactive={false}
              onHighlightClick={handleHighlightClick}
            />
          </div>
        );
      })}
    </div>
  );
}
