"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  achievementsService,
  type AchievementsOverview,
  type AchievementWithProgress,
} from "@/app/services/launch";

const CATEGORY_COLORS: Record<string, string> = {
  STUDY: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  STREAK: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  PROGRESS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  COMMUNITY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  MASTERY: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  MILESTONE: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function AchievementsPage() {
  const [overview, setOverview] = useState<AchievementsOverview | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const load = async () => {
    setLoading(true);
    try {
      const [o, l] = await Promise.all([
        achievementsService.overview(),
        achievementsService.leaderboard(10),
      ]);
      setOverview(o);
      setLeaderboard(Array.isArray(l) ? l : []);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="px-[50px] pb-[50px] pt-[25px] flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin mr-2 text-emerald-600" /> Loading achievements…
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="px-[50px] pb-[50px] pt-[25px]">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Couldn't load achievements right now. Please refresh.
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = overview.items.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  });

  const levelProgress =
    overview.points.nextLevelAt > 0
      ? Math.round(
          ((overview.points.total %
            (overview.points.nextLevelAt / Math.max(1, overview.points.level))) /
            (overview.points.nextLevelAt /
              Math.max(1, overview.points.level))) *
            100
        )
      : 0;

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="text-amber-500" /> Achievements
        </h1>
        <p className="text-muted-foreground mt-1">
          Earn badges, build streaks and level up by studying consistently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-amber-200/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/15 text-amber-600">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Total points
              </p>
              <p className="text-3xl font-bold text-amber-600 leading-tight">
                {overview.points.total}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Level {overview.points.level} • Next at {overview.points.nextLevelAt}
              </p>
              <Progress value={levelProgress} className="h-1.5 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/10 border-orange-200/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-500/15 text-orange-600">
              <Flame className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Current streak
              </p>
              <p className="text-3xl font-bold text-orange-600 leading-tight">
                {overview.streak.current} <span className="text-base font-medium">days</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Longest: {overview.streak.longest} days
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 border-emerald-200/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/15 text-emerald-600">
              <Award className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Badges
              </p>
              <p className="text-3xl font-bold text-emerald-600 leading-tight">
                {overview.counts.unlocked}
                <span className="text-base font-medium text-muted-foreground">
                  {" "}/ {overview.counts.total}
                </span>
              </p>
              <Progress
                value={
                  overview.counts.total > 0
                    ? Math.round(
                        (overview.counts.unlocked / overview.counts.total) * 100
                      )
                    : 0
                }
                className="h-1.5 mt-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All achievements</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "unlocked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unlocked")}
              >
                Unlocked
              </Button>
              <Button
                variant={filter === "locked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("locked")}
              >
                Locked
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((a) => (
              <AchievementCard key={a.id} a={a} />
            ))}
            {items.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No achievements match this filter yet.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" /> Leaderboard
            </CardTitle>
            <CardDescription>Top point earners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet — start practicing!</p>
            ) : (
              leaderboard.map((row, idx) => (
                <div
                  key={row.id ?? idx}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0
                        ? "bg-amber-500 text-white"
                        : idx === 1
                          ? "bg-gray-300 text-gray-800"
                          : idx === 2
                            ? "bg-orange-300 text-orange-900"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {row.userId?.slice(0, 10)}…
                    </p>
                  </div>
                  <p className="font-semibold text-sm">{row.total}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AchievementCard({ a }: { a: AchievementWithProgress }) {
  const pct = Math.min(100, Math.round((a.progress / Math.max(1, a.threshold)) * 100));
  return (
    <Card
      className={`transition-all ${
        a.unlocked
          ? "border-amber-300/70 shadow-amber-200/40 shadow-md"
          : "opacity-90"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-lg ${
                a.unlocked
                  ? "bg-amber-500/15 text-amber-600"
                  : "bg-gray-200 text-gray-400 dark:bg-gray-800"
              }`}
            >
              {a.unlocked ? <Trophy className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight">{a.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
            </div>
          </div>
          <Badge className={CATEGORY_COLORS[a.category] ?? ""}>{a.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            {a.unlocked ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Unlocked
              </span>
            ) : (
              `${a.progress} / ${a.threshold}`
            )}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            <Star className="h-3 w-3" /> {a.points} pts
          </span>
        </div>
        <Progress value={a.unlocked ? 100 : pct} className="h-1.5" />
      </CardContent>
    </Card>
  );
}
