"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  CheckCircle2,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  FileQuestion,
  ClipboardList,
  PlayCircle,
  Calendar,
  PlusCircle,
  Heart,
  Brain,
  Stethoscope,
  Play,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { StatCard } from "../Dashboard/StatCard";
import { StudyPlanCard } from "../Dashboard/StudyPlanCard";
import { ProgressCard } from "../Dashboard/ProgressCard";
import {
  studentStatsService,
  studyPlansService,
  type StudentDashboardStats,
  type StudyTask,
} from "@/app/services/student";

const QBANK_TARGET_FALLBACK = 3639;

const LEARNING_MODULES = [
  {
    key: "Cardiology",
    icon: Heart,
    color: "red",
    description: "Heart conditions and treatments",
    accent: "bg-red-500/10 dark:bg-red-500/20 text-red-500",
    bar: "bg-red-500",
  },
  {
    key: "Neurology",
    icon: Brain,
    color: "blue",
    description: "Brain and nervous system",
    accent: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-500",
    bar: "bg-blue-500",
  },
  {
    key: "Emergency",
    icon: Stethoscope,
    color: "green",
    description: "Critical care and trauma",
    accent: "bg-green-500/10 dark:bg-green-500/20 text-green-500",
    bar: "bg-green-500",
  },
] as const;

function classifyTask(t: StudyTask): "upcoming" | "overdue" | "completed" {
  if (t.status === "COMPLETED") return "completed";
  const now = Date.now();
  const due = new Date(t.scheduledFor).getTime();
  if (due < now - 5 * 60 * 1000) return "overdue";
  return "upcoming";
}

