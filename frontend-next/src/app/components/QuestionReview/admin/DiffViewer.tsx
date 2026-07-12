"use client";

import { diffLines } from "./qa-admin-utils";

type Props = {
  before: string;
  after: string;
  className?: string;
};

export function DiffViewer({ before, after, className }: Props) {
  const lines = diffLines(before, after);
  if (!before && !after) {
    return (
      <p className="text-sm text-muted-foreground dark:text-slate-400">
        No changes to compare.
      </p>
    );
  }

  return (
    <div
      className={`rounded-lg border border-border/60 overflow-hidden font-mono text-xs ${className ?? ""}`}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={
            line.type === "add"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 px-3 py-1"
              : line.type === "remove"
                ? "bg-red-500/10 text-red-800 dark:text-red-200 px-3 py-1 line-through"
                : "px-3 py-1 text-muted-foreground dark:text-slate-400"
          }
        >
          <span className="select-none opacity-50 mr-2">
            {line.type === "add" ? "+" : line.type === "remove" ? "−" : " "}
          </span>
          {line.text || " "}
        </div>
      ))}
    </div>
  );
}
