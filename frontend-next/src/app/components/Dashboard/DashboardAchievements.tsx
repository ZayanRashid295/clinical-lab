"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { LucideIcon } from "lucide-react";
import {
  Trophy,
  Flame,
  Sparkles,
  Star,
  Award,
  Lock,
  Loader2,
  CheckCircle2,
  Crown,
  Radio,
  Target,
  Medal,
  BookOpen,
  Users,
  TrendingUp,
  GraduationCap,
  Flag,
  Clock,
} from "lucide-react";
import {
  achievementsService,
  type AchievementsOverview,
  type AchievementWithProgress,
  type AchievementMetric,
} from "@/app/services/launch";
import type { Achievement, LeaderboardEntry } from "@/app/services/launch/types";
import { UserIdentity } from "@/shared/components/Common/UserIdentity";
import { useRealtimeEvent } from "@/app/services/realtime/use-realtime-room";
import { getSocket } from "@/app/services/realtime/socket";
import { authService } from "@/shared";
import { cn } from "@/shared/utils/cn";

const CATEGORY_LABEL: Record<string, string> = {
  STUDY: "Study",
  STREAK: "Streak",
  PROGRESS: "Progress",
  COMMUNITY: "Community",
  MASTERY: "Mastery",
  MILESTONE: "Milestone",
};

const CATEGORY_ICON: Record<string, LucideIcon> = {
  STUDY: BookOpen,
  STREAK: Flame,
  PROGRESS: TrendingUp,
  COMMUNITY: Users,
  MASTERY: GraduationCap,
  MILESTONE: Flag,
};

function formatUnlockDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const METRIC_LABEL: Record<AchievementMetric, string> = {
  QUESTIONS_ANSWERED: "Question bank",
  CORRECT_ANSWERS: "Correct answers",
  TESTS_COMPLETED: "Tests completed",
  STREAK_DAYS: "Study streak",
  STUDY_MINUTES: "Study time",
  DISCUSSION_POSTS: "Discussions",
  AI_TUTOR_MESSAGES: "AI tutor",
  STUDY_TASKS_COMPLETED: "Planner tasks",
  STUDY_GROUP_POSTS: "Study groups",
  MEDPREP_CONVERSATIONS: "MedPrep cases",
  QUESTION_REPORTS_SUBMITTED: "Question reports",
  FEEDBACK_TICKETS_SUBMITTED: "Feedback tickets",
  MOCK_EXAMS_COMPLETED: "Mock exams completed",
  STUDY_GROUPS_JOINED: "Study group memberships",
};

interface LeaderboardBroadcast {
  entries: LeaderboardEntry[];
  generatedAt?: string;
}

export function useDashboardAchievements() {
  const [overview, setOverview] = useState<AchievementsOverview | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, l] = await Promise.all([
        achievementsService.overview(),
        achievementsService.leaderboard(25),
      ]);
      setOverview(o);
      setLeaderboard(Array.isArray(l) ? (l as LeaderboardEntry[]) : []);
    } catch {
      setOverview(null);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeEvent<LeaderboardBroadcast>("leaderboard:update", (payload) => {
    if (payload?.entries?.length) setLeaderboard(payload.entries);
  });

  useRealtimeEvent("achievements:updated", () => {
    void load();
  });

  useEffect(() => {
    const tick = () => {
      const s = getSocket();
      setLive(!!s?.connected);
    };
    tick();
    const s = getSocket();
    if (!s) return;
    const onC = () => setLive(true);
    const onD = () => setLive(false);
    s.on("connect", onC);
    s.on("disconnect", onD);
    return () => {
      s.off("connect", onC);
      s.off("disconnect", onD);
    };
  }, []);

  return { overview, leaderboard, loading, live, reload: load };
}

