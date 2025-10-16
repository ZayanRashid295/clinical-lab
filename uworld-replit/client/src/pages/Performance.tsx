import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceStats {
  totalTests: number;
  completedTests: number;
  averageScore: number;
  totalQuestions: number;
}

export default function Performance() {
  const { data: stats, isLoading } = useQuery<PerformanceStats>({
    queryKey: ["/api/performance/stats"],
  });

  const subjectData = [
    { name: "Anatomy", correct: 65, incorrect: 35 },
    { name: "Biochemistry", correct: 72, incorrect: 28 },
    { name: "Pathology", correct: 58, incorrect: 42 },
    { name: "Pharmacology", correct: 80, incorrect: 20 },
    { name: "Physiology", correct: 70, incorrect: 30 },
  ];

  const trendData = [
    { date: "Jan 15", score: 45 },
    { date: "Jan 22", score: 52 },
    { date: "Jan 29", score: 58 },
    { date: "Feb 05", score: 65 },
    { date: "Feb 12", score: 72 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-performance">
        <div>
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and identify areas for improvement
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-performance">
      <div>
        <h1 className="text-3xl font-bold">Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your progress and identify areas for improvement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1" data-testid="text-overall-score">
              {Math.round(stats?.averageScore || 0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average across all tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questions Attempted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-questions-attempted">
              {stats?.totalQuestions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Out of 3,732 total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2" data-testid="text-study-streak">12 days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects" data-testid="tab-subjects">By Subject</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Score Trends</TabsTrigger>
          <TabsTrigger value="systems" data-testid="tab-systems">By System</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="correct" fill="hsl(var(--chart-2))" name="Correct" />
                  <Bar dataKey="incorrect" fill="hsl(var(--chart-3))" name="Incorrect" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Score Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Score %" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systems" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Detailed system-level analytics will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
