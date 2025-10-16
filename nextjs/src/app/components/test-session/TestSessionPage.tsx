"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Test,
  Question,
  TestSessionState,
  SessionAnswer,
} from "@/lib/test-models";

interface TestSessionPageProps {
  test: Test;
  questions: Question[];
}

export default function TestSessionPage({
  test,
  questions,
}: TestSessionPageProps) {
  const [sessionState, setSessionState] = useState<TestSessionState>({
    currentQuestionIndex: 0,
    answers: new Map(),
    timeRemaining: test.timeLimit ? test.timeLimit * 60 : undefined, // Convert to seconds
    isSubmitted: false,
    showReview: false,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set()
  );

  // Timer effect
  useEffect(() => {
    if (!sessionState.timeRemaining || isPaused || sessionState.isSubmitted)
      return;

    const timer = setInterval(() => {
      setSessionState((prev) => ({
        ...prev,
        timeRemaining: Math.max(0, (prev.timeRemaining || 0) - 1),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionState.timeRemaining, isPaused, sessionState.isSubmitted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (sessionState.timeRemaining === 0 && !sessionState.isSubmitted) {
      handleSubmitTest();
    }
  }, [sessionState.timeRemaining, sessionState.isSubmitted]);

  const handleAnswerSelect = useCallback(
    (questionId: string, answerId: string) => {
      setSessionState((prev) => {
        const newAnswers = new Map(prev.answers);
        newAnswers.set(questionId, {
          id: `sa_${Date.now()}`,
          sessionId: "current_session",
          questionId,
          answerId,
          answeredAt: new Date().toISOString(),
        });
        return {
          ...prev,
          answers: newAnswers,
        };
      });
    },
    []
  );

  const handleNavigateToQuestion = (index: number) => {
    setSessionState((prev) => ({
      ...prev,
      currentQuestionIndex: index,
    }));
  };

  const handlePreviousQuestion = () => {
    if (sessionState.currentQuestionIndex > 0) {
      setSessionState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  const handleNextQuestion = () => {
    if (sessionState.currentQuestionIndex < questions.length - 1) {
      setSessionState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  };

  const handleFlagQuestion = (questionIndex: number) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleSubmitTest = () => {
    setSessionState((prev) => ({
      ...prev,
      isSubmitted: true,
      showReview: true,
    }));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    return (sessionState.answers.size / questions.length) * 100;
  };

  const getAnsweredQuestionsCount = () => {
    return sessionState.answers.size;
  };

  const getUnansweredQuestions = () => {
    return questions.filter((q) => !sessionState.answers.has(q.id));
  };

  const currentQuestion = questions[sessionState.currentQuestionIndex];
  const currentAnswer = sessionState.answers.get(currentQuestion.id);

  if (sessionState.showReview) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Test Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{test.title}</h2>
                <p className="text-muted-foreground">
                  You have answered {getAnsweredQuestionsCount()} out of{" "}
                  {questions.length} questions
                </p>
                {getUnansweredQuestions().length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {getUnansweredQuestions().length} questions remain
                      unanswered
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const isAnswered = sessionState.answers.has(question.id);
                  const isFlagged = flaggedQuestions.has(index);
                  const isCurrent = index === sessionState.currentQuestionIndex;

                  return (
                    <Button
                      key={question.id}
                      variant={
                        isCurrent
                          ? "default"
                          : isAnswered
                          ? "secondary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleNavigateToQuestion(index)}
                      className="aspect-square relative"
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="h-3 w-3 absolute -top-1 -right-1 text-red-500" />
                      )}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setSessionState((prev) => ({ ...prev, showReview: false }))
                  }
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Continue Test
                </Button>
                <Button
                  onClick={handleSubmitTest}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Submit Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">{test.title}</h1>
              <Badge variant="outline">
                Question {sessionState.currentQuestionIndex + 1} of{" "}
                {questions.length}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {sessionState.timeRemaining !== undefined && (
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded ${
                    sessionState.timeRemaining < 300
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-mono font-medium">
                    {formatTime(sessionState.timeRemaining)}
                  </span>
                </div>
              )}

              <Button variant="outline" size="sm" onClick={handlePauseResume}>
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                {isPaused ? "Resume" : "Pause"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSessionState((prev) => ({ ...prev, showReview: true }))
                }
              >
                <Eye className="h-4 w-4 mr-2" />
                Review
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>
                Progress: {getAnsweredQuestionsCount()}/{questions.length}{" "}
                answered
              </span>
              <span>{Math.round(getProgressPercentage())}% complete</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Question Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-1">
                  {questions.map((question, index) => {
                    const isAnswered = sessionState.answers.has(question.id);
                    const isFlagged = flaggedQuestions.has(index);
                    const isCurrent =
                      index === sessionState.currentQuestionIndex;

                    return (
                      <Button
                        key={question.id}
                        variant={
                          isCurrent
                            ? "default"
                            : isAnswered
                            ? "secondary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handleNavigateToQuestion(index)}
                        className="aspect-square relative text-xs"
                      >
                        {index + 1}
                        {isFlagged && (
                          <Flag className="h-2 w-2 absolute -top-0.5 -right-0.5 text-red-500" />
                        )}
                      </Button>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-secondary rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border rounded"></div>
                    <span>Unanswered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="h-3 w-3 text-red-500" />
                    <span>Flagged</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Question {sessionState.currentQuestionIndex + 1}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleFlagQuestion(sessionState.currentQuestionIndex)
                    }
                  >
                    <Flag
                      className={`h-4 w-4 ${
                        flaggedQuestions.has(sessionState.currentQuestionIndex)
                          ? "text-red-500 fill-current"
                          : ""
                      }`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-base leading-relaxed">
                    {currentQuestion.content}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentQuestion.answers?.map((answer, index) => (
                    <div
                      key={answer.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        currentAnswer?.answerId === answer.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() =>
                        handleAnswerSelect(currentQuestion.id, answer.id)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            currentAnswer?.answerId === answer.id
                              ? "border-primary bg-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {currentAnswer?.answerId === answer.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="font-medium">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{answer.content}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={sessionState.currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {sessionState.currentQuestionIndex ===
                    questions.length - 1 ? (
                      <Button
                        onClick={handleSubmitTest}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Submit Test
                      </Button>
                    ) : (
                      <Button onClick={handleNextQuestion}>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
