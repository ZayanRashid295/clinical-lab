import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type StudyTask, insertStudyTaskSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function StudyPlanner() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: tasks = [], isLoading } = useQuery<StudyTask[]>({
    queryKey: ["/api/study-tasks"],
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest("PATCH", `/api/study-tasks/${taskId}`, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-tasks"] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/study-tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-tasks"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Task Created",
        description: "Your study task has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertStudyTaskSchema),
    defaultValues: {
      title: "",
      type: "Study Session",
      duration: "",
      status: "upcoming",
      dueDate: "",
    },
  });

  const onSubmit = (data: any) => {
    createTaskMutation.mutate(data);
  };

  const upcomingTasks = tasks.filter((t) => t.status === "upcoming");
  const overdueTasks = tasks.filter((t) => t.status === "overdue");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const completionPercentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const renderTask = (task: StudyTask) => {
    const statusConfig = {
      upcoming: { icon: Clock, color: "text-primary", bgColor: "bg-primary/10" },
      overdue: { icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
      completed: { icon: CheckCircle2, color: "text-chart-2", bgColor: "bg-chart-2/10" },
    };

    const { icon: Icon, color, bgColor } = statusConfig[task.status];

    return (
      <div
        key={task.id}
        className="flex items-start gap-3 p-4 rounded-lg border border-border hover-elevate"
        data-testid={`task-${task.id}`}
      >
        <div className={`p-2 rounded-md ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {task.type}
            </Badge>
            <span className="text-xs text-muted-foreground">{task.duration}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        </div>
        {task.status !== "completed" && (
          <Button 
            variant="outline" 
            size="sm" 
            data-testid={`button-complete-${task.id}`}
            onClick={() => completeTaskMutation.mutate(task.id)}
            disabled={completeTaskMutation.isPending}
          >
            Mark Complete
          </Button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-study-planner">
        <div>
          <h1 className="text-3xl font-bold">Study Planner</h1>
          <p className="text-muted-foreground mt-1">
            Organize your study schedule and track progress
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
    <div className="space-y-6" data-testid="page-study-planner">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Planner</h1>
          <p className="text-muted-foreground mt-1">
            Organize your study schedule and track progress
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-task">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Study Task</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Review Cardiology" {...field} data-testid="input-task-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-type">
                            <SelectValue placeholder="Select task type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Study Session">Study Session</SelectItem>
                          <SelectItem value="Practice Test">Practice Test</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Flashcards">Flashcards</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="2 hours" {...field} data-testid="input-task-duration" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-task-due-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-task">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-submit-task">
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-tasks">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2" data-testid="text-completion-rate">
              {Math.round(completionPercentage)}%
            </div>
            <Progress value={completionPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive" data-testid="text-overdue-tasks">
              {overdueTasks.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Study Plan Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Progress value={76.19} className="flex-1" />
              <span className="text-sm font-medium tabular-nums">76.19%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">1 / 10 days completed</span>
              <span className="text-muted-foreground">10 days remaining</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                Completed 16
              </Badge>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                Overdue {overdueTasks.length}
              </Badge>
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                Incomplete 3
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming ({upcomingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" data-testid="tab-overdue">
            Overdue ({overdueTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {upcomingTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No upcoming tasks</p>
              </CardContent>
            </Card>
          ) : (
            upcomingTasks.map(renderTask)
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-3">
          {overdueTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-chart-2 mb-4" />
                <p className="text-sm text-muted-foreground">No overdue tasks</p>
              </CardContent>
            </Card>
          ) : (
            overdueTasks.map(renderTask)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No completed tasks</p>
              </CardContent>
            </Card>
          ) : (
            completedTasks.map(renderTask)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
