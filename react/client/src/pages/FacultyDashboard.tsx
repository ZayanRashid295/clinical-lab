import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatCard } from "@/components/StatCard";
import { Users, BookOpen, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function FacultyDashboard() {
  const cohortProgress = [
    { name: "Year 3 Students", completed: 145, total: 200, avgScore: 82 },
    { name: "Year 4 Students", completed: 210, total: 250, avgScore: 88 },
    { name: "Residents", completed: 89, total: 100, avgScore: 91 },
  ];

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="faculty" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Faculty Dashboard</h1>
                <p className="text-muted-foreground">Monitor student progress and cohort performance</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Students"
                  value={550}
                  icon={Users}
                  trend={{ value: 8, label: "this semester" }}
                />
                <StatCard
                  title="Cases Assigned"
                  value={42}
                  icon={BookOpen}
                />
                <StatCard
                  title="Avg Completion"
                  value="78%"
                  icon={CheckCircle2}
                  trend={{ value: 5, label: "this month" }}
                />
                <StatCard
                  title="Avg Score"
                  value="85%"
                  icon={TrendingUp}
                  trend={{ value: 3, label: "this month" }}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Cohort Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {cohortProgress.map((cohort, idx) => (
                    <Card key={idx} className="p-6">
                      <h3 className="font-semibold mb-4">{cohort.name}</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Cases Completed</span>
                            <span className="font-medium">{cohort.completed}/{cohort.total}</span>
                          </div>
                          <Progress value={(cohort.completed / cohort.total) * 100} />
                        </div>
                        <div className="pt-3 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Average Score</span>
                            <span className="font-bold text-lg text-chart-3">{cohort.avgScore}%</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
