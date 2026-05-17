"use client";

import { type CSSProperties } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  HelpCircle,
  Search,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { anim } from "./demo-primitives";
import { SnapshotFrame } from "./demo-mode-snapshots";
import { MODE_SNAPSHOT_FRAME_TITLE } from "./demo-typography";
import { demoDiagram } from "./demo-theme";

const SYSTEMS = [
  { name: "Cardiovascular System", count: 12, selected: true },
  { name: "Psychology", count: 0, selected: false },
  { name: "Hematology", count: 0, selected: false },
  { name: "Neurology", count: 0, selected: false },
  { name: "Respiratory System", count: 0, selected: false },
] as const;

const CARDIO_TOPICS = [
  "Acute Chest Pain",
  "Heart Failure",
  "Hypertension",
  "Aortic Dissection",
  "Arrhythmias",
  "Infective Endocarditis",
  "Peripheral Vascular Disease",
  "Valvular Heart Disease",
  "Pericardial Diseases",
  "Congenital Heart Disease",
] as const;

function Toggle({
  on,
  label,
  delayMs,
}: {
  on: boolean;
  label: string;
  delayMs?: number;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2"
      style={delayMs !== undefined ? anim("demo-fade-up", delayMs, "0.45s") : undefined}
    >
      <span className="text-lg font-medium text-zinc-200 sm:text-xl">{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          on ? "bg-red-500" : "bg-zinc-700",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left]",
            on ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </div>
  );
}

function PoolStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "unused" | "incorrect" | "omitted" | "correct";
}) {
  const tones = {
    unused: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    incorrect: "border-red-500/35 bg-red-500/12 text-red-200",
    omitted: "border-amber-500/35 bg-amber-500/12 text-amber-200",
    correct: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
  };
  return (
    <div className={cn("rounded-lg border px-2 py-1.5 text-center", tones[tone])}>
      <p className="text-[17px] font-medium uppercase tracking-wide opacity-80 sm:text-lg">{label}</p>
      <p className="text-3xl font-bold tabular-nums sm:text-4xl">{value}</p>
    </div>
  );
}

