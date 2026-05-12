"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MEDPREP_MODES } from "./modes";
import type { MedPrepModeId } from "./modes";
import { authService } from "@/shared/services/auth.service";
import {
  medprepSessionService,
  type MedprepSession,
} from "@/lib/fyp/medprep-session-service";
import { getClinicalUserId } from "@/lib/fyp/medprep-user";
import useMyEntitlements from "../../../hooks/useMyEntitlements";
import {
  isMedprepSlugAllowed,
  medprepSessionModeToSlug,
} from "@/lib/fyp/medprep-entitlements";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Clock,
  Crown,
  Gift,
  GraduationCap,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Play,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { APP_PAGE_SHELL } from "@/app/config/app-shell";

type CaseLimitRow = {
  slug: string;
  enabled: boolean;
  title: string;
  limit: number | null;
  used: number;
  limitPeriod: string;
};

type CaseLimitsPayload = {
  hasMedprepAccess: boolean;
  limitPeriod: string;
  modes: CaseLimitRow[];
};

const HIGHLIGHT_ICONS: Record<
  MedPrepModeId,
  [LucideIcon, LucideIcon, LucideIcon]
> = {
  "let-me-drive": [BookOpen, Clock, Target],
  qa: [GraduationCap, MessageCircle, Sparkles],
  "ai-evaluation": [ClipboardCheck, Crown, TrendingUp],
};

const MODE_THEME: Record<
  MedPrepModeId,
  {
    topBar: string;
    iconWrap: string;
    highlightRing: string;
    highlightIcon: string;
    cardBorder: string;
    cardBg: string;
    activeCta: string;
    activeCtaHover: string;
    resumeBadge: string;
  }
> = {
  "let-me-drive": {
    topBar: "from-rose-500 via-orange-500 to-amber-500",
    iconWrap:
      "bg-rose-100 text-rose-700 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50",
    highlightRing: "ring-rose-100 bg-white dark:ring-white/10 dark:bg-white/5",
    highlightIcon: "text-rose-600 dark:text-rose-300",
    cardBorder: "border-rose-100/90 dark:border-white/10",
    cardBg:
      "bg-gradient-to-b from-white to-rose-50/40 dark:from-white/[0.06] dark:to-slate-950/80",
    activeCta:
      "bg-gradient-to-r from-rose-600 to-orange-600 shadow-md shadow-rose-500/20",
    activeCtaHover: "hover:from-rose-700 hover:to-orange-700 hover:shadow-lg hover:shadow-rose-500/25",
    resumeBadge:
      "bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-800/50",
  },
  qa: {
    topBar: "from-emerald-500 via-teal-500 to-cyan-500",
    iconWrap:
      "bg-emerald-100 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/45 dark:text-emerald-100 dark:ring-emerald-800/50",
    highlightRing:
      "ring-emerald-100 bg-white dark:ring-white/10 dark:bg-white/5",
    highlightIcon: "text-emerald-600 dark:text-emerald-300",
    cardBorder: "border-emerald-100/90 dark:border-white/10",
    cardBg:
      "bg-gradient-to-b from-white to-emerald-50/35 dark:from-white/[0.06] dark:to-slate-950/80",
    activeCta:
      "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-500/20",
    activeCtaHover: "hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-500/25",
    resumeBadge:
      "bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800/50",
  },
  "ai-evaluation": {
    topBar: "from-indigo-500 via-violet-500 to-purple-600",
    iconWrap:
      "bg-indigo-100 text-indigo-800 ring-indigo-200/80 dark:bg-indigo-950/45 dark:text-indigo-100 dark:ring-indigo-800/50",
    highlightRing:
      "ring-indigo-100 bg-white dark:ring-white/10 dark:bg-white/5",
    highlightIcon: "text-indigo-600 dark:text-indigo-300",
    cardBorder: "border-indigo-100/90 dark:border-white/10",
    cardBg:
      "bg-gradient-to-b from-white to-indigo-50/35 dark:from-white/[0.06] dark:to-slate-950/80",
    activeCta:
      "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20",
    activeCtaHover: "hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/25",
    resumeBadge:
      "bg-indigo-50 text-indigo-900 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-100 dark:border-indigo-800/50",
  },
};

