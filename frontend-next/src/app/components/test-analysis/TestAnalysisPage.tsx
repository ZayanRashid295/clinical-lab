"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Activity,
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
}

interface SystemStats {
  name: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  averageTime: number;
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
    
    const totalTimeSpent = questionsData.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
    const averageTimePerQuestion = totalQuestions > 0 ? Math.round(totalTimeSpent / totalQuestions) : 0;

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
    const subjectMap = new Map<string, { total: number; correct: number; incorrect: number; unanswered: number; totalTime: number }>();
    
    questionsData.forEach((q) => {
      const subject = q.question?.topic?.chapter?.name || "Unknown";
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { total: 0, correct: 0, incorrect: 0, unanswered: 0, totalTime: 0 });
      }
      const stats = subjectMap.get(subject)!;
      stats.total++;
      stats.totalTime += q.timeSpent || 0;
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
      averageTime: stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
    })).sort((a, b) => b.total - a.total);

    setSubjectStats(subjectStatsArray);

    // Calculate system-wise stats
    const systemMap = new Map<string, { total: number; correct: number; incorrect: number; unanswered: number; totalTime: number }>();
    
    questionsData.forEach((q) => {
      const system = q.question?.topic?.chapter?.section?.name || "Unknown";
      if (!systemMap.has(system)) {
        systemMap.set(system, { total: 0, correct: 0, incorrect: 0, unanswered: 0, totalTime: 0 });
      }
      const stats = systemMap.get(system)!;
      stats.total++;
      stats.totalTime += q.timeSpent || 0;
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
      averageTime: stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
    })).sort((a, b) => b.total - a.total);

    setSystemStats(systemStatsArray);

    // Identify weak areas (subjects/systems with < 60% score)
    const weakSubjects = subjectStatsArray
      .filter((s) => s.percentage < 60 && s.total >= 3)
      .map((s) => s.name);
    const weakSystems = systemStatsArray
      .filter((s) => s.percentage < 60 && s.total >= 3)
      .map((s) => s.name);
    
    setWeakAreas([...weakSubjects, ...weakSystems]);

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
    if (seconds < 60) return `${seconds} sec`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-background dark:bg-gray-900">
        <div className="w-full px-6 lg:px-8 xl:px-12 py-8 space-y-8">
          <Skeleton className="h-8 w-64 bg-muted dark:bg-gray-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-48 bg-muted dark:bg-gray-800" />
            <Skeleton className="h-48 bg-muted dark:bg-gray-800" />
            <Skeleton className="h-48 bg-muted dark:bg-gray-800" />
            <Skeleton className="h-48 bg-muted dark:bg-gray-800" />
          </div>
          <Skeleton className="h-96 bg-muted dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!questionPaper || !performanceStats) {
    return (
      <div className="w-full min-h-screen bg-background dark:bg-gray-900">
        <div className="w-full px-6 lg:px-8 xl:px-12 py-8">
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            Test Analysis Not Found
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">
            Unable to load test analysis data.
          </p>
          <Button
            className="mt-4 border-border dark:border-gray-700 text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-800"
            onClick={() => router.push("/previous-tests")}
          >
            Back to Previous Tests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background dark:bg-gray-900">
      <div className="w-full px-6 lg:px-8 xl:px-12 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-gray-100">
              Test Analysis
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

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground dark:text-gray-100">
                {performanceStats.percentage}%
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                {performanceStats.correctAnswers} of {performanceStats.totalQuestions} correct
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Time/Question
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground dark:text-gray-100">
                {formatTime(performanceStats.averageTimePerQuestion)}
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                Total: {formatTime(performanceStats.totalTimeSpent)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                Correct
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {performanceStats.correctAnswers}
              </div>
              <Progress 
                value={(performanceStats.correctAnswers / performanceStats.totalQuestions) * 100} 
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                Incorrect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {performanceStats.incorrectAnswers}
              </div>
              <Progress 
                value={(performanceStats.incorrectAnswers / performanceStats.totalQuestions) * 100} 
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Detailed Analysis */}
        <Tabs defaultValue="subjects" className="space-y-4">
          <TabsList className="bg-card dark:bg-gray-800 border border-border dark:border-gray-700">
            <TabsTrigger value="subjects">
              <BookOpen className="h-4 w-4 mr-2" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="systems">
              <Activity className="h-4 w-4 mr-2" />
              Systems
            </TabsTrigger>
            <TabsTrigger value="weak-areas">
              <AlertCircle className="h-4 w-4 mr-2" />
              Weak Areas
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Target className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-4">
            <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground dark:text-gray-100">
                  Subject-wise Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700">
                        <TableHead className="font-semibold px-6">Subject</TableHead>
                        <TableHead className="font-semibold px-6">Total</TableHead>
                        <TableHead className="font-semibold px-6">Correct</TableHead>
                        <TableHead className="font-semibold px-6">Incorrect</TableHead>
                        <TableHead className="font-semibold px-6">Score</TableHead>
                        <TableHead className="font-semibold px-6">Avg Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectStats.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground dark:text-gray-400">
                            No subject data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        subjectStats.map((stat) => (
                          <TableRow key={stat.name} className="border-border dark:border-gray-700">
                            <TableCell className="font-medium px-6">{stat.name}</TableCell>
                            <TableCell className="px-6">{stat.total}</TableCell>
                            <TableCell className="text-green-600 dark:text-green-400 px-6">{stat.correct}</TableCell>
                            <TableCell className="text-red-600 dark:text-red-400 px-6">{stat.incorrect}</TableCell>
                            <TableCell className="px-6">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${
                                  stat.percentage >= 80 ? "text-green-600 dark:text-green-400" :
                                  stat.percentage >= 60 ? "text-yellow-600 dark:text-yellow-400" :
                                  "text-red-600 dark:text-red-400"
                                }`}>
                                  {stat.percentage}%
                                </span>
                                <Progress value={stat.percentage} className="h-2 w-20" />
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground dark:text-gray-400 px-6">
                              {formatTime(stat.averageTime)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="systems" className="space-y-4">
            <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground dark:text-gray-100">
                  System-wise Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700">
                        <TableHead className="font-semibold px-6">System</TableHead>
                        <TableHead className="font-semibold px-6">Total</TableHead>
                        <TableHead className="font-semibold px-6">Correct</TableHead>
                        <TableHead className="font-semibold px-6">Incorrect</TableHead>
                        <TableHead className="font-semibold px-6">Score</TableHead>
                        <TableHead className="font-semibold px-6">Avg Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemStats.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground dark:text-gray-400">
                            No system data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        systemStats.map((stat) => (
                          <TableRow key={stat.name} className="border-border dark:border-gray-700">
                            <TableCell className="font-medium px-6">{stat.name}</TableCell>
                            <TableCell className="px-6">{stat.total}</TableCell>
                            <TableCell className="text-green-600 dark:text-green-400 px-6">{stat.correct}</TableCell>
                            <TableCell className="text-red-600 dark:text-red-400 px-6">{stat.incorrect}</TableCell>
                            <TableCell className="px-6">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${
                                  stat.percentage >= 80 ? "text-green-600 dark:text-green-400" :
                                  stat.percentage >= 60 ? "text-yellow-600 dark:text-yellow-400" :
                                  "text-red-600 dark:text-red-400"
                                }`}>
                                  {stat.percentage}%
                                </span>
                                <Progress value={stat.percentage} className="h-2 w-20" />
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground dark:text-gray-400 px-6">
                              {formatTime(stat.averageTime)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weak-areas" className="space-y-4">
            <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground dark:text-gray-100 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  Areas Needing Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weakAreas.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <p className="text-muted-foreground dark:text-gray-400">
                      Great job! No significant weak areas identified.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weakAreas.map((area, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                      >
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        <span className="text-foreground dark:text-gray-200 font-medium">{area}</span>
                        <Badge variant="outline" className="ml-auto border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300">
                          Needs Review
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground dark:text-gray-100 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    >
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-foreground dark:text-gray-200">{rec}</p>
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
