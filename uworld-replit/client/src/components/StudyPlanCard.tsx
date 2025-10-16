import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, AlertCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  type: string;
  duration: string;
  status: "upcoming" | "overdue" | "completed";
}

interface StudyPlanCardProps {
  tasks: Task[];
  onViewPlan?: () => void;
}

export function StudyPlanCard({ tasks, onViewPlan }: StudyPlanCardProps) {
  const upcomingTasks = tasks.filter((t) => t.status === "upcoming");
  const overdueTasks = tasks.filter((t) => t.status === "overdue");

  return (
    <Card data-testid="card-study-plan">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">Study Planner</CardTitle>
        <Button variant="outline" size="sm" onClick={onViewPlan} data-testid="button-view-plan">
          View Plan
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm text-muted-foreground">Today, October 13, 2025</p>
        </div>
        
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="overdue" data-testid="tab-overdue">
              Overdue
              {overdueTasks.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1 text-xs">
                  {overdueTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming tasks</p>
            ) : (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover-elevate"
                  data-testid={`task-${task.id}`}
                >
                  <Clock className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {task.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{task.duration}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="overdue" className="mt-4 space-y-3">
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No overdue tasks</p>
            ) : (
              overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-destructive/50 bg-destructive/5 hover-elevate"
                  data-testid={`task-${task.id}`}
                >
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {task.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{task.duration}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
