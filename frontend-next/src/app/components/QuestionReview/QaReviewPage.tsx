"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { useToast } from "@/shared/ui/use-toast";
import QuestionPanel from "@/app/components/question-generator/question-panel";
import {
  clearReviewSession,
  loadReviewSession,
  questionReviewService,
  type ReviewQuestion,
  saveReviewSession,
} from "@/app/services/question-review/question-review.service";
import {
  ReviewProvider,
  ReviewDrawer,
  QuestionReviewDocument,
  QAProgressPanel,
  DEFAULT_REVIEW_PROGRESS,
  DEFAULT_OVERALL_REVIEW,
  type ReviewAnnotation,
  type ReviewProgress,
  type OverallReviewState,
  type ReviewTarget,
} from "./review";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";

type Props = { slug: string };

type QuestionPhase = "answer" | "review";

function mapOverallFromResponse(r?: ReviewQuestion["response"]): OverallReviewState {
  if (!r) return { ...DEFAULT_OVERALL_REVIEW };
  return {
    questionQualityRating: r.questionQualityRating ?? 0,
    explanationQualityRating: r.explanationQualityRating ?? 0,
    imageQualityRating: r.imageQualityRating ?? 0,
    difficultyRating:
      (r.difficultyRating as OverallReviewState["difficultyRating"]) ||
      "APPROPRIATE",
    approvalStatus:
      (r.approvalStatus as OverallReviewState["approvalStatus"]) ||
      "NEEDS_REVISION",
    overallComment: r.overallComment ?? r.qualityComment ?? "",
  };
}

function mapProgressFromResponse(r?: ReviewQuestion["response"]): ReviewProgress {
  return { ...DEFAULT_REVIEW_PROGRESS, ...(r?.reviewProgress ?? {}) };
}

