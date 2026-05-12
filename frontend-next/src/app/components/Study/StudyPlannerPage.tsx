"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Plus,
  Loader2,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  X,
  Save,
  Target,
} from "lucide-react";
import {
  studyPlansService,
  type StudyPlan,
  type StudyPlanProgress,
  type StudyTask,
  type StudyTaskStatus,
  type StudyTaskType,
} from "@/app/services/student";
import {
  getApiErrorMessage,
  isSubscriptionUpgradeRequiredError,
} from "@/app/services/base/api-http-error";
import { SubscriptionUpgradeModal } from "@/shared/components/SubscriptionUpgradeModal";
import { APP_GLASS_CARD, APP_PAGE_PADDING, APP_PAGE_SHELL } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";

const TYPES: StudyTaskType[] = [
  "READING",
  "PRACTICE",
  "REVIEW",
  "FLASHCARDS",
  "ASSESSMENT",
  "GENERAL",
];

const blankTask = () => ({
  title: "",
  description: "",
  type: "GENERAL" as StudyTaskType,
  scheduledFor: new Date().toISOString().slice(0, 16),
  durationMinutes: 30,
});

const blankPlan = () => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  return {
    name: "My Study Plan",
    description: "",
    goal: "",
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

function classify(t: StudyTask): "upcoming" | "overdue" | "completed" {
  if (t.status === "COMPLETED") return "completed";
  return new Date(t.scheduledFor).getTime() < Date.now() - 60_000
    ? "overdue"
    : "upcoming";
}

export default function StudyPlannerPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [progress, setProgress] = useState<StudyPlanProgress | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [taskDraft, setTaskDraft] = useState(blankTask());

  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [planDraft, setPlanDraft] = useState(blankPlan());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const settled = await Promise.allSettled([
        studyPlansService.getActive(),
        studyPlansService.progress(),
        studyPlansService.listTasks(),
      ]);
      let blocked = false;
      const messages: string[] = [];

      const noteFailure = (reason: unknown, fallback: string) => {
        if (isSubscriptionUpgradeRequiredError(reason)) {
          blocked = true;
          return;
        }
        messages.push(getApiErrorMessage(reason, fallback));
      };

      if (settled[0].status === "fulfilled") setPlan(settled[0].value);
      else noteFailure(settled[0].reason, "Could not load your study plan.");

      if (settled[1].status === "fulfilled") setProgress(settled[1].value);
      else noteFailure(settled[1].reason, "Could not load study plan progress.");

      if (settled[2].status === "fulfilled") setTasks(settled[2].value);
      else noteFailure(settled[2].reason, "Could not load tasks.");

      if (blocked) {
        setPlan(null);
        setProgress(null);
        setTasks([]);
        setSubscriptionModalOpen(true);
        setError(null);
      } else {
        setError(messages.length ? messages.join(" ") : null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Auto-open create-plan modal if URL says so
  useEffect(() => {
    if (router.query?.action === "create" && !plan) {
      setShowPlanEditor(true);
    }
  }, [router.query, plan]);

  const grouped = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const overdue: StudyTask[] = [];
    const todayList: StudyTask[] = [];
    const upcoming: StudyTask[] = [];
    const completed: StudyTask[] = [];
    for (const t of tasks) {
      const c = classify(t);
      if (c === "completed") completed.push(t);
      else if (c === "overdue") overdue.push(t);
      else {
        const sched = new Date(t.scheduledFor);
        if (sched >= today && sched < tomorrow) todayList.push(t);
        else upcoming.push(t);
      }
    }
    const cmp = (a: StudyTask, b: StudyTask) =>
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
    return {
      overdue: overdue.sort(cmp),
      todayList: todayList.sort(cmp),
      upcoming: upcoming.sort(cmp),
      completed: completed.sort(cmp).reverse(),
    };
  }, [tasks]);

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskDraft(blankTask());
    setShowTaskEditor(true);
  };
  const openEditTask = (t: StudyTask) => {
    setEditingTask(t);
    setTaskDraft({
      title: t.title,
      description: t.description ?? "",
      type: t.type,
      scheduledFor: new Date(t.scheduledFor).toISOString().slice(0, 16),
      durationMinutes: t.durationMinutes ?? 30,
    });
    setShowTaskEditor(true);
  };
  const saveTask = async () => {
    if (!taskDraft.title.trim()) return;
    setBusy(true);
    try {
      const payload = {
        title: taskDraft.title,
        description: taskDraft.description || undefined,
        type: taskDraft.type,
        scheduledFor: new Date(taskDraft.scheduledFor).toISOString(),
        durationMinutes: Number(taskDraft.durationMinutes) || 30,
      };
      if (editingTask) {
        await studyPlansService.updateTask(editingTask.id, payload);
      } else {
        await studyPlansService.createTask(payload);
      }
      setShowTaskEditor(false);
      await load();
    } catch (e: unknown) {
      if (isSubscriptionUpgradeRequiredError(e)) setSubscriptionModalOpen(true);
      else setError(getApiErrorMessage(e, "Could not save task."));
    } finally {
      setBusy(false);
    }
  };
  const removeTask = async (t: StudyTask) => {
    if (!confirm(`Delete task "${t.title}"?`)) return;
    try {
      await studyPlansService.deleteTask(t.id);
      await load();
    } catch (e: unknown) {
      if (isSubscriptionUpgradeRequiredError(e)) setSubscriptionModalOpen(true);
      else setError(getApiErrorMessage(e, "Could not delete task."));
    }
  };
  const setStatus = async (t: StudyTask, status: StudyTaskStatus) => {
    try {
      await studyPlansService.updateTask(t.id, { status });
      await load();
    } catch (e: unknown) {
      if (isSubscriptionUpgradeRequiredError(e)) setSubscriptionModalOpen(true);
      else setError(getApiErrorMessage(e, "Could not update task."));
    }
  };

  const savePlan = async () => {
    if (!planDraft.name.trim()) return;
    setBusy(true);
    try {
      await studyPlansService.createPlan({
        name: planDraft.name,
        description: planDraft.description || undefined,
        goal: planDraft.goal || undefined,
        startDate: new Date(planDraft.startDate).toISOString(),
        endDate: new Date(planDraft.endDate).toISOString(),
      });
      setShowPlanEditor(false);
      await load();
    } catch (e: unknown) {
      if (isSubscriptionUpgradeRequiredError(e)) setSubscriptionModalOpen(true);
      else setError(getApiErrorMessage(e, "Could not save plan."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING, "space-y-6")}>
      <SubscriptionUpgradeModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
        featureLabel="Study Planner"
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Study Planner</h1>
          <p className="text-muted-foreground mt-2">
            Plan, schedule, and check off your prep tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPlanDraft(blankPlan());
              setShowPlanEditor(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> New Plan
          </Button>
          <Button onClick={openCreateTask}>
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {plan ? (
        <Card className={cn(APP_GLASS_CARD)}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{plan.name}</CardTitle>
                {plan.description && (
                  <CardDescription>{plan.description}</CardDescription>
                )}
                {plan.goal && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <Target className="inline h-4 w-4 mr-1" /> {plan.goal}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(plan.startDate).toLocaleDateString()} –{" "}
                {new Date(plan.endDate).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Stat label="Total tasks" value={progress?.total ?? 0} />
              <Stat
                label="Completed"
                value={progress?.completed ?? 0}
                color="text-emerald-600"
              />
              <Stat
                label="Overdue"
                value={progress?.overdue ?? 0}
                color="text-red-500"
              />
              <Stat
                label="Days left"
                value={progress?.daysRemaining ?? 0}
                color="text-blue-600"
              />
              <Stat
                label="Progress"
                value={`${Math.round(progress?.percent ?? 0)}%`}
                color="text-purple-600"
              />
            </div>
            <div className="mt-3 w-full rounded-full bg-slate-200 dark:bg-white/10 h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all dark:bg-primary-500"
                style={{ width: `${Math.min(100, progress?.percent ?? 0)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={cn(APP_GLASS_CARD)}>
          <CardContent className="p-8 text-center">
            <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">No active plan</h3>
            <p className="text-muted-foreground mb-4">
              Set up a study plan and we&apos;ll keep your daily tasks in line.
            </p>
            <Button
              onClick={() => {
                setPlanDraft(blankPlan());
                setShowPlanEditor(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Create plan
            </Button>
          </CardContent>
        </Card>
      )}

      <TaskGroup
        title="Overdue"
        tone="overdue"
        tasks={grouped.overdue}
        onComplete={(t) => setStatus(t, "COMPLETED")}
        onSkip={(t) => setStatus(t, "SKIPPED")}
        onEdit={openEditTask}
        onDelete={removeTask}
      />
      <TaskGroup
        title="Today"
        tone="today"
        tasks={grouped.todayList}
        onComplete={(t) => setStatus(t, "COMPLETED")}
        onSkip={(t) => setStatus(t, "SKIPPED")}
        onEdit={openEditTask}
        onDelete={removeTask}
      />
      <TaskGroup
        title="Upcoming"
        tone="upcoming"
        tasks={grouped.upcoming}
        onComplete={(t) => setStatus(t, "COMPLETED")}
        onSkip={(t) => setStatus(t, "SKIPPED")}
        onEdit={openEditTask}
        onDelete={removeTask}
      />
      <TaskGroup
        title="Completed"
        tone="completed"
        tasks={grouped.completed.slice(0, 20)}
        onComplete={(t) => setStatus(t, "PENDING")}
        onSkip={(t) => setStatus(t, "SKIPPED")}
        onEdit={openEditTask}
        onDelete={removeTask}
      />

      {showTaskEditor && (
        <Modal title={editingTask ? "Edit task" : "New task"} onClose={() => setShowTaskEditor(false)}>
          <Input
            placeholder="Task title"
            value={taskDraft.title}
            onChange={(e) =>
              setTaskDraft((d) => ({ ...d, title: e.target.value }))
            }
          />
          <Textarea
            placeholder="Description (optional)"
            value={taskDraft.description}
            onChange={(e) =>
              setTaskDraft((d) => ({ ...d, description: e.target.value }))
            }
            rows={3}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={taskDraft.type}
              onValueChange={(v) =>
                setTaskDraft((d) => ({ ...d, type: v as StudyTaskType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={5}
              step={5}
              value={taskDraft.durationMinutes}
              onChange={(e) =>
                setTaskDraft((d) => ({
                  ...d,
                  durationMinutes: Number(e.target.value) || 30,
                }))
              }
            />
          </div>
          <Input
            type="datetime-local"
            value={taskDraft.scheduledFor}
            onChange={(e) =>
              setTaskDraft((d) => ({ ...d, scheduledFor: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTaskEditor(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={saveTask} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </Modal>
      )}

      {showPlanEditor && (
        <Modal title="New study plan" onClose={() => setShowPlanEditor(false)}>
          <Input
            placeholder="Plan name"
            value={planDraft.name}
            onChange={(e) =>
              setPlanDraft((d) => ({ ...d, name: e.target.value }))
            }
          />
          <Textarea
            placeholder="Description"
            value={planDraft.description}
            onChange={(e) =>
              setPlanDraft((d) => ({ ...d, description: e.target.value }))
            }
            rows={2}
          />
          <Input
            placeholder="Goal (e.g. 75% accuracy on cardio)"
            value={planDraft.goal}
            onChange={(e) =>
              setPlanDraft((d) => ({ ...d, goal: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Start</p>
              <Input
                type="date"
                value={planDraft.startDate}
                onChange={(e) =>
                  setPlanDraft((d) => ({ ...d, startDate: e.target.value }))
                }
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">End</p>
              <Input
                type="date"
                value={planDraft.endDate}
                onChange={(e) =>
                  setPlanDraft((d) => ({ ...d, endDate: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPlanEditor(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={savePlan} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save plan
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-md border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TaskGroup({
  title,
  tone,
  tasks,
  onComplete,
  onSkip,
  onEdit,
  onDelete,
}: {
  title: string;
  tone: "overdue" | "today" | "upcoming" | "completed";
  tasks: StudyTask[];
  onComplete: (t: StudyTask) => void;
  onSkip: (t: StudyTask) => void;
  onEdit: (t: StudyTask) => void;
  onDelete: (t: StudyTask) => void;
}) {
  if (tasks.length === 0) return null;
  const toneBorder =
    tone === "overdue"
      ? "border-red-300/90 dark:border-red-500/35"
      : tone === "today"
        ? "border-primary-300/90 dark:border-primary-600/40"
        : tone === "completed"
          ? "border-emerald-300/90 dark:border-emerald-600/35"
          : "border-slate-200/90 dark:border-white/10";
  return (
    <Card className={cn(APP_GLASS_CARD, toneBorder)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg dark:text-slate-100">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-md border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
          >
            <div className="pt-0.5">
              {tone === "overdue" ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : tone === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {t.description}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {t.type.charAt(0) + t.type.slice(1).toLowerCase()}
                </Badge>
                <span>
                  {new Date(t.scheduledFor).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>· {t.durationMinutes ?? 30} min</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {tone !== "completed" ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onComplete(t)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Done
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onComplete(t)}
                >
                  Reopen
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(t)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className={cn(APP_GLASS_CARD, "w-full max-w-lg max-h-[90vh] overflow-y-auto")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">{children}</CardContent>
      </Card>
    </div>
  );
}
