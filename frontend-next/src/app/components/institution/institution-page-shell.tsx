"use client";

import { cn } from "@/shared/utils/cn";

/** Fills MenuSystem main area (negates layout `p-3`, edge-to-edge). Always dark. */
export const INSTITUTION_PAGE_OUTER = cn(
  "dark -m-3 flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden",
  "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950",
  "text-slate-100",
);

/** Summary chip in page header — readable on dark backgrounds (no light `primary-50` bleed). */
export function InstitutionStatBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        "border-primary-600/50 bg-primary-900/90 text-primary-50",
        "dark:border-primary-400/55 dark:bg-primary-950/95 dark:text-primary-100",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Sidebar thread row — active state stays dark (no `primary-50` wash). */
export function threadListItemClass(active: boolean): string {
  return cn(
    "w-full border-b px-4 py-3.5 text-left text-sm transition-colors",
    "border-white/5",
    active
      ? "border-l-[3px] border-l-primary-400 bg-slate-800/95 pl-[13px]"
      : cn(
          "border-l-[3px] border-l-transparent pl-[13px]",
          "hover:bg-slate-800/55",
        ),
  );
}

export function threadListTitleClass(active: boolean): string {
  return cn(
    "font-medium",
    active ? "text-slate-50" : "text-slate-100",
  );
}

export function threadListPreviewClass(active: boolean): string {
  return cn(
    "line-clamp-2 text-xs",
    active ? "text-slate-300" : "text-slate-400",
  );
}

export function assignmentProgressBadgeClass(status: string): string {
  const s = String(status ?? "").toUpperCase();
  const base =
    "inline-flex shrink-0 items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold capitalize";
  switch (s) {
    case "IN_PROGRESS":
      return cn(
        base,
        "border-amber-600/50 bg-amber-950/90 text-amber-50",
        "dark:border-amber-400/45 dark:bg-amber-950 dark:text-amber-100",
      );
    case "SUBMITTED":
      return cn(
        base,
        "border-sky-600/50 bg-sky-950/90 text-sky-50",
        "dark:border-sky-400/45 dark:bg-sky-950 dark:text-sky-100",
      );
    case "GRADED":
      return cn(
        base,
        "border-violet-600/50 bg-violet-950/90 text-violet-50",
        "dark:border-violet-400/45 dark:bg-violet-950 dark:text-violet-100",
      );
    case "LATE":
      return cn(
        base,
        "border-rose-600/50 bg-rose-950/90 text-rose-50",
        "dark:border-rose-400/45 dark:bg-rose-950 dark:text-rose-100",
      );
    default:
      return cn(
        base,
        "border-slate-600/50 bg-slate-800/90 text-slate-100",
        "dark:border-slate-500/45 dark:bg-slate-900 dark:text-slate-200",
      );
  }
}

export function InstitutionPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-5 backdrop-blur-md sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
            Institution
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
