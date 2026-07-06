"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import {
  Target,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Bell,
  BellOff,
  CheckCircle2,
  X,
  Pause,
  Play,
} from "lucide-react";
import {
  goalsService,
  type Goal,
  type GoalMetric,
  type GoalPeriod,
  type GoalWithProgress,
  type CreateGoalPayload,
} from "@/app/services/launch";
import { useToast } from "@/shared/ui/use-toast";
import { toastApiError } from "@/app/services/base/api-http-error";
import {
  STUDY_FEATURE_KEYS,
  useStudyFeatureGate,
} from "@/hooks/useSubscriptionUpgradeModal";
import { useConfirm } from "@/hooks/useConfirm";
import { APP_GLASS_CARD, APP_PAGE_PADDING, APP_PAGE_SHELL } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";

const METRICS: { value: GoalMetric; label: string }[] = [
  { value: "QUESTIONS_ANSWERED", label: "Questions answered" },
  { value: "CORRECT_ANSWERS", label: "Correct answers" },
  { value: "STUDY_MINUTES", label: "Study minutes" },
  { value: "FLASHCARDS_REVIEWED", label: "Flashcards reviewed" },
  { value: "NOTES_CREATED", label: "Notes created" },
  { value: "TESTS_COMPLETED", label: "Tests completed" },
];

const PERIODS: GoalPeriod[] = ["DAILY", "WEEKLY", "MONTHLY"];

export default function GoalsPage() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const {
    handleSubscriptionError,
    ensureAccess,
    UpgradeModal,
  } = useStudyFeatureGate(STUDY_FEATURE_KEYS.planner, "Goals");
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [draft, setDraft] = useState<CreateGoalPayload>({
    title: "",
    description: "",
    metric: "QUESTIONS_ANSWERED",
    target: 20,
    period: "DAILY",
    reminderEnabled: true,
    reminderHour: 9,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await goalsService.list();
      setGoals(Array.isArray(list) ? list : []);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    if (!ensureAccess()) return;
    setEditing(null);
    setDraft({
      title: "",
      description: "",
      metric: "QUESTIONS_ANSWERED",
      target: 20,
      period: "DAILY",
      reminderEnabled: true,
      reminderHour: 9,
    });
    setShowEditor(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setDraft({
      title: g.title,
      description: g.description ?? "",
      metric: g.metric,
      target: g.target,
      period: g.period,
      reminderEnabled: g.reminderEnabled,
      reminderHour: g.reminderHour,
    });
    setShowEditor(true);
  };

  const onSave = async () => {
    if (!draft.title.trim() || draft.target <= 0) return;
    if (!editing && !ensureAccess()) return;
    setSaving(true);
    try {
      if (editing) {
        await goalsService.update(editing.id, draft);
      } else {
        await goalsService.create(draft);
      }
      setShowEditor(false);
      load();
    } catch (e) {
      if (!handleSubscriptionError(e, "Goals")) {
        toastApiError(toast, e, "Couldn’t save goal");
      }
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async (g: Goal) => {
    try {
      await goalsService.update(g.id, { isActive: !g.isActive });
      load();
    } catch (e) {
      toastApiError(toast, e, "Couldn’t update goal");
    }
  };

  const onDelete = async (g: Goal) => {
    const ok = await confirm({
      title: "Delete goal?",
      message: `"${g.title}" will be permanently removed.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await goalsService.remove(g.id);
      load();
    } catch (e) {
      if (!handleSubscriptionError(e, "Goals")) {
        toastApiError(toast, e, "Couldn’t delete goal");
      }
    }
  };

  return (
    <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING, "space-y-6")}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-slate-100">
            <Target className="text-primary-600 dark:text-primary-400" /> Personal Goals
          </h1>
          <p className="text-muted-foreground mt-1">
            Set targets and stay accountable. Progress updates as you study.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New goal
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : goals.length === 0 ? (
        <Card className={cn(APP_GLASS_CARD)}>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Target className="mx-auto mb-3 text-gray-300" size={42} />
            <p className="font-medium">No goals yet.</p>
            <p className="text-xs">Create your first goal to start tracking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / g.target) * 100));
            return (
              <Card
                key={g.id}
                className={cn(
                  APP_GLASS_CARD,
                  "transition-all",
                  g.achievedThisBucket
                    ? "border-emerald-300/90 bg-emerald-50/40 dark:border-emerald-600/40 dark:bg-emerald-900/15"
                    : !g.isActive
                      ? "opacity-60"
                      : ""
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {g.title}
                        {g.achievedThisBucket && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </CardTitle>
                      {g.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {g.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(g)}
                        title={g.isActive ? "Pause goal" : "Resume goal"}
                      >
                        {g.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(g)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>
                      {g.currentValue} / {g.target} {METRIC_LABEL[g.metric]}
                    </span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                    <Badge variant="outline">{g.period}</Badge>
                    {g.reminderEnabled ? (
                      <Badge variant="outline" className="gap-1">
                        <Bell className="h-3 w-3" /> @{g.reminderHour}:00
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <BellOff className="h-3 w-3" /> No reminder
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className={cn(APP_GLASS_CARD, "w-full max-w-lg")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editing ? "Edit goal" : "New goal"}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditor(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Goal title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="Description (optional)"
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Metric
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {METRICS.map((m) => (
                    <Button
                      key={m.value}
                      size="sm"
                      variant={draft.metric === m.value ? "default" : "outline"}
                      onClick={() => setDraft({ ...draft, metric: m.value })}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Target
                  </p>
                  <Input
                    type="number"
                    min={1}
                    value={draft.target}
                    onChange={(e) =>
                      setDraft({ ...draft, target: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Period
                  </p>
                  <div className="flex gap-1.5">
                    {PERIODS.map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={draft.period === p ? "default" : "outline"}
                        onClick={() => setDraft({ ...draft, period: p })}
                        className="flex-1"
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!draft.reminderEnabled}
                    onChange={(e) =>
                      setDraft({ ...draft, reminderEnabled: e.target.checked })
                    }
                  />
                  Daily reminder
                </label>
                {draft.reminderEnabled && (
                  <div className="flex items-center gap-1 text-sm">
                    at
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      className="w-16"
                      value={draft.reminderHour ?? 9}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          reminderHour: Math.max(
                            0,
                            Math.min(23, Number(e.target.value) || 0)
                          ),
                        })
                      }
                    />
                    :00
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowEditor(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  disabled={saving || !draft.title.trim() || draft.target <= 0}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editing ? "Save" : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {UpgradeModal}
    </div>
  );
}

const METRIC_LABEL: Record<GoalMetric, string> = {
  QUESTIONS_ANSWERED: "questions",
  CORRECT_ANSWERS: "correct",
  STUDY_MINUTES: "min",
  FLASHCARDS_REVIEWED: "cards",
  NOTES_CREATED: "notes",
  TESTS_COMPLETED: "tests",
};
