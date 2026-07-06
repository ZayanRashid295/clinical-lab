"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Label } from "@/shared/ui/label";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  Bookmark,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import {
  ApiHttpError,
  getApiErrorMessage,
  isSubscriptionUpgradeRequiredError,
  subscriptionGateFromApiError,
} from "@/app/services/base/api-http-error";
import { Skeleton } from "@/shared/ui/skeleton";
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service";
import { QuestionPaperQuestionsService } from "@/app/services/assessments/question-paper-questions.service";
import { QuestionsService } from "@/app/services/questions/questions.service";
import { authService } from "@/shared/services/auth.service";

interface Test {
  id: string;
  name: string;
  mode: "tutor" | "timed";
  isTimed: boolean;
  questionPool: string;
  subjects: string[];
  systems: string[];
  questionCount: number;
  duration?: number;
  questions: string[];
  answers: Record<string, string>;
  markedQuestions: string[];
  status?: string;
  createdAt: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject: string;
  system: string;
  topic: string;
  mcqTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  imageUrl?: string;
}

function parseMcqTitleFromTags(tags: unknown, fallbackTitle?: string | null): string {
  const tagList = Array.isArray(tags) ? tags : [];
  for (const tag of tagList) {
    if (typeof tag === "string" && tag.startsWith("__mcqTitle:")) {
      return tag.replace("__mcqTitle:", "").trim();
    }
  }
  return fallbackTitle?.trim() || "";
}

