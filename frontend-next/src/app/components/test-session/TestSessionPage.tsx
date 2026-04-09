"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Label } from "@/shared/ui/label";
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, Bookmark } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service";
import { QuestionPaperQuestionsService } from "@/app/services/assessments/question-paper-questions.service";
import { QuestionsService } from "@/app/services/questions/questions.service";

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
  difficulty: "Easy" | "Medium" | "Hard";
  imageUrl?: string;
}

export default function TestSessionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  
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
          const answers: Record<string, string> = {};
          const markedQuestions: string[] = [];

          // Sort by order to maintain question sequence
          const sortedQuestions = [...questionPaperQuestions].sort((a, b) => (a.order || 0) - (b.order || 0));

          sortedQuestions.forEach((qpq: any) => {
            questionIds.push(qpq.questionId);
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

          // Fetch full question details using the service
          const questionPromises = questionIds.map(async (questionId: string) => {
            try {
              const question = await questionsService.getQuestion(questionId);
              // Transform backend question to frontend format
              return {
                id: question.id,
                text: (question as any).stem || question.question,
                options: (question.choices || []).map((c: any) => c.text),
                correctAnswer: (question.choices || []).find((c: any) => c.isCorrect)?.text || "",
                explanation: question.explanation || "",
                subject: (question as any).system?.name || "General",
                system: question.topic?.name || "General",
                difficulty: "Medium" as const,
                imageUrl: (question as any).imageUrl,
              };
            } catch (err) {
              console.error(`Failed to fetch question ${questionId}:`, err);
              throw err;
            }
          });
          
          const fetchedQuestions = await Promise.all(questionPromises);
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
      } catch (err: any) {
        setError(err?.message || "Failed to load test");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = {
      ...selectedAnswers,
      [currentQuestionIndex]: answer,
    };
    setSelectedAnswers(newAnswers);

    // Save answer to test
    if (test && test.questions && test.questions[currentQuestionIndex]) {
      const questionId = test.questions[currentQuestionIndex];
      const updatedAnswers = {
        ...(test.answers || {}),
        [questionId]: answer,
      };

      // Update test state and backend
      setTest({
        ...test,
        answers: updatedAnswers,
      });

      // Update test in backend
      fetch(`/api/tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updatedAnswers }),
      }).catch(console.error);
    }

    if (!test?.isTimed) {
      setShowExplanation(true);
    }
  };

  const handleToggleMark = () => {
    const newMarked = new Set(markedQuestions);
    if (newMarked.has(currentQuestionIndex)) {
      newMarked.delete(currentQuestionIndex);
    } else {
      newMarked.add(currentQuestionIndex);
    }
    setMarkedQuestions(newMarked);

    // Save marked questions to test
    if (test && test.questions) {
      const markedIds = Array.from(newMarked).map((idx) => test.questions[idx]);
      
      // Update test state and backend
      setTest({
        ...test,
        markedQuestions: markedIds,
      });

      fetch(`/api/tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markedQuestions: markedIds }),
      }).catch(console.error);
    }
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setShowExplanation(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!test) return;

    const duration = Math.floor((Date.now() - startTime) / 1000 / 60);
    let correctCount = 0;

    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    try {
      // Submit test to API
      const response = await fetch(`/api/tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          score,
          duration,
          completedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit test");
      }

      // Navigate to results page
      router.push(`/test-results/${id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to submit test");
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

  if (error || !test) {
    return (
      <div className="container mx-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{error || "The test could not be loaded."}</p>
          <Button onClick={() => router.push("/test-creation/study-create")} className="mt-4">
            Return to Create Test
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const isAnswered = selectedAnswer !== undefined;
  const totalAnswered = Object.keys(selectedAnswers).length;
  const progressPercent = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

  const isCorrect = isAnswered && selectedAnswer === currentQuestion?.correctAnswer;
  const isIncorrect = isAnswered && selectedAnswer !== currentQuestion?.correctAnswer;

  return (
    <div className="container mx-auto p-3 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="space-y-4 max-w-5xl mx-auto" data-testid="page-test-session">
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
                <CardTitle className="text-lg flex-1 text-gray-900 dark:text-white">
                  {currentQuestion.text}
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <Badge variant="secondary">{currentQuestion.subject}</Badge>
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
              data-testid="button-submit-test"
            >
              Submit Test
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

