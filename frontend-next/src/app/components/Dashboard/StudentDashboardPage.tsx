"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Eye,
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
import { authService } from "@/shared/services/auth.service";
import SubscriptionWidget from "../Billing/SubscriptionWidget";
import useBillingFeatures from "@/hooks/useBillingFeatures";
import {
  isMedprepSlugAllowed,
  medprepSessionModeToSlug,
} from "@/lib/fyp/medprep-entitlements";
import type { MedPrepModeId } from "@/app/components/medprep-ai/modes";
import {
  medprepSessionService,
  type MedprepSession,
} from "@/lib/fyp/medprep-session-service";
import { getClinicalUserId } from "@/lib/fyp/medprep-user";
import { cn } from "@/shared/utils/cn";
import { DashboardInstitutionPanel } from "@/app/components/Dashboard/DashboardInstitutionPanel";
import {
  AchievementsCatalogSection,
  AchievementsProgressSummary,
  AchievementsRecentUnlocks,
  useDashboardAchievements,
} from "@/app/components/Dashboard/DashboardAchievements";

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
    bar: "from-rose-500 via-orange-500 to-amber-500",
    iconBg:
      "bg-rose-100 dark:bg-rose-950/50 dark:ring-rose-800/40",
    iconFg: "text-rose-800 dark:text-rose-200",
    resumeBadge:
      "border-rose-200/80 bg-rose-50 text-rose-900 dark:border-rose-800/50 dark:bg-rose-950/45 dark:text-rose-100",
    cardRing: "hover:border-rose-300/80 dark:hover:border-rose-800/60",
  },
  qa: {
    Icon: GraduationCap,
    bar: "from-emerald-500 via-teal-500 to-cyan-500",
    iconBg:
      "bg-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-800/40",
    iconFg: "text-emerald-800 dark:text-emerald-100",
    resumeBadge:
      "border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/45 dark:text-emerald-100",
    cardRing: "hover:border-emerald-300/80 dark:hover:border-emerald-800/60",
  },
  "ai-evaluation": {
    Icon: ClipboardCheck,
    bar: "from-indigo-500 via-violet-500 to-purple-600",
    iconBg:
      "bg-indigo-100 dark:bg-indigo-950/50 dark:ring-indigo-800/40",
    iconFg: "text-indigo-800 dark:text-indigo-100",
    resumeBadge:
      "border-indigo-200/80 bg-indigo-50 text-indigo-900 dark:border-indigo-800/50 dark:bg-indigo-950/45 dark:text-indigo-100",
    cardRing: "hover:border-indigo-300/80 dark:hover:border-indigo-800/60",
  },
  "shadow-mode": {
    Icon: Eye,
    bar: "from-cyan-500 via-sky-600 to-blue-700",
    iconBg: "bg-cyan-100 dark:bg-cyan-950/50 dark:ring-cyan-800/40",
    iconFg: "text-cyan-800 dark:text-cyan-100",
    resumeBadge:
      "border-cyan-200/80 bg-cyan-50 text-cyan-900 dark:border-cyan-800/50 dark:bg-cyan-950/45 dark:text-cyan-100",
    cardRing: "hover:border-cyan-300/80 dark:hover:border-cyan-800/60",
  },
};

const QUICK_LINK_ICON: Record<
  "studyGroups" | "settings" | "performance",
  { wrap: string }
> = {
  studyGroups: {
    wrap:
      "bg-emerald-100 text-emerald-900 ring-emerald-200/80 dark:bg-emerald-500/30 dark:text-emerald-50 dark:ring-emerald-400/50",
  },
  settings: {
    wrap:
      "bg-slate-100 text-slate-800 ring-slate-200/80 dark:bg-slate-600/70 dark:text-slate-50 dark:ring-white/25",
  },
  performance: {
    wrap:
      "bg-indigo-100 text-indigo-900 ring-indigo-200/80 dark:bg-indigo-500/30 dark:text-indigo-50 dark:ring-indigo-400/50",
  },
};

