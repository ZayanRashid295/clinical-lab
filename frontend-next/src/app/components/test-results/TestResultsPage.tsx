"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { CheckCircle, XCircle, Clock, Award, Target } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";

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
  score?: number;
  completedAt?: string;
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
}

export default function TestResultsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch test
        const testResponse = await fetch(`/api/tests/${id}`);
        if (!testResponse.ok) {
          throw new Error("Failed to fetch test");
        }
        const testData = await testResponse.json();
        setTest(testData);

        // Fetch questions
        if (testData.questions && testData.questions.length > 0) {
          const questionPromises = testData.questions.map(
            async (questionId: string) => {
              const qResponse = await fetch(`/api/questions/${questionId}`);
              if (!qResponse.ok) {
                throw new Error(`Failed to fetch question ${questionId}`);
              }
              return qResponse.json();
            }
          );
          const fetchedQuestions = await Promise.all(questionPromises);
          setQuestions(fetchedQuestions);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load test results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-3 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="space-y-4 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="container mx-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {error || "The test results could not be loaded."}
          </p>
          <Button
            onClick={() => router.push("/test-creation/study-create")}
            className="mt-4"
          >
            Create New Test
          </Button>
        </div>
      </div>
    );
  }

  const score = test.score || 0;
  const correctCount = Math.round((score / 100) * test.questionCount);
  const incorrectCount = test.questionCount - correctCount;

  return (
    <div className="container mx-auto p-3 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div
        className="space-y-4 max-w-5xl mx-auto"
        data-testid="page-test-results"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Test Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{test.name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/test-creation/study-create")}
              data-testid="button-view-all-tests"
            >
              View All Tests
            </Button>
            <Button
              onClick={() => router.push("/test-creation/study-create")}
              data-testid="button-new-test"
            >
              Take Another Test
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold text-gray-900 dark:text-white"
                data-testid="text-score"
              >
                {score}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {correctCount} of {test.questionCount} correct
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold text-green-600 dark:text-green-400"
                data-testid="text-correct"
              >
                {correctCount}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Correct answers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold text-gray-900 dark:text-white"
                data-testid="text-duration"
              >
                {test.duration || 0} min
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Time spent
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Correct Answers</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {correctCount} ({score}%)
                </span>
              </div>
              <Progress value={score} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Incorrect Answers</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {incorrectCount} ({100 - score}%)
                </span>
              </div>
              <Progress
                value={100 - score}
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Test Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mode</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {test.isTimed ? "Timed" : "Tutor"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Question Pool
                </p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {test.questionPool}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Subjects
                </p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {test.subjects.map((subject, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Systems
                </p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {test.systems.map((system, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {system}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(test.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3">
          <Button
            onClick={() => router.push("/test-creation/study-create")}
            data-testid="button-create-new-test"
          >
            Create New Test
          </Button>
        </div>
      </div>
    </div>
  );
}
