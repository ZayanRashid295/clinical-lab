"use client";

import { type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { SceneShell } from "./demo-primitives";

/** Copy on top + visual below, centered as one block (not pinned to top). */
export function StackedCopyVisualSlide({
  header,
  visual,
  visualClassName,
  maxWidth = "96rem",
}: {
  header: ReactNode;
  visual: ReactNode;
  visualClassName?: string;
  maxWidth?: "96rem" | "100rem";
}) {
  const maxW =
    maxWidth === "100rem" ? "max-w-[min(100%,100rem)]" : "max-w-[min(100%,96rem)]";

  return (
    <SceneShell fullWidth>
      <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden px-2 py-4 pb-8 sm:px-6 sm:py-6 lg:py-7">
        <div className={cn("flex w-full flex-col items-center gap-3 sm:gap-4", maxW)}>
          {header}
          <div className={cn("w-full min-h-0 shrink-0", visualClassName)}>{visual}</div>
        </div>
      </div>
    </SceneShell>
  );
}
