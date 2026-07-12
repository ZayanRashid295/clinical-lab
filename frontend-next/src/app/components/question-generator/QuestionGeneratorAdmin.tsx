"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminDashboard from "./admin-dashboard";
import type { QaFeedbackHighlight } from "@/app/components/QuestionReview/admin/QaFeedbackHighlightsBar";
import { qaAdminService } from "@/app/services/question-review/qa-admin.service";

export default function QuestionGeneratorAdmin() {
  const router = useRouter();

  const questionIdFromQuery =
    router.isReady && typeof router.query.questionId === "string"
      ? router.query.questionId.trim() || null
      : null;

  const reviewAttemptIdFromQuery =
    router.isReady && typeof router.query.reviewAttemptId === "string"
      ? router.query.reviewAttemptId.trim() || null
      : null;

  const [feedbackHighlights, setFeedbackHighlights] = useState<
    QaFeedbackHighlight[] | null
  >(null);
  const [reviewerName, setReviewerName] = useState<string | null>(null);

  useEffect(() => {
    if (!questionIdFromQuery) return;

    try {
      const raw = sessionStorage.getItem(
        `qa-review-highlights:${questionIdFromQuery}`
      );
      if (raw) {
        const parsed = JSON.parse(raw) as {
          highlights?: QaFeedbackHighlight[];
          reviewerName?: string;
          attemptId?: string;
        };
        if (Array.isArray(parsed.highlights) && parsed.highlights.length) {
          setFeedbackHighlights(parsed.highlights);
          setReviewerName(parsed.reviewerName ?? null);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    if (!reviewAttemptIdFromQuery) return;

    let cancelled = false;
    qaAdminService
      .getQuestionReview(questionIdFromQuery)
      .then((review) => {
        if (cancelled) return;
        const bundle = review.reviewerBundles?.find(
          (b) => b.attemptId === reviewAttemptIdFromQuery
        );
        if (!bundle) return;
        const highlights = bundle.annotations.filter((a) =>
          a.selectedText?.trim()
        );
        if (highlights.length) {
          setFeedbackHighlights(highlights);
          setReviewerName(bundle.reviewerName);
        }
      })
      .catch(() => {
        /* optional — editor still works without highlights */
      });

    return () => {
      cancelled = true;
    };
  }, [questionIdFromQuery, reviewAttemptIdFromQuery]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background dark:bg-gray-900">
      <div className="min-h-0 flex-1 overflow-hidden">
        <AdminDashboard
          initialQuestionId={questionIdFromQuery}
          feedbackHighlights={feedbackHighlights}
          feedbackReviewerName={reviewerName}
        />
      </div>
    </div>
  );
}
