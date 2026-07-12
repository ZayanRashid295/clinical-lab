"use client";

import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { MessageSquare, User } from "lucide-react";
import type { QaIssueCard } from "@/app/services/question-review/qa-admin.service";
import {
  formatDate,
  formatStatus,
  severityStyles,
  statusStyles,
} from "./qa-admin-utils";

type Props = {
  issue: QaIssueCard;
  onOpen: () => void;
  selected?: boolean;
};

export function IssueCard({ issue, onOpen, selected }: Props) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={`p-4 cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm ${
        selected ? "border-primary ring-1 ring-primary/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              Q#{issue.questionId.slice(-6)}
            </span>
            {issue.system && (
              <Badge variant="outline" className="text-[10px]">
                {issue.system}
              </Badge>
            )}
            {issue.topic && (
              <Badge variant="outline" className="text-[10px]">
                {issue.topic}
              </Badge>
            )}
          </div>
          <h3 className="font-medium text-sm line-clamp-1 dark:text-slate-100">
            {issue.questionTitle || issue.title}
          </h3>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1 line-clamp-2">
            {issue.body}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${severityStyles(issue.severity)}`}
          >
            {issue.severity}
          </span>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles(issue.status)}`}
          >
            {formatStatus(issue.status)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <User className="h-3 w-3" />
          {issue.reporterCount > 1
            ? `${issue.reporters[0]} +${issue.reporterCount - 1}`
            : issue.reporters[0] ?? "Reviewer"}
        </span>
        {issue.category && <span>{issue.category}</span>}
        <span>{issue.section}</span>
        <span>{formatDate(issue.createdAt)}</span>
        {issue.assignedTo && <span>→ {issue.assignedTo.name}</span>}
        {issue.replyCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-primary">
            <MessageSquare className="h-3 w-3" />
            {issue.replyCount}
          </span>
        )}
      </div>
    </Card>
  );
}
