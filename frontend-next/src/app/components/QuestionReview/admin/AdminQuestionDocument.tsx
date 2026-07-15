"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RichContentRenderer from "@/app/components/question-generator/rich-content-renderer";
import {
  normalizeStemBlocksForDisplay,
  stripOptionsAndExplanationsFromStemString,
} from "@/app/components/question-generator/stem-blocks-utils";
import type { ReviewQuestion } from "@/app/services/question-review/question-review.service";
import { InlineCommentBadge } from "./InlineCommentBadge";
import { HighlightedContent } from "../review/HighlightedContent";
import {
  annotationsToHighlightItems,
  blockTargetKey,
  type HighlightItem,
} from "../review/annotation-highlight";
import { imageTargetKey } from "../review/ReviewableImage";
import { AdminAnswerBreakdown } from "../review/ReviewableAnswerBreakdown";
import { cn } from "@/shared/utils/cn";

type IssuePin = {
  id: string;
  targetKey: string;
  count: number;
};

type ReviewIssue = {
  id: string;
  targetKey: string;
  selectedText?: string | null;
  severity?: string;
  body?: string | null;
};

type Props = {
  question: ReviewQuestion;
  highlightIssues: ReviewIssue[] | null;
  highlightAnnotations?: ReviewIssue[] | null;
  issuesByTarget: IssuePin[];
  activeTargetKey: string | null;
  onSelectTarget: (targetKey: string, issueId?: string) => void;
  className?: string;
};

function isActiveTarget(activeKey: string | null, blockKey: string) {
  if (!activeKey) return false;
  if (activeKey === blockKey) return true;
  const activeBlock = blockTargetKey(activeKey);
  if (activeBlock === blockKey) return true;
  return (
    activeKey.startsWith(`${blockKey}:`) &&
    activeKey.charAt(blockKey.length) === ":"
  );
}

function BlockShell({
  id,
  label,
  targetKey,
  issueCount,
  active,
  onSelect,
  highlightItems,
  onHighlightClick,
  children,
  className,
}: {
  id: string;
  label: string;
  targetKey: string;
  issueCount: number;
  active: boolean;
  onSelect: () => void;
  highlightItems: HighlightItem[];
  onHighlightClick?: (item: HighlightItem) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-target-key={targetKey}
      className={cn(
        "rounded-xl border p-4 transition-all scroll-mt-24",
        active
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border/60",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        {issueCount > 0 && (
          <InlineCommentBadge
            count={issueCount}
            active={active}
            onClick={onSelect}
          />
        )}
      </div>

      <HighlightedContent
        highlightItems={highlightItems}
        onItemClick={onHighlightClick}
        className="text-sm dark:text-slate-200"
      >
        {children}
      </HighlightedContent>
    </section>
  );
}

