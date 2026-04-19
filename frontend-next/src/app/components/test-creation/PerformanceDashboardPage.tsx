"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  FileQuestion,
  Target,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  LineChart,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Badge } from "@/shared/ui/badge";
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service";
import { QuestionPaperQuestionsService } from "@/app/services/assessments/question-paper-questions.service";
import { authService } from "@/shared/services/auth.service";
import { cn } from "@/shared/utils/cn";

interface TestSummary {
  id: string;
  name: string;
  score: number;
  questionCount: number;
  date: Date;
  dateLabel: string;
}

function fetchAllQuestionsForPaper(
  questionPaperQuestionsService: QuestionPaperQuestionsService,
  paperId: string,
  totalHint: number
) {
  return (async () => {
    let allQuestions: any[] = [];
    let page = 1;
    let hasMore = true;
    if (totalHint <= 0) return allQuestions;
    while (hasMore) {
      const questionsResponse =
        await questionPaperQuestionsService.getQuestionPaperQuestions({
          questionPaperId: paperId,
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
      if (questionsArray.length === 0) hasMore = false;
    }
    return allQuestions;
  })();
}

function scoreTier(score: number): {
  label: string;
  className: string;
  barClass: string;
} {
  if (score >= 85)
    return {
      label: "Strong",
      className:
        "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200",
      barClass: "from-emerald-500 to-emerald-400",
    };
  if (score >= 70)
    return {
      label: "Good",
      className:
        "border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-200",
      barClass: "from-sky-500 to-sky-400",
    };
  if (score >= 55)
    return {
      label: "Fair",
      className:
        "border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200",
      barClass: "from-amber-500 to-amber-400",
    };
  return {
    label: "Review",
    className:
      "border-rose-200/80 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200",
    barClass: "from-rose-500 to-rose-400",
  };
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "slate" | "emerald" | "violet" | "amber";
}) {
  const accents = {
    slate: "from-slate-500/15 to-slate-500/5 text-slate-600 dark:text-slate-300",
    emerald:
      "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    violet:
      "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400",
    amber:
      "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
  };
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:border-slate-300/90 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:border-slate-600"
      data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div
        className={cn(
          "mb-4 inline-flex rounded-xl bg-gradient-to-br p-2.5",
          accents[accent]
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p
        className="mt-1 font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white text-3xl"
        data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {subtitle}
      </p>
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-slate-100/80 to-transparent opacity-60 blur-2xl dark:from-slate-700/30" />
    </div>
  );
}

export default function PerformanceDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const questionPapersService = useMemo(() => new QuestionPapersService(), []);
  const questionPaperQuestionsService = useMemo(
    () => new QuestionPaperQuestionsService(),
    []
  );

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const user = authService.getCurrentUser();
        if (!user?.id) {
          setTests([]);
          setLoading(false);
          return;
        }

        const response = await questionPapersService.getQuestionPapers({
          userId: user.id,
        });
        const questionPapers = Array.isArray(response)
          ? response
          : (response as any)?.data || [];

        const summaries: TestSummary[] = await Promise.all(
          (questionPapers as any[]).map(async (paper: any) => {
            const totalQuestionCount =
              paper._count?.questionPaperQuestions ||
              paper.totalQuestions ||
              0;

            const questionsArray = await fetchAllQuestionsForPaper(
              questionPaperQuestionsService,
              paper.id,
              totalQuestionCount
            );

            const totalQuestions =
              totalQuestionCount || questionsArray.length;
            const correctAnswers = questionsArray.filter(
              (q) => q.isCorrect === true
            ).length;
            const score =
              totalQuestions > 0
                ? Math.round((correctAnswers / totalQuestions) * 100)
                : 0;

            const created = new Date(paper.createdAt);
            return {
              id: paper.id,
              name: paper.name || "Untitled test",
              score,
              questionCount: totalQuestions,
              date: created,
              dateLabel: created.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            };
          })
        );

        summaries.sort((a, b) => b.date.getTime() - a.date.getTime());
        setTests(summaries);
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error ? e.message : "Could not load performance data."
        );
        setTests([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [questionPapersService, questionPaperQuestionsService]);

  const aggregates = useMemo(() => {
    if (tests.length === 0) {
      return {
        avgScore: 0,
        bestScore: 0,
        totalTests: 0,
        totalQuestions: 0,
        estimatedCorrect: 0,
      };
    }
    const totalQuestions = tests.reduce((s, t) => s + t.questionCount, 0);
    const estimatedCorrect = tests.reduce(
      (s, t) => s + Math.round((t.score / 100) * t.questionCount),
      0
    );
    const avgScore = Math.round(
      tests.reduce((s, t) => s + t.score, 0) / tests.length
    );
    const bestScore = Math.max(...tests.map((t) => t.score));
    return {
      avgScore,
      bestScore,
      totalTests: tests.length,
      totalQuestions,
      estimatedCorrect,
    };
  }, [tests]);

  const trendTests = useMemo(() => {
    return [...tests].slice(0, 10).reverse();
  }, [tests]);

  const chartMaxPx = 160;

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-slate-950"
        data-testid="page-performance-loading"
      >
        <div className="mx-auto max-w-6xl space-y-8 px-6 pb-16 pt-8 sm:px-[50px]">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasData = tests.length > 0;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80 dark:from-gray-950 dark:via-slate-950 dark:to-gray-950"
      data-testid="page-performance"
    >
      <div className="mx-auto max-w-6xl space-y-10 px-6 pb-16 pt-8 sm:px-[50px]">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl shadow-slate-900/20 dark:border-slate-700/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 w-fit border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
                onClick={() => router.push("/test-creation/new")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300/90">
                <Sparkles className="h-4 w-4" />
                Learning analytics
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Performance insights
              </h1>
              <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
                Review how you perform across sessions, spot trends over time,
                and jump into detailed analysis for any test.
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-3">
              <Button
                variant="secondary"
                className="border-0 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={() => router.push("/previous-tests")}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                All tests
              </Button>
              <Button
                className="border-0 bg-white font-semibold text-slate-900 shadow-lg shadow-black/20 hover:bg-slate-100"
                onClick={() => router.push("/test-creation/study-create")}
              >
                <FileQuestion className="mr-2 h-4 w-4" />
                New test
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-rose-200/80 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/30">
            <CardContent className="pt-6 text-sm text-rose-800 dark:text-rose-200">
              {error}
            </CardContent>
          </Card>
        )}

        {!hasData && !error && (
          <Card className="overflow-hidden border-2 border-dashed border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/40">
            <CardContent className="flex flex-col items-center gap-8 py-16 text-center sm:py-20">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner dark:from-slate-800 dark:to-slate-900">
                <LineChart className="h-10 w-10 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="max-w-md space-y-3">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  No sessions yet
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Complete a practice test or question paper to unlock your
                  performance dashboard. Sign in to sync your history.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  className="rounded-xl px-8"
                  onClick={() => router.push("/test-creation/study-create")}
                >
                  Start a test
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
                  onClick={() => router.push("/previous-tests")}
                >
                  Previous tests
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasData && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title="Average score"
                value={`${aggregates.avgScore}%`}
                subtitle="Mean across all graded sessions"
                icon={Target}
                accent="slate"
              />
              <KpiCard
                title="Personal best"
                value={`${aggregates.bestScore}%`}
                subtitle="Highest score in a single session"
                icon={Award}
                accent="emerald"
              />
              <KpiCard
                title="Sessions"
                value={`${aggregates.totalTests}`}
                subtitle="Question papers in your history"
                icon={BarChart3}
                accent="violet"
              />
              <KpiCard
                title="Items graded"
                value={`${aggregates.totalQuestions.toLocaleString()}`}
                subtitle={`~${aggregates.estimatedCorrect.toLocaleString()} estimated correct`}
                icon={Layers}
                accent="amber"
              />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Chart */}
              <Card className="border-slate-200/90 bg-white/90 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/50 lg:col-span-7">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          <TrendingUp className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                        </div>
                        Score trajectory
                      </CardTitle>
                      <CardDescription className="mt-2 text-slate-600 dark:text-slate-400">
                        Last {Math.min(trendTests.length, 10)} sessions, oldest
                        to newest — bar height reflects score.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-950/50">
                    <div
                      className="grid h-[200px] items-end gap-1.5 sm:gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(trendTests.length, 1)}, minmax(0, 1fr))`,
                      }}
                    >
                      {trendTests.map((t) => {
                        const tier = scoreTier(t.score);
                        const h = Math.max(
                          (t.score / 100) * chartMaxPx,
                          t.score > 0 ? 6 : 0
                        );
                        return (
                          <div
                            key={t.id}
                            className="group flex min-h-0 min-w-0 flex-col items-center justify-end gap-2"
                            title={t.name}
                          >
                            <div
                              className={cn(
                                "w-full min-w-[20px] rounded-t-md bg-gradient-to-t shadow-sm transition-all duration-300 group-hover:opacity-95 group-hover:shadow-md",
                                tier.barClass
                              )}
                              style={{ height: `${h}px` }}
                            />
                            <span className="text-[10px] font-semibold tabular-nums text-slate-600 dark:text-slate-400 sm:text-[11px]">
                              {t.score}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className="mt-3 grid gap-1 border-t border-slate-200/80 pt-3 dark:border-slate-800 sm:gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(trendTests.length, 1)}, minmax(0, 1fr))`,
                      }}
                    >
                      {trendTests.map((t) => (
                        <span
                          key={`${t.id}-label`}
                          className="truncate text-center text-[9px] leading-tight text-slate-500 dark:text-slate-500 sm:text-[10px]"
                          title={t.name}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sessions list */}
              <Card className="border-slate-200/90 bg-white/90 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/50 lg:col-span-5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    Recent activity
                  </CardTitle>
                  <CardDescription>
                    Newest first — open full breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tests.slice(0, 7).map((t) => {
                    const tier = scoreTier(t.score);
                    return (
                      <div
                        key={t.id}
                        className="group flex items-center gap-4 rounded-xl border border-transparent bg-slate-50/50 p-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm dark:bg-slate-950/30 dark:hover:border-slate-700 dark:hover:bg-slate-900/80"
                      >
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
                          <Calendar className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900 dark:text-white">
                            {t.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t.dateLabel} · {t.questionCount} questions
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "border font-semibold tabular-nums",
                              tier.className
                            )}
                          >
                            {t.score}%
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-slate-300 text-xs font-medium dark:border-slate-600"
                            onClick={() =>
                              router.push(`/test-analysis/${t.id}`)
                            }
                          >
                            Analysis
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
