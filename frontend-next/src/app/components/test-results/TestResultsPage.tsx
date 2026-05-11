"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
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
import { CheckCircle, XCircle, Circle, ChevronLeft, TrendingUp, Activity } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service";
import {
  getQuestionHierarchyColumns,
  type QuestionHierarchySlice,
} from "@/app/utils/question-hierarchy-display";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";

interface QuestionPaperQuestion {
  id: string;
  questionId: string;
  order: number;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
  markedForReview: boolean;
  question?: QuestionHierarchySlice & { id: string };
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

  const questionPapersService = new QuestionPapersService();

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const data = await questionPapersService.getAssessmentResults(id);
        // Backend returns a compatible shape but TS types differ slightly, so cast for now
        setResults(data as any);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError(getApiErrorMessage(err, "Failed to load test results"));
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
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="w-full min-h-screen bg-background dark:bg-gray-900">
        <div className="w-full px-6 lg:px-8 xl:px-12 py-8">
          <h1 className="text-2xl font-bold text-foreground dark:text-white">Test Results Not Found</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">{error}</p>
          <Button onClick={() => router.push("/previous-tests")} className="mt-4">
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
  const incorrectCount = stats.incorrectAnswers;
  const unansweredCount = stats.unansweredQuestions;

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
    if (!seconds) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  };

  return (
    <div className="w-full min-h-screen bg-background dark:bg-gray-900">
      <div className="border-b border-border dark:border-gray-700 bg-card/50 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-6 lg:px-8 xl:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/previous-tests")} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Previous Tests
              </Button>
              <div className="h-4 w-px bg-border dark:bg-gray-700" />
              <div>
                <h1 className="text-lg font-semibold text-balance text-foreground dark:text-white">{questionPaper.name}</h1>
                <p className="text-xs text-muted-foreground dark:text-gray-400">Test Results Overview</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/test-analysis/${id}`)}>
              View Analytics
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 lg:px-8 xl:px-12 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Overall Score</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tight text-foreground dark:text-white">{score}</span>
                    <span className="text-lg text-muted-foreground dark:text-gray-400">%</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="h-1.5 rounded-full bg-muted dark:bg-gray-700 w-32">
                      <div
                        className="h-1.5 rounded-full bg-primary dark:bg-primary"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-primary/10 dark:bg-primary/20 p-2">
                  <TrendingUp className="h-4 w-4 text-primary dark:text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-3">
                {correctCount} / {totalCount} correct
              </p>
            </CardContent>
          </Card>

          <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Questions Answered</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tight text-foreground dark:text-white">{stats.answeredQuestions}</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                      <span className="text-muted-foreground dark:text-gray-400">{correctCount} correct</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-destructive dark:bg-destructive" />
                      <span className="text-muted-foreground dark:text-gray-400">{incorrectCount} wrong</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-green-600/10 dark:bg-green-400/20 p-2">
                  <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-3">{totalCount} total questions</p>
            </CardContent>
          </Card>

          <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Performance</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tight text-foreground dark:text-white">{score}</span>
                    <span className="text-lg text-muted-foreground dark:text-gray-400">%</span>
                  </div>
                  <div className="mt-3">
                    <Badge variant={score >= 70 ? "default" : "secondary"} className="text-xs">
                      {score >= 70 ? "Strong Performance" : "Needs Review"}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-3">Test completion rate</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
          <CardHeader className="border-b border-border dark:border-gray-700 bg-card dark:bg-gray-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold text-foreground dark:text-white">Question History</CardTitle>
                <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                  {filteredQuestions.length} {filteredQuestions.length === 1 ? "question" : "questions"}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={showFilter} onValueChange={setShowFilter}>
                  <SelectTrigger className="w-[140px] h-9 bg-muted/50 dark:bg-gray-700/50 border-border dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card dark:bg-gray-800 border-border dark:border-gray-700">
                    <SelectItem value="All" className="text-foreground dark:text-white">All</SelectItem>
                    <SelectItem value="Correct" className="text-foreground dark:text-white">Correct</SelectItem>
                    <SelectItem value="Incorrect" className="text-foreground dark:text-white">Incorrect</SelectItem>
                    <SelectItem value="Omitted" className="text-foreground dark:text-white">Omitted</SelectItem>
                    <SelectItem value="Marked" className="text-foreground dark:text-white">Marked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border dark:border-gray-700 hover:bg-transparent dark:hover:bg-transparent">
                    <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400">Status</TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400">ID</TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400" title="Product / exam (e.g. USMLE)">
                      Subject
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400" title="Organ system">
                      System
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400" title="Discipline category">
                      Category
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400" title="Topic · subtopic">
                      Topic
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground dark:text-gray-400">
                        No questions match your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuestions.map((q, index) => {
                      const question = q.question;
                      const cols = getQuestionHierarchyColumns(question);
                      const questionId = `${index + 1}-${question?.id?.slice(-4) || "XXXX"}`;

                      return (
                        <TableRow
                          key={q.id}
                          className="border-border dark:border-gray-700 hover:bg-muted/50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                          onClick={() => {
                            // TODO: Navigate to question detail view
                            // View question
                          }}
                        >
                          <TableCell className="px-4 py-3 text-foreground dark:text-white">{getStatusIcon(q)}</TableCell>
                          <TableCell className="px-4 py-3 font-mono text-sm text-foreground dark:text-white">{questionId}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-foreground dark:text-white">{cols.subject}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-foreground dark:text-white">{cols.system}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-foreground dark:text-white">{cols.category}</TableCell>
                          <TableCell className="px-4 py-3">
                            {cols.topic !== "—" ? (
                              <Badge variant="outline" className="text-xs font-normal text-foreground dark:text-white border-border dark:border-gray-600">
                                {cols.topic}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground dark:text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs text-muted-foreground dark:text-gray-400 font-mono">
                            {formatTimeSpent(q.timeSpent)}
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
