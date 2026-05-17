"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Eye,
  FlaskConical,
  Layers,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { APP_DISPLAY_NAME } from "@/app/config/brand";
import {
  AI_SIMULATION_MODULE,
  CLINICAL_LAB_MODULE,
} from "./demo-constants";
import { anim } from "./demo-primitives";

const MODES: { label: string; icon: LucideIcon }[] = [
  { label: "Practice", icon: Stethoscope },
  { label: "Learning", icon: BookOpen },
  { label: "Evaluation", icon: ClipboardCheck },
  { label: "Shadow", icon: Eye },
];

const OUTCOMES = [
  { value: "SOAP", label: "Clinical notes" },
  { value: "OSCE", label: "Skills rubrics" },
  { value: "MCQ", label: "Board prep" },
] as const;

function ModuleCard({
  title,
  subtitle,
  icon: Icon,
  children,
  delayMs,
  slideAnim,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
  delayMs: number;
  slideAnim: "demo-slide-right" | "demo-slide-left";
}) {
  return (
    <article
      className="demo-intro-module relative flex min-h-0 flex-1 flex-col rounded-xl border border-white/15 bg-black/50 p-4 lg:rounded-2xl lg:p-5"
      style={anim(slideAnim, delayMs, "0.75s")}
    >
      <header className="mb-3.5 flex items-center gap-3 border-b border-white/10 pb-3 lg:mb-4 lg:pb-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/35 to-red-900/25 text-red-300 ring-1 ring-red-500/35 lg:h-12 lg:w-12">
          <Icon className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-white lg:text-xl">{title}</p>
          <p className="text-sm text-zinc-400 lg:text-base">{subtitle}</p>
        </div>
      </header>
      {children}
    </article>
  );
}

/** Platform flow diagram for slide 1 — single glass panel, no stock imagery. */
export function IntroPlatformDiagram() {
  return (
    <div
      className="demo-intro-diagram relative w-full"
      style={anim("demo-fade-in", 480, "0.9s")}
      aria-hidden
    >
      <div className="demo-intro-diagram__aura pointer-events-none absolute -inset-8 rounded-[2rem] lg:-inset-10" />

      <div
        className="demo-intro-diagram__panel relative overflow-hidden rounded-2xl border-2 border-red-500/35 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-6 lg:rounded-3xl lg:p-7"
        style={anim("demo-slide-up-deep", 560, "0.85s")}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 85% 55% at 50% 0%, rgba(220, 38, 38, 0.22), transparent 58%)",
          }}
          aria-hidden
        />

        {/* Hub */}
        <div
          className="relative z-10 mx-auto flex w-full max-w-[20rem] flex-col items-center text-center lg:max-w-none"
          style={anim("demo-pop", 680, "0.7s")}
        >
          <div className="relative">
            <span
              className="demo-intro-hub-ring pointer-events-none absolute -inset-4 rounded-full lg:-inset-5"
              aria-hidden
            />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-800 shadow-lg shadow-red-900/50 ring-2 ring-red-400/30 lg:h-20 lg:w-20 lg:rounded-3xl">
              <Layers className="h-8 w-8 text-white lg:h-10 lg:w-10" strokeWidth={1.75} />
            </span>
          </div>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-red-400 lg:text-base">
            Unified platform
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-white lg:text-4xl xl:text-[2rem]">
            {APP_DISPLAY_NAME}
          </p>
        </div>

        {/* Connector fork */}
        <svg
          className="relative z-0 mx-auto mt-1 block h-11 w-full max-w-[14rem] text-red-500/70 lg:h-14 lg:max-w-[18rem]"
          viewBox="0 0 160 36"
          fill="none"
          aria-hidden
        >
          <path
            d="M80 0 V14 M80 14 H24 M80 14 H136"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="demo-intro-connector"
          />
          <circle
            cx="80"
            cy="14"
            r="4"
            fill="rgb(239, 68, 68)"
            className="demo-intro-connector-node"
          />
        </svg>

        {/* Modules */}
        <div className="relative z-10 mt-2 grid grid-cols-2 gap-3.5 lg:gap-4">
          <ModuleCard
            title={AI_SIMULATION_MODULE}
            subtitle="AI patient encounters"
            icon={Stethoscope}
            delayMs={880}
            slideAnim="demo-slide-right"
          >
            <ul className="grid grid-cols-2 gap-2 lg:gap-2.5">
              {MODES.map((m, i) => {
                const ModeIcon = m.icon;
                return (
                  <li
                    key={m.label}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2.5 py-2.5 lg:px-3 lg:py-3"
                    style={anim("demo-fade-up", 1020 + i * 55, "0.45s")}
                  >
                    <ModeIcon className="h-4 w-4 shrink-0 text-red-400 lg:h-[1.125rem] lg:w-[1.125rem]" />
                    <span className="text-sm font-semibold text-zinc-100 lg:text-base">{m.label}</span>
                  </li>
                );
              })}
            </ul>
          </ModuleCard>

          <ModuleCard
            title={CLINICAL_LAB_MODULE}
            subtitle="QBank & timed blocks"
            icon={FlaskConical}
            delayMs={940}
            slideAnim="demo-slide-left"
          >
            <div className="flex flex-1 flex-col gap-2.5 lg:gap-3">
              <div
                className="rounded-xl border border-red-500/25 bg-red-950/40 px-3 py-2.5 lg:px-3.5 lg:py-3"
                style={anim("demo-fade-up", 1080)}
              >
                <div className="flex items-center justify-between text-sm lg:text-base">
                  <span className="text-zinc-300">Session accuracy</span>
                  <span className="text-lg font-bold text-red-300 lg:text-xl">78%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800 lg:h-2.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                    style={{ width: "78%" }}
                  />
                </div>
              </div>
              <ul className="space-y-2">
                {["Create test", "Tutor mode", "Analytics"].map((label, i) => (
                  <li
                    key={label}
                    className="flex items-center gap-2.5 text-sm font-medium text-zinc-200 lg:text-base"
                    style={anim("demo-fade-up", 1140 + i * 50, "0.4s")}
                  >
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </ModuleCard>
        </div>

        {/* Outcomes rail */}
        <div
          className="relative z-10 mt-5 rounded-xl border border-red-500/20 bg-gradient-to-r from-red-950/45 via-zinc-950/70 to-red-950/45 px-4 py-4 lg:mt-6 lg:rounded-2xl lg:px-5 lg:py-5"
          style={anim("demo-fade-up", 1320, "0.65s")}
        >
          <div className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-red-400 lg:text-base">
            <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />
            Shared outcomes
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2.5 lg:mt-4 lg:gap-3">
            {OUTCOMES.map((item, i) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/12 bg-black/40 px-2 py-3 text-center lg:py-3.5"
                style={anim("demo-counter-pop", 1420 + i * 90, "0.55s")}
              >
                <p className="text-xl font-bold text-white lg:text-2xl">{item.value}</p>
                <p className="mt-1 text-[12px] leading-tight text-zinc-400 lg:text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