function formatQuestionContextLabel(question: {
  system?: string;
  topic?: string;
  mcqTitle?: string;
}): string | null {
  const parts = [
    question.system?.trim() || "",
    question.topic?.trim() || "",
    question.mcqTitle?.trim() || "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function TestSessionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qpqIds, setQpqIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<number, number>>({});
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  /** Plan / entitlement gate — show dedicated screen instead of raw ApiHttpError */
  const [planGate, setPlanGate] = useState<{
    title: string;
    description: string;
    detail?: string;
  } | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    score: number;
    percentage: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const questionPapersService = new QuestionPapersService();
  const questionPaperQuestionsService = new QuestionPaperQuestionsService();
  const questionsService = new QuestionsService();

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchTest = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch question paper using the service
        const questionPaper = await questionPapersService.getQuestionPaper(id);
        
        // Fetch question paper questions
        const questionsResponse = await questionPaperQuestionsService.getQuestionPaperQuestions({
          questionPaperId: id,
        });
        
        // Handle paginated response
        const questionPaperQuestions = Array.isArray(questionsResponse)
          ? questionsResponse
          : (questionsResponse as any)?.data || [];

        // Transform question paper to test format
        const testData: Test = {
          id: questionPaper.id,
          name: questionPaper.name,
          mode: questionPaper.timeLimit ? "timed" : "tutor",
          isTimed: !!questionPaper.timeLimit,
          questionPool: questionPaper.type === "practice" ? "USMLE Step 1" : "Custom",
          subjects: [],
          systems: [],
          questionCount: questionPaperQuestions.length,
          duration: questionPaper.timeLimit,
          questions: [],
          answers: {},
          markedQuestions: [],
          status: "in-progress",
          createdAt: questionPaper.createdAt,
        };

        // Extract questions and restore answers/marked status
        if (questionPaperQuestions.length > 0) {
          const questionIds: string[] = [];
          const orderedQpqIds: string[] = [];
          const answers: Record<string, string> = {};
          const markedQuestions: string[] = [];

          // Sort by order to maintain question sequence
          const sortedQuestions = [...questionPaperQuestions].sort((a, b) => (a.order || 0) - (b.order || 0));

          sortedQuestions.forEach((qpq: any) => {
            questionIds.push(qpq.questionId);
            orderedQpqIds.push(qpq.id);
            if (qpq.userAnswer) {
              answers[qpq.questionId] = qpq.userAnswer;
            }
            if (qpq.markedForReview) {
              markedQuestions.push(qpq.questionId);
            }
          });

          testData.questions = questionIds;
          testData.answers = answers;
          testData.markedQuestions = markedQuestions;
          setQpqIds(orderedQpqIds);

          const fetchedQuestions: Question[] = [];
          for (const questionId of questionIds) {
            try {
              const question = await questionsService.getQuestion(questionId);
              const q = question as any;
              const systemName = q.system?.name || "General";
              const topicName = q.topic?.name || "General";
              const mcqTitle = parseMcqTitleFromTags(q.tags, q.title);
              fetchedQuestions.push({
                id: question.id,
                text: q.stem || question.question,
                options: (question.choices || []).map((c: any) => c.text),
                correctAnswer:
                  (question.choices || []).find((c: any) => c.isCorrect)?.text || "",
                explanation: question.explanation || "",
                subject: q.category?.name || systemName,
                system: systemName,
                topic: topicName,
                mcqTitle,
                difficulty: "Medium" as const,
                imageUrl: q.imageUrl,
              });
            } catch (err) {
              if (
                ApiHttpError.is(err) &&
                isSubscriptionUpgradeRequiredError(err)
              ) {
                setPlanGate(subscriptionGateFromApiError(err));
                setIsLoading(false);
                return;
              }
              setError(
                getApiErrorMessage(err, "We couldn’t load one or more questions.")
              );
              setIsLoading(false);
              return;
            }
          }
          setQuestions(fetchedQuestions);

          // Restore answers and marked questions by index
          const restoredAnswers: Record<number, string> = {};
          const restoredMarked = new Set<number>();

          sortedQuestions.forEach((qpq: any, index: number) => {
            if (qpq.userAnswer) {
              restoredAnswers[index] = qpq.userAnswer;
            }
            if (qpq.markedForReview) {
              restoredMarked.add(index);
            }
          });

          setSelectedAnswers(restoredAnswers);
          setMarkedQuestions(restoredMarked);
        }

        setTest(testData);
      } catch (err: unknown) {
        if (
          ApiHttpError.is(err) &&
          isSubscriptionUpgradeRequiredError(err)
        ) {
          setPlanGate(subscriptionGateFromApiError(err));
        } else {
          setError(getApiErrorMessage(err, "Failed to load test"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  const recordTimeSpent = (idx: number) => {
    const startedAt = questionStartTimes[idx];
    if (!startedAt) return 0;
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    setQuestionTimeSpent((prev) => ({
      ...prev,
      [idx]: (prev[idx] || 0) + seconds,
    }));
    return (questionTimeSpent[idx] || 0) + seconds;
  };

  // Track when the user lands on a new question
  useEffect(() => {
    if (!test || questions.length === 0) return;
    setQuestionStartTimes((prev) => ({
      ...prev,
      [currentQuestionIndex]: Date.now(),
    }));
  }, [currentQuestionIndex, test, questions.length]);

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = {
      ...selectedAnswers,
      [currentQuestionIndex]: answer,
    };
    setSelectedAnswers(newAnswers);

    if (test && test.questions && test.questions[currentQuestionIndex]) {
      const questionId = test.questions[currentQuestionIndex];
      const updatedAnswers = {
        ...(test.answers || {}),
        [questionId]: answer,
      };
      setTest({ ...test, answers: updatedAnswers });

      const qpqId = qpqIds[currentQuestionIndex];
      const isCorrect =
        questions[currentQuestionIndex]?.correctAnswer === answer;

      if (qpqId) {
        questionPaperQuestionsService
          .updateQuestionPaperQuestion(qpqId, {
            userAnswer: answer,
            isCorrect,
          })
          .catch((err) => {
            console.error("Failed to persist answer:", err);
          });
      }
    }

    if (!test?.isTimed) {
      setShowExplanation(true);
    }
  };

  const handleToggleMark = () => {
    const newMarked = new Set(markedQuestions);
    const willMark = !newMarked.has(currentQuestionIndex);
    if (willMark) {
      newMarked.add(currentQuestionIndex);
    } else {
      newMarked.delete(currentQuestionIndex);
    }
    setMarkedQuestions(newMarked);

    if (test && test.questions) {
      const markedIds = Array.from(newMarked).map((idx) => test.questions[idx]);
      setTest({ ...test, markedQuestions: markedIds });

      const qpqId = qpqIds[currentQuestionIndex];
      if (qpqId) {
        questionPaperQuestionsService
          .updateQuestionPaperQuestion(qpqId, {
            markedForReview: willMark,
          })
          .catch((err) => {
            console.error("Failed to persist mark:", err);
          });
      }
    }
  };

  const handleNext = () => {
    recordTimeSpent(currentQuestionIndex);
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    recordTimeSpent(currentQuestionIndex);
    setShowExplanation(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!test || !id || typeof id !== "string") return;
    setIsSubmitting(true);
    setError(null);

    recordTimeSpent(currentQuestionIndex);

    const user = authService.getCurrentUser();
    if (!user?.id) {
      setError("You must be signed in to submit a test.");
      setIsSubmitting(false);
      return;
    }

    const answersPayload = qpqIds
      .map((qpqId, idx) => {
        const userAnswer = selectedAnswers[idx];
        if (!qpqId || userAnswer === undefined) return null;
        return {
          questionPaperQuestionId: qpqId,
          userAnswer,
          timeSpent: questionTimeSpent[idx] || 0,
          markedForReview: markedQuestions.has(idx),
        };
      })
      .filter(Boolean) as Array<{
      questionPaperQuestionId: string;
      userAnswer: string;
      timeSpent: number;
      markedForReview: boolean;
    }>;

    try {
      const response = await questionPapersService.submitAssessment(id, {
        userId: user.id,
        answers: answersPayload,
      });
      setSubmitResult({
        ...response.results,
        answeredQuestions: answersPayload.length,
      });
    } catch (err: unknown) {
      if (
        ApiHttpError.is(err) &&
        isSubscriptionUpgradeRequiredError(err)
      ) {
        setPlanGate(subscriptionGateFromApiError(err));
      } else {
        setError(getApiErrorMessage(err, "Failed to submit test"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-3 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="space-y-4 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (planGate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/90 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <Card className="w-full overflow-hidden border-slate-200/90 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-600" />
            <CardHeader className="space-y-4 pb-2 pt-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900/50">
                <ShieldAlert className="h-7 w-7" aria-hidden />
              </div>
              <CardTitle className="text-xl font-semibold leading-snug text-slate-900 dark:text-white">
                {planGate.title}
              </CardTitle>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {planGate.description}
              </p>
              {planGate.detail && (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                  {planGate.detail}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pb-8 sm:flex-row sm:justify-center sm:gap-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
                asChild
              >
                <Link href="/billing">View plans and billing</Link>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/previous-tests">Back to my tests</Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-slate-600 sm:w-auto"
                type="button"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
            </CardContent>
          </Card>
          <p className="mt-6 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-500">
            If you believe this is a mistake—for example you recently upgraded—try refreshing after a minute or contact support with the message above.
          </p>
        </div>
      </div>
    );
  }

  if (submitResult && test) {
    const totalSeconds = Math.max(
      0,
      Math.floor((Date.now() - startTime) / 1000)
    );
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return (
      <div className="container mx-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="max-w-3xl mx-auto space-y-6" data-testid="page-test-results">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                Test Submitted
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">{test.name}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {submitResult.percentage}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {submitResult.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {submitResult.incorrectAnswers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Incorrect</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {minutes}m {seconds}s
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Answered {submitResult.answeredQuestions} of {submitResult.totalQuestions}
                  </span>
                </div>
                <Progress
                  value={
                    submitResult.totalQuestions > 0
                      ? (submitResult.answeredQuestions / submitResult.totalQuestions) * 100
                      : 0
                  }
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    setSubmitResult(null);
                    setShowExplanation(true);
                    setCurrentQuestionIndex(0);
                  }}
                  data-testid="button-review-answers"
                >
                  Review Answers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/previous-tests")}
                  data-testid="button-back-to-tests"
                >
                  Back to My Tests
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/test-creation/study-create")}
                  data-testid="button-create-another"
                >
                  Create Another Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {error || "The test could not be loaded."}
          </p>
          <Button
            onClick={() => router.push("/test-creation/study-create")}
            className="mt-4"
          >
            Return to Create Test
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const questionContextLabel = currentQuestion
    ? formatQuestionContextLabel(currentQuestion)
    : null;
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const isAnswered = selectedAnswer !== undefined;
  const totalAnswered = Object.keys(selectedAnswers).length;
  const progressPercent = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

  const isCorrect = isAnswered && selectedAnswer === currentQuestion?.correctAnswer;
  const isIncorrect = isAnswered && selectedAnswer !== currentQuestion?.correctAnswer;

  return (
    <div className="container mx-auto p-3 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="space-y-4 max-w-5xl mx-auto" data-testid="page-test-session">
        {error && (
          <div
            className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200 flex items-center justify-between"
            data-testid="test-session-error"
          >
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              data-testid="button-dismiss-error"
            >
              Dismiss
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{test.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {test.isTimed ? "Timed Mode" : "Tutor Mode"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {test.isTimed && test.duration && (
              <Badge variant="outline" className="gap-2">
                <Clock className="h-4 w-4" />
                {test.duration} min
              </Badge>
            )}
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length || test.questionCount}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {totalAnswered} / {questions.length || test.questionCount} answered
            </span>
          </div>
          <Progress value={progressPercent} />
        </div>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Test created successfully! Questions will be loaded from the question bank.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Selected Subjects: {test.subjects.join(", ")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Selected Systems: {test.systems.join(", ")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Question Count: {test.questionCount}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : currentQuestion ? (
          <Card data-testid={`question-card-${currentQuestionIndex}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {questionContextLabel && (
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      {questionContextLabel}
                    </p>
                  )}
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    {currentQuestion.text}
                  </CardTitle>
                </div>
                <div className="flex gap-2 items-center flex-shrink-0">
                  <Badge variant="outline">{currentQuestion.difficulty}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleMark}
                    className={markedQuestions.has(currentQuestionIndex) ? "text-yellow-500" : ""}
                    title={markedQuestions.has(currentQuestionIndex) ? "Unmark question" : "Mark question"}
                  >
                    <Bookmark className={`h-4 w-4 ${markedQuestions.has(currentQuestionIndex) ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={selectedAnswer}
                onValueChange={handleAnswerSelect}
                disabled={showExplanation && !test.isTimed}
              >
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const optionLetter = String.fromCharCode(65 + idx);
                    const isThisCorrect = option === currentQuestion.correctAnswer;
                    const isSelected = selectedAnswer === option;

                    let borderColor = "";
                    if (showExplanation) {
                      if (isThisCorrect) borderColor = "border-green-500";
                      else if (isSelected && !isThisCorrect) borderColor = "border-red-500";
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 ${borderColor} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                        data-testid={`option-${idx}`}
                      >
                        <RadioGroupItem value={option} id={`option-${idx}`} />
                        <Label
                          htmlFor={`option-${idx}`}
                          className="flex-1 cursor-pointer text-gray-900 dark:text-gray-200"
                        >
                          <span className="font-medium mr-2">{optionLetter}.</span>
                          {option}
                        </Label>
                        {showExplanation && isThisCorrect && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              {showExplanation && (
                <Card className="bg-gray-50 dark:bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-white">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Correct!</span>
                        </>
                      ) : (
                        <>
                          <Flag className="h-5 w-5 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">Incorrect</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {currentQuestion.explanation}
                    </p>
                  </CardContent>
                </Card>
              )}

              {test.isTimed && isAnswered && (
                <Button
                  variant="outline"
                  onClick={() => setShowExplanation(!showExplanation)}
                  data-testid="button-toggle-explanation"
                >
                  {showExplanation ? "Hide" : "Show"} Explanation
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {questions.length > 0 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              data-testid="button-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-3">
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              data-testid="button-submit-test"
            >
              {isSubmitting ? "Submitting…" : "Submit Test"}
            </Button>
              ) : (
                <Button onClick={handleNext} data-testid="button-next">
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

