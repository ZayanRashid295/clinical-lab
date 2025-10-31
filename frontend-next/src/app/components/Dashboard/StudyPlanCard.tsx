import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
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
    <Card data-testid="card-study-plan" className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Study Planner</CardTitle>
        <Button variant="outline" size="sm" onClick={onViewPlan} data-testid="button-view-plan">
          View Plan
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Today, {new Date().toLocaleDateString()}</p>
        </div>
        
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming" className="text-gray-700 dark:text-gray-300">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="overdue" data-testid="tab-overdue" className="text-gray-700 dark:text-gray-300">
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
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No upcoming tasks</p>
            ) : (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  data-testid={`task-${task.id}`}
                >
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {task.type}
                      </Badge>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{task.duration}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="overdue" className="mt-4 space-y-3">
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No overdue tasks</p>
            ) : (
              overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-red-500/50 bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors"
                  data-testid={`task-${task.id}`}
                >
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {task.type}
                      </Badge>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{task.duration}</span>
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