/** Sharp vector Create Test UI for demo slide 10 (replaces blurry screenshot). */
export function ClinicalLabCreateTestSnapshot({ style }: { style?: CSSProperties }) {
  return (
    <SnapshotFrame
      title="Clinical Lab · Create Test"
      titleClassName={MODE_SNAPSHOT_FRAME_TITLE}
      style={style}
      scale="large"
      className="h-full"
    >
      <div
        className={cn(
          "demo-visual-enlarged flex min-h-0 flex-1 flex-col rounded-lg bg-zinc-950 p-3 sm:p-4 lg:p-5",
          demoDiagram.innerStack,
        )}
      >
        {/* Header */}
        <div
          className="mb-3 flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3"
          style={anim("demo-fade-up", 200)}
        >
          <div>
            <h3 className="text-2xl font-semibold text-white sm:text-3xl">Create Test</h3>
            <p className="text-lg text-zinc-400 sm:text-xl">Customize your learning path</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-lg text-zinc-300 sm:text-xl">
            <HelpCircle className="h-3.5 w-3.5 text-red-400" />
            Quick Guide
          </span>
        </div>

        {/* Top config row */}
        <div className="mb-3 grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <div
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:p-3"
            style={anim("demo-fade-up", 320)}
          >
            <p className="mb-2 flex items-center gap-1.5 text-lg font-semibold text-zinc-100 sm:text-xl">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Test Mode
            </p>
            <div className="space-y-1.5">
              <Toggle on label="Tutor · explanations" delayMs={380} />
              <Toggle on={false} label="Timed · 90s per question" delayMs={440} />
            </div>
          </div>

          <div
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:p-3"
            style={anim("demo-fade-up", 400)}
          >
            <p className="mb-2 text-lg font-semibold text-zinc-100 sm:text-xl">Marked Questions</p>
            <Toggle on={false} label="Include marked for review" delayMs={460} />
            <p className="mt-2 text-lg text-red-400/90 sm:text-xl">● 0 marked</p>
          </div>

          <div
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:p-3"
            style={anim("demo-fade-up", 480)}
          >
            <p className="mb-2 text-lg font-semibold text-zinc-100 sm:text-xl">Question Pool</p>
            <div className="grid grid-cols-2 gap-1.5">
              <PoolStat label="Unused" value={0} tone="unused" />
              <PoolStat label="Incorrect" value={2} tone="incorrect" />
              <PoolStat label="Omitted" value={0} tone="omitted" />
              <PoolStat label="Correct" value={3} tone="correct" />
            </div>
          </div>
        </div>

        {/* Systems + topics */}
        <div
          className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-xl border border-white/10 sm:grid-cols-[minmax(7.5rem,28%)_1fr]"
          style={anim("demo-pop", 560, "0.75s")}
        >
          <div className="border-b border-white/10 bg-zinc-900/90 p-2 sm:border-b-0 sm:border-r sm:p-3">
            <p className="mb-2 text-[17px] font-bold uppercase tracking-wider text-zinc-500 sm:text-lg">
              Systems
            </p>
            <ul className="space-y-0.5">
              {SYSTEMS.map((s, i) => (
                <li
                  key={s.name}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-lg sm:text-xl",
                    s.selected
                      ? "bg-red-500/20 text-red-100 ring-1 ring-red-500/25"
                      : "text-zinc-500 hover:bg-white/5",
                  )}
                  style={anim("demo-slide-right", 700 + i * 55, "0.4s")}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      s.selected ? "border-red-400 bg-red-500/50" : "border-zinc-600",
                    )}
                  >
                    {s.selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate leading-tight">{s.name}</span>
                  <span className="shrink-0 tabular-nums text-zinc-400">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex min-h-0 flex-col p-2 sm:p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[17px] font-bold uppercase tracking-wider text-zinc-500 sm:text-lg">
                Topics
              </p>
              <button
                type="button"
                className="text-lg font-medium text-red-400 sm:text-xl"
                tabIndex={-1}
              >
                + Expand All
              </button>
            </div>
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="text-lg text-zinc-500 sm:text-xl">Search topics…</span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3 lg:gap-2">
              {CARDIO_TOPICS.map((t, i) => (
                <label
                  key={t}
                  className="flex cursor-default items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-lg text-zinc-200 sm:text-xl"
                  style={anim("demo-fade-in", 850 + i * 40, "0.35s")}
                >
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border border-red-500/50 bg-red-500/25">
                    <Check className="h-2 w-2 text-red-200" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 truncate leading-snug">{t}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3"
          style={anim("demo-fade-up", 1200)}
        >
          <span className="text-xl font-medium text-zinc-400">12 selections</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-lg font-medium text-zinc-300 sm:text-xl"
              tabIndex={-1}
            >
              Reset All
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-lg font-semibold text-white shadow-lg shadow-red-900/30 sm:text-xl"
              style={{ animation: "demo-cta-glow 2.5s ease-in-out 1.5s infinite" }}
              tabIndex={-1}
            >
              Generate Test
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </SnapshotFrame>
  );
}

export function ClinicalLabSessionSnapshot({ style }: { style?: CSSProperties }) {
  return (
    <SnapshotFrame
      title="Clinical Lab · Tutor mode session"
      titleClassName={MODE_SNAPSHOT_FRAME_TITLE}
      style={style}
      scale="large"
      className="h-full"
    >
      <div
        className={cn(
          "demo-visual-enlarged flex flex-col gap-3 rounded-lg bg-zinc-950 p-3 sm:p-4 lg:p-5",
          demoDiagram.innerStack,
        )}
      >
        <div className="flex items-center justify-between text-xl text-zinc-400">
          <span>Question 4 of 20</span>
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">Tutor mode</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5" style={anim("demo-fade-up", 400)}>
          <p className="text-lg font-semibold uppercase text-red-400">Cardiovascular · Heart failure</p>
          <p className="mt-1.5 text-2xl font-medium leading-snug text-white">
            A 72-year-old with progressive dyspnea has S₃, bilateral crackles, and BNP 890 pg/mL. Best next step?
          </p>
          <div className="mt-2 space-y-1">
            {[
              { label: "A. Immediate PCI", selected: false },
              { label: "B. IV diuretic + afterload reduction", selected: true, correct: true },
              { label: "C. High-flow oxygen only", selected: false },
              { label: "D. Outpatient echo in 4 weeks", selected: false },
            ].map((opt, i) => (
              <div
                key={opt.label}
                className={cn(
                  "rounded border px-2 py-1 text-xl",
                  opt.selected
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-100"
                    : "border-white/10 text-zinc-400",
                )}
                style={anim("demo-slide-left", 700 + i * 100, "0.4s")}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
        <div
          className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-2"
          style={anim("demo-fade-up", 1200)}
        >
          <p className="flex items-center gap-1 text-xl font-bold text-emerald-400">
            <BookOpen className="h-3 w-3" />
            Tutor explanation
          </p>
          <p className="mt-1 text-xl leading-relaxed text-emerald-100/90">
            Acute decompensated HF requires <strong>volume offload</strong> (diuretics) and afterload reduction;
            PCI is for ACS, not isolated volume overload with elevated BNP and pulmonary edema.
          </p>
        </div>
        <div className="flex justify-between text-lg text-zinc-500">
          <span>Marked for review</span>
          <span>Next question →</span>
        </div>
      </div>
    </SnapshotFrame>
  );
}

export function ClinicalLabPerformanceSnapshot({ style }: { style?: CSSProperties }) {
  return (
    <SnapshotFrame title="Clinical Lab · Performance" style={style} scale="large">
      <div
        className={cn(
          "grid grid-cols-3 gap-4 rounded-lg bg-zinc-950 p-4 sm:p-5 lg:p-6",
          demoDiagram.innerStack,
        )}
      >
        {[
          { label: "Accuracy", value: "78%", sub: "+6% this week" },
          { label: "Cardio system", value: "84%", sub: "Strongest" },
          { label: "Tests taken", value: "23", sub: "4 marked weak" },
        ].map((m, i) => (
          <div
            key={m.label}
            className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4 text-center lg:p-6"
            style={anim("demo-counter-pop", 400 + i * 150, "0.6s")}
          >
            <p className="text-7xl font-bold text-white lg:text-8xl">{m.value}</p>
            <p className="mt-2 text-2xl font-medium text-zinc-300">{m.label}</p>
            <p className="mt-1 text-xl text-zinc-500">{m.sub}</p>
          </div>
        ))}
      </div>
    </SnapshotFrame>
  );
}

/** @deprecated Use ClinicalLabCreateTestSnapshot — kept as alias for imports. */
export function ClinicalLabCreateTestPhoto({ style }: { style?: CSSProperties }) {
  return <ClinicalLabCreateTestSnapshot style={style} />;
}
