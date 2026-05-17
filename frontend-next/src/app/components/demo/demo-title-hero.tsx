"use client";

import { BarChart3, Layers, Sparkles, Stethoscope, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { APP_DISPLAY_NAME } from "@/app/config/brand";
import {
  AI_SIMULATION_MODULE,
  CLINICAL_LAB_MODULE,
  DEMO_INTRO_FEATURES,
} from "./demo-constants";
import { IntroPlatformDiagram } from "./demo-intro-visual";
import { anim, WordReveal } from "./demo-primitives";
import { demoType } from "./demo-typography";

const FEATURE_ICONS: LucideIcon[] = [Layers, UserRound, BarChart3];

/** Full-viewport intro — typography-first, no stock photo. */
export function DemoTitleHero() {
  return (
    <div className="relative flex h-full min-h-full w-full flex-1 flex-col overflow-hidden bg-demo-950">
      <div className="pointer-events-none absolute inset-0 demo-bg-mesh" aria-hidden />
      <div className="demo-intro-spotlight pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 demo-bg-grain opacity-40" aria-hidden />

      <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-10 xl:px-12">
        <div className="mx-auto grid w-full max-w-[90rem] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,48%)] lg:gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(28rem,52%)] xl:gap-10">
          {/* Copy */}
          <div className="flex min-w-0 flex-col">
            <div style={anim("demo-fade-up", 200)}>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-red-500/35 bg-red-950/40 px-4 py-2 font-semibold text-red-100 backdrop-blur-sm",
                  demoType.introBadge,
                )}
              >
                <Sparkles className="h-4 w-4 text-red-400" />
                FYP Open House · Live demo
              </span>
            </div>

            <div
              className="mt-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500/20 to-transparent shadow-lg shadow-red-950/40 lg:mt-7 lg:h-16 lg:w-16"
              style={anim("demo-logo-pop", 350, "0.8s")}
            >
              <Stethoscope className="h-8 w-8 text-red-400 lg:h-9 lg:w-9" />
            </div>

            <WordReveal
              text={APP_DISPLAY_NAME}
              baseDelay={450}
              stagger={70}
              gradientClass="demo-text-gradient"
              className="mt-5 text-left text-5xl sm:text-6xl lg:text-6xl xl:text-7xl"
            />

            <p
              className={cn("mt-4 max-w-xl text-zinc-300 lg:mt-5", demoType.introSub)}
              style={anim("demo-fade-up", 1100)}
            >
              {AI_SIMULATION_MODULE} and {CLINICAL_LAB_MODULE} on one platform — AI patient
              cases, faculty tools, and board-style MCQs.
            </p>

            <div className="mt-5 flex flex-wrap gap-2" style={anim("demo-fade-up", 1250)}>
              <span className="rounded-lg border border-red-500/25 bg-red-950/30 px-3 py-1.5 text-base font-medium text-red-100">
                {AI_SIMULATION_MODULE}
              </span>
              <span className="rounded-lg border border-red-800/30 bg-red-950/20 px-3 py-1.5 text-base font-medium text-zinc-300">
                {CLINICAL_LAB_MODULE}
              </span>
            </div>

            <ul className="mt-6 hidden gap-3 sm:grid sm:grid-cols-2 lg:hidden">
              {DEMO_INTRO_FEATURES.map((feature, i) => {
                const Icon = FEATURE_ICONS[i] ?? Layers;
                return (
                  <li
                    key={feature.title}
                    className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 backdrop-blur-sm lg:p-3.5"
                    style={anim("demo-fade-up", 1400 + i * 120, "0.65s")}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/30 to-red-900/10 text-red-300 ring-1 ring-red-500/25">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-white", demoType.introFeatureTitle)}>
                        {feature.title}
                      </span>
                      <span className={cn("mt-0.5 block text-zinc-500", demoType.introFeatureLine)}>
                        {feature.line}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <p
              className={cn(
                "mt-6 border-t border-red-500/15 pt-4 text-zinc-500 lg:mt-5 lg:pt-4",
                demoType.introHint,
              )}
              style={anim("demo-fade-in", 2100)}
            >
              Press{" "}
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-base text-zinc-300">
                Space
              </kbd>{" "}
              to play · 2-minute tour
            </p>
          </div>

          {/* Platform diagram — desktop (primary visual) */}
          <div className="hidden w-full min-w-0 lg:block">
            <IntroPlatformDiagram />
          </div>
        </div>

        {/* Platform diagram — mobile/tablet */}
        <div className="mx-auto mt-6 w-full max-w-lg lg:hidden">
          <IntroPlatformDiagram />
        </div>
      </div>
    </div>
  );
}