export default function QaReviewPage({ slug }: Props) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<{
    title: string;
    description: string | null;
    questionCount: number;
  } | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [starting, setStarting] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptSecret, setAttemptSecret] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [phases, setPhases] = useState<Record<string, QuestionPhase>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [annotationsByQuestion, setAnnotationsByQuestion] = useState<
    Record<string, ReviewAnnotation[]>
  >({});
  const [progressByQuestion, setProgressByQuestion] = useState<
    Record<string, ReviewProgress>
  >({});
  const [overallByQuestion, setOverallByQuestion] = useState<
    Record<string, OverallReviewState>
  >({});

  const [annotationSaving, setAnnotationSaving] = useState(false);
  const [overallSaving, setOverallSaving] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentPhase = currentQuestion
    ? phases[currentQuestion.id] ?? (selectedAnswers[currentQuestion.id] ? "review" : "answer")
    : "answer";

  const hydrateQuestions = useCallback((qs: ReviewQuestion[]) => {
    const answers: Record<string, string> = {};
    const ann: Record<string, ReviewAnnotation[]> = {};
    const prog: Record<string, ReviewProgress> = {};
    const overall: Record<string, OverallReviewState> = {};
    const ph: Record<string, QuestionPhase> = {};

    qs.forEach((q) => {
      if (q.response?.userAnswer) {
        answers[q.id] = q.response.userAnswer;
        ph[q.id] = q.response.reviewModeEnteredAt ? "review" : "review";
      }
      ann[q.id] = (q.response?.annotations ?? []) as ReviewAnnotation[];
      prog[q.id] = mapProgressFromResponse(q.response);
      overall[q.id] = mapOverallFromResponse(q.response);
    });

    setSelectedAnswers(answers);
    setAnnotationsByQuestion(ann);
    setProgressByQuestion(prog);
    setOverallByQuestion(overall);
    setPhases(ph);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta = await questionReviewService.getBundle(slug);
        if (cancelled) return;
        setBundle({
          title: meta.title,
          description: meta.description,
          questionCount: meta.questionCount,
        });

        const saved = loadReviewSession(slug);
        if (saved) {
          const session = await questionReviewService.getAttempt(
            saved.attemptId,
            saved.attemptSecret
          );
          if (cancelled) return;
          setAttemptId(saved.attemptId);
          setAttemptSecret(saved.attemptSecret);
          setReviewerName(saved.reviewerName);
          setQuestions(session.questions);
          hydrateQuestions(session.questions);
          if (session.status === "COMPLETED") setCompleted(true);
        }
      } catch (e) {
        toast({
          title: "Could not load review",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, toast, hydrateQuestions]);

  const handleStart = async () => {
    if (!reviewerName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    setStarting(true);
    try {
      const result = await questionReviewService.startAttempt(slug, {
        reviewerName: reviewerName.trim(),
      });
      saveReviewSession(slug, {
        attemptId: result.attemptId,
        attemptSecret: result.attemptSecret,
        reviewerName: reviewerName.trim(),
      });
      setAttemptId(result.attemptId);
      setAttemptSecret(result.attemptSecret);
      setQuestions(result.questions);
      hydrateQuestions(result.questions);
      setCurrentIndex(0);
    } catch (e) {
      toast({
        title: "Could not start",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setStarting(false);
    }
  };

  const enterReviewMode = async (questionId: string, answer: string) => {
    if (!attemptId || !attemptSecret) return;
    const q = questions.find((x) => x.id === questionId);
    const option = q?.options.find((o) => o.label === answer);
    await questionReviewService.updateResponse(
      attemptId,
      questionId,
      attemptSecret,
      {
        userAnswer: answer,
        isCorrect: !!option?.correct,
        enterReviewMode: true,
      }
    );
    setPhases((p) => ({ ...p, [questionId]: "review" }));
  };

  const handleSelectAnswer = async (label: string) => {
    if (!currentQuestion || completed || !label) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: label }));
    try {
      await enterReviewMode(currentQuestion.id, label);
    } catch (e) {
      toast({
        title: "Could not save answer",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleAnnotationSave = async (payload: {
    target: ReviewTarget;
    body: string;
    tags: string[];
    severity: ReviewAnnotation["severity"];
  }): Promise<boolean> => {
    if (!attemptId || !attemptSecret || !currentQuestion) return false;
    setAnnotationSaving(true);
    try {
      const created = await questionReviewService.createAnnotation(
        attemptId,
        currentQuestion.id,
        attemptSecret,
        {
          targetType: payload.target.targetType,
          targetKey: payload.target.targetKey,
          section: payload.target.section,
          selectedText: payload.target.selectedText,
          anchorMeta: payload.target.anchorMeta,
          body: payload.body,
          tags: payload.tags,
          severity: payload.severity,
        }
      );
      setAnnotationsByQuestion((prev) => ({
        ...prev,
        [currentQuestion.id]: [...(prev[currentQuestion.id] ?? []), created as ReviewAnnotation],
      }));
      toast({ title: "Feedback saved" });
      return true;
    } catch (e) {
      toast({
        title: "Could not save feedback",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    } finally {
      setAnnotationSaving(false);
    }
  };

  const markSection = async (key: keyof ReviewProgress) => {
    if (!currentQuestion || !attemptId || !attemptSecret) return;
    const next = {
      ...(progressByQuestion[currentQuestion.id] ?? DEFAULT_REVIEW_PROGRESS),
      [key]: true,
    };
    setProgressByQuestion((p) => ({ ...p, [currentQuestion.id]: next }));
    try {
      await questionReviewService.updateResponse(
        attemptId,
        currentQuestion.id,
        attemptSecret,
        { reviewProgress: next }
      );
    } catch {
      /* best effort */
    }
  };

  const saveOverallReview = async (): Promise<boolean> => {
    if (!currentQuestion || !attemptId || !attemptSecret) return false;
    const overall = overallByQuestion[currentQuestion.id] ?? DEFAULT_OVERALL_REVIEW;
    if (!overall.overallComment.trim()) {
      toast({ title: "Overall comment is required", variant: "destructive" });
      return false;
    }
    setOverallSaving(true);
    try {
      const nextProgress = {
        ...(progressByQuestion[currentQuestion.id] ?? DEFAULT_REVIEW_PROGRESS),
        overallReviewed: true,
      };
      const updated = await questionReviewService.updateResponse(
        attemptId,
        currentQuestion.id,
        attemptSecret,
        {
          questionQualityRating: overall.questionQualityRating || undefined,
          explanationQualityRating: overall.explanationQualityRating || undefined,
          imageQualityRating: overall.imageQualityRating || undefined,
          difficultyRating: overall.difficultyRating,
          approvalStatus: overall.approvalStatus,
          overallComment: overall.overallComment.trim(),
          reviewProgress: nextProgress,
        }
      );
      setProgressByQuestion((p) => ({
        ...p,
        [currentQuestion.id]: mapProgressFromResponse(updated),
      }));
      toast({ title: "Overall review saved" });
      return true;
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    } finally {
      setOverallSaving(false);
    }
  };

  const nextBlockers = useMemo(() => {
    if (!currentQuestion) return ["Loading question…"];
    const blockers: string[] = [];
    if (!selectedAnswers[currentQuestion.id]) {
      blockers.push("select an answer");
    }
    if (currentPhase === "answer") {
      blockers.push("finish the answer step");
    }
    const overall = overallByQuestion[currentQuestion.id] ?? DEFAULT_OVERALL_REVIEW;
    if (!overall.overallComment.trim()) {
      blockers.push("add an overall comment at the bottom of the page");
    }
    return blockers;
  }, [currentQuestion, selectedAnswers, currentPhase, overallByQuestion]);

  const canGoNext = nextBlockers.length === 0;

  const goNext = async () => {
    if (!currentQuestion) return;
    if (!canGoNext) {
      toast({
        title: "Complete this question first",
        description: `Please ${nextBlockers.join(", then ")}.`,
        variant: "destructive",
      });
      return;
    }

    const prog = progressByQuestion[currentQuestion.id] ?? DEFAULT_REVIEW_PROGRESS;
    if (!prog.overallReviewed) {
      const saved = await saveOverallReview();
      if (!saved) return;
    }

    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  };

  const handleSubmitAll = async () => {
    if (!attemptId || !attemptSecret || !currentQuestion) return;
    if (!canGoNext) {
      toast({
        title: "Complete this question first",
        description: `Please ${nextBlockers.join(", then ")}.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const prog = progressByQuestion[currentQuestion.id] ?? DEFAULT_REVIEW_PROGRESS;
      if (!prog.overallReviewed) {
        const saved = await saveOverallReview();
        if (!saved) return;
      }
      await questionReviewService.completeAttempt(attemptId, attemptSecret);
      clearReviewSession(slug);
      setCompleted(true);
      toast({ title: "Review submitted — thank you!" });
    } catch (e) {
      toast({
        title: "Could not submit",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const mapToPanelQuestion = useCallback((q: ReviewQuestion) => ({
    id: q.id,
    stem: q.stem,
    questionStemBlocks: q.questionStemBlocks,
    system: q.system,
    topic: q.topic,
    mcqTitle: q.title,
    options: q.options.map((o) => ({ ...o, value: o.label })),
    explanation: q.explanation,
    perAnswerExplanations: q.perAnswerExplanations,
  }), []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading UAT review…</p>
      </div>
    );
  }

  const currentAnnotations = currentQuestion
    ? annotationsByQuestion[currentQuestion.id] ?? []
    : [];
  const currentProgress = currentQuestion
    ? progressByQuestion[currentQuestion.id] ?? DEFAULT_REVIEW_PROGRESS
    : DEFAULT_REVIEW_PROGRESS;
  const currentOverall = currentQuestion
    ? overallByQuestion[currentQuestion.id] ?? DEFAULT_OVERALL_REVIEW
    : DEFAULT_OVERALL_REVIEW;

  return (
    <>
      <Head>
        <title>{bundle?.title ?? "MCQ UAT Review"}</title>
      </Head>

      <div className="min-h-screen bg-background text-slate-900 dark:text-slate-100 flex flex-col">
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20 px-4 py-3 dark:border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                Content QA · UAT
              </p>
              <h1 className="font-semibold truncate">{bundle?.title}</h1>
            </div>
            {reviewerName && (
              <p className="text-xs text-muted-foreground shrink-0">
                Reviewer: {reviewerName}
              </p>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
          {!attemptId && !completed && (
            <Card className="max-w-md mx-auto m-6 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Begin content review</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {bundle?.description}
                </p>
                <p className="text-sm mt-2">
                  Answer each question, then review the full content on one page —
                  highlight text, comment on images, tables, and options like a
                  document review.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Your name</label>
                <Input
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="mt-1 dark:bg-slate-900/80 dark:text-slate-100"
                  placeholder="Dr. / Student name"
                />
              </div>
              <Button className="w-full" onClick={handleStart} disabled={starting}>
                {starting ? "Starting…" : `Start · ${bundle?.questionCount} questions`}
              </Button>
            </Card>
          )}

          {completed && (
            <Card className="max-w-md mx-auto m-6 p-8 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h2 className="text-lg font-semibold">UAT review submitted</h2>
              <p className="text-sm text-muted-foreground">
                Thank you, {reviewerName}. Your detailed feedback has been recorded.
              </p>
            </Card>
          )}

          {attemptId && !completed && currentQuestion && (
            <ReviewProvider
              annotations={currentAnnotations}
              setAnnotations={(updater) => {
                setAnnotationsByQuestion((prev) => {
                  const current = prev[currentQuestion.id] ?? [];
                  const next =
                    typeof updater === "function" ? updater(current) : updater;
                  return { ...prev, [currentQuestion.id]: next };
                });
              }}
            >
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-w-0">
                  <QAProgressPanel
                    questionIndex={currentIndex}
                    questionTotal={questions.length}
                    answered={!!selectedAnswers[currentQuestion.id]}
                    progress={currentProgress}
                  />

                  {currentPhase === "answer" ? (
                    <div className="max-w-3xl mx-auto space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Step 1 — Answer the question. The full review view unlocks
                        after you submit.
                      </p>
                      <QuestionPanel
                        question={mapToPanelQuestion(currentQuestion)}
                        selectedAnswer={selectedAnswers[currentQuestion.id] ?? null}
                        answered={!!selectedAnswers[currentQuestion.id]}
                        onSelectAnswer={handleSelectAnswer}
                      />
                    </div>
                  ) : (
                    <QuestionReviewDocument
                      question={currentQuestion}
                      selectedAnswer={selectedAnswers[currentQuestion.id] ?? null}
                      overallReview={currentOverall}
                      onOverallChange={(v) =>
                        setOverallByQuestion((o) => ({
                          ...o,
                          [currentQuestion.id]: v,
                        }))
                      }
                      onOverallSave={saveOverallReview}
                      overallSaving={overallSaving}
                      progress={currentProgress}
                      onMarkSection={markSection}
                    />
                  )}

                  <div className="max-w-3xl space-y-2 pt-4 border-t dark:border-slate-800">
                    {!canGoNext && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        To continue: {nextBlockers.join(" · ")}
                      </p>
                    )}
                    <div className="flex justify-between gap-3">
                    <Button
                      variant="outline"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    {currentIndex < questions.length - 1 ? (
                      <Button
                        onClick={() => void goNext()}
                        disabled={!canGoNext || overallSaving}
                      >
                        {overallSaving ? "Saving…" : "Next question"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => void handleSubmitAll()}
                        disabled={submitting || overallSaving || !canGoNext}
                      >
                        {submitting ? "Submitting…" : "Submit UAT review"}
                      </Button>
                    )}
                    </div>
                  </div>
                </div>
                <ReviewDrawer onSave={handleAnnotationSave} saving={annotationSaving} />
              </div>
            </ReviewProvider>
          )}
        </main>
      </div>
    </>
  );
}
