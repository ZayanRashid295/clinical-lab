"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CheckCircle, XCircle, Circle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service";
import { QuestionPaperQuestionsService } from "@/app/services/assessments/question-paper-questions.service";

interface QuestionPaperQuestion {
  id: string;
  questionId: string;
  order: number;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
  markedForReview: boolean;
  question?: {
    id: string;
    topic?: {
      id: string;
      name: string;
      chapter?: {
        id: string;
        name: string;
        section?: {
          id: string;
          name: string;
        };
      };
    };
    productTag?: {
  id: string;
  name: string;
    };
  };
}

interface AssessmentResults {
  questionPaper: {
  id: string;
    name: string;
    type: string;
    timeLimit?: number;
  };
  results: {
    totalQuestions: number;
    answeredQuestions: number;
    unansweredQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    score: number;
    percentage: number;
  };
  questions: QuestionPaperQuestion[];
}

export default function TestResultsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState("All");
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const questionPapersService = new QuestionPapersService();

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const data = await questionPapersService.getAssessmentResults(id);
        setResults(data);
      } catch (err: any) {
        console.error("Failed to fetch results:", err);
        setError(err?.message || "Failed to load test results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-background dark:bg-gray-900">
        <div className="w-full px-6 lg:px-8 xl:px-12 py-8 space-y-8">
          <Skeleton className="h-8 w-64 bg-muted dark:bg-gray-800" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-48 bg-muted dark:bg-gray-800" />
            <Skeleton className="h-48 bg-muted dark:bg-gray-800" />
          </div>
          <Skeleton className="h-96 bg-muted dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="w-full min-h-screen bg-background dark:bg-gray-900">
        <div className="w-full px-6 lg:px-8 xl:px-12 py-8">
          <h1 className="text-2xl font-bold text-foreground dark:text-white">
            Test Results Not Found
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">{error}</p>
          <Button
            onClick={() => router.push("/previous-tests")}
            className="mt-4"
          >
            Back to Previous Tests
          </Button>
        </div>
      </div>
    );
  }

  const { questionPaper, results: stats, questions } = results;
  const score = stats.percentage;
  const correctCount = stats.correctAnswers;
  const totalCount = stats.totalQuestions;

  // Determine mode and pool
  const hasTimeSpent = questions.some((q) => q.timeSpent && q.timeSpent > 0);
  const mode = hasTimeSpent ? "Timed" : "Untutored";
  const pool = questionPaper.type === "practice" ? "USMLE Step 1" : "Custom";

  // Filter questions based on showFilter
  const filteredQuestions = questions.filter((q) => {
    if (showFilter === "All") return true;
    if (showFilter === "Correct" && q.isCorrect === true) return true;
    if (showFilter === "Incorrect" && q.isCorrect === false) return true;
    if (showFilter === "Omitted" && !q.userAnswer) return true;
    if (showFilter === "Marked" && q.markedForReview) return true;
    return false;
  });

  const getStatusIcon = (q: QuestionPaperQuestion) => {
    if (q.isCorrect === true) {
      return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
    } else if (q.isCorrect === false) {
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    } else if (!q.userAnswer) {
      return <Circle className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
    return null;
  };

  const formatTimeSpent = (seconds?: number) => {
    if (!seconds) return "0 sec";
    if (seconds < 60) return `${seconds} sec`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes} min ${secs} sec` : `${minutes} min`;
  };

  const handleQuestionClick = (questionPaperQuestionId: string) => {
    setSelectedQuestion(questionPaperQuestionId);
    // For now, just log - can be enhanced to show question details in a modal
    console.log("View question:", questionPaperQuestionId);
    // TODO: Open question detail modal or navigate to question view
  };

  return (
    <div className="w-full min-h-screen bg-background dark:bg-gray-900">
      <div className="w-full px-6 lg:px-8 xl:px-12 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">
              Test Results
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2 text-lg">
              {questionPaper.name}
            </p>
          </div>
            <Button
              variant="outline"
              className="border-border dark:border-gray-700 text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-800"
              onClick={() => router.push("/previous-tests")}
            >
            Back to Previous Tests
            </Button>
        </div>

        {/* Score and Settings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Your Score Card */}
          <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground dark:text-white">
                Your Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {score}%
                </div>
                <Progress value={score} className="h-3" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg: 64%
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {correctCount} of {totalCount} correct
              </div>
            </CardContent>
          </Card>

          {/* Test Settings Card */}
          <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground dark:text-white">
                Test Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Mode</p>
                <div className="flex gap-2">
                  <Button
                    variant={mode === "Timed" ? "default" : "outline"}
                    size="sm"
                    disabled
                    className="border-border dark:border-gray-700 text-foreground dark:text-gray-100"
                  >
                    Timed
                  </Button>
                  <Button
                    variant={mode === "Untutored" ? "default" : "outline"}
                    size="sm"
                    disabled
                    className="border-border dark:border-gray-700 text-foreground dark:text-gray-100"
                  >
                    Untutored
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Question Pool
              </p>
                <Button variant="outline" size="sm" disabled className="border-border dark:border-gray-700 text-foreground dark:text-gray-100">
                  {pool}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Table */}
        <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4 px-6 pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-foreground dark:text-white">
                Questions
            </CardTitle>
              <Select value={showFilter} onValueChange={setShowFilter}>
                <SelectTrigger className="w-[180px] bg-card dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-gray-100">
                  <SelectValue placeholder="Show: All" />
                </SelectTrigger>
                <SelectContent className="bg-card dark:bg-gray-800 border-border dark:border-gray-700">
                  <SelectItem value="All" className="text-foreground dark:text-gray-100">Show: All</SelectItem>
                  <SelectItem value="Correct" className="text-foreground dark:text-gray-100">Show: Correct</SelectItem>
                  <SelectItem value="Incorrect" className="text-foreground dark:text-gray-100">Show: Incorrect</SelectItem>
                  <SelectItem value="Omitted" className="text-foreground dark:text-gray-100">Show: Omitted</SelectItem>
                  <SelectItem value="Marked" className="text-foreground dark:text-gray-100">Show: Marked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700">
                    <TableHead className="font-semibold w-16 px-6">Status</TableHead>
                    <TableHead className="font-semibold px-6">ID</TableHead>
                    <TableHead className="font-semibold px-6">SUBJECTS</TableHead>
                    <TableHead className="font-semibold px-6">SYSTEMS</TableHead>
                    <TableHead className="font-semibold px-6">CATEGORIES</TableHead>
                    <TableHead className="font-semibold px-6">TOPICS</TableHead>
                    <TableHead className="font-semibold px-6">% CORRECT OTHERS</TableHead>
                    <TableHead className="font-semibold px-6">TIME SPENT</TableHead>
                    <TableHead className="font-semibold w-16 px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground dark:text-gray-400">
                        No questions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuestions.map((q, index) => {
                      const question = q.question;
                      const subject = question?.topic?.chapter?.name || "N/A";
                      const system = question?.topic?.chapter?.section?.name || "N/A";
                      const category = question?.productTag?.name || "N/A";
                      const topic = question?.topic?.name || "N/A";
                      const questionId = `${index + 1}-${question?.id?.slice(-4) || "XXXX"}`;

                      return (
                        <TableRow
                          key={q.id}
                          className="bg-card dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-border dark:border-gray-700"
                          onClick={() => handleQuestionClick(q.id)}
                        >
                          <TableCell className="px-6">{getStatusIcon(q)}</TableCell>
                          <TableCell className="font-mono text-sm px-6">{questionId}</TableCell>
                          <TableCell className="px-6">{subject}</TableCell>
                          <TableCell className="px-6">{system}</TableCell>
                          <TableCell className="px-6">{category}</TableCell>
                          <TableCell className="px-6">{topic}</TableCell>
                          <TableCell className="text-muted-foreground dark:text-gray-400 px-6">66%</TableCell>
                          <TableCell className="text-muted-foreground dark:text-gray-400 px-6">
                            {formatTimeSpent(q.timeSpent)}
                          </TableCell>
                          <TableCell className="px-6">
                            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
