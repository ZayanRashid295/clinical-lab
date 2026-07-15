"use client";

import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RichContentRenderer from "@/app/components/question-generator/rich-content-renderer";
import {
  normalizeStemBlocksForDisplay,
  stripOptionsAndExplanationsFromStemString,
} from "@/app/components/question-generator/stem-blocks-utils";
import type { ReviewQuestion } from "@/app/services/question-review/question-review.service";
import { ReviewableBlock } from "./ReviewableBlock";
import { ReviewableOption } from "./ReviewableOption";
import { ReviewableTable } from "./ReviewableTable";
import { ReviewableImage, imageTargetKey } from "./ReviewableImage";
import { OverallReviewCard } from "./OverallReviewCard";
import { ReviewableAnswerBreakdown } from "./ReviewableAnswerBreakdown";
import { useTextSelectionReview } from "./useTextSelectionReview";
import type { OverallReviewState, ReviewProgress } from "./review-types";

type Props = {
  question: ReviewQuestion;
  selectedAnswer: string | null;
  overallReview: OverallReviewState;
  onOverallChange: (v: OverallReviewState) => void;
  onOverallSave: () => void;
  overallSaving?: boolean;
  progress: ReviewProgress;
  onMarkSection: (key: keyof ReviewProgress) => void;
};

