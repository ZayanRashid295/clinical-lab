"use client";

import { AssignmentPanel } from "./AssignmentPanel";
import { CommentThread } from "./CommentThread";
import { severityStyles } from "./qa-admin-utils";

type Issue = {
  id: string;
  title: string;
  body: string;
  section: string;
  targetKey: string;
  severity: string;
  status: string;
  selectedText?: string | null;
  assignedToId?: string | null;
  reporterNames?: string[];
  comments?: Array<{
    id: string;
    authorName: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
  }>;
};

type Props = {
  issues: Issue[];
  activeIssueId: string | null;
  assignees: Array<{ id: string; name: string }>;
  onSelectIssue: (id: string) => void;
  onUpdateIssue: (id: string, patch: Record<string, unknown>) => Promise<void>;
  onReply: (issueId: string, body: string, isInternal: boolean) => Promise<void>;
};

export function DiscussionSidebar({
  issues,
  activeIssueId,
  assignees,
  onSelectIssue,
  onUpdateIssue,
  onReply,
}: Props) {
  const active = issues.find((i) => i.id === activeIssueId) ?? issues[0];

  if (!active) return null;

  return (
    <aside className="w-full lg:w-[340px] shrink-0 rounded-xl border border-border/60 bg-card flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)]">
      <div className="p-3 border-b border-border/60 space-y-2">
        <p className="text-sm font-semibold dark:text-slate-100">Feedback</p>
        {issues.length > 1 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {issues.map((issue, idx) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => onSelectIssue(issue.id)}
                className={`shrink-0 rounded-md px-2 py-1 text-[11px] border ${
                  issue.id === active.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground"
                }`}
              >
                #{idx + 1}
              </button>
            ))}
          </div>
        )}
        <span
          className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${severityStyles(active.severity)}`}
        >
          {active.severity}
        </span>
        <p className="text-xs text-muted-foreground">{active.section}</p>
        <AssignmentPanel
          status={active.status}
          assignedToId={active.assignedToId ?? null}
          assignees={assignees}
          saving={false}
          onStatusChange={(status) => onUpdateIssue(active.id, { status })}
          onAssign={(assignedToId) => onUpdateIssue(active.id, { assignedToId })}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        <CommentThread
          issueTitle={active.title}
          issueBody={active.body}
          selectedText={active.selectedText}
          comments={active.comments ?? []}
          onReply={(body, isInternal) => onReply(active.id, body, isInternal)}
        />
      </div>
    </aside>
  );
}
