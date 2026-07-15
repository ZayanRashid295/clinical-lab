"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { qaAdminService } from "@/app/services/question-review/qa-admin.service";
import { AdminQuestionDocument } from "./AdminQuestionDocument";
import { ReviewerFeedbackPanel } from "./ReviewerFeedbackPanel";
import type { ReviewerFeedbackBundle } from "./ReviewerFeedbackPanel";
import { ApprovalCard } from "./ApprovalCard";
import { blockTargetKey } from "../review/annotation-highlight";
import { OverallReviewCard } from "../review/OverallReviewCard";
import type {
  OverallReviewState,
  ReviewApproval,
  ReviewDifficulty,
} from "../review/review-types";
import { DEFAULT_OVERALL_REVIEW } from "../review/review-types";
import { ArrowLeft, ExternalLink } from "lucide-react";

function overallFromBundle(
  bundle: ReviewerFeedbackBundle | null
): OverallReviewState {
  if (!bundle) return DEFAULT_OVERALL_REVIEW;
  return {
    questionQualityRating: bundle.questionQualityRating ?? 0,
    explanationQualityRating: bundle.explanationQualityRating ?? 0,
    imageQualityRating: bundle.imageQualityRating ?? 0,
    difficultyRating:
      (bundle.difficultyRating as ReviewDifficulty) ||
      DEFAULT_OVERALL_REVIEW.difficultyRating,
    approvalStatus:
      (bundle.approvalStatus as ReviewApproval) ||
      DEFAULT_OVERALL_REVIEW.approvalStatus,
    overallComment: bundle.overallComment ?? "",
  };
}

export function QuestionReviewLayout({ questionId }: { questionId: string }) {
  const [data, setData] = useState<any>(null);
  const [activeReviewerAttemptId, setActiveReviewerAttemptId] = useState<
    string | null
  >(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null
  );
  const [activeTargetKey, setActiveTargetKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const review = await qaAdminService.getQuestionReview(questionId);
      setData(review);
      const bundles = review.reviewerBundles ?? [];
      setActiveReviewerAttemptId((prev) => prev ?? bundles[0]?.attemptId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load question");
    }
  }, [questionId]);

  useEffect(() => {
    load();
  }, [load]);

  const reviewerBundles = (data?.reviewerBundles ??
    []) as ReviewerFeedbackBundle[];

  const activeReviewer = useMemo(
    () =>
      reviewerBundles.find((b) => b.attemptId === activeReviewerAttemptId) ??
      reviewerBundles[0] ??
      null,
    [reviewerBundles, activeReviewerAttemptId]
  );

  const issuesByTarget = useMemo(() => {
    const source = activeReviewer?.annotations ?? [];
    const map = new Map<string, number>();
    for (const item of source) {
      const key = blockTargetKey(item.targetKey);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([targetKey, count]) => ({
      id: targetKey,
      targetKey,
      count,
    }));
  }, [activeReviewer]);

  const highlightAnnotations = useMemo(() => {
    if (activeReviewer?.annotations?.length) {
      return activeReviewer.annotations.map((a) => ({
        id: a.id,
        targetKey: a.targetKey,
        selectedText: a.selectedText,
        severity: a.severity,
        body: a.body,
      }));
    }

    return (data?.issues ?? []).map(
      (i: {
        id: string;
        targetKey: string;
        selectedText?: string | null;
        severity?: string;
        body?: string | null;
        summary?: string | null;
      }) => ({
        id: i.id,
        targetKey: i.targetKey,
        selectedText: i.selectedText,
        severity: i.severity,
        body: i.body ?? i.summary ?? "",
      })
    );
  }, [activeReviewer, data?.issues]);

  const highlightIssues = useMemo(() => {
    const withText = highlightAnnotations.filter(
      (a: { selectedText?: string | null }) => a.selectedText?.trim()
    );
    return withText.length ? withText : null;
  }, [highlightAnnotations]);

  const handleSelectAnnotation = (annotation: {
    id: string;
    targetKey: string;
  }) => {
    setActiveAnnotationId(annotation.id);
    setActiveTargetKey(annotation.targetKey);
  };

  if (error) {
    return <Card className="p-4 text-destructive">{error}</Card>;
  }

  if (!data) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  const openIssues = (data.issues ?? []).filter(
    (i: { status: string }) =>
      !["RESOLVED", "VERIFIED", "CLOSED"].includes(i.status)
  ).length;

  const hasReviewerFeedback = reviewerBundles.length > 0;
  const overallReview = overallFromBundle(activeReviewer);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="sm" asChild className="mt-0.5">
            <Link href="/admin/content/question-review">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold dark:text-slate-100">
              {data.question.title || "Question review"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {data.question.system} · {data.question.topic}
              {openIssues > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {" "}
                  · {openIssues} open issue{openIssues === 1 ? "" : "s"}
                </span>
              )}
              {hasReviewerFeedback && (
                <span>
                  {" "}
                  · {reviewerBundles.length} reviewer
                  {reviewerBundles.length === 1 ? "" : "s"}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <a
              href={`/question-generator/admin?questionId=${questionId}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Full editor
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 min-h-[calc(100vh-12rem)]">
        <div className="flex-1 min-w-0 space-y-6">
          <AdminQuestionDocument
            question={data.question}
            highlightIssues={highlightIssues}
            highlightAnnotations={highlightAnnotations}
            issuesByTarget={issuesByTarget}
            activeTargetKey={activeTargetKey}
            onSelectTarget={(targetKey, issueId) => {
              setActiveTargetKey(targetKey);
              if (issueId) setActiveAnnotationId(issueId);
            }}
          />

          {activeReviewer && (
            <OverallReviewCard
              value={overallReview}
              readOnly
              reviewerName={activeReviewer.reviewerName}
            />
          )}

          {(data.issues ?? []).length > 0 && (
            <Card className="p-4 border-border/60">
              <h2 className="text-sm font-semibold mb-3 dark:text-slate-100">
                Mark question ready
              </h2>
              <ApprovalCard
                initialStatus={data.qaRecord?.productionStatus}
                initialRatings={
                  (data.qaRecord?.ratings as Record<string, number>) ?? {}
                }
                initialNote={data.qaRecord?.decisionNote ?? ""}
                onSubmit={async (payload) => {
                  await qaAdminService.approveQuestion(questionId, payload);
                  await load();
                }}
              />
            </Card>
          )}
        </div>

        {hasReviewerFeedback ? (
          <ReviewerFeedbackPanel
            bundles={reviewerBundles}
            activeAttemptId={activeReviewerAttemptId}
            activeAnnotationId={activeAnnotationId}
            onSelectReviewer={setActiveReviewerAttemptId}
            onSelectAnnotation={handleSelectAnnotation}
          />
        ) : (
          <Card className="p-4 xl:w-[min(420px,34vw)] shrink-0 text-sm text-muted-foreground">
            No reviewer feedback on this question yet.
          </Card>
        )}
      </div>
    </div>
  );
}
