"use client";

import { useEffect, useState } from "react";
import { Card } from "@/shared/ui/card";
import { qaAdminService } from "@/app/services/question-review/qa-admin.service";

export function ReviewerInsights() {
  const [rows, setRows] = useState<
    Array<{
      name: string;
      sessions: number;
      questionsReviewed: number;
      issuesSubmitted: number;
      approvalRate: number;
      topCategories: Array<{ name: string; count: number }>;
    }>
  >([]);

  useEffect(() => {
    qaAdminService.getReviewerInsights().then(setRows).catch(() => {});
  }, []);

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground p-8">
        Reviewer analytics will appear after UAT sessions are submitted.
      </p>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {rows.map((r) => (
        <Card key={r.name} className="p-4 border-border/60">
          <h3 className="font-semibold dark:text-slate-100">{r.name}</h3>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div>
              <p className="text-muted-foreground">Sessions</p>
              <p className="font-medium text-lg dark:text-slate-100">{r.sessions}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Questions reviewed</p>
              <p className="font-medium text-lg dark:text-slate-100">
                {r.questionsReviewed}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Issues submitted</p>
              <p className="font-medium text-lg dark:text-slate-100">
                {r.issuesSubmitted}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Approval rate</p>
              <p className="font-medium text-lg dark:text-slate-100">
                {r.approvalRate}%
              </p>
            </div>
          </div>
          {r.topCategories.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">
                Top issue categories
              </p>
              <div className="flex flex-wrap gap-1">
                {r.topCategories.map((c) => (
                  <span
                    key={c.name}
                    className="text-[10px] rounded-full bg-muted px-2 py-0.5 dark:text-slate-300"
                  >
                    {c.name} ({c.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