export function AdminQuestionDocument({
  question,
  highlightIssues,
  highlightAnnotations,
  issuesByTarget,
  activeTargetKey,
  onSelectTarget,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const countFor = (key: string) =>
    issuesByTarget.find((i) => i.targetKey === key)?.count ?? 0;

  const annotationSource = useMemo(
    () =>
      highlightAnnotations?.length
        ? highlightAnnotations
        : highlightIssues ?? [],
    [highlightAnnotations, highlightIssues]
  );

  const highlightsFor = useCallback(
    (targetKey: string) => {
      if (!annotationSource.length) return [];
      return annotationsToHighlightItems(annotationSource, targetKey);
    },
    [annotationSource]
  );

  const handleHighlightClick = useCallback(
    (item: HighlightItem) => {
      onSelectTarget(item.targetKey, item.id);
    },
    [onSelectTarget]
  );

  const stemBlocks = normalizeStemBlocksForDisplay(
    (question.questionStemBlocks as any[]) ?? []
  );
  const displayStem = stripOptionsAndExplanationsFromStemString(
    question.stem || ""
  );

  useEffect(() => {
    if (!activeTargetKey || !containerRef.current) return;
    const root = containerRef.current;
    const blockKey = blockTargetKey(activeTargetKey);

    const candidates = [
      blockKey,
      activeTargetKey,
      // legacy reviewer image keys: image:blockId-0 → image:blockId / image:blockId:0
      blockKey.replace(/^image:(.+)-(\d+)$/, "image:$1:$2"),
      blockKey.replace(/^image:(.+)-(\d+)$/, "image:$1"),
    ];

    let el: Element | null = null;
    for (const key of candidates) {
      el = root.querySelector(`[data-target-key="${CSS.escape(key)}"]`);
      if (el) break;
    }

    if (!el) {
      const parts = blockKey.split(":");
      for (let i = parts.length - 1; i >= 2; i -= 1) {
        const parentKey = parts.slice(0, i).join(":");
        el = root.querySelector(`[data-target-key="${CSS.escape(parentKey)}"]`);
        if (el) break;
      }
    }

    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeTargetKey]);

  const correctLabel =
    question.options.find((o) => o.correct)?.label ?? "";

  const stemHighlights = highlightsFor("stem");

  return (
    <div ref={containerRef} className={cn("space-y-6", className)}>
      <BlockShell
        id="qa-metadata"
        label="Metadata"
        targetKey="metadata"
        issueCount={countFor("metadata")}
        active={isActiveTarget(activeTargetKey, "metadata")}
        onSelect={() => onSelectTarget("metadata")}
        highlightItems={highlightsFor("metadata")}
        onHighlightClick={handleHighlightClick}
        className="bg-muted/20"
      >
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {question.system && (
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">System</p>
              <p className="font-medium dark:text-slate-100">{question.system}</p>
            </div>
          )}
          {question.topic && (
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Topic</p>
              <p className="font-medium dark:text-slate-100">{question.topic}</p>
            </div>
          )}
          {question.title && (
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Title</p>
              <p className="font-medium dark:text-slate-100">{question.title}</p>
            </div>
          )}
        </div>
      </BlockShell>

      <BlockShell
        id="qa-stem"
        label="Question stem"
        targetKey="stem"
        issueCount={countFor("stem")}
        active={isActiveTarget(activeTargetKey, "stem")}
        onSelect={() => onSelectTarget("stem")}
        highlightItems={stemHighlights}
        onHighlightClick={handleHighlightClick}
      >
        {stemBlocks.length > 0 ? (
          <RichContentRenderer content={stemBlocks} stemMode />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none dark:text-slate-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayStem}</ReactMarkdown>
          </div>
        )}
      </BlockShell>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Options
        </h3>
        {question.options.map((opt) => {
          const key = `option:${opt.label}`;
          const active = isActiveTarget(activeTargetKey, key);
          const optionHighlights = highlightsFor(key);

          return (
            <div
              key={opt.label}
              data-target-key={key}
              className={cn(
                "rounded-lg border px-3 py-2 scroll-mt-24",
                active
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border/60",
                opt.correct && "bg-emerald-500/5"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Option {opt.label}
                </span>
                {countFor(key) > 0 && (
                  <InlineCommentBadge
                    count={countFor(key)}
                    active={active}
                    onClick={() => onSelectTarget(key)}
                  />
                )}
              </div>

              <HighlightedContent
                highlightItems={optionHighlights}
                onItemClick={handleHighlightClick}
                className="text-sm dark:text-slate-200"
              >
                <div>
                  <span className="font-semibold mr-2">{opt.label}.</span>
                  {opt.text}
                  {opt.correct && (
                    <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                      Correct
                    </span>
                  )}
                </div>
              </HighlightedContent>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground px-1">
          Correct answer: <strong>{correctLabel}</strong>
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Explanation & breakdown
        </h3>
        {(question.explanation as any[]).flatMap((block: any, index: number) => {
          const id = block.id || `block-${index}`;

          if (block.type === "images" || block.type === "image") {
            const images = block.data?.images || block.data?.urls || [];
            const list = (
              Array.isArray(images) ? images : [block.data?.url].filter(Boolean)
            ).filter(Boolean);
            const total = list.length;
            return list
              .map((img: any, i: number) => {
                const src =
                  typeof img === "string" ? img : img?.url || img?.src;
                if (!src) return null;
                const key = imageTargetKey(id, i, total);
                const imageHighlights = highlightsFor(key);
                // Also accept legacy keys image:${id}-${i}
                const legacyKey = `image:${id}-${i}`;
                const legacyHighlights = highlightsFor(legacyKey);
                const merged = [
                  ...imageHighlights,
                  ...legacyHighlights.filter(
                    (h) => !imageHighlights.some((x) => x.id === h.id)
                  ),
                ];
                const issueCount =
                  countFor(key) +
                  (key !== legacyKey ? countFor(legacyKey) : 0);

                return (
                  <BlockShell
                    key={key}
                    id={`qa-block-${key}`}
                    label={total > 1 ? `Image ${i + 1}` : `Image ${index + 1}`}
                    targetKey={key}
                    issueCount={issueCount}
                    active={
                      isActiveTarget(activeTargetKey, key) ||
                      isActiveTarget(activeTargetKey, legacyKey)
                    }
                    onSelect={() => onSelectTarget(key)}
                    highlightItems={merged}
                    onHighlightClick={handleHighlightClick}
                    className={
                      issueCount > 0
                        ? "border-amber-400/50 ring-1 ring-amber-300/30"
                        : undefined
                    }
                  >
                    <img
                      src={src}
                      alt={img?.alt || ""}
                      className="w-full h-auto max-h-80 object-contain bg-muted/30 rounded-md"
                    />
                    {img?.caption && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {img.caption}
                      </p>
                    )}
                  </BlockShell>
                );
              })
              .filter(Boolean);
          }

          if (
            block.type === "per-answer-explanation" ||
            block.type === "PER_ANSWER_EXPLANATION" ||
            block.data?.placeholder === true
          ) {
            const key = `per-answer:${id}`;
            return [
              <section
                key={id}
                id={`qa-block-${id}`}
                data-target-key={key}
                className={cn(
                  "rounded-xl border p-4 scroll-mt-24",
                  isActiveTarget(activeTargetKey, key)
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border/60"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Per-answer explanations
                  </h3>
                  {countFor(key) > 0 && (
                    <InlineCommentBadge
                      count={countFor(key)}
                      active={isActiveTarget(activeTargetKey, key)}
                      onClick={() => onSelectTarget(key)}
                    />
                  )}
                </div>
                <AdminAnswerBreakdown
                  blockId={id}
                  options={question.options}
                  perAnswerExplanations={
                    question.perAnswerExplanations as Record<string, unknown>
                  }
                  annotations={annotationSource}
                  activeTargetKey={activeTargetKey}
                  onSelectTarget={onSelectTarget}
                  countFor={countFor}
                />
              </section>,
            ];
          }

          const key =
            block.type === "table"
              ? `table:${id}`
              : `explanation:${id}`;
          const blockHighlights = highlightsFor(key);

          return [
            <BlockShell
              key={id}
              id={`qa-block-${id}`}
              label={
                block.type === "table" ? `Table ${index + 1}` : "Explanation"
              }
              targetKey={key}
              issueCount={countFor(key)}
              active={isActiveTarget(activeTargetKey, key)}
              onSelect={() => onSelectTarget(key)}
              highlightItems={blockHighlights}
              onHighlightClick={handleHighlightClick}
            >
              <RichContentRenderer content={[block]} />
            </BlockShell>,
          ];
        })}
        {!((question.explanation as any[]) ?? []).some(
          (b: any) =>
            b.type === "per-answer-explanation" ||
            b.type === "PER_ANSWER_EXPLANATION" ||
            b.data?.placeholder === true
        ) &&
          Object.keys(question.perAnswerExplanations || {}).length > 0 && (
            <section
              data-target-key="per-answer:answer-breakdown"
              className="rounded-xl border border-border/60 p-4 scroll-mt-24"
            >
              <AdminAnswerBreakdown
                blockId="answer-breakdown"
                options={question.options}
                perAnswerExplanations={
                  question.perAnswerExplanations as Record<string, unknown>
                }
                annotations={annotationSource}
                activeTargetKey={activeTargetKey}
                onSelectTarget={onSelectTarget}
                countFor={countFor}
              />
            </section>
          )}
      </section>
    </div>
  );
}
