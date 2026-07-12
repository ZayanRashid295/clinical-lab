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
import {
  draftFromSnapshot,
  type QuestionEditDraft,
} from "./qa-admin-utils";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { useToast } from "@/shared/ui/use-toast";

export function QuestionReviewLayout({ questionId }: { questionId: string }) {
  const { toast } = useToast();

  const [data, setData] = useState<any>(null);
  const [activeReviewerAttemptId, setActiveReviewerAttemptId] = useState<
    string | null
  >(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null
  );
  const [activeTargetKey, setActiveTargetKey] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editAttemptId, setEditAttemptId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<QuestionEditDraft | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
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
    const withText = highlightAnnotations.filter((a) => a.selectedText?.trim());
    return withText.length ? withText : null;
  }, [highlightAnnotations]);

  const handleSelectAnnotation = (annotation: {
    id: string;
    targetKey: string;
  }) => {
    setActiveAnnotationId(annotation.id);
    setActiveTargetKey(annotation.targetKey);
  };

  const handleStartEditMode = (attemptId: string) => {
    if (!data?.question) return;
    const bundle = reviewerBundles.find((b) => b.attemptId === attemptId);
    setActiveReviewerAttemptId(attemptId);
    setEditAttemptId(attemptId);
    setEditMode(true);
    setEditDraft(
      draftFromSnapshot(data.draftSnapshot, data.question)
    );
    if (bundle?.annotations[0]) {
      setActiveAnnotationId(bundle.annotations[0].id);
      setActiveTargetKey(bundle.annotations[0].targetKey);
    }
  };

  const handleExitEditMode = () => {
    setEditMode(false);
    setEditAttemptId(null);
    setEditDraft(null);
    setActiveAnnotationId(null);
    setActiveTargetKey(null);
  };

  const handleSaveDraft = async () => {
    if (!editDraft) return;
    setSavingDraft(true);
    try {
      await qaAdminService.saveDraft(questionId, {
        draftSnapshot: editDraft as unknown as Record<string, unknown>,
        summary: activeReviewer
          ? `Draft while addressing ${activeReviewer.reviewerName}'s feedback`
          : "Question draft saved",
      });
      toast({ title: "Draft saved" });
      await load();
    } catch (e) {
      toast({
        title: "Could not save draft",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
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
          {editMode && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExitEditMode}
              >
                Exit edit mode
              </Button>
              <Button
                size="sm"
                onClick={handleSaveDraft}
                disabled={savingDraft}
              >
                <Save className="h-4 w-4 mr-1" />
                {savingDraft ? "Saving…" : "Save draft"}
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" asChild>
            <a
              href={`/question-generator/admin?questionId=${questionId}${activeReviewerAttemptId ? `&reviewAttemptId=${activeReviewerAttemptId}` : ""}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                if (!highlightIssues?.length) return;
                try {
                  sessionStorage.setItem(
                    `qa-review-highlights:${questionId}`,
                    JSON.stringify({
                      attemptId: activeReviewerAttemptId,
                      reviewerName: activeReviewer?.reviewerName,
                      highlights: highlightIssues,
                    })
                  );
                } catch {
                  /* ignore */
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Full editor
            </a>
          </Button>
        </div>
      </div>

      {editMode && activeReviewer && (
        <Card className="p-3 border-primary/30 bg-primary/5 text-sm">
          <p className="font-medium text-primary">
            Editing with {activeReviewer.reviewerName}&apos;s highlights
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Flagged phrases are highlighted in amber boxes. Update the fields
            below each flagged section, then save your draft.
          </p>
        </Card>
      )}

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
            editMode={editMode}
            editDraft={editDraft}
            onEditDraftChange={setEditDraft}
          />

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
            editMode={editMode}
            editAttemptId={editAttemptId}
            activeAnnotationId={activeAnnotationId}
            onSelectReviewer={(attemptId) => {
              setActiveReviewerAttemptId(attemptId);
              if (editMode && editAttemptId !== attemptId) {
                handleExitEditMode();
              }
            }}
            onSelectAnnotation={handleSelectAnnotation}
            onStartEditMode={handleStartEditMode}
            onExitEditMode={handleExitEditMode}
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