export default function TestCreationPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashboard, tasksRes] = await Promise.all([
        studentStatsService.dashboard(),
        studyPlansService.listTasks({}),
      ]);
      setStats(dashboard);
      setTasks(tasksRes ?? []);
    } catch (e: any) {
      console.error("Dashboard load failed", e);
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleContinueLastTest = () => {
    const target = stats?.tests.inProgress?.id ?? stats?.tests.lastTest?.id;
    if (target) {
      router.push(`/test-session/${target}`);
    } else {
      router.push("/test-creation/study-create");
    }
  };

  const upcomingTasks = useMemo(
    () =>
      tasks
        .map((t) => ({ ...t, _bucket: classifyTask(t) }))
        .filter((t) => t._bucket === "upcoming")
        .sort(
          (a, b) =>
            new Date(a.scheduledFor).getTime() -
            new Date(b.scheduledFor).getTime()
        )
        .slice(0, 5),
    [tasks]
  );

  const overdueTasks = useMemo(
    () => tasks.filter((t) => classifyTask(t) === "overdue"),
    [tasks]
  );

  const moduleStats = useMemo(() => {
    const byDeck = new Map<string, number>();
    // Use # of completed tasks per topic-ish key as a rough "progress" hint.
    for (const t of tasks) {
      if (t.status === "COMPLETED") {
        const k = (t.title || "").toLowerCase();
        for (const m of LEARNING_MODULES) {
          if (k.includes(m.key.toLowerCase())) {
            byDeck.set(m.key, (byDeck.get(m.key) ?? 0) + 1);
          }
        }
      }
    }
    return LEARNING_MODULES.map((m) => {
      const completed = byDeck.get(m.key) ?? 0;
      const total = Math.max(
        completed,
        tasks.filter((t) =>
          (t.title || "").toLowerCase().includes(m.key.toLowerCase())
        ).length,
        1
      );
      const percent = Math.min(
        100,
        Math.round((completed / Math.max(total, 1)) * 100)
      );
      return { ...m, completed, total, percent };
    });
  }, [tasks]);

  const questionScorePercent = stats?.questionScore.percent ?? 0;
  const questionScoreFraction = `${stats?.questionScore.correct ?? 0}/${
    stats?.questionScore.attempted ?? 0
  }`;
  const qbankUsed = stats?.qbankUsage.used ?? 0;
  const qbankTotal = stats?.qbankUsage.total ?? QBANK_TARGET_FALLBACK;
  const qbankUsagePercent = stats?.qbankUsage.percent ?? 0;
  const qbankUsageFraction = `${qbankUsed}/${qbankTotal}`;
  const testCompletionPercent = stats?.tests.percent ?? 0;
  const testCompletionFraction = `${stats?.tests.completed ?? 0}/${
    stats?.tests.total ?? 0
  }`;

  const planProgressPercent = stats?.plan.progress.percent ?? 0;
  const planCompleted = stats?.plan.progress.completed ?? 0;
  const planTotal = stats?.plan.progress.total ?? 0;
  const planDaysRemaining = stats?.plan.progress.daysRemaining ?? 0;
  const planOverdue = stats?.plan.progress.overdue ?? overdueTasks.length;
  const planIncomplete = stats?.plan.progress.incomplete ?? 0;

  return (
    <div
      className="space-y-3 px-[50px] pb-[50px] pt-[25px]"
      data-testid="page-dashboard"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your USMLE preparation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadAll}
            data-testid="button-refresh-dashboard"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Learning module cards now driven by completed-task counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {moduleStats.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.key}
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              onClick={() =>
                router.push(`/study/question-bank?system=${m.key}`)
              }
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${m.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      {m.key}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {m.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Progress
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {m.percent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${m.bar} h-2 rounded-full transition-all`}
                      style={{ width: `${m.percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {m.completed}/{m.total} tasks
                    </span>
                    <span className="capitalize">{m.color}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    variant={m.percent > 0 ? "default" : "outline"}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {m.percent > 0 ? "Continue Learning" : "Start Learning"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="Question Score"
          value={`${Math.round(questionScorePercent)}%`}
          subtitle={`${questionScoreFraction} Correct`}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="QBank Usage"
          value={`${Math.round(qbankUsagePercent)}%`}
          subtitle={`${qbankUsageFraction} Used`}
          icon={BookOpen}
          progress={Math.round(qbankUsagePercent)}
          color="primary"
        />
        <StatCard
          title="Test Count"
          value={`${Math.round(testCompletionPercent)}%`}
          subtitle={`${testCompletionFraction} Completed`}
          icon={ClipboardCheck}
          progress={Math.round(testCompletionPercent)}
          color="primary"
        />
      </div>

      <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                Quick Actions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start your study session with one of these options
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="button-view-performance"
                  onClick={() => router.push("/performance")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Performance
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="button-create-test"
                  onClick={() => router.push("/test-creation/study-create")}
                >
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Create a Test
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="button-view-past-tests"
                  onClick={() => router.push("/previous-tests")}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  View Past Tests
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="button-continue-last-test"
                  onClick={handleContinueLastTest}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Continue Last Test
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="button-view-study-plan"
                  onClick={() => router.push("/study-planner")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Study Plan
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="button-make-study-plan"
                  onClick={() => router.push("/study-planner?action=create")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Make Study Plan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StudyPlanCard
          tasks={[
            ...upcomingTasks.map((t) => ({
              id: t.id,
              title: t.title,
              type: t.type.charAt(0) + t.type.slice(1).toLowerCase(),
              duration: `${t.durationMinutes ?? 30} min`,
              status: "upcoming" as const,
            })),
            ...overdueTasks.map((t) => ({
              id: t.id,
              title: t.title,
              type: t.type.charAt(0) + t.type.slice(1).toLowerCase(),
              duration: `${t.durationMinutes ?? 30} min`,
              status: "overdue" as const,
            })),
          ]}
          onViewPlan={() => router.push("/study-planner")}
        />
        <ProgressCard
          title="Study Plan Progress"
          progress={planProgressPercent}
          current={planCompleted}
          total={Math.max(planTotal, 1)}
          daysRemaining={planDaysRemaining}
          stats={{
            completed: planCompleted,
            overdue: planOverdue,
            incomplete: planIncomplete,
          }}
        />
      </div>
    </div>
  );
}