const quickLinkIconBox =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset";

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

  const { entitlements } = useBillingFeatures();
  const {
    overview: achievementsOverview,
    leaderboard,
    loading: achievementsLoading,
    live: leaderboardLive,
    reload: reloadAchievements,
  } = useDashboardAchievements();

  const hasMedprepModuleAccess = Boolean(
    (entitlements["medprepai.access"] as { enabled?: boolean } | undefined)?.enabled ??
      entitlements["medprepai.modes"] ??
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
    const onFocus = () => void refreshMedprepSessions();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshMedprepSessions();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
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

  useEffect(() => {
    if (!router.isReady) return;
    if (!router.asPath.includes("#achievements")) return;
    const timer = window.setTimeout(() => {
      document.getElementById("achievements")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [router.isReady, router.asPath]);

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
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <div className="w-full max-w-none space-y-1.5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              MedPrepAI
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
                  void reloadAchievements();
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
                <Link href="/billing">Billing</Link>
              </Button>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Welcome back{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Pick up where you left off, track your progress, and jump into study tools—all in one place.
          </p>
        </div>
      </div>

      <div className="w-full max-w-none space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
          >
            {error}
          </div>
        )}

        <DashboardInstitutionPanel />

        {/* Resume in-progress test — highest priority action */}
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

        {/* Study KPIs */}
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
            title="Bookmarks"
            value={String(stats?.bookmarks ?? 0)}
            subtitle="Saved for review"
            icon={BookMarked}
            color="warning"
          />
        </section>

        <AchievementsProgressSummary
          overview={achievementsOverview}
          loading={achievementsLoading}
        />

        {achievementsOverview ? (
          <AchievementsRecentUnlocks overview={achievementsOverview} />
        ) : null}

        {/* MedPrep — resume active simulations */}
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
                  Active MedPrepAI sessions—continue where you stopped
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
                        : session.mode === "SHADOW"
                          ? "Shadow"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {[
              {
                title: "Create Test",
                desc: "Build custom practice blocks",
                href: "/test-creation/study-create",
                icon: BookOpen,
                accent: "from-primary-500 to-primary-700",
              },
              {
                title: "Mock Exams",
                desc: "Full-length timed exams",
                href: "/mock-exams",
                icon: ClipboardList,
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
              {
                title: "Past Tests",
                desc: "Scores, attempts, and review",
                href: "/previous-tests",
                icon: ClipboardCheck,
                accent: "from-slate-500 to-slate-700",
              },
              {
                title: "Performance",
                desc: "Trends and breakdowns",
                href: "/performance",
                icon: BarChart3,
                accent: "from-indigo-500 to-violet-600",
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

        {/* Planner snapshot + AI tutor */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
          <Card className="flex h-full flex-col border-slate-200 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
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

          <Card className="flex h-full flex-col border-slate-200 bg-gradient-to-br from-primary-50/80 to-white dark:border-white/10 dark:from-transparent dark:to-transparent dark:bg-white/5 dark:backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 ring-1 ring-primary-200/70 dark:bg-primary-600/40 dark:ring-primary-500/45">
                  <Sparkles
                    className="h-5 w-5 text-primary-700 dark:text-primary-50"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </div>
                <div>
                  <CardTitle className="text-base dark:text-white">AI Tutor</CardTitle>
                  <CardDescription className="text-xs dark:text-slate-400">
                    Explanations and drills—usage follows your plan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500/35 sm:w-auto"
                asChild
              >
                <Link href="/ai-tutor">Open AI Tutor</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <Card className="overflow-hidden border-slate-200/90 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
          <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-teal-500 to-indigo-600" />
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/12 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                <Stethoscope className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">MedPrepAI clinical simulations</p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                  Practice, learning, shadow, and evaluation modes—access follows your plan.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/medprep-ai">
                Open MedPrep hub
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {achievementsOverview ? (
          <AchievementsCatalogSection
            overview={achievementsOverview}
            leaderboard={leaderboard}
            live={leaderboardLive}
          />
        ) : achievementsLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading achievements…
          </div>
        ) : null}

        <section className="max-w-md">
          <SubscriptionWidget />
        </section>

        {/* Quick links */}
        <section className="border-t border-slate-200/80 pt-8 dark:border-white/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            More
          </p>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/study-groups"
              className="group flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm transition hover:border-primary-300/60 hover:bg-primary-50/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md dark:text-white dark:hover:border-primary-600/40 dark:hover:bg-white/10"
            >
              <span
                className={`${quickLinkIconBox} ${QUICK_LINK_ICON.studyGroups.wrap}`}
              >
                <Users className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">Study groups</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-slate-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-500"
                aria-hidden
              />
            </Link>
            <Link
              href="/performance"
              className="group flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm transition hover:border-primary-300/60 hover:bg-primary-50/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md dark:text-white dark:hover:border-primary-600/40 dark:hover:bg-white/10"
            >
              <span
                className={`${quickLinkIconBox} ${QUICK_LINK_ICON.performance.wrap}`}
              >
                <BarChart3 className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">Performance</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-slate-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-500"
                aria-hidden
              />
            </Link>
            <Link
              href="/settings"
              className="group flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm transition hover:border-primary-300/60 hover:bg-primary-50/50 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md dark:text-white dark:hover:border-primary-600/40 dark:hover:bg-white/10"
            >
              <span
                className={`${quickLinkIconBox} ${QUICK_LINK_ICON.settings.wrap}`}
              >
                <Settings className="h-5 w-5" strokeWidth={2.25} aria-hidden />
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
