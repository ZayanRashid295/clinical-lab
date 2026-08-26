"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { qaAdminService, type QaIssueCard } from "@/app/services/question-review/qa-admin.service";
import { IssueCard } from "./IssueCard";
import { InboxSummaryBar } from "./InboxSummaryBar";
import { QA_ISSUE_STATUSES, formatStatus } from "./qa-admin-utils";

export function QAInbox() {
  const router = useRouter();
  const [issues, setIssues] = useState<QaIssueCard[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await qaAdminService.listInbox(filters);
      setIssues(data);
    } catch {
      // Keep the last successful result during a transient refresh failure.
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load(true);
    const interval = window.setInterval(() => void load(), 15_000);
    const refreshOnFocus = () => void load();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [load]);

  const setFilter = (key: string, value: string) => {
    setFilters((f) => {
      const next = { ...f };
      if (!value || value === "all") delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const openQuestion = (questionId: string, issueId: string) => {
    void router.push(
      `/admin/content/question-review/question?questionId=${questionId}&issueId=${issueId}`
    );
  };

  return (
    <div className="space-y-4">
      <InboxSummaryBar />

      <div className="flex flex-wrap gap-2">
        <Select value={filters.sort ?? "newest"} onValueChange={(v) => setFilter("sort", v)}>
          <SelectTrigger className="h-9 w-[140px] text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="critical">Most critical</SelectItem>
            <SelectItem value="updated">Recently updated</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.severity ?? "all"} onValueChange={(v) => setFilter("severity", v)}>
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severity</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="MAJOR">Major</SelectItem>
            <SelectItem value="MINOR">Minor</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status ?? "all"} onValueChange={(v) => setFilter("status", v)}>
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All open</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8">Loading feedback…</p>
      ) : issues.length === 0 ? (
        <p className="text-muted-foreground py-8">
          No feedback yet. Share a UAT link from the UAT Links tab.
        </p>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onOpen={() => openQuestion(issue.questionId, issue.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
