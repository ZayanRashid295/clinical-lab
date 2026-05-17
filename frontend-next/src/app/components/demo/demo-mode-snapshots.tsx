"use client";

import { type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Eye,
  LayoutDashboard,
  Play,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { APP_DISPLAY_NAME } from "@/app/config/brand";
import {
  DEMO_CASE_GENERATION_UI_IMAGE,
  DEMO_MODES_HUB_UI_IMAGE,
  DEMO_SCREENSHOT_SIZES,
} from "./demo-constants";
import { DemoScreenshot } from "./demo-screenshot";
import {
  EvaluationModeUiMock,
  LearningModeUiMock,
  PracticeModeUiMock,
  ShadowModeUiMock,
} from "./demo-mode-ui-mocks";
import { anim } from "./demo-primitives";
import { demoDiagram } from "./demo-theme";
import { MODE_SNAPSHOT_FRAME_TITLE, SNAPSHOT_FRAME_TITLE } from "./demo-typography";
import {
  DEMO_CASE_USAGE,
  DEMO_HIGHLIGHT_ICONS,
  DEMO_MODE_ICONS,
  DEMO_MODE_THEME,
  DEMO_RESUME_SESSIONS,
  MEDPREP_MODES,
  type MedPrepModeId,
} from "./demo-mode-data";

export function SnapshotFrame({
  title,
  children,
  style,
  className,
  scale = "default",
  titleClassName = SNAPSHOT_FRAME_TITLE,
}: {
  title: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  scale?: "default" | "compact" | "large" | "mode";
  titleClassName?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-red-950/70 bg-black shadow-2xl ring-1 ring-red-500/10",
        scale === "compact" && "max-w-3xl",
        scale === "default" && "max-w-5xl",
        scale === "large" && demoDiagram.frameLarge,
        scale === "mode" && demoDiagram.frameMode,
        className,
      )}
      style={style}
    >
      <div className="flex items-center gap-1.5 border-b border-red-950/80 bg-red-950/40 px-3 py-2 sm:px-4 sm:py-2.5">
        <span className="h-2 w-2 rounded-full bg-red-500/90" />
        <span className="h-2 w-2 rounded-full bg-amber-500/90" />
        <span className="h-2 w-2 rounded-full bg-red-500/90" />
        <span className={cn("flex-1 truncate text-center", titleClassName, "text-zinc-400")}>
          {title}
        </span>
      </div>
      <div
        className={cn(
          scale === "compact" && "p-2 sm:p-3",
          scale === "default" && "p-3 sm:p-4",
          scale === "large" && cn(demoDiagram.frameBody, "min-h-0 flex-1"),
          scale === "mode" && demoDiagram.frameModeBody,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DivBar({ className }: { className: string }) {
  return <div className={cn("h-1 w-full bg-gradient-to-r", className)} aria-hidden />;
}

export function MiniModeCard({
  modeId,
  compact,
  highlight,
  delayMs = 0,
}: {
  modeId: MedPrepModeId;
  compact?: boolean;
  highlight?: boolean;
  delayMs?: number;
}) {
  const mode = MEDPREP_MODES.find((m) => m.id === modeId)!;
  const t = DEMO_MODE_THEME[modeId];
  const Icon = DEMO_MODE_ICONS[modeId];
  const icons = DEMO_HIGHLIGHT_ICONS[modeId];
  const used = DEMO_CASE_USAGE[modeId];

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border shadow-lg ring-1 ring-white/5",
        t.cardBorder,
        t.cardBg,
        highlight && "ring-2 ring-red-400/60",
        compact ? "min-h-0" : "h-full",
      )}
      style={anim("demo-fade-up", delayMs, "0.65s")}
    >
      <DivBar className={t.topBar} />
      <div className={cn("flex flex-1 flex-col", compact ? "p-3" : "p-4 sm:p-5")}>
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-2 ring-offset-1 ring-offset-zinc-900",
              t.iconWrap,
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-base font-semibold uppercase text-red-200">
            <Play className="h-2.5 w-2.5" />
            Included
          </span>
        </div>
        <h3 className={cn("font-semibold text-white", compact ? "mt-2 text-lg" : "mt-3 text-xl")}>
          {mode.title}
        </h3>
        {!compact && (
          <>
            <p className="mt-1 line-clamp-2 text-lg font-medium leading-snug text-zinc-400">
              {mode.heroHeadline}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {mode.highlights.slice(0, compact ? 1 : 2).map((h, i) => {
                const Hi = icons[i];
                return (
                  <li
                    key={h.title}
                    className={cn("flex gap-2 rounded-lg p-2 ring-1", t.highlightRing)}
                  >
                    <Hi className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", t.highlightIcon)} />
                    <span className="min-w-0">
                      <span className="block text-base font-semibold text-zinc-200">{h.title}</span>
                      <span className="text-base text-zinc-500">{h.subtitle}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <p className="mt-auto pt-2 text-base text-zinc-500">
          Cases this month: <span className="font-semibold text-zinc-300">{used}</span> · Unlimited
        </p>
        <div
          className={cn(
            "mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r py-2 text-base font-semibold text-white",
            t.cta,
          )}
        >
          {mode.ctaLabel}
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </article>
  );
}

export function ModesHubSnapshot({ style }: { style?: CSSProperties }) {
  return (
    <SnapshotFrame title={`AI Simulation · ${APP_DISPLAY_NAME}`} style={style} scale="large">
      <div className={cn("rounded-lg bg-zinc-950 p-4 sm:p-5 lg:p-6", demoDiagram.innerStack)}>
        <div className="mb-3 flex items-end justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Clinical simulation
            </p>
            <h3 className="text-2xl font-semibold text-white sm:text-3xl">{APP_DISPLAY_NAME}</h3>
          </div>
          <span className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-base text-zinc-300 sm:inline-flex">
            <LayoutDashboard className="h-3 w-3" />
            Dashboard
          </span>
        </div>

        <p className="mb-3 text-base font-semibold text-zinc-300">Resume a session</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {DEMO_RESUME_SESSIONS.map((s, i) => {
            const t = DEMO_MODE_THEME[s.badge];
            return (
              <div
                key={s.title}
                className="rounded-lg border border-white/10 bg-white/5 p-2"
                style={anim("demo-fade-in", 400 + i * 120, "0.5s")}
              >
                <p className="truncate text-base font-semibold text-zinc-100">{s.title}</p>
                <span
                  className={cn(
                    "mt-1.5 inline-block rounded-full border px-1.5 py-0.5 text-sm font-bold uppercase",
                    t.resumeBadge,
                  )}
                >
                  {s.mode === "LEARNING" ? "Learning" : s.mode === "SHADOW" ? "Shadow" : "Practice"}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mb-2 text-base font-semibold text-zinc-300">Modes</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {MEDPREP_MODES.map((m, i) => (
            <MiniModeCard key={m.id} modeId={m.id} delayMs={700 + i * 150} />
          ))}
        </div>
      </div>
    </SnapshotFrame>
  );
}

/** Generate New Case / Browse Cases (`case-generation-ui.png`). */
export function CaseGenerationUiScreenshot({
  style,
  className,
}: {
  style?: CSSProperties;
  className?: string;
}) {
  const { width, height } = DEMO_SCREENSHOT_SIZES.caseGeneration;
  return (
    <DemoScreenshot
      src={DEMO_CASE_GENERATION_UI_IMAGE}
      alt={`${APP_DISPLAY_NAME} — dynamic case generation`}
      width={width}
      height={height}
      style={style}
      className={className}
      fit="fill"
    />
  );
}

/** Four simulation mode cards screenshot. */
export function ModesHubUiScreenshot({
  style,
  className,
}: {
  style?: CSSProperties;
  className?: string;
}) {
  const { width, height } = DEMO_SCREENSHOT_SIZES.modesHub;
  return (
    <DemoScreenshot
      src={DEMO_MODES_HUB_UI_IMAGE}
      alt={`${APP_DISPLAY_NAME} — four simulation modes`}
      width={width}
      height={height}
      style={style}
      className={className}
      fit="fill"
    />
  );
}

function ModeSnapshotBody({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "demo-visual-enlarged flex min-h-0 flex-1 flex-col",
        demoDiagram.innerStack,
      )}
    >
      {children}
    </div>
  );
}

export function PracticeModeSnapshot({ style }: { style?: CSSProperties }) {
  return (
    <SnapshotFrame
      title={`${APP_DISPLAY_NAME} · Practice Mode`}
      titleClassName={MODE_SNAPSHOT_FRAME_TITLE}
      style={style}
      scale="large"
      className="h-full"
    >
      <ModeSnapshotBody>
        <PracticeModeUiMock />
      </ModeSnapshotBody>
    </SnapshotFrame>
  );
}

export function LearningModeSnapshot({ style }: { style?: CSSProperties }) {
  return (
    <SnapshotFrame
      title={`${APP_DISPLAY_NAME} · Learning Mode`}
      titleClassName={MODE_SNAPSHOT_FRAME_TITLE}
      style={style}
      scale="large"
      className="h-full"
    >
      <ModeSnapshotBody>
        <LearningModeUiMock />
      </ModeSnapshotBody>
    </SnapshotFrame>
  );
}

export function EvaluationModeSnapshot({ style }: { style?: CSSProperties }) {
  return (
    <SnapshotFrame
      title={`${APP_DISPLAY_NAME} · AI Evaluation Mode`}
      titleClassName={MODE_SNAPSHOT_FRAME_TITLE}
      style={style}
      scale="large"
      className="h-full"
    >
      <ModeSnapshotBody>
        <EvaluationModeUiMock />
      </ModeSnapshotBody>
    </SnapshotFrame>
  );
}

export function ShadowModeSnapshot({ style }: { style?: CSSProperties }) {
  return (
    <SnapshotFrame
      title={`${APP_DISPLAY_NAME} · Shadow Mode`}
      titleClassName={MODE_SNAPSHOT_FRAME_TITLE}
      style={style}
      scale="large"
      className="h-full"
    >
      <ModeSnapshotBody>
        <ShadowModeUiMock />
      </ModeSnapshotBody>
    </SnapshotFrame>
  );
}