export function QuestionReviewDocument({
  question,
  selectedAnswer,
  overallReview,
  onOverallChange,
  onOverallSave,
  overallSaving,
  progress,
  onMarkSection,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { Toolbar } = useTextSelectionReview({
    containerRef,
    enabled: true,
    defaultSection: "Explanation",
    defaultTargetType: "EXPLANATION",
  });

  const correctLabel =
    question.options.find((o) => o.correct)?.label ?? "";
  const stemBlocks = normalizeStemBlocksForDisplay(
    (question.questionStemBlocks as any[]) ?? []
  );
  const displayStem = stripOptionsAndExplanationsFromStemString(
    question.stem || ""
  );
  const hasStemBlocks = stemBlocks.length > 0;

  const renderExplanationBlocks = () => {
    const blocks = (question.explanation as any[]) ?? [];
    if (!blocks.length) {
      return (
        <p className="text-sm text-muted-foreground dark:text-slate-400">
          No explanation available.
        </p>
      );
    }

    const hasPerAnswerBlock = blocks.some(
      (b) =>
        b.type === "per-answer-explanation" ||
        b.type === "PER_ANSWER_EXPLANATION" ||
        b.data?.placeholder === true ||
        b.data?.isPerAnswerExplanation === true
    );

    const rendered = blocks.map((block: any, index: number) => {
      const id = block.id || `block-${index}`;
      if (block.type === "table") {
        const html =
          block.data?.tableHtml || block.data?.html || block.data?.content || "";
        return (
          <ReviewableBlock
            key={id}
            label={`Table ${index + 1}`}
            section={`Table ${index + 1}`}
            targetType="TABLE"
            targetKey={`table:${id}`}
            onMarkReviewed={() => onMarkSection("explanationReviewed")}
          >
            <ReviewableTable tableId={id} tableHtml={html} />
          </ReviewableBlock>
        );
      }
      if (block.type === "images" || block.type === "image") {
        const images = block.data?.images || block.data?.urls || [];
        const list = (
          Array.isArray(images) ? images : [block.data?.url].filter(Boolean)
        ).filter(Boolean);
        const total = list.length;
        return (
          <div key={id} className="space-y-3">
            {list.map((img: any, i: number) => {
              const src = typeof img === "string" ? img : img?.url || img?.src;
              if (!src) return null;
              const targetKey = imageTargetKey(id, i, total);
              return (
                <ReviewableImage
                  key={targetKey}
                  targetKey={targetKey}
                  src={src}
                  alt={img?.alt}
                  caption={img?.caption}
                  label={total > 1 ? `Image ${i + 1}` : "Image"}
                />
              );
            })}
          </div>
        );
      }
      if (
        block.type === "per-answer-explanation" ||
        block.type === "PER_ANSWER_EXPLANATION" ||
        block.data?.placeholder === true ||
        block.data?.isPerAnswerExplanation === true
      ) {
        return (
          <section
            key={id}
            data-review-section="Answer breakdown"
            data-review-target={`per-answer:${id}`}
            data-review-type="EXPLANATION"
            data-target-key={`per-answer:${id}`}
            className="space-y-2 scroll-mt-24"
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                Per-answer explanations
              </h3>
              <button
                type="button"
                onClick={() => onMarkSection("explanationReviewed")}
                className="text-[10px] text-muted-foreground hover:text-foreground dark:text-slate-500 dark:hover:text-slate-300"
              >
                Mark reviewed
              </button>
            </div>
            <ReviewableAnswerBreakdown
              blockId={id}
              options={question.options}
              perAnswerExplanations={
                question.perAnswerExplanations as Record<string, unknown>
              }
              selectedAnswer={selectedAnswer}
            />
          </section>
        );
      }
      return (
        <ReviewableBlock
          key={id}
          section="Explanation"
          targetType="EXPLANATION"
          targetKey={`explanation:${id}`}
          onMarkReviewed={() => onMarkSection("explanationReviewed")}
        >
          <RichContentRenderer content={[block]} stemMode={false} />
        </ReviewableBlock>
      );
    });

    // Legacy data: per-answer content exists but no placeholder block in explanation array
    if (
      !hasPerAnswerBlock &&
      Object.keys(question.perAnswerExplanations || {}).length > 0
    ) {
      rendered.push(
        <section
          key="per-answer-fallback"
          data-review-section="Answer breakdown"
          data-review-target="per-answer:answer-breakdown"
          data-review-type="EXPLANATION"
          data-target-key="per-answer:answer-breakdown"
          className="space-y-2 scroll-mt-24"
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
              Per-answer explanations
            </h3>
            <button
              type="button"
              onClick={() => onMarkSection("explanationReviewed")}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Mark reviewed
            </button>
          </div>
          <ReviewableAnswerBreakdown
            blockId="answer-breakdown"
            options={question.options}
            perAnswerExplanations={
              question.perAnswerExplanations as Record<string, unknown>
            }
            selectedAnswer={selectedAnswer}
          />
        </section>
      );
    }

    return rendered;
  };

  return (
    <>
      {Toolbar}
      <div ref={containerRef} className="space-y-8 pb-8">
        {/* Metadata */}
        <ReviewableBlock
          label="Metadata"
          section="Metadata"
          targetType="METADATA"
          targetKey="metadata"
          onMarkReviewed={() => onMarkSection("metadataReviewed")}
          className="p-4 bg-muted/30 dark:bg-slate-800/30"
        >
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {question.system && (
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">System</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {question.system}
                </p>
              </div>
            )}
            {question.topic && (
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Topic</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {question.topic}
                </p>
              </div>
            )}
            {question.title && (
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Title</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {question.title}
                </p>
              </div>
            )}
          </div>
        </ReviewableBlock>

        {/* Stem */}
        <ReviewableBlock
          label="Question stem"
          section="Question stem"
          targetType="STEM"
          targetKey="stem"
          onMarkReviewed={() => onMarkSection("stemReviewed")}
          className="p-4 bg-white border border-slate-200/80 rounded-xl"
        >
          {hasStemBlocks ? (
            <div className="prose prose-sm max-w-none text-slate-900 [&_*]:text-slate-900">
              <RichContentRenderer content={stemBlocks} stemMode />
            </div>
          ) : displayStem ? (
            <div className="prose prose-sm max-w-none text-slate-900">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayStem}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No question stem content was provided for this MCQ.
            </p>
          )}
        </ReviewableBlock>

        {/* Options */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
            Options
          </h3>
          {question.options.map((opt) => (
            <ReviewableOption
              key={opt.label}
              label={opt.label}
              text={opt.text}
              correct={opt.correct}
              selected={selectedAnswer === opt.label}
              showCorrect
            />
          ))}
          <p className="text-xs text-muted-foreground px-1 pt-1">
            Correct answer:{" "}
            <strong className="text-emerald-600">{correctLabel}</strong>
          </p>
        </section>

        {/* Explanation */}
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
            Explanation & breakdown
          </h3>
          {renderExplanationBlocks()}
        </section>

        {/* Overall */}
        <OverallReviewCard
          value={overallReview}
          onChange={onOverallChange}
          onSave={onOverallSave}
          saving={overallSaving}
        />
      </div>
    </>
  );
}
