"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { useToast } from "@/shared/ui/use-toast";
import QuestionPanel from "@/app/components/question-generator/question-panel";
import ExplanationPanel from "@/app/components/question-generator/explanation-panel";
import {
  clearReviewSession,
  loadReviewSession,
  questionReviewService,
  ReviewQuestion,
  saveReviewSession,
} from "@/app/services/question-review/question-review.service";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";

type Props = {
  slug: string;
};

export default function QaReviewPage({ slug }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<{
    title: string;
    description: string | null;
    questionCount: number;
  } | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [starting, setStarting] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptSecret, setAttemptSecret] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("IN_PROGRESS");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [qualityComment, setQualityComment] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];

  const mapToPanelQuestion = useCallback((q: ReviewQuestion) => {
    return {
      id: q.id,
      stem: q.stem,
      questionStemBlocks: q.questionStemBlocks,
      system: q.system,
      topic: q.topic,
      mcqTitle: q.title,
      options: q.options,
      explanation: q.explanation,
      perAnswerExplanations: q.perAnswerExplanations,
    };
  }, []);

  const hydrateFromQuestions = useCallback((qs: ReviewQuestion[]) => {
    const ans: Record<string, string> = {};
    const comm: Record<string, string> = {};
    qs.forEach((q) => {
      if (q.response?.userAnswer) ans[q.id] = q.response.userAnswer;
      if (q.response?.qualityComment) comm[q.id] = q.response.qualityComment;
    });
    setAnswers(ans);
    setComments(comm);
    if (qs.length) {
      const first = qs[0];
      setSelectedAnswer(ans[first.id] ?? null);
      setAnswered(!!ans[first.id]);
      setQualityComment(comm[first.id] ?? "");
    }
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
          setStatus(session.status);
          setQuestions(session.questions);
          hydrateFromQuestions(session.questions);
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
  }, [slug, toast, hydrateFromQuestions]);

  useEffect(() => {
    if (!currentQuestion) return;
    setSelectedAnswer(answers[currentQuestion.id] ?? null);
    setAnswered(!!answers[currentQuestion.id]);
    setQualityComment(comments[currentQuestion.id] ?? "");
  }, [currentIndex, currentQuestion, answers, comments]);

  const correctAnswerLabel = useMemo(() => {
    if (!currentQuestion) return "";
    const correct = currentQuestion.options.find((o) => o.correct);
    return correct?.label ?? "";
  }, [currentQuestion]);

  const handleStart = async () => {
    if (!reviewerName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    setStarting(true);
    try {
      const result = await questionReviewService.startAttempt(slug, {
        reviewerName: reviewerName.trim(),
        reviewerEmail: reviewerEmail.trim() || undefined,
      });
      saveReviewSession(slug, {
        attemptId: result.attemptId,
        attemptSecret: result.attemptSecret,
        reviewerName: reviewerName.trim(),
      });
      setAttemptId(result.attemptId);
      setAttemptSecret(result.attemptSecret);
      setQuestions(result.questions);
      hydrateFromQuestions(result.questions);
      setCurrentIndex(0);
    } catch (e) {
      toast({
        title: "Could not start review",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setStarting(false);
    }
  };

  const persistCurrent = async (
    answer: string,
    comment: string,
    isCorrect: boolean
  ) => {
    if (!attemptId || !attemptSecret || !currentQuestion) return;
    await questionReviewService.updateResponse(
      attemptId,
      currentQuestion.id,
      attemptSecret,
      {
        userAnswer: answer,
        isCorrect,
        qualityComment: comment.trim(),
      }
    );
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    setComments((prev) => ({ ...prev, [currentQuestion.id]: comment.trim() }));
  };

  const handleSelectAnswer = async (label: string) => {
    if (!currentQuestion || completed) return;
    const option = currentQuestion.options.find((o) => o.label === label);
    setSelectedAnswer(label);
    setAnswered(true);
    try {
      await persistCurrent(label, qualityComment, !!option?.correct);
    } catch (e) {
      toast({
        title: "Could not save answer",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleCommentBlur = async () => {
    if (!currentQuestion || !selectedAnswer || completed) return;
    const option = currentQuestion.options.find(
      (o) => o.label === selectedAnswer
    );
    try {
      await persistCurrent(
        selectedAnswer,
        qualityComment,
        !!option?.correct
      );
    } catch {
      /* silent on blur */
    }
  };

  const canGoNext = useMemo(() => {
    if (!currentQuestion) return false;
    const hasAnswer = !!answers[currentQuestion.id];
    const hasComment = !!comments[currentQuestion.id]?.trim() || !!qualityComment.trim();
    return hasAnswer && hasComment;
  }, [currentQuestion, answers, comments, qualityComment]);

  const goNext = async () => {
    if (!currentQuestion || !selectedAnswer) return;
    if (!qualityComment.trim()) {
      toast({
        title: "Comment required",
        description:
          "Please write a quality comment for this question before continuing — even if you are satisfied.",
        variant: "destructive",
      });
      return;
    }
    const option = currentQuestion.options.find(
      (o) => o.label === selectedAnswer
    );
    try {
      await persistCurrent(
        selectedAnswer,
        qualityComment,
        !!option?.correct
      );
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAll = async () => {
    if (!attemptId || !attemptSecret) return;
    if (!canGoNext) {
      toast({
        title: "Complete this question first",
        description: "Select an answer and write a mandatory quality comment.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const option = currentQuestion?.options.find(
        (o) => o.label === selectedAnswer
      );
      if (currentQuestion && selectedAnswer) {
        await persistCurrent(
          selectedAnswer,
          qualityComment,
          !!option?.correct
        );
      }
      await questionReviewService.completeAttempt(attemptId, attemptSecret);
      setCompleted(true);
      setStatus("COMPLETED");
      toast({
        title: "Thank you!",
        description: "Your quality review has been submitted.",
      });
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

  const answeredCount = Object.keys(answers).length;
  const commentedCount = Object.values(comments).filter((c) => c?.trim()).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-muted-foreground">Loading review…</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{bundle?.title ?? "MCQ Quality Review"} — MedPrepAI</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardList className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <h1 className="font-semibold truncate">{bundle?.title}</h1>
                <p className="text-xs text-muted-foreground truncate">
                  MCQ quality review · Tutor mode
                </p>
              </div>
            </div>
            {questions.length > 0 && (
              <div className="text-sm text-muted-foreground shrink-0">
                {answeredCount}/{questions.length} answered · {commentedCount} commented
              </div>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">
          {!attemptId && !completed && (
            <Card className="max-w-lg mx-auto p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Start your review</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {bundle?.description}
                </p>
                <p className="text-sm font-medium mt-3">
                  {bundle?.questionCount} questions · explanations shown after each answer
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                  A written comment is <strong>required on every question</strong> — please note
                  anything you liked or would improve.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Your name *</label>
                  <Input
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Dr. / Student name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email (optional)</label>
                  <Input
                    type="email"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleStart}
                disabled={starting || !bundle?.questionCount}
              >
                {starting ? "Starting…" : "Begin review"}
              </Button>
            </Card>
          )}

          {completed && (
            <Card className="max-w-lg mx-auto p-8 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-semibold">Review submitted</h2>
              <p className="text-muted-foreground">
                Thank you, {reviewerName}. Your feedback on {questions.length} questions
                has been recorded.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  clearReviewSession(slug);
                  void router.reload();
                }}
              >
                Start a new session
              </Button>
            </Card>
          )}

          {attemptId && !completed && currentQuestion && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  Question {currentIndex + 1} of {questions.length}
                </p>
                <div className="flex flex-wrap gap-1">
                  {questions.map((q, i) => {
                    const done =
                      !!answers[q.id] &&
                      !!(comments[q.id]?.trim() || (i === currentIndex && qualityComment.trim()));
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentIndex(i)}
                        className={`h-8 w-8 rounded-md text-xs font-medium border transition-colors ${
                          i === currentIndex
                            ? "bg-primary text-primary-foreground border-primary"
                            : done
                              ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 text-emerald-800 dark:text-emerald-200"
                              : "bg-white dark:bg-slate-800 border-border"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 min-h-[420px]">
                <QuestionPanel
                  question={mapToPanelQuestion(currentQuestion)}
                  selectedAnswer={selectedAnswer}
                  answered={answered}
                  onSelectAnswer={handleSelectAnswer}
                />
                <div className="flex flex-col gap-3 min-h-0">
                  {answered ? (
                    <ExplanationPanel
                      correct={
                        !!currentQuestion.options.find(
                          (o) => o.label === selectedAnswer
                        )?.correct
                      }
                      selectedAnswer={selectedAnswer}
                      explanation={currentQuestion.explanation}
                      correctAnswerLabel={correctAnswerLabel}
                      options={currentQuestion.options}
                      perAnswerExplanations={currentQuestion.perAnswerExplanations}
                      chapter={currentQuestion.system ?? undefined}
                      topic={currentQuestion.topic ?? undefined}
                      mcqTitle={currentQuestion.title ?? undefined}
                    />
                  ) : (
                    <Card className="p-6 flex items-center justify-center text-muted-foreground text-sm flex-1">
                      Select an answer to view the explanation
                    </Card>
                  )}
                </div>
              </div>

              <Card className="p-4 space-y-2 border-amber-200/60 dark:border-amber-800/40">
                <label className="text-sm font-semibold">
                  Quality feedback for this question <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Required — write whether the question is clear, accurate, and at the right
                  difficulty, or what should be improved.
                </p>
                <Textarea
                  value={qualityComment}
                  onChange={(e) => setQualityComment(e.target.value)}
                  onBlur={handleCommentBlur}
                  placeholder="e.g. Stem is clear. Distractors are plausible. Explanation could mention…"
                  rows={4}
                  className="resize-y"
                />
              </Card>

              <div className="flex justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                {currentIndex < questions.length - 1 ? (
                  <Button onClick={goNext} disabled={!canGoNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitAll}
                    disabled={submitting || !canGoNext}
                  >
                    {submitting ? "Submitting…" : "Submit review"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
