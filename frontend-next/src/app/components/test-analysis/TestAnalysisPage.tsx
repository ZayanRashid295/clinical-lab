"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  BookOpen,
  Activity,
  Lightbulb,
  Minus,
} from "lucide-react";
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

interface PerformanceStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  percentage: number;
  averageTimePerQuestion: number;
  totalTimeSpent: number;
}

interface SubjectStats {
  name: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  averageTime: number;
  trend?: "up" | "down" | "stable";
}

interface SystemStats {
  name: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  averageTime: number;
  trend?: "up" | "down" | "stable";
}

export default function TestAnalysisPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [questionPaper, setQuestionPaper] = useState<any>(null);
  const [questions, setQuestions] = useState<QuestionPaperQuestion[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats[]>([]);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [strongAreas, setStrongAreas] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const questionPapersService = new QuestionPapersService();
  const questionPaperQuestionsService = new QuestionPaperQuestionsService();

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch question paper
        const paper = await questionPapersService.getQuestionPaper(id);
        setQuestionPaper(paper);

        // Fetch all questions for this paper
        let allQuestions: QuestionPaperQuestion[] = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const questionsResponse = await questionPaperQuestionsService.getQuestionPaperQuestions({
            questionPaperId: id,
            limit: 100,
            page,
          });

          const questionsArray = Array.isArray(questionsResponse)
            ? questionsResponse
            : (questionsResponse as any)?.data || [];
          
          allQuestions = [...allQuestions, ...questionsArray];
          
          if (Array.isArray(questionsResponse)) {
            hasMore = false;
          } else {
            const pagination = (questionsResponse as any)?.pagination;
            hasMore = pagination && page < pagination.totalPages;
            page++;
          }
        }

        setQuestions(allQuestions);
        calculateStats(allQuestions);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const calculateStats = (questionsData: QuestionPaperQuestion[]) => {
    // Calculate overall performance
    const totalQuestions = questionsData.length;
    const correctAnswers = questionsData.filter((q) => q.isCorrect === true).length;
    const incorrectAnswers = questionsData.filter((q) => q.isCorrect === false).length;
    const unansweredQuestions = questionsData.filter((q) => !q.userAnswer).length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Calculate time statistics - only count questions with timeSpent > 0
    const questionsWithTime = questionsData.filter((q) => q.timeSpent && q.timeSpent > 0);
    // Total time spent only from questions that have time data
    const totalTimeSpent = questionsWithTime.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
    // Calculate average only from questions that have time data
    const averageTimePerQuestion = questionsWithTime.length > 0 
      ? Math.round(totalTimeSpent / questionsWithTime.length) 
      : 0;

    setPerformanceStats({
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      score,
      percentage: score,
      averageTimePerQuestion,
      totalTimeSpent,
    });

    // Calculate subject-wise stats
    const subjectMap = new Map<string, { total: number; correct: number; incorrect: number; unanswered: number; totalTime: number; questionsWithTime: number }>();
    
    questionsData.forEach((q) => {
      const subject = q.question?.topic?.chapter?.name || "Unknown";
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { total: 0, correct: 0, incorrect: 0, unanswered: 0, totalTime: 0, questionsWithTime: 0 });
      }
      const stats = subjectMap.get(subject)!;
      stats.total++;
      if (q.timeSpent && q.timeSpent > 0) {
        stats.totalTime += q.timeSpent;
        stats.questionsWithTime++;
      }
      if (q.isCorrect === true) {
        stats.correct++;
      } else if (q.isCorrect === false) {
        stats.incorrect++;
      } else {
        stats.unanswered++;
      }
    });

    const subjectStatsArray: SubjectStats[] = Array.from(subjectMap.entries()).map(([name, stats]) => ({
      name,
      total: stats.total,
      correct: stats.correct,
      incorrect: stats.incorrect,
      unanswered: stats.unanswered,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      averageTime: stats.questionsWithTime > 0 ? Math.round(stats.totalTime / stats.questionsWithTime) : 0,
      trend: "stable" as const, // Could be calculated based on historical data
    })).sort((a, b) => b.total - a.total);

    setSubjectStats(subjectStatsArray);

    // Calculate system-wise stats
    const systemMap = new Map<string, { total: number; correct: number; incorrect: number; unanswered: number; totalTime: number; questionsWithTime: number }>();
    
    questionsData.forEach((q) => {
      const system = q.question?.topic?.chapter?.section?.name || "Unknown";
      if (!systemMap.has(system)) {
        systemMap.set(system, { total: 0, correct: 0, incorrect: 0, unanswered: 0, totalTime: 0, questionsWithTime: 0 });
      }
      const stats = systemMap.get(system)!;
      stats.total++;
      if (q.timeSpent && q.timeSpent > 0) {
        stats.totalTime += q.timeSpent;
        stats.questionsWithTime++;
      }
      if (q.isCorrect === true) {
        stats.correct++;
      } else if (q.isCorrect === false) {
        stats.incorrect++;
      } else {
        stats.unanswered++;
      }
    });

    const systemStatsArray: SystemStats[] = Array.from(systemMap.entries()).map(([name, stats]) => ({
      name,
      total: stats.total,
      correct: stats.correct,
      incorrect: stats.incorrect,
      unanswered: stats.unanswered,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      averageTime: stats.questionsWithTime > 0 ? Math.round(stats.totalTime / stats.questionsWithTime) : 0,
      trend: "stable" as const, // Could be calculated based on historical data
    })).sort((a, b) => b.total - a.total);

    setSystemStats(systemStatsArray);

    // Identify weak and strong areas
    const weakSubjects = subjectStatsArray
      .filter((s) => s.percentage < 60 && s.total >= 3)
      .map((s) => s.name);
    const weakSystems = systemStatsArray
      .filter((s) => s.percentage < 60 && s.total >= 3)
      .map((s) => s.name);
    
    setWeakAreas([...weakSubjects, ...weakSystems]);

    const strongSubjects = subjectStatsArray
      .filter((s) => s.percentage >= 80 && s.total >= 3)
      .map((s) => s.name);
    const strongSystems = systemStatsArray
      .filter((s) => s.percentage >= 80 && s.total >= 3)
      .map((s) => s.name);
    
    setStrongAreas([...strongSubjects, ...strongSystems]);

    // Generate recommendations
    const recs: string[] = [];
    if (score < 60) {
      recs.push("Focus on fundamental concepts and review basic principles");
    }
    if (weakSubjects.length > 0) {
      recs.push(`Review ${weakSubjects.slice(0, 2).join(" and ")} - these subjects need more attention`);
    }
    if (averageTimePerQuestion > 120) {
      recs.push("Practice time management - you're spending too much time per question");
    }
    if (unansweredQuestions > 0) {
      recs.push(`Complete all questions - you left ${unansweredQuestions} question(s) unanswered`);
    }
    if (score >= 80) {
      recs.push("Excellent performance! Continue practicing to maintain this level");
    }
    if (recs.length === 0) {
      recs.push("Keep practicing regularly to improve your performance");
    }
    
    setRecommendations(recs);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  };

  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive dark:text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground dark:text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-background dark:bg-gray-900">
        <div className="w-full px-6 lg:px-8 xl:px-12 py-8 space-y-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!questionPaper || !performanceStats) {
    return (
      <div className="w-full min-h-screen bg-background dark:bg-gray-900">
        <div className="w-full px-6 lg:px-8 xl:px-12 py-8">
          <h1 className="text-2xl font-bold text-foreground dark:text-white">Test Analysis Not Found</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">Unable to load test analysis data.</p>
          <Button onClick={() => router.push("/previous-tests")} className="mt-4">
            Back to Previous Tests
          </Button>
        </div>
      </div>
    );
  }

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
                <p className="text-xs text-muted-foreground dark:text-gray-400">Performance Analytics</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/test-results/${id}`)}>
              View Results
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 lg:px-8 xl:px-12 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Overall Score</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">{performanceStats.percentage}</span>
                    <span className="text-base text-muted-foreground dark:text-gray-400">%</span>
                  </div>
                </div>
                <div className="rounded-lg bg-primary/10 dark:bg-primary/20 p-2">
                  <Target className="h-4 w-4 text-primary dark:text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-3">
                {performanceStats.correctAnswers} of {performanceStats.totalQuestions} correct
              </p>
            </CardContent>
          </Card>

          <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Avg Time / Question</p>
                  <div className="mt-2">
                    <span className="text-3xl font-semibold tracking-tight font-mono text-foreground dark:text-white">
                      {formatTime(performanceStats.averageTimePerQuestion)}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-600/10 dark:bg-blue-400/20 p-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-3">Total: {formatTime(performanceStats.totalTimeSpent)}</p>
            </CardContent>
          </Card>

          <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Correct Answers</p>
                  <div className="mt-2">
                    <span className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">{performanceStats.correctAnswers}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-green-600/10 dark:bg-green-400/20 p-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-muted dark:bg-gray-700">
                  <div
                    className="h-1.5 rounded-full bg-green-600 dark:bg-green-400"
                    style={{ width: `${(performanceStats.correctAnswers / performanceStats.totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Mastery Level</p>
                  <div className="mt-2">
                    <span className="text-2xl font-semibold tracking-tight text-foreground dark:text-white">
                      {performanceStats.percentage >= 80
                        ? "Advanced"
                        : performanceStats.percentage >= 65
                          ? "Intermediate"
                          : "Beginner"}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-purple-600/10 dark:bg-purple-400/20 p-2">
                  <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-muted dark:bg-gray-700">
                  <div
                    className="h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"
                    style={{ width: `${performanceStats.percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subjects" className="space-y-4">
          <TabsList className="bg-muted/50 dark:bg-gray-700/50 border border-border dark:border-gray-700 p-1">
            <TabsTrigger value="subjects" className="text-xs data-[state=active]:bg-card dark:data-[state=active]:bg-gray-800">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="systems" className="text-xs data-[state=active]:bg-card dark:data-[state=active]:bg-gray-800">
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Systems
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs data-[state=active]:bg-card dark:data-[state=active]:bg-gray-800">
              <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-4">
            <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
              <CardHeader className="border-b border-border dark:border-gray-700">
                <CardTitle className="text-base font-semibold text-foreground dark:text-white">Subject Performance</CardTitle>
                <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Breakdown by subject area</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border dark:border-gray-700 hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400">Subject</TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400 text-right">
                          Questions
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400 text-right">
                          Correct
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400 text-right">
                          Wrong
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400">Score</TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400 text-right">
                          Avg Time
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400">Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectStats.map((stat) => (
                        <TableRow key={stat.name} className="border-border dark:border-gray-700 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors">
                          <TableCell className="px-4 py-3 font-medium text-sm text-foreground dark:text-white">{stat.name}</TableCell>
                          <TableCell className="px-4 py-3 text-right text-sm text-foreground dark:text-white">{stat.total}</TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">{stat.correct}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-destructive dark:text-destructive">{stat.incorrect}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold font-mono w-10 ${
                                  stat.percentage >= 80
                                    ? "text-green-600 dark:text-green-400"
                                    : stat.percentage >= 60
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-destructive dark:text-destructive"
                                }`}
                              >
                                {stat.percentage}%
                              </span>
                              <div className="h-1.5 rounded-full bg-muted dark:bg-gray-700 w-16">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    stat.percentage >= 80
                                      ? "bg-green-600 dark:bg-green-400"
                                      : stat.percentage >= 60
                                        ? "bg-yellow-600 dark:bg-yellow-400"
                                        : "bg-destructive dark:bg-destructive"
                                  }`}
                                  style={{ width: `${stat.percentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right text-xs text-muted-foreground font-mono">
                            {formatTime(stat.averageTime)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {getTrendIcon(stat.trend)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="systems" className="space-y-4">
            <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
              <CardHeader className="border-b border-border dark:border-gray-700">
                <CardTitle className="text-base font-semibold text-foreground dark:text-white">System Performance</CardTitle>
                <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Breakdown by body system</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border dark:border-gray-700 hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400">System</TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400 text-right">
                          Questions
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400 text-right">
                          Correct
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400 text-right">
                          Wrong
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400">Score</TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400 text-right">
                          Avg Time
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium text-muted-foreground dark:text-gray-400">Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemStats.map((stat) => (
                        <TableRow key={stat.name} className="border-border dark:border-gray-700 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors">
                          <TableCell className="px-4 py-3 font-medium text-sm text-foreground dark:text-white">{stat.name}</TableCell>
                          <TableCell className="px-4 py-3 text-right text-sm text-foreground dark:text-white">{stat.total}</TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">{stat.correct}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-destructive dark:text-destructive">{stat.incorrect}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold font-mono w-10 ${
                                  stat.percentage >= 80
                                    ? "text-green-600 dark:text-green-400"
                                    : stat.percentage >= 60
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-destructive dark:text-destructive"
                                }`}
                              >
                                {stat.percentage}%
                              </span>
                              <div className="h-1.5 rounded-full bg-muted dark:bg-gray-700 w-16">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    stat.percentage >= 80
                                      ? "bg-green-600 dark:bg-green-400"
                                      : stat.percentage >= 60
                                        ? "bg-yellow-600 dark:bg-yellow-400"
                                        : "bg-destructive dark:bg-destructive"
                                  }`}
                                  style={{ width: `${stat.percentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right text-xs text-muted-foreground dark:text-gray-400 font-mono">
                            {formatTime(stat.averageTime)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {getTrendIcon(stat.trend)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
                <CardHeader className="border-b border-border dark:border-gray-700 bg-card dark:bg-gray-800">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground dark:text-white">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Strong Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {strongAreas.length === 0 ? (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">No strong areas identified yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {strongAreas.map((area) => (
                        <div
                          key={area}
                          className="flex items-center gap-2 p-2 rounded-lg bg-green-600/5 dark:bg-green-400/10 border border-green-600/20 dark:border-green-400/30"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm text-foreground dark:text-white">{area}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
                <CardHeader className="border-b border-border dark:border-gray-700 bg-card dark:bg-gray-800">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground dark:text-white">
                    <AlertCircle className="h-4 w-4 text-destructive dark:text-destructive" />
                    Needs Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {weakAreas.length === 0 ? (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Great job! No significant weak areas identified.</p>
                  ) : (
                    <div className="space-y-2">
                      {weakAreas.map((area) => (
                        <div
                          key={area}
                          className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 dark:bg-destructive/10 border border-destructive/20 dark:border-destructive/30"
                        >
                          <AlertCircle className="h-4 w-4 text-destructive dark:text-destructive flex-shrink-0" />
                          <span className="text-sm text-foreground dark:text-white">{area}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border dark:border-gray-700 bg-card dark:bg-gray-800">
              <CardHeader className="border-b border-border dark:border-gray-700 bg-card dark:bg-gray-800">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground dark:text-white">
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50 dark:bg-gray-700/50 border border-border dark:border-gray-700">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/10 dark:bg-blue-400/20 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground dark:text-white">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
