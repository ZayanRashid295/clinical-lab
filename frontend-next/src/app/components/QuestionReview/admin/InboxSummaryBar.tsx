"use client";

import { useEffect, useState } from "react";
import { Card } from "@/shared/ui/card";
import { qaAdminService } from "@/app/services/question-review/qa-admin.service";

export function InboxSummaryBar() {
  const [stats, setStats] = useState<{
    openIssues: number;
    criticalIssues: number;
    questionsReviewed: number;
    activeReviewers: number;
  } | null>(null);

  useEffect(() => {
    const load = () => {
      qaAdminService
        .getDashboard()
        .then((d) =>
          setStats({
            openIssues: d.cards.openIssues as number,
            criticalIssues: d.cards.criticalIssues as number,
            questionsReviewed: d.cards.questionsReviewed as number,
            activeReviewers: d.cards.activeReviewers as number,
          })
        )
        .catch(() => {});
    };
    load();
    const interval = window.setInterval(load, 15_000);
    const refreshOnFocus = () => load();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {[
        { label: "Open issues", value: stats.openIssues },
        { label: "Critical", value: stats.criticalIssues },
        { label: "Questions reviewed", value: stats.questionsReviewed },
        { label: "Active reviewers", value: stats.activeReviewers },
      ].map((s) => (
        <Card key={s.label} className="px-3 py-2 border-border/60">
          <p className="text-[10px] uppercase text-muted-foreground">{s.label}</p>
          <p className="text-lg font-semibold dark:text-slate-100">{s.value}</p>
        </Card>
      ))}
    </div>
  );
}
