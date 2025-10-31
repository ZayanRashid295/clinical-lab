"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
// import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { StatCard } from "../Dashboard/StatCard";
import { StudyPlanCard } from "../Dashboard/StudyPlanCard";
import { ProgressCard } from "../Dashboard/ProgressCard";

interface PerformanceStats {
  totalTests: number;
  completedTests: number;
  averageScore: number;
  totalQuestions: number;
  correctAnswers?: number;
  totalAnsweredQuestions?: number;
}

interface StudyTask {
  id: string;
  title: string;
  type: string;
  duration: string;
  status: "upcoming" | "overdue" | "completed";
  dueDate: string;
  completedAt?: string;
}

export default function TestCreationPage() {
  const [activeTab, setActiveTab] = useState("config");
  const router = useRouter();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [lastTest, setLastTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate test completion (ensure non-zero)
  const totalTests = stats?.totalTests || 5;
  const completedTests = stats?.completedTests || 3;
  const testCompletionPercent = Math.round((completedTests / totalTests) * 100);
  const testCompletionFraction = `${completedTests}/${totalTests}`;
  // Calculate question score with fraction
  const correctAnswers = stats?.correctAnswers || 15;
  const totalAnsweredQuestions = stats?.totalAnsweredQuestions || 20;
  const questionScore =
    stats && totalAnsweredQuestions > 0
      ? Math.round(stats.averageScore)
      : Math.round((correctAnswers / totalAnsweredQuestions) * 100);
  const questionScoreFraction = `${correctAnswers}/${totalAnsweredQuestions}`;

  // Calculate QBank usage (ensure non-zero)
  const totalQuestions = stats?.totalQuestions || 50;
  const qbankUsagePercent = Math.round((totalQuestions / 3639) * 100);
  const qbankUsageFraction = `${totalQuestions}/3639`;

  const handleContinueLastTest = () => {
    if (lastTest?.id) {
      router.push(`/test-session/${lastTest.id}`);
    } else {
      // If no last test, create a new one
      router.push("/test-creation/study-create");
    }
  };

  const upcomingTasks = tasks
    .filter((t) => t.status === "upcoming")
    .slice(0, 3);
  const overdueTasks = tasks.filter((t) => t.status === "overdue");

  return (
    <div
      className="space-y-3 px-[50px] pb-[50px] pt-[25px]"
      data-testid="page-dashboard"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to your USMLE preparation
        </p>
      </div>

      {/* Learning Modules Cards from Med App */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/10 dark:bg-red-500/20 rounded-lg">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Cardiology
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Heart conditions and treatments
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
                  75%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: "75%" }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>12/16 lessons</span>
                <span>4.8★</span>
              </div>
              <Button className="w-full" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                <Brain className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Neurology
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Brain and nervous system
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
                  45%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: "45%" }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>7/15 lessons</span>
                <span>4.6★</span>
              </div>
              <Button className="w-full" size="sm" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Start Learning
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                <Stethoscope className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Emergency Medicine
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Critical care and trauma
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
                  90%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "90%" }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>18/20 lessons</span>
                <span>4.9★</span>
              </div>
              <Button className="w-full" size="sm" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="Question Score"
          value={`${questionScore}% (${questionScoreFraction})`}
          subtitle="Correct"
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="QBank Usage"
          value={`${qbankUsagePercent}%`}
          subtitle={`${qbankUsageFraction} Used`}
          icon={BookOpen}
          progress={qbankUsagePercent}
          color="primary"
        />
        <StatCard
          title="Test Count"
          value={`${testCompletionPercent}%`}
          subtitle={`${testCompletionFraction} Completed`}
          icon={ClipboardCheck}
          progress={testCompletionPercent}
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
          tasks={upcomingTasks.map((t) => ({
            id: t.id,
            title: t.title,
            type: t.type,
            duration: t.duration,
            status: t.status,
          }))}
          onViewPlan={() => router.push("/study-planner")}
        />
        <ProgressCard
          title="Study Plan Progress"
          progress={76.19}
          current={1}
          total={10}
          daysRemaining={10}
          stats={{
            completed: 16,
            overdue: overdueTasks.length,
            incomplete: 3,
          }}
        />
      </div>
    </div>
  );
}
