"use client";

import { formatDate, severityStyles } from "./qa-admin-utils";

export type ReviewerAnnotation = {
  id: string;
  targetType: string;
  targetKey: string;
  section: string;
  selectedText?: string | null;
  body: string;
  tags: string[];
  severity: string;
  createdAt: string;
};

export type ReviewerFeedbackBundle = {
  attemptId: string;
  reviewerName: string;
  reviewerEmail?: string | null;
  completedAt?: string | null;
  overallComment?: string | null;
  approvalStatus?: string | null;
  questionQualityRating?: number | null;
  explanationQualityRating?: number | null;
  imageQualityRating?: number | null;
  difficultyRating?: string | null;
  feedbackCount: number;
  annotations: ReviewerAnnotation[];
};

type Props = {
  bundles: ReviewerFeedbackBundle[];
  activeAttemptId: string | null;
  activeAnnotationId: string | null;
  onSelectReviewer: (attemptId: string) => void;
  onSelectAnnotation: (annotation: ReviewerAnnotation) => void;
};

export function ReviewerFeedbackPanel({
  bundles,
  activeAttemptId,
  activeAnnotationId,
  onSelectReviewer,
  onSelectAnnotation,
}: Props) {
  const active =
    bundles.find((b) => b.attemptId === activeAttemptId) ?? bundles[0];

  if (!active) return null;

  return (
    <aside className="w-full xl:w-[min(420px,34vw)] shrink-0 rounded-xl border border-border/60 bg-card flex flex-col xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)]">
      <div className="p-3 border-b border-border/60 space-y-3">
        <div>
          <p className="text-sm font-semibold dark:text-slate-100">
            Reviewer feedback
          </p>
          <p className="text-[11px] text-muted-foreground">
            Inline notes from one reviewer on this question
          </p>
        </div>

        {bundles.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {bundles.map((bundle) => (
              <button
                key={bundle.attemptId}
                type="button"
                onClick={() => onSelectReviewer(bundle.attemptId)}
                className={`rounded-md px-2 py-1 text-[11px] border ${
                  bundle.attemptId === active.attemptId
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {bundle.reviewerName}
                <span className="ml-1 opacity-70">({bundle.feedbackCount})</span>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium dark:text-slate-100">{active.reviewerName}</p>
            <span className="text-[10px] text-muted-foreground">
              {active.feedbackCount} item{active.feedbackCount === 1 ? "" : "s"}
            </span>
          </div>
          {active.completedAt && (
            <p className="text-[10px] text-muted-foreground">
              Completed {formatDate(active.completedAt)}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {active.annotations.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No inline annotations — see overall review below the question.
          </p>
        ) : (
          active.annotations.map((annotation, idx) => (
            <button
              key={annotation.id}
              type="button"
              onClick={() => onSelectAnnotation(annotation)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                activeAnnotationId === annotation.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 hover:border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-medium text-muted-foreground">
                  #{idx + 1} · {annotation.section}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${severityStyles(annotation.severity)}`}
                >
                  {annotation.severity}
                </span>
              </div>
              {annotation.selectedText?.trim() && (
                <p className="text-[11px] italic text-muted-foreground mb-1 line-clamp-2">
                  &ldquo;{annotation.selectedText}&rdquo;
                </p>
              )}
              <p className="text-sm dark:text-slate-200 line-clamp-3">
                {annotation.body}
              </p>
              {annotation.tags.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {annotation.tags.join(" · ")}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatDate(annotation.createdAt)}
              </p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
