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
import { Textarea } from "@/shared/ui/textarea";
import { InlineCommentBadge } from "./InlineCommentBadge";
import { HighlightedContent } from "../review/HighlightedContent";
import {
  annotationsToHighlightItems,
  blockTargetKey,
  type HighlightItem,
} from "../review/annotation-highlight";
import { blockToPlainText, stemPlainText, highlightItemsMatchingPlainText, mergeHighlightItems } from "../review/highlight-text-utils";
import type { QuestionEditDraft } from "./qa-admin-utils";
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
  editMode?: boolean;
  editDraft?: QuestionEditDraft | null;
  onEditDraftChange?: (draft: QuestionEditDraft) => void;
  className?: string;
};

function isActiveTarget(activeKey: string | null, blockKey: string) {
  if (!activeKey) return false;
  return activeKey === blockKey || activeKey.startsWith(`${blockKey}:`);
}

function BlockShell({
  id,
  label,
  targetKey,
  issueCount,
  active,
  onSelect,
  highlightItems,
  plainText,
  onHighlightClick,
  editField,
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
  plainText?: string;
  onHighlightClick?: (item: HighlightItem) => void;
  editField?: React.ReactNode;
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
        plainText={plainText}
        onItemClick={onHighlightClick}
        className="text-sm dark:text-slate-200"
      >
        {children}
      </HighlightedContent>

      {editField && (
        <div className="mt-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Edit content
          </p>
          {editField}
        </div>
      )}
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
  editMode = false,
  editDraft,
  onEditDraftChange,
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
    (targetKey: string, fullTextFallback?: string) => {
      if (!annotationSource.length) return [];
      const byTarget = annotationsToHighlightItems(annotationSource, targetKey, {
        fullTextFallback,
      });
      if (!fullTextFallback?.trim()) return byTarget;
      return mergeHighlightItems(
        byTarget,
        highlightItemsMatchingPlainText(annotationSource, fullTextFallback)
      );
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
  const displayStem =
    editDraft?.stem ??
    stripOptionsAndExplanationsFromStemString(question.stem || "");
  const stemPlain = stemPlainText(question, displayStem);

  const updateDraft = (patch: Partial<QuestionEditDraft>) => {
    if (!editDraft || !onEditDraftChange) return;
    onEditDraftChange({ ...editDraft, ...patch });
  };

  const updateOptionText = (label: string, text: string) => {
    if (!editDraft || !onEditDraftChange) return;
    onEditDraftChange({
      ...editDraft,
      options: editDraft.options.map((o) =>
        o.label === label ? { ...o, text } : o
      ),
    });
  };

  const updateExplanationBlock = (blockId: string, text: string) => {
    if (!editDraft || !onEditDraftChange) return;
    onEditDraftChange({
      ...editDraft,
      explanationBlocks: { ...editDraft.explanationBlocks, [blockId]: text },
    });
  };

  useEffect(() => {
    if (!activeTargetKey || !containerRef.current) return;
    const blockKey = blockTargetKey(activeTargetKey);
    const el =
      containerRef.current.querySelector(`[data-target-key="${blockKey}"]`) ??
      containerRef.current.querySelector(
        `[data-target-key="${activeTargetKey}"]`
      );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeTargetKey]);

  const correctLabel =
    question.options.find((o) => o.correct)?.label ?? "";

  const stemHighlights = highlightsFor("stem");
  const stemHasFeedback = stemHighlights.length > 0 || countFor("stem") > 0;

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
        plainText={stemPlain}
        onHighlightClick={handleHighlightClick}
        editField={
          editMode && stemHasFeedback ? (
            <Textarea
              value={editDraft?.stem ?? displayStem}
              onChange={(e) => updateDraft({ stem: e.target.value })}
              rows={6}
              className="text-sm font-mono"
            />
          ) : undefined
        }
      >
        {stemBlocks.length > 0 && !stemHighlights.length ? (
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
          const optionText =
            editDraft?.options.find((o) => o.label === opt.label)?.text ??
            opt.text;
          const displayText = `${opt.label}. ${optionText}`;
          const optionHighlights = highlightsFor(key, displayText);
          const hasFeedback = optionHighlights.length > 0 || countFor(key) > 0;

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
                plainText={displayText}
                onItemClick={handleHighlightClick}
                className="text-sm dark:text-slate-200 mb-2"
              >
                <div>
                  <span className="font-semibold mr-2">{opt.label}.</span>
                  {optionText}
                  {opt.correct && (
                    <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                      Correct
                    </span>
                  )}
                </div>
              </HighlightedContent>

              {editMode && hasFeedback && (
                <Textarea
                  value={optionText}
                  onChange={(e) => updateOptionText(opt.label, e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              )}
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
        {(question.explanation as any[]).map((block: any, index: number) => {
          const id = block.id || `block-${index}`;
          const key =
            block.type === "table"
              ? `table:${id}`
              : block.type === "images" || block.type === "image"
                ? `image:${id}`
                : block.type === "per-answer-explanation" ||
                    block.type === "PER_ANSWER_EXPLANATION"
                  ? `per-answer:${id}`
                  : `explanation:${id}`;
          const blockHighlights = highlightsFor(key);
          const hasFeedback = blockHighlights.length > 0 || countFor(key) > 0;
          const editableText =
            editDraft?.explanationBlocks[id] ?? blockToPlainText(block);

          return (
            <BlockShell
              key={id}
              id={`qa-block-${id}`}
              label={
                block.type === "table"
                  ? `Table ${index + 1}`
                  : block.type === "images"
                    ? `Image ${index + 1}`
                    : "Explanation"
              }
              targetKey={key}
              issueCount={countFor(key)}
              active={isActiveTarget(activeTargetKey, key)}
              onSelect={() => onSelectTarget(key)}
              highlightItems={blockHighlights}
              plainText={editableText}
              onHighlightClick={handleHighlightClick}
              editField={
                editMode &&
                hasFeedback &&
                (block.type === "text" || block.type === "markdown") ? (
                  <Textarea
                    value={editableText}
                    onChange={(e) => updateExplanationBlock(id, e.target.value)}
                    rows={5}
                    className="text-sm font-mono"
                  />
                ) : editMode && hasFeedback ? (
                  <p className="text-xs text-muted-foreground">
                    Edit tables and images in the question generator.
                  </p>
                ) : undefined
              }
            >
              <RichContentRenderer
                content={[block]}
                perAnswerExplanations={question.perAnswerExplanations}
                options={question.options}
              />
            </BlockShell>
          );
        })}
      </section>
    </div>
  );
}