function ModeCardIcon({ modeId }: { modeId: MedPrepModeId }) {
  const Icon =
    modeId === "let-me-drive"
      ? Stethoscope
      : modeId === "qa"
        ? BookOpen
        : ClipboardCheck;
  const t = MODE_THEME[modeId];
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950 ${t.iconWrap}`}
      aria-hidden
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
    </div>
  );
}

export default function MedPrepOverviewPage() {
  const [sessions, setSessions] = useState<MedprepSession[]>([]);
  const [caseLimits, setCaseLimits] = useState<CaseLimitsPayload | null>(null);
  const { entitlements, loading } = useMyEntitlements();
  const hasAccess = Boolean(
    entitlements["medprepai.access"]?.enabled ??
      entitlements["medprepai.access"] ??
      false
  );

  const accessOk =
    caseLimits !== null ? caseLimits.hasMedprepAccess : hasAccess;

  const slugAllowed = (slug: string) =>
    isMedprepSlugAllowed(entitlements as Record<string, unknown>, slug, accessOk);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const userId = getClinicalUserId(user);
    if (userId && userId !== "anonymous") {
      fetch(`/api/medprep/case-limits?userId=${encodeURIComponent(userId)}`)
        .then((r) => r.json())
        .then((j) => {
          if (j?.success && j?.data) setCaseLimits(j.data as CaseLimitsPayload);
        })
        .catch(() => setCaseLimits(null));
    }
  }, []);

  useEffect(() => {
    const load = () => {
      const user = authService.getCurrentUser();
      const userId = getClinicalUserId(user) ?? "anonymous";
      medprepSessionService
        .listSessions(userId)
        .then(setSessions)
        .catch(() => setSessions([]));
    };
    load();
    const retry = setTimeout(load, 400);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(retry);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const activeSessions = useMemo(() => {
    const active = sessions.filter((session) => session.status === "ACTIVE");
    const ent = entitlements as Record<string, unknown>;
    const resumable = active.filter((session) =>
      isMedprepSlugAllowed(
        ent,
        medprepSessionModeToSlug(session.mode),
        accessOk
      )
    );
    return resumable.slice(0, 6);
  }, [sessions, entitlements, accessOk]);

  return (
    <div className={cn(APP_PAGE_SHELL, "min-h-full w-full")}>
      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Clinical simulation
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                MedPrep AI
              </h1>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
                Pick how you want to work through cases—solo practice, guided
                learning, or structured evaluation. Your progress and limits
                follow your subscription.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/15 dark:hover:bg-white/10"
            >
              <LayoutDashboard className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {activeSessions.length > 0 ? (
          <section aria-labelledby="resume-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                id="resume-heading"
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Resume a session
              </h2>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Active simulations
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeSessions.map((session) => {
                const slug = medprepSessionModeToSlug(session.mode);
                const badge =
                  MODE_THEME[slug as MedPrepModeId]?.resumeBadge ??
                  "bg-slate-50 text-slate-800 border-slate-200 dark:bg-white/10 dark:text-slate-100 dark:border-white/10";
                return (
                  <Link
                    key={session.id}
                    href={medprepSessionService.getContinueUrl(session)}
                    className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-950/5 transition-all hover:border-emerald-200/80 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:ring-white/5 dark:hover:border-emerald-500/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-sm font-semibold leading-snug text-slate-900 group-hover:text-emerald-800 dark:text-slate-100 dark:group-hover:text-emerald-300">
                        {session.title || session.caseId || "Untitled case"}
                      </p>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                    </div>
                    <p
                      className={`mt-3 inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badge}`}
                    >
                      {session.mode === "PRACTICE"
                        ? "Practice"
                        : session.mode === "LEARNING"
                          ? "Learning"
                          : "Evaluation"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {!loading && !accessOk && (
          <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 shadow-sm dark:border-amber-500/25 dark:from-amber-950/30 dark:to-orange-950/20 dark:backdrop-blur-md">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    MedPrep AI isn&apos;t on your current plan
                  </h2>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Upgrade to unlock simulations, case generation, and usage
                    aligned to your package.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Link
                  href="/landing-page#pricing"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                >
                  View plans
                </Link>
                <Link
                  href="/my-subscription"
                  className="text-center text-sm font-medium text-slate-700 underline-offset-4 hover:underline sm:text-right dark:text-slate-300"
                >
                  Manage subscription
                </Link>
              </div>
            </div>
          </div>
        )}

        <section aria-labelledby="modes-heading">
          <div className="mb-6">
            <h2
              id="modes-heading"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Modes
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Included modes depend on your subscription. Locked modes can be
              unlocked by upgrading.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
            {MEDPREP_MODES.map((mode) => {
              const row = caseLimits?.modes?.find((m) => m.slug === mode.id);
              const periodLabel =
                row?.limitPeriod === "DAY"
                  ? "day"
                  : row?.limitPeriod === "MONTH"
                    ? "month"
                    : "period";
              const atCap =
                !!row &&
                row.enabled &&
                row.limit !== null &&
                row.limit !== undefined &&
                row.used >= row.limit;
              const notEntitledToSlug = accessOk && !slugAllowed(mode.id);
              const rowBlocks = Boolean(row && !row.enabled);
              const modeNotOnPlan = rowBlocks || notEntitledToSlug;
              const linkDisabled =
                loading || !accessOk || notEntitledToSlug || atCap || rowBlocks;

              const t = MODE_THEME[mode.id];
              const icons = HIGHLIGHT_ICONS[mode.id];

              return (
                <article
                  key={mode.id}
                  className={`relative flex flex-col overflow-x-hidden rounded-2xl border shadow-sm ring-1 ring-slate-950/[0.04] backdrop-blur-sm dark:ring-white/5 ${t.cardBorder} ${t.cardBg}`}
                >
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${t.topBar}`}
                    aria-hidden
                  />

                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-3">
                      <ModeCardIcon modeId={mode.id} />
                      {modeNotOnPlan ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          <Lock className="h-3 w-3" />
                          Locked
                        </span>
                      ) : atCap ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                          Limit reached
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                          <Play className="h-3 w-3" />
                          Included
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      {mode.title}
                    </h3>
                    <p className="mt-2 text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
                      {mode.heroHeadline}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {mode.summary}
                    </p>

                    {/* Full-width rows only: three columns inside each card was too narrow and clipped text */}
                    <ul className="mt-6 flex flex-col gap-3">
                      {mode.highlights.map((h, i) => {
                        const Hi = icons[i];
                        return (
                          <li
                            key={h.title}
                            className={`flex w-full gap-3 rounded-xl p-3.5 ring-1 ${t.highlightRing}`}
                          >
                            <span
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-white/10 ${t.highlightIcon}`}
                            >
                              <Hi className="h-4 w-4" strokeWidth={2} />
                            </span>
                            <span className="min-w-0 flex-1 break-words">
                              <span className="block text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                                {h.title}
                              </span>
                              <span className="mt-1 block text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                {h.subtitle}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {row && accessOk && (
                      <p className="mt-5 text-xs text-slate-600 dark:text-slate-400">
                        Cases this {periodLabel}:{" "}
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {row.used}
                        </span>
                        {row.limit !== null && row.limit !== undefined ? (
                          <>
                            {" "}
                            /{" "}
                            <span className="tabular-nums">{row.limit}</span>
                          </>
                        ) : (
                          <span className="text-slate-500"> · Unlimited</span>
                        )}
                      </p>
                    )}

                    {atCap && (
                      <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/90 px-3 py-2 text-xs font-medium leading-relaxed text-amber-950">
                        You&apos;ve used all distinct cases for this mode this{" "}
                        {periodLabel}. Limits reset when your billing period
                        rolls over.
                      </p>
                    )}

                    <div className="mt-6 flex flex-col gap-2 border-t border-slate-200/80 pt-6">
                      {!linkDisabled ? (
                        <Link
                          href={`/medprep-ai/${mode.id}`}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all ${t.activeCta} ${t.activeCtaHover}`}
                        >
                          {mode.ctaLabel}
                          <ArrowRight className="h-4 w-4 opacity-90" />
                        </Link>
                      ) : loading ? (
                        <div className="flex justify-center rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm text-slate-500">
                          Checking access…
                        </div>
                      ) : (
                        <>
                          <div
                            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100/90 px-4 py-3 text-sm font-semibold text-slate-500"
                            aria-disabled
                          >
                            <Lock className="h-4 w-4" />
                            {modeNotOnPlan || rowBlocks
                              ? "Not included in your plan"
                              : atCap
                                ? "Case limit reached"
                                : "Unavailable"}
                          </div>
                          {(modeNotOnPlan || rowBlocks || !accessOk) && (
                            <Link
                              href="/landing-page#pricing"
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
                            >
                              <Gift className="h-4 w-4 text-slate-600" />
                              Compare plans
                            </Link>
                          )}
                          {accessOk && atCap && !modeNotOnPlan && (
                            <Link
                              href="/my-subscription"
                              className="text-center text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
                            >
                              View usage and renewal date
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