export function AchievementsProgressSummary({
  overview,
  loading,
}: {
  overview: AchievementsOverview | null;
  loading: boolean;
}) {
  if (loading && !overview) {
    return (
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((k) => (
          <div
            key={k}
            className="h-[7.5rem] animate-pulse rounded-xl border border-slate-100 bg-slate-100/80 dark:border-white/10 dark:bg-white/10"
          />
        ))}
      </section>
    );
  }

  if (!overview) return null;

  const pts = overview.points;
  const levelProgress = pts.progressToNextLevel ?? 0;
  const badgePct =
    overview.counts.total > 0
      ? Math.round((overview.counts.unlocked / overview.counts.total) * 100)
      : 0;

  return (
    <section
      aria-label="Progress and recognition"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <Card className="overflow-hidden border-slate-200/90 bg-gradient-to-br from-slate-50 to-white shadow-sm dark:border-white/10 dark:from-transparent dark:to-transparent dark:bg-white/5 dark:backdrop-blur-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Points & level
              </p>
              <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                {pts.total.toLocaleString()}
                <span className="ml-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                  pts
                </span>
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Level {pts.level}</span>
                  <span>
                    {pts.pointsIntoLevel ?? 0}/{pts.pointsPerLevel ?? 200}
                  </span>
                </div>
                <Progress value={levelProgress} className="h-1.5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/90 bg-gradient-to-br from-slate-50 to-white shadow-sm dark:border-white/10 dark:from-transparent dark:to-transparent dark:bg-white/5 dark:backdrop-blur-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/12 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <Flame className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Study streak
              </p>
              <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                {overview.streak.current}
                <span className="ml-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                  days
                </span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Best: {overview.streak.longest} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/90 bg-gradient-to-br from-slate-50 to-white shadow-sm dark:border-white/10 dark:from-transparent dark:to-transparent dark:bg-white/5 dark:backdrop-blur-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Badges
              </p>
              <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                {overview.counts.unlocked}
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {" "}
                  / {overview.counts.total}
                </span>
              </p>
              <Progress value={badgePct} className="h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function AchievementsRecentUnlocks({
  overview,
}: {
  overview: AchievementsOverview;
}) {
  if (overview.recent.length === 0) return null;

  return (
    <Card className="overflow-hidden border-slate-200/90 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 bg-slate-50/80 pb-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Medal className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden />
              Recent unlocks
            </CardTitle>
            <CardDescription className="mt-0.5 dark:text-slate-400">
              Latest milestones you&apos;ve earned
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className={cn(
            "flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-4 pr-7 sm:px-5 sm:py-4",
            "scroll-px-4 sm:scroll-px-5",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-3 lg:grid-cols-4"
          )}
        >
          {overview.recent.map((r) => (
            <RecentUnlockCard key={r.id} entry={r} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AchievementsCatalogSection({
  overview,
  leaderboard,
  live,
}: {
  overview: AchievementsOverview;
  leaderboard: LeaderboardEntry[];
  live: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [category, setCategory] = useState<string>("ALL");
  const meId = authService.getCurrentUser?.()?.id as string | undefined;

  const categories = useMemo(() => {
    const set = new Set<string>();
    overview.items.forEach((i) => set.add(i.category));
    return ["ALL", ...Array.from(set).sort()];
  }, [overview.items]);

  const filteredItems = useMemo(() => {
    return overview.items.filter((a) => {
      if (category !== "ALL" && a.category !== category) return false;
      if (filter === "unlocked") return a.unlocked;
      if (filter === "locked") return !a.unlocked;
      return true;
    });
  }, [overview.items, category, filter]);

  return (
    <section id="achievements" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Achievements & leaderboard
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Browse badges and see how you rank among peers
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "w-fit gap-1.5 font-normal",
            live
              ? "border-primary-300/80 bg-primary-50 text-primary-900 dark:border-primary-800/60 dark:bg-black dark:text-primary-200"
              : "border-slate-200 text-slate-700 dark:border-white/10 dark:bg-black dark:text-slate-300"
          )}
        >
          <Radio
            className={cn(
              "h-3 w-3",
              live ? "text-primary-600 dark:text-primary-400" : "text-muted-foreground"
            )}
          />
          {live ? "Live rankings" : "Offline rankings"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              className="h-8"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unlocked" ? "default" : "outline"}
              size="sm"
              className="h-8"
              onClick={() => setFilter("unlocked")}
            >
              Unlocked
            </Button>
            <Button
              variant={filter === "locked" ? "default" : "outline"}
              size="sm"
              className="h-8"
              onClick={() => setFilter("locked")}
            >
              In progress
            </Button>
          </div>

          <Tabs value={category} onValueChange={setCategory} className="w-full">
            <TabsList className="no-scrollbar flex h-auto w-full flex-wrap justify-start gap-1 bg-slate-100/80 p-1 dark:bg-white/10">
              {categories.map((c) => (
                <TabsTrigger
                  key={c}
                  value={c}
                  className="rounded-md px-3 py-1.5 text-xs data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-black dark:data-[state=active]:text-white"
                >
                  {c === "ALL" ? "All categories" : CATEGORY_LABEL[c] ?? c}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredItems.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
          {filteredItems.length === 0 ? (
            <Card className="border-dashed dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground dark:text-slate-400">
                <Target className="h-8 w-8 opacity-40" />
                Nothing matches these filters—keep studying to unlock more.
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit border-slate-200/90 shadow-sm lg:sticky lg:top-24 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold dark:text-white">
              <Crown className="h-4 w-4 text-primary-600 dark:text-primary-400" /> Leaderboard
            </CardTitle>
            <CardDescription className="dark:text-slate-400">
              Top learners by total points
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 divide-y divide-slate-100 px-0 pb-4 dark:divide-white/10">
            {leaderboard.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground dark:text-slate-400">
                No rankings yet—be the first on the board.
              </p>
            ) : (
              leaderboard.map((row, idx) => {
                const isMe = !!meId && row.userId === meId;
                return (
                  <div
                    key={row.id ?? row.userId}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors",
                      isMe && "bg-primary-50/90 dark:bg-primary-900/25"
                    )}
                  >
                    <RankBadge rank={idx + 1} />
                    <div className="min-w-0 flex-1">
                      <UserIdentity
                        user={row.user}
                        fallbackId={row.userId}
                        avatarClassName="size-9"
                        nameClassName="text-sm font-medium"
                        subtitle={`Level ${row.level}`}
                        className="min-w-0"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {row.total.toLocaleString()}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground dark:text-slate-500">
                        pts
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function RecentUnlockCard({
  entry,
}: {
  entry: {
    id: string;
    unlockedAt: string;
    achievement: Achievement | null;
  };
}) {
  const a = entry.achievement;
  const cat = a?.category ?? "STUDY";
  const Icon = CATEGORY_ICON[cat] ?? Trophy;
  const points = a?.points;

  return (
    <div className="min-w-[200px] shrink-0 snap-start py-1 sm:min-w-0 sm:snap-align-none">
      <div className="flex h-full flex-col rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition-colors hover:border-primary-300/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-primary-700/50">
        <div className="flex gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/[0.12] text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
            aria-hidden
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">
              {a?.title ?? "Achievement"}
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground dark:text-slate-400">
              {CATEGORY_LABEL[cat] ?? cat}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-white/10">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground dark:text-slate-400">
            <Clock className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
            {formatUnlockDate(entry.unlockedAt)}
          </span>
          {points != null ? (
            <span className="text-xs font-semibold tabular-nums text-primary-700 dark:text-primary-400">
              +{points} pts
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const palette =
    rank === 1
      ? "bg-primary-600 text-white shadow-sm dark:bg-primary-500"
      : rank === 2
        ? "bg-primary-300 text-primary-900 dark:bg-primary-400 dark:text-primary-900"
        : rank === 3
          ? "bg-primary-200 text-primary-900 dark:bg-primary-600/80 dark:text-white"
          : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300";
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        palette
      )}
    >
      {rank}
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: AchievementWithProgress }) {
  const pct = Math.min(
    100,
    Math.round((a.progress / Math.max(1, a.threshold)) * 100)
  );
  const metricLabel = METRIC_LABEL[a.metric as AchievementMetric] ?? a.metric;
  const CatIcon = CATEGORY_ICON[a.category] ?? Trophy;

  return (
    <Card
      className={cn(
        "border-slate-200/90 transition-shadow dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md",
        a.unlocked ? "shadow-md shadow-primary-500/10 ring-1 ring-primary-200/50 dark:ring-primary-900/40" : ""
      )}
    >
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              a.unlocked
                ? "bg-primary-500/15 text-primary-700 dark:text-primary-300"
                : "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"
            )}
            aria-hidden
          >
            <CatIcon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm font-semibold leading-snug dark:text-white">
                {a.title}
              </CardTitle>
              <Badge
                variant="outline"
                className="font-normal text-[10px] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {CATEGORY_LABEL[a.category] ?? a.category}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
              {a.description}
            </p>
            <p className="text-[10px] text-muted-foreground dark:text-slate-500">
              Tracked via{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {metricLabel}
              </span>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground dark:text-slate-400">
            {a.unlocked ? (
              <span className="inline-flex items-center gap-1 font-medium text-primary-600 dark:text-primary-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3 opacity-50" />
                {a.progress} / {a.threshold}
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400">
            <Star className="h-3.5 w-3.5" /> +{a.points} pts
          </span>
        </div>
        <Progress value={a.unlocked ? 100 : pct} className="h-1.5 bg-slate-100 dark:bg-white/10" />
      </CardContent>
    </Card>
  );
}
