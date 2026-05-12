"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
  Brain,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileQuestion,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  PlayCircle,
  RefreshCw,
  Settings,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { StatCard } from "@/app/components/Dashboard/StatCard";
import {
  studentStatsService,
  studyPlansService,
  type StudentDashboardStats,
  type StudyTask,
} from "@/app/services/student";
import {
  getApiErrorMessage,
  isSubscriptionUpgradeRequiredError,
} from "@/app/services/base/api-http-error";
import { SubscriptionUpgradeModal } from "@/shared/components/SubscriptionUpgradeModal";
import { authService } from "@/shared/services/auth.service";
import useMyEntitlements from "@/hooks/useMyEntitlements";
import {
  isMedprepSlugAllowed,
  medprepSessionModeToSlug,
} from "@/lib/fyp/medprep-entitlements";
import { MEDPREP_MODES } from "@/app/components/medprep-ai/modes";
import type { MedPrepModeId } from "@/app/components/medprep-ai/modes";
import {
  medprepSessionService,
  type MedprepSession,
} from "@/lib/fyp/medprep-session-service";
import { getClinicalUserId } from "@/lib/fyp/medprep-user";
import { cn } from "@/shared/utils/cn";

type CaseLimitsPayload = {
  hasMedprepAccess: boolean;
  limitPeriod: string;
  modes: unknown[];
};

function formatRelativeUpdated(iso?: string): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const MEDPREP_ROUTE: Record<MedPrepModeId, string> = {
  "let-me-drive": "/medprep-ai/let-me-drive",
  qa: "/medprep-ai/qa",
  "ai-evaluation": "/medprep-ai/ai-evaluation",
};

const MODE_VISUAL: Record<
  MedPrepModeId,
  {
    Icon: typeof Stethoscope;
    bar: string;
    iconBg: string;
    iconFg: string;
    resumeBadge: string;
    cardRing: string;
  }
> = {
  "let-me-drive": {
    Icon: Stethoscope,
    bar: "from-primary-500 via-primary-600 to-primary-700",
    iconBg: "bg-primary-100 dark:bg-primary-900/40",
    iconFg: "text-primary-800 dark:text-primary-300",
    resumeBadge:
      "border-primary-200/80 bg-primary-50 text-primary-900 dark:border-primary-800/50 dark:bg-primary-900/35 dark:text-primary-100",
    cardRing: "hover:border-primary-300/80 dark:hover:border-primary-700",
  },
  qa: {
    Icon: GraduationCap,
    bar: "from-primary-400 via-primary-500 to-primary-600",
    iconBg: "bg-primary-100 dark:bg-primary-900/40",
    iconFg: "text-primary-800 dark:text-primary-300",
    resumeBadge:
      "border-primary-200/80 bg-primary-50 text-primary-900 dark:border-primary-800/50 dark:bg-primary-900/35 dark:text-primary-100",
    cardRing: "hover:border-primary-300/80 dark:hover:border-primary-700",
  },
  "ai-evaluation": {
    Icon: ClipboardCheck,
    bar: "from-primary-600 via-primary-700 to-primary-800",
    iconBg: "bg-primary-100 dark:bg-primary-900/40",
    iconFg: "text-primary-800 dark:text-primary-300",
    resumeBadge:
      "border-primary-200/80 bg-primary-50 text-primary-900 dark:border-primary-800/50 dark:bg-primary-900/35 dark:text-primary-100",
    cardRing: "hover:border-primary-300/80 dark:hover:border-primary-700",
  },
};

