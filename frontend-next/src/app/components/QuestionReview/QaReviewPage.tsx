"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { useToast } from "@/shared/ui/use-toast";
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
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  MessageSquarePlus,
  MousePointerClick,
  StickyNote,
  Eye,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

type Props = { slug: string };

const REVIEW_GUIDELINES = [
  {
    icon: Eye,
    title: "1. Read the full question",
    body: "You’ll see the stem, options, and explanation on one page. Take a moment to read everything before leaving comments.",
  },
  {
    icon: Highlighter,
    title: "2. Highlight anything that looks wrong",
    body: "Select text in the stem, options, or explanation. A small “Add feedback” button will appear — click it to leave a comment on that exact phrase.",
  },
  {
    icon: MessageSquarePlus,
    title: "3. Comment on whole sections too",
    body: "Hover any block (stem, option, image, table, explanation) and click Comment if the whole section needs a note — typos, unclear wording, wrong facts, or weak distractors.",
  },
  {
    icon: StickyNote,
    title: "4. Be specific and helpful",
    body: "Say what is wrong and how you’d fix it. Short notes are fine: e.g. “Option B wording is ambiguous” or “Explanation contradicts guideline X.”",
  },
  {
    icon: MousePointerClick,
    title: "5. Finish with an overall comment",
    body: "At the bottom of each question, leave a short overall note, then use Next. You can go back to earlier questions before you submit the full review.",
  },
] as const;

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

