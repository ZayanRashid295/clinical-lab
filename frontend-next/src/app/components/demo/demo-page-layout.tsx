"use client";

import { type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { SceneShell } from "./demo-primitives";

/** Fills the slide viewport — minimal padding, no centered void. */
export function DemoPageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <SceneShell layout="dense" fullWidth bleed className={className}>
      <div className="demo-page-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">{children}</div>
    </SceneShell>
  );
}

/** Copy column + visual column — uses full slide height on desktop. */
export function SplitCopyVisualSlide({
  header,
  visual,
  copySide = "left",
}: {
  header: ReactNode;
  visual: ReactNode;
  copySide?: "left" | "right";
}) {
  return (
    <DemoPageFrame>
      <div
        className={cn(
          "grid h-full min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(16rem,31%)_1fr] lg:gap-5",
          copySide === "right" && "lg:grid-cols-[1fr_minmax(16rem,31%)]",
        )}
      >
        <aside
          className={cn(
            "flex min-h-0 flex-col justify-center gap-0.5 overflow-y-auto py-1 lg:py-2",
            copySide === "right" && "lg:col-start-2",
          )}
        >
          {header}
        </aside>
        <div
          className={cn(
            "demo-visual-panel flex min-h-[min(46vh,420px)] min-w-0 flex-1 flex-col lg:min-h-0",
            copySide === "right" && "lg:col-start-1 lg:row-start-1",
          )}
        >
          <div className="flex min-h-0 flex-1 items-stretch justify-stretch">{visual}</div>
        </div>
      </div>
    </DemoPageFrame>
  );
}

/** Top headline band + flex-growing body (cards, metrics, modules). */
export function DenseSceneLayout({
  header,
  body,
  headerAlign = "center",
}: {
  header: ReactNode;
  body: ReactNode;
  headerAlign?: "center" | "left";
}) {
  return (
    <DemoPageFrame>
      <div
        className={cn(
          "flex h-full min-h-0 flex-1 flex-col gap-4 sm:gap-5",
          headerAlign === "center" ? "items-center" : "items-stretch",
        )}
      >
        <header
          className={cn(
            "w-full shrink-0 space-y-2 sm:space-y-3",
            headerAlign === "center" ? "max-w-4xl text-center" : "max-w-3xl text-left",
          )}
        >
          {header}
        </header>
        <div className="flex min-h-0 w-full flex-1 flex-col">{body}</div>
      </div>
    </DemoPageFrame>
  );
}