function classifyTask(t: StudyTask): "upcoming" | "overdue" | "completed" {
  if (t.status === "COMPLETED") return "completed";
  const now = Date.now();
  const due = new Date(t.scheduledFor).getTime();
  if (due < now - 5 * 60 * 1000) return "overdue";
  return "upcoming";
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [studyPlannerBlocked, setStudyPlannerBlocked] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [medprepSessions, setMedprepSessions] = useState<MedprepSession[]>([]);
  const [medprepSessionsLoading, setMedprepSessionsLoading] = useState(true);
  const [caseLimits, setCaseLimits] = useState<CaseLimitsPayload | null>(null);

  const { entitlements, loading: entitlementsLoading } = useMyEntitlements();

  const hasMedprepModuleAccess = Boolean(
    entitlements["medprepai.access"]?.enabled ??
      entitlements["medprepai.access"] ??
      false
  );

  const accessOk =
    caseLimits !== null ? caseLimits.hasMedprepAccess : hasMedprepModuleAccess;

  const refreshMedprepSessions = useCallback(async () => {
    const userId = getClinicalUserId(authService.getCurrentUser()) ?? "anonymous";
    if (!userId || userId === "anonymous") {
      setMedprepSessions([]);
      setMedprepSessionsLoading(false);
      return;
    }
    setMedprepSessionsLoading(true);
    try {
      const list = await medprepSessionService.listSessions(userId);
      setMedprepSessions(list);
    } catch {
      setMedprepSessions([]);
    } finally {
      setMedprepSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const userId = getClinicalUserId(user);
    if (userId && userId !== "anonymous") {
      void fetch(
        `/api/medprep/case-limits?userId=${encodeURIComponent(userId)}`
      )
        .then((r) => r.json())
        .then((j: { success?: boolean; data?: CaseLimitsPayload }) => {
          if (j?.success && j?.data) setCaseLimits(j.data);
        })
        .catch(() => setCaseLimits(null));
    }
  }, []);

  useEffect(() => {
    void refreshMedprepSessions();
    const retry = setTimeout(() => void refreshMedprepSessions(), 450);
    const onFocus = () => void refreshMedprepSessions();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshMedprepSessions();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(retry);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshMedprepSessions]);

  const activeMedprepSessions = useMemo(() => {
    const active = medprepSessions.filter((s) => s.status === "ACTIVE");
    const ent = entitlements as Record<string, unknown>;
    return active
      .filter((session) =>
        isMedprepSlugAllowed(
          ent,
          medprepSessionModeToSlug(session.mode),
          accessOk
        )
      )
      .slice(0, 8);
  }, [medprepSessions, entitlements, accessOk]);

  useEffect(() => {
    const u = authService.getCurrentUser();
    const raw =
      (u as { firstName?: string })?.firstName ||
      (u as { name?: string })?.name ||
      (u as { email?: string })?.email;
    setDisplayName(raw?.split("@")[0]?.trim() || "there");
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    setStudyPlannerBlocked(false);
    try {
      const [dashResult, tasksResult] = await Promise.allSettled([
        studentStatsService.dashboard(),
        studyPlansService.listTasks({}),
      ]);

      let combined: string | null = null;

      if (dashResult.status === "fulfilled") {
        setStats(dashResult.value);
      } else {
        combined = getApiErrorMessage(
          dashResult.reason,
          "Could not load dashboard metrics."
        );
      }

      if (tasksResult.status === "fulfilled") {
        setTasks(tasksResult.value ?? []);
      } else {
        const err = tasksResult.reason;
        if (isSubscriptionUpgradeRequiredError(err)) {
          setTasks([]);
          setStudyPlannerBlocked(true);
        } else {
          const msg = getApiErrorMessage(err, "Could not load study tasks.");
          combined = combined ? `${combined} ${msg}` : msg;
          setTasks([]);
        }
      }

      setError(combined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const upcomingPreview = useMemo(() => {
    return tasks
      .filter((t) => classifyTask(t) === "upcoming")
      .sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime()
      )
      .slice(0, 3);
  }, [tasks]);

  const overdueCount = useMemo(
    () => tasks.filter((t) => classifyTask(t) === "overdue").length,
    [tasks]
  );

  const goPlannerOrUpsell = (href: string) => {
    if (studyPlannerBlocked) {
      setSubscriptionModalOpen(true);
      return;
    }
    void router.push(href);
  };

  const inProgress = stats?.tests.inProgress;
  const lastCompleted = stats?.tests.lastTest;

  return (
    <div
      className="min-h-full bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(var(--color-primary-500-rgb),0.08),transparent)] dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
      data-testid="page-dashboard"
    >
      <SubscriptionUpgradeModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
        featureLabel="Study Planner"
      />

      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <div className="w-full max-w-none space-y-2 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Clinical Lab
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500 dark:text-slate-400" aria-hidden />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={() => {
                  void loadAll();
                  void refreshMedprepSessions();
                }}
                data-testid="button-refresh-dashboard"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-primary-600 text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500/35 dark:bg-primary-600 dark:hover:bg-primary-500"
                asChild
              >
                <Link href="/my-subscription">Subscription</Link>
              </Button>
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Welcome back{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="overflow-x-auto text-sm leading-relaxed whitespace-nowrap text-slate-600 [scrollbar-width:thin] dark:text-slate-400">
            Your hub for QBank study, assessments, MedPrep AI clinical cases, and subscription-aware tools—organized in one place.
          </p>
        </div>
      </div>

      <div className="w-full max-w-none space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
          >
            {error}
          </div>
        )}

        {/* KPI strip */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Question accuracy"
            value={`${Math.round(stats?.questionScore.percent ?? 0)}%`}
            subtitle={`${stats?.questionScore.correct ?? 0}/${
              stats?.questionScore.attempted ?? 0
            } correct`}
            icon={Target}
            color="success"
          />
          <StatCard
            title="QBank coverage"
            value={`${Math.round(stats?.qbankUsage.percent ?? 0)}%`}
            subtitle={`${stats?.qbankUsage.used ?? 0} of ${
              stats?.qbankUsage.total ?? 0
            } seen`}
            icon={Layers}
            progress={Math.round(stats?.qbankUsage.percent ?? 0)}
            color="primary"
          />
          <StatCard
            title="Tests completed"
            value={`${Math.round(stats?.tests.percent ?? 0)}%`}
            subtitle={`${stats?.tests.completed ?? 0}/${
              stats?.tests.total ?? 0
            } tests`}
            icon={ClipboardList}
            progress={Math.round(stats?.tests.percent ?? 0)}
            color="primary"
          />
          <StatCard
            title="Flashcards due"
            value={String(stats?.flashcards.due ?? 0)}
            subtitle={`${stats?.flashcards.total ?? 0} total in decks`}
            icon={Brain}
            color="warning"
          />
        </section>

        {/* Resume */}
        {(inProgress || lastCompleted) && (
          <section className="grid gap-4 lg:grid-cols-2">
            {inProgress && (
              <Card className="overflow-hidden border-primary-200/80 bg-gradient-to-br from-white to-primary-50/40 shadow-sm dark:border-white/10 dark:from-transparent dark:to-transparent dark:bg-white/5 dark:backdrop-blur-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-primary-600 text-white hover:bg-primary-600">
                      In progress
                    </Badge>
                    <PlayCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden />
                  </div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    {inProgress.name}
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">
                    {inProgress.answered}/{inProgress.totalQuestions} answered · pick up
                    where you left off
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-primary-600 hover:bg-primary-700 sm:w-auto"
                    onClick={() =>
                      void router.push(`/test-session/${inProgress.id}`)
                    }
                  >
                    Continue test
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
            {lastCompleted && !inProgress && (
              <Card className="border-slate-200 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg dark:text-white">Last test</CardTitle>
                  <CardDescription className="dark:text-slate-400">{lastCompleted.name}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" className="dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" asChild>
                    <Link href={`/test-session/${lastCompleted.id}`}>Review</Link>
                  </Button>
                  <Button variant="ghost" className="dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white" asChild>
                    <Link href="/previous-tests">All past tests</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* MedPrep — resume active simulations (same source as MedPrep overview) */}
        {(medprepSessionsLoading || activeMedprepSessions.length > 0) && (
          <section aria-labelledby="dash-medprep-resume-heading">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="dash-medprep-resume-heading"
                  className="text-lg font-semibold text-slate-900 dark:text-white"
                >
                  Resume clinical simulations
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Active MedPrep AI sessions—continue where you stopped
                </p>
              </div>
              <div className="flex items-center gap-2">
                {medprepSessionsLoading && (
                  <Loader2
                    className="h-4 w-4 animate-spin text-slate-400 dark:text-slate-500"
                    aria-hidden
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  onClick={() => void refreshMedprepSessions()}
                >
                  Sync sessions
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/medprep-ai">MedPrep hub</Link>
                </Button>
              </div>
            </div>

            {medprepSessionsLoading && activeMedprepSessions.length === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((k) => (
                  <div
                    key={k}
                    className="h-[7.25rem] animate-pulse rounded-xl border border-slate-100 bg-slate-100/80 dark:border-white/10 dark:bg-white/10"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {activeMedprepSessions.map((session) => {
                  const slug = medprepSessionModeToSlug(session.mode) as MedPrepModeId;
                  const vis = MODE_VISUAL[slug];
                  const ModeIcon = vis.Icon;
                  const updated = formatRelativeUpdated(session.updatedAt);
                  const href = medprepSessionService.getContinueUrl(session);
                  const modeLabel =
                    session.mode === "PRACTICE"
                      ? "Practice"
                      : session.mode === "LEARNING"
                        ? "Learning"
                        : "Evaluation";

                  return (
                    <Link
                      key={session.id}
                      href={href}
                      className={cn(
                        "group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-950/[0.04] transition-all hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md dark:ring-white/5",
                        vis.cardRing
                      )}
                    >
                      <div
                        className={cn(
                          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90",
                          vis.bar
                        )}
                      />
                      <div className="flex items-start justify-between gap-3 pt-1">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 dark:ring-white/10",
                            vis.iconBg
                          )}
                        >
                          <ModeIcon
                            className={cn("h-5 w-5", vis.iconFg)}
                            aria-hidden
                          />
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600 dark:text-slate-500 dark:group-hover:text-primary-400" />
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                        {session.title || session.caseId || "Clinical case"}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                            vis.resumeBadge
                          )}
                        >
                          {modeLabel}
                        </span>
                        {updated && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" aria-hidden />
                            {updated}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Study workspace */}
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Study workspace
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Core learning tools and materials
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/study">Study index</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Question Bank",
                desc: "Systems, topics, and tracked progress",
                href: "/study/question-bank",
                icon: BookOpen,
                accent: "from-primary-500 to-primary-700",
              },
              {
                title: "Flashcards",
                desc: "Spaced repetition decks",
                href: "/study/flashcards",
                icon: Brain,
                accent: "from-primary-400 to-primary-600",
              },
              {
                title: "Notes",
                desc: "Your clinical notes & pins",
                href: "/study/notes",
                icon: BookMarked,
                accent: "from-primary-600 to-primary-800",
              },
              {
                title: "Study Planner",
                desc: studyPlannerBlocked
                  ? "Included on plans with planner access"
                  : "Tasks & schedule",
                href: "/study-planner",
                icon: Target,
                accent: "from-primary-300 to-primary-500",
                locked: studyPlannerBlocked,
              },
            ].map((item) => (
              <Card
                key={item.title}
                className={cn(
                  "group relative overflow-hidden border-slate-200/90 transition-shadow hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md",
                  item.locked && "opacity-95"
                )}
              >
                <div
                  className={cn(
                    "h-1 w-full bg-gradient-to-r opacity-90",
                    item.accent
                  )}
                />
                <CardHeader className="space-y-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10"
                    )}
                  >
                    <item.icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-base dark:text-white">
                    {item.title}
                    {item.locked && (
                      <Lock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden />
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed dark:text-slate-400">
                    {item.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant={item.locked ? "secondary" : "default"}
                    className="w-full"
                    onClick={() =>
                      item.title === "Study Planner"
                        ? goPlannerOrUpsell(item.href)
                        : void router.push(item.href)
                    }
                  >
                    {item.locked ? "View plans" : "Open"}
                    <ArrowRight className="ml-2 h-4 w-4 opacity-70" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* MedPrep AI */}
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                MedPrep AI
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Clinical simulation modes—access follows your subscription
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/medprep-ai">Overview & resume</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {MEDPREP_MODES.map((mode) => {
              const id = mode.id as MedPrepModeId;
              const allowed = isMedprepSlugAllowed(
                entitlements as Record<string, unknown>,
                id,
                hasMedprepModuleAccess
              );
              const vis = MODE_VISUAL[id];
              const Icon = vis.Icon;
              const href = MEDPREP_ROUTE[id];

              return (
                <Card
                  key={id}
                  className="relative overflow-hidden border-slate-200/90 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md"
                >
                  <div
                    className={cn("h-1.5 w-full bg-gradient-to-r", vis.bar)}
                  />
                  <CardHeader className="space-y-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10",
                        vis.iconBg
                      )}
                    >
                      <Icon className={cn("h-6 w-6", vis.iconFg)} aria-hidden />
                    </div>
                    <CardTitle className="text-base dark:text-white">{mode.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs leading-relaxed dark:text-slate-400">
                      {mode.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!hasMedprepModuleAccess && !entitlementsLoading && (
                      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                        MedPrep AI is not included on your current plan.
                      </p>
                    )}
                    {entitlementsLoading ? (
                      <Button variant="secondary" className="w-full" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking access…
                      </Button>
                    ) : allowed ? (
                      <Button className="w-full" asChild>
                        <Link href={href}>{mode.ctaLabel}</Link>
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full" asChild>
                        <Link href="/my-subscription">
                          <Lock className="mr-2 h-4 w-4" />
                          Compare plans
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Assessments */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Assessments & analytics
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Build tests, review history, track performance
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-slate-200 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
              <CardHeader>
                <FileQuestion className="mb-2 h-8 w-8 text-primary-600 dark:text-primary-400" />
                <CardTitle className="text-base dark:text-white">Create a test</CardTitle>
                <CardDescription className="text-xs dark:text-slate-400">
                  Tutor or timed, pools, systems, and topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/test-creation/study-create">New test</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
              <CardHeader>
                <ClipboardList className="mb-2 h-8 w-8 text-slate-700 dark:text-slate-300" />
                <CardTitle className="text-base dark:text-white">Past tests</CardTitle>
                <CardDescription className="text-xs dark:text-slate-400">
                  Scores, attempts, and review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" asChild>
                  <Link href="/previous-tests">View history</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
              <CardHeader>
                <BarChart3 className="mb-2 h-8 w-8 text-primary-600 dark:text-primary-400" />
                <CardTitle className="text-base dark:text-white">Performance</CardTitle>
                <CardDescription className="text-xs dark:text-slate-400">
                  Trends and breakdowns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" asChild>
                  <Link href="/performance">Open dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Planner snapshot + AI tutor */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-slate-200 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base dark:text-white">Study planner snapshot</CardTitle>
                <CardDescription className="text-xs dark:text-slate-400">
                  Upcoming work tied to your plan
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-700 dark:text-primary-400"
                onClick={() => goPlannerOrUpsell("/study-planner")}
              >
                Open
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {studyPlannerBlocked ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Planner tasks require the appropriate subscription add-on. Use{" "}
                  <button
                    type="button"
                    className="font-medium text-primary-700 underline underline-offset-2 dark:text-primary-400"
                    onClick={() => setSubscriptionModalOpen(true)}
                  >
                    View plans
                  </button>{" "}
                  when you are ready.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">
                        Plan progress
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {stats?.plan.progress.completed ?? 0}/
                        {Math.max(stats?.plan.progress.total ?? 1, 1)} tasks
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">
                        Days left
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {stats?.plan.progress.daysRemaining ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500">
                        Overdue
                      </p>
                      <p className="font-semibold text-primary-700 dark:text-primary-400">
                        {overdueCount}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={Math.round(stats?.plan.progress.percent ?? 0)}
                    className="h-2"
                  />
                  {upcomingPreview.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No upcoming tasks in the next slice—add tasks in Study Planner.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {upcomingPreview.map((t) => (
                        <li
                          key={t.id}
                          className="flex justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                        >
                          <span className="truncate font-medium text-slate-800 dark:text-white">
                            {t.title}
                          </span>
                          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                            {new Date(t.scheduledFor).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-gradient-to-br from-primary-50/80 to-white dark:border-white/10 dark:from-transparent dark:to-transparent dark:bg-white/5 dark:backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/45">
                  <Sparkles className="h-5 w-5 text-primary-700 dark:text-primary-300" />
                </div>
                <div>
                  <CardTitle className="text-base dark:text-white">AI Tutor</CardTitle>
                  <CardDescription className="text-xs dark:text-slate-400">
                    Explanations and drills—usage follows your plan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button className="bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500/35" asChild>
                <Link href="/ai-tutor">Open AI Tutor</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Quick links — full-width strip */}
        <section className="border-t border-slate-200/80 pt-8 dark:border-white/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Quick links
          </p>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/achievements"
              className="group flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm transition hover:border-primary-300/60 hover:bg-primary-50/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md dark:text-white dark:hover:border-primary-600/40 dark:hover:bg-white/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
                <Trophy className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">Achievements</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-slate-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-500"
                aria-hidden
              />
            </Link>
            <Link
              href="/mock-exams"
              className="group flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm transition hover:border-primary-300/60 hover:bg-primary-50/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md dark:text-white dark:hover:border-primary-600/40 dark:hover:bg-white/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100/90 text-primary-800 dark:bg-primary-900/35 dark:text-primary-200">
                <ClipboardCheck className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">Mock exams</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-slate-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-500"
                aria-hidden
              />
            </Link>
            <Link
              href="/study-groups"
              className="group flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm transition hover:border-primary-300/60 hover:bg-primary-50/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md dark:text-white dark:hover:border-primary-600/40 dark:hover:bg-white/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">Study groups</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-slate-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-500"
                aria-hidden
              />
            </Link>
            <Link
              href="/settings"
              className="group flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm transition hover:border-primary-300/60 hover:bg-primary-50/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md dark:text-white dark:hover:border-primary-600/40 dark:hover:bg-white/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                <Settings className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">Settings</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-slate-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-500"
                aria-hidden
              />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
