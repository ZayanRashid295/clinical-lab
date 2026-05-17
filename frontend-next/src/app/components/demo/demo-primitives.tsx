"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import type { LucideIcon } from "lucide-react";
import { demoTheme } from "./demo-theme";
import { demoType } from "./demo-typography";

/** @deprecated All scenes use the unified dark mesh — kept for API compatibility. */
export type SceneTone = "dark";

export function anim(
  name: string,
  delayMs: number,
  duration = "0.7s",
  fill: "both" | "forwards" = "both",
): CSSProperties {
  return {
    opacity: 0,
    animation: `${name} ${duration} cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms ${fill}`,
  };
}

function UnifiedBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 demo-bg-mesh" aria-hidden />
      <FloatingOrbs />
      <div
        className="demo-ambient-orb pointer-events-none absolute left-1/2 top-[18%] h-[min(65vh,480px)] w-[min(88vw,680px)] -translate-x-1/2 rounded-full bg-red-600/12 blur-[100px]"
        aria-hidden
      />
    </>
  );
}

export function SceneShell({
  children,
  className,
  fullWidth = false,
  bleed = false,
  layout = "center",
  contentAlign = "center",
  /** @deprecated Ignored — unified dark theme */
  tone: _tone = "dark",
}: {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  bleed?: boolean;
  layout?: "center" | "fill" | "dense";
  contentAlign?: "center" | "start";
  tone?: SceneTone;
}) {
  const isDense = layout === "dense";
  const isFill = layout === "fill" || isDense;
  const isCentered = layout === "center";
  const alignStart = (contentAlign === "start" || isDense) && isCentered;

  return (
    <div
      className={cn(
        "demo-scene relative flex h-full min-h-full w-full overflow-hidden text-white",
        demoTheme.shell,
        isCentered && !alignStart && "flex-col items-center justify-center demo-vignette-soft",
        isCentered && alignStart && "flex-col demo-vignette-soft",
        isFill && !isDense && "flex-col",
        isDense && "h-full min-h-0 flex-col demo-vignette-light",
        className,
      )}
    >
      <UnifiedBackdrop />
      <div
        className={cn(
          "relative z-10 w-full",
          isDense &&
            "relative flex h-full min-h-0 w-full max-w-none flex-1 flex-col p-3 sm:p-4 lg:p-5",
          isFill &&
            !isDense &&
            "flex h-full min-h-0 max-w-none flex-1 flex-col p-0",
          isCentered &&
            alignStart &&
            "flex h-full min-h-0 flex-1 flex-col items-stretch justify-start max-w-none p-0",
          isCentered &&
            !alignStart &&
            "flex h-full flex-col items-center justify-center",
          isCentered && !bleed && !alignStart && "px-5 py-8 sm:px-10 sm:py-10",
          isCentered && bleed && "p-0",
          isCentered && !fullWidth && !bleed && !alignStart && "max-w-6xl",
          isCentered && fullWidth && !alignStart && "max-w-[min(96rem,100%)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function FloatingOrbs() {
  const orbs = useMemo(
    () => [
      { className: "left-[5%] top-[8%] h-[28rem] w-[28rem] bg-red-500/10", anim: "demo-orb-drift-a 20s ease-in-out infinite" },
      { className: "right-[0%] top-[15%] h-[24rem] w-[24rem] bg-red-800/10", anim: "demo-orb-drift-b 24s ease-in-out infinite" },
      { className: "bottom-[5%] left-[35%] h-[20rem] w-[20rem] bg-red-700/8", anim: "demo-orb-drift-a 18s ease-in-out infinite reverse" },
    ],
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {orbs.map((o, i) => (
        <div
          key={i}
          className={cn("absolute rounded-full blur-[80px]", o.className)}
          style={{ animation: o.anim }}
        />
      ))}
    </div>
  );
}

export function GlowBurst({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[38%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/25 blur-[90px]"
      style={anim("demo-glow-burst", delayMs, "1.4s")}
      aria-hidden
    />
  );
}

export function SceneTag({
  icon: Icon,
  label,
  delayMs = 0,
  className,
  iconClassName,
  /** @deprecated Always uses unified tag style */
  dark: _dark = true,
}: {
  icon: LucideIcon;
  label: string;
  delayMs?: number;
  className?: string;
  iconClassName?: string;
  dark?: boolean;
}) {
  return (
    <div
      style={anim("demo-fade-up", delayMs)}
      className={cn(
        "mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5",
        demoType.sceneTag,
        demoTheme.tag,
        className,
      )}
    >
      <Icon className={cn("h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]", iconClassName)} />
      {label}
    </div>
  );
}

export function WordReveal({
  text,
  className,
  baseDelay = 400,
  stagger = 100,
  gradientFrom = 0,
  gradientClass = "demo-text-gradient",
}: {
  text: string;
  className?: string;
  baseDelay?: number;
  stagger?: number;
  gradientFrom?: number;
  gradientClass?: string;
}) {
  const words = text.split(" ");
  return (
    <h1
      className={cn(
        demoType.wordReveal,
        "text-center text-white",
        className,
      )}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={cn("inline-block", i >= gradientFrom && gradientClass)}
          style={anim("demo-fade-up", baseDelay + i * stagger, "0.65s")}
        >
          {word}
          {i < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </h1>
  );
}
