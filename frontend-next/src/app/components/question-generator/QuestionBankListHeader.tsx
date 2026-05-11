"use client";

import { Filter } from "lucide-react";
import { Button } from "@/shared/ui/button";

export interface QuestionBankStatCard {
  id: string;
  title: string;
  value: string;
  /** Optional secondary line under the stat. */
  hint?: string;
}

export interface QuestionBankListHeaderProps {
  title: string;
  subtitle: string;
  statCards: QuestionBankStatCard[];
  /** Distinct system names from the loaded bank (excluding empty). */
  systems: string[];
  systemFilter: "all" | string;
  onSystemChange: (next: "all" | string) => void;
  allLabel: string;
  presentationLabel: string;
  onPresentationClick?: () => void;
}

export function QuestionBankListHeader({
  title,
  subtitle,
  statCards,
  systems,
  systemFilter,
  onSystemChange,
  allLabel,
  presentationLabel,
  onPresentationClick,
}: QuestionBankListHeaderProps) {
  return (
    <div className="space-y-5 mb-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground dark:text-gray-50">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground dark:text-emerald-200/70 mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div
            key={card.id}
            className="rounded-xl border border-border/80 dark:border-emerald-900/60 bg-card dark:bg-emerald-950/40 px-4 py-3 shadow-sm"
          >
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground dark:text-emerald-300/80 uppercase">
              {card.title}
            </p>
            <p className="text-2xl font-bold text-foreground dark:text-white mt-1 tabular-nums">
              {card.value}
            </p>
            {card.hint ? (
              <p className="text-xs text-muted-foreground dark:text-emerald-400/90 mt-0.5 truncate">
                {card.hint}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => onSystemChange("all")}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              systemFilter === "all"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-50 dark:border-emerald-500"
                : "border-border bg-background text-muted-foreground hover:border-emerald-500/50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200/80"
            }`}
          >
            {allLabel}
          </button>
          {systems.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onSystemChange(name)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors max-w-[200px] truncate ${
                systemFilter === name
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-50 dark:border-emerald-500"
                  : "border-border bg-background text-muted-foreground hover:border-emerald-500/50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200/80"
              }`}
              title={name}
            >
              {name}
            </button>
          ))}
        </div>
        {onPresentationClick ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPresentationClick}
            className="shrink-0 gap-2 border-dashed dark:border-emerald-800 dark:text-emerald-200"
          >
            <Filter className="h-4 w-4" aria-hidden />
            {presentationLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
