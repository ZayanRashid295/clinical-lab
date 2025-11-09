import { CheckCircle2, BookOpen, ClipboardCheck, BarChart3, FileQuestion, ClipboardList } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StudyPlanCard } from "@/components/StudyPlanCard";
import { ProgressCard } from "@/components/ProgressCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { type StudyTask } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface PerformanceStats {
  totalTests: number;
  completedTests: number;
  averageScore: number;
  totalQuestions: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<StudyTask[]>({
    queryKey: ["/api/study-tasks"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<PerformanceStats>({
    queryKey: ["/api/performance/stats"],
  });

  const isLoading = tasksLoading || statsLoading;

  const upcomingTasks = tasks.filter((t) => t.status === "upcoming").slice(0, 3);
  const overdueTasks = tasks.filter((t) => t.status === "overdue");

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-dashboard">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to your USMLE preparation</p>
        </div>
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
    );
  }

  const questionScore = stats && stats.totalQuestions > 0 
    ? Math.round(stats.averageScore) 
    : 0;
  
  const qbankUsagePercent = stats && stats.totalQuestions > 0 
    ? Math.round((stats.totalQuestions / 3639) * 100) 
    : 0;

  const testCompletionPercent = stats && stats.totalTests > 0
    ? Math.round((stats.completedTests / stats.totalTests) * 100)
    : 0;

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to your USMLE preparation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Question Score"
          value={`${questionScore}%`}
          subtitle="Correct"
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="QBank Usage"
          value={`${qbankUsagePercent}%`}
          subtitle={`${stats?.totalQuestions || 0} / 3639 Used`}
          icon={BookOpen}
          progress={qbankUsagePercent}
          color="primary"
        />
        <StatCard
          title="Test Count"
          value={`${testCompletionPercent}%`}
          subtitle={`${stats?.completedTests || 0} / ${stats?.totalTests || 0} Completed`}
          icon={ClipboardCheck}
          progress={testCompletionPercent}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudyPlanCard 
          tasks={upcomingTasks.map(t => ({
            id: t.id,
            title: t.title,
            type: t.type,
            duration: t.duration,
            status: t.status,
          }))} 
          onViewPlan={() => setLocation("/study-planner")} 
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold text-lg mb-2">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">
                Start your study session with one of these options
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button 
                data-testid="button-view-performance"
                onClick={() => setLocation("/performance")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Performance
              </Button>
              <Button 
                variant="outline" 
                data-testid="button-create-test"
                onClick={() => setLocation("/create-test")}
              >
                <FileQuestion className="h-4 w-4 mr-2" />
                Create a Test
              </Button>
              <Button 
                variant="outline" 
                data-testid="button-view-past-tests"
                onClick={() => setLocation("/previous-tests")}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                View Past Tests
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