function QaReviewWelcome({
  title,
  description,
  questionCount,
  reviewerName,
  onNameChange,
  guidelinesAccepted,
  onGuidelinesAcceptedChange,
  starting,
  onStart,
}: {
  title: string;
  description: string | null;
  questionCount: number;
  reviewerName: string;
  onNameChange: (v: string) => void;
  guidelinesAccepted: boolean;
  onGuidelinesAcceptedChange: (v: boolean) => void;
  starting: boolean;
  onStart: () => void;
}) {
  const canStart =
    guidelinesAccepted && reviewerName.trim().length > 0 && !starting;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-6 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Content QA · Review
          </p>
          <h2 className="mt-2 text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-slate-900">
            Before you begin
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl">
            {description?.trim() ||
              "You’ll review each MCQ on one page — stem, options, and explanation — and leave clear feedback so we can improve the question bank."}
          </p>
          <p className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
            {questionCount} question{questionCount === 1 ? "" : "s"} · {title}
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              How to give feedback
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Read these steps once — they take under a minute and apply to every
              question.
            </p>
            <ul className="mt-4 space-y-3">
              {REVIEW_GUIDELINES.map(({ icon: Icon, title: stepTitle, body }) => (
                <li
                  key={stepTitle}
                  className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-emerald-700">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {stepTitle}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950/90 leading-relaxed">
            <span className="font-semibold">Tip:</span> You do not need a perfect
            medical essay — clear, concrete feedback helps most. If something feels
            off, say so.
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div>
              <label
                htmlFor="qa-reviewer-name"
                className="text-sm font-medium text-slate-900"
              >
                Your name
              </label>
              <Input
                id="qa-reviewer-name"
                value={reviewerName}
                onChange={(e) => onNameChange(e.target.value)}
                className="mt-1.5 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                placeholder="e.g. Dr. Ayesha Khan / Student name"
                autoComplete="name"
              />
            </div>

            <label
              htmlFor="qa-guidelines-ack"
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors",
                guidelinesAccepted
                  ? "border-emerald-300 bg-emerald-50/60"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <Checkbox
                id="qa-guidelines-ack"
                checked={guidelinesAccepted}
                onCheckedChange={(v) => onGuidelinesAcceptedChange(v === true)}
                className="mt-0.5 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <span className="text-sm text-slate-700 leading-relaxed">
                I have read the guidelines and understand how to highlight text,
                leave comments, and submit overall feedback for each question.
              </span>
            </label>

            <Button
              className="w-full h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              onClick={onStart}
              disabled={!canStart}
            >
              {starting
                ? "Starting…"
                : `Start review · ${questionCount} question${questionCount === 1 ? "" : "s"}`}
            </Button>
            {!guidelinesAccepted && (
              <p className="text-center text-xs text-slate-500">
                Check the box above after reading the guidelines to enable Start.
              </p>
            )}
            {guidelinesAccepted && !reviewerName.trim() && (
              <p className="text-center text-xs text-slate-500">
                Enter your name to continue.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [starting, setStarting] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptSecret, setAttemptSecret] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  /** Reviewer UAT pages stay light regardless of site theme. */
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
    return () => {
      root.classList.remove("light");
      root.style.colorScheme = "";
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  const currentQuestion = questions[currentIndex];

  const hydrateQuestions = useCallback((qs: ReviewQuestion[]) => {
    const answers: Record<string, string> = {};
    const ann: Record<string, ReviewAnnotation[]> = {};
    const prog: Record<string, ReviewProgress> = {};
    const overall: Record<string, OverallReviewState> = {};

    qs.forEach((q) => {
      if (q.response?.userAnswer) {
        answers[q.id] = q.response.userAnswer;
      }
      ann[q.id] = (q.response?.annotations ?? []) as ReviewAnnotation[];
      prog[q.id] = mapProgressFromResponse(q.response);
      overall[q.id] = mapOverallFromResponse(q.response);
    });

    setSelectedAnswers(answers);
    setAnnotationsByQuestion(ann);
    setProgressByQuestion(prog);
    setOverallByQuestion(overall);
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
    if (!guidelinesAccepted) {
      toast({
        title: "Please confirm the guidelines",
        description: "Check the box after reading how feedback works.",
        variant: "destructive",
      });
      return;
    }
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

  const enterReviewMode = async (questionId: string) => {
    if (!attemptId || !attemptSecret) return;
    try {
      await questionReviewService.updateResponse(
        attemptId,
        questionId,
        attemptSecret,
        {
          enterReviewMode: true,
        }
      );
    } catch {
      /* best effort — review UI still works offline of this flag */
    }
  };

  useEffect(() => {
    if (!currentQuestion || !attemptId || completed) return;
    void enterReviewMode(currentQuestion.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when question changes
  }, [currentQuestion?.id, attemptId, completed]);

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
        [currentQuestion.id]: [
          ...(prev[currentQuestion.id] ?? []),
          created as ReviewAnnotation,
        ],
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
    const overall = overallByQuestion[currentQuestion.id] ?? DEFAULT_OVERALL_REVIEW;
    if (!overall.overallComment.trim()) {
      blockers.push("add an overall comment at the bottom of the page");
    }
    return blockers;
  }, [currentQuestion, overallByQuestion]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900">
        <p className="text-sm text-slate-500">Loading review…</p>
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
        <title>{bundle?.title ?? "MCQ Content Review"}</title>
      </Head>

      <div className="qa-review-root min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-20 px-4 py-3.5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-700 font-semibold">
                Content QA · Review
              </p>
              <h1 className="font-semibold truncate text-slate-900 text-[15px] sm:text-base">
                {bundle?.title}
              </h1>
            </div>
            {reviewerName && attemptId && (
              <p className="text-xs text-slate-500 shrink-0">
                Reviewer:{" "}
                <span className="font-medium text-slate-700">{reviewerName}</span>
              </p>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col w-full">
          {!attemptId && !completed && bundle && (
            <QaReviewWelcome
              title={bundle.title}
              description={bundle.description}
              questionCount={bundle.questionCount}
              reviewerName={reviewerName}
              onNameChange={setReviewerName}
              guidelinesAccepted={guidelinesAccepted}
              onGuidelinesAcceptedChange={setGuidelinesAccepted}
              starting={starting}
              onStart={() => void handleStart()}
            />
          )}

          {completed && (
            <Card className="max-w-md mx-auto m-8 p-8 text-center space-y-3 border-slate-200 bg-white shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h2 className="text-lg font-semibold text-slate-900">
                Review submitted
              </h2>
              <p className="text-sm text-slate-600">
                Thank you, {reviewerName}. Your feedback has been recorded and will
                help improve these questions.
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
              <div className="flex-1 min-h-0 flex flex-col max-w-5xl mx-auto w-full">
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-w-0">
                  <QAProgressPanel
                    questionIndex={currentIndex}
                    questionTotal={questions.length}
                    progress={currentProgress}
                  />

                  <QuestionReviewDocument
                    question={currentQuestion}
                    selectedAnswer={
                      selectedAnswers[currentQuestion.id] ?? null
                    }
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

                  <div className="max-w-3xl space-y-2 pt-4 border-t border-slate-200">
                    {!canGoNext && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                        To continue: {nextBlockers.join(" · ")}
                      </p>
                    )}
                    <div className="flex justify-between gap-3">
                      <Button
                        variant="outline"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        className="border-slate-200 bg-white"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      {currentIndex < questions.length - 1 ? (
                        <Button
                          onClick={() => void goNext()}
                          disabled={!canGoNext || overallSaving}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {overallSaving ? "Saving…" : "Next question"}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => void handleSubmitAll()}
                          disabled={submitting || overallSaving || !canGoNext}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {submitting ? "Submitting…" : "Submit review"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <ReviewDrawer
                  onSave={handleAnnotationSave}
                  saving={annotationSaving}
                />
              </div>
            </ReviewProvider>
          )}
        </main>
      </div>
    </>
  );
}
