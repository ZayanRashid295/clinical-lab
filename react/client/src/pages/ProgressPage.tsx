import { useState } from "react";
import { useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutDialog } from "@/components/LogoutDialog";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Award, Clock, Info } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ProgressPage() {
  const [, setLocation] = useLocation();

  const competencies = [
    { name: "History Taking", score: 85, target: 90 },
    { name: "Physical Examination", score: 78, target: 85 },
    { name: "Clinical Reasoning", score: 92, target: 95 },
    { name: "Communication", score: 88, target: 90 },
    { name: "Professionalism", score: 95, target: 95 },
    { name: "Clinical Documentation", score: 82, target: 90 },
  ];

  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(
    "History Taking"
  );

  const getTimeSeriesData = (competencyName: string) => {
    const baseScores: Record<string, number> = {
      "History Taking": 85,
      "Physical Examination": 78,
      "Clinical Reasoning": 92,
      Communication: 88,
      Professionalism: 95,
      "Clinical Documentation": 82,
    };

    const currentScore = baseScores[competencyName] || 80;
    const startScore = Math.max(50, currentScore - 30);
    const totalGrowth = currentScore - startScore;

    return [
      { week: "Week 1", score: Math.round(startScore) },
      { week: "Week 2", score: Math.round(startScore + totalGrowth * 0.15) },
      { week: "Week 3", score: Math.round(startScore + totalGrowth * 0.3) },
      { week: "Week 4", score: Math.round(startScore + totalGrowth * 0.45) },
      { week: "Week 5", score: Math.round(startScore + totalGrowth * 0.6) },
      { week: "Week 6", score: Math.round(startScore + totalGrowth * 0.75) },
      { week: "Week 7", score: Math.round(startScore + totalGrowth * 0.9) },
      { week: "Week 8", score: currentScore },
    ];
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="student" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <LogoutDialog />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Progress</h1>
                <p className="text-muted-foreground">
                  Track your performance across core clinical competencies
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Overall Score
                      </p>
                      <p className="text-2xl font-bold">87%</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Improvement
                      </p>
                      <p className="text-2xl font-bold">+12%</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Cases Done
                      </p>
                      <p className="text-2xl font-bold">47</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-chart-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Study Hours
                      </p>
                      <p className="text-2xl font-bold">24h</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <Card className="p-6 flex-1 md:w-1/2">
                  <h2 className="text-xl font-bold mb-6">
                    Clinical Competencies
                  </h2>
                  <div className="space-y-6">
                    {competencies.map((competency) => (
                      <div key={competency.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {competency.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                setSelectedCompetency(competency.name)
                              }
                              data-testid={`button-info-${competency.name
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`}
                            >
                              <Info className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {competency.score}% / {competency.target}%
                          </span>
                        </div>
                        <Progress value={competency.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 flex-1 md:w-1/2">
                  <h2 className="text-xl font-bold mb-6">Progress Over Time</h2>
                  {selectedCompetency ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedCompetency}
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getTimeSeriesData(selectedCompetency)}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                          />
                          <XAxis
                            dataKey="week"
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <p>Click an info icon to view competency progress</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
