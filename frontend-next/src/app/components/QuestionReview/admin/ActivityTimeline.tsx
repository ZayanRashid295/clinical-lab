"use client";

import { formatDate } from "./qa-admin-utils";

type Activity = {
  id: string;
  actorName: string;
  action: string;
  createdAt: string;
  meta?: Record<string, unknown> | null;
};

const ACTION_LABELS: Record<string, string> = {
  issue_created: "Issue created",
  issue_report_merged: "Duplicate report merged",
  issue_updated: "Issue updated",
  discussion_reply: "Discussion reply",
  internal_note_added: "Internal note added",
  draft_saved: "Draft saved",
  qa_decision: "QA decision recorded",
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return (
      <p className="text-sm text-muted-foreground dark:text-slate-400">
        No activity yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border/60 ml-2 space-y-4">
      {activities.map((item) => (
        <li key={item.id} className="ml-4">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
          <p className="text-sm font-medium text-foreground dark:text-slate-100">
            {ACTION_LABELS[item.action] ?? item.action}
          </p>
          <p className="text-xs text-muted-foreground dark:text-slate-400">
            {item.actorName} · {formatDate(item.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}
