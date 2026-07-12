"use client";

import { useEffect, useState } from "react";
import { Card } from "@/shared/ui/card";
import { qaAdminService } from "@/app/services/question-review/qa-admin.service";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileQuestion,
  Star,
  Users,
} from "lucide-react";

function MetricCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <Card className="p-4 border-border/60 bg-card/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold mt-1 dark:text-slate-100">{value}</p>
          {hint && (
            <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
          )}
        </div>
        <Icon className="h-5 w-5 text-primary/70" />
      </div>
    </Card>
  );
}

function BarChart({
  title,
  items,
}: {
  title: string;
  items: Array<{ name: string; count: number }>;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <Card className="p-4 border-border/60">
      <h3 className="text-sm font-semibold mb-3 dark:text-slate-100">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">No data yet</p>
        )}
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="truncate dark:text-slate-200">{item.name}</span>
              <span className="text-muted-foreground">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded-full"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    qaAdminService
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Card className="p-4 text-destructive text-sm border-destructive/30">
        {error}
      </Card>
    );
  }

  if (!data) {
    return <div className="text-muted-foreground p-8">Loading dashboard…</div>;
  }

  const c = data.cards;

  return (
    <div className="space-y-6">
      {data.insights?.length > 0 && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <h3 className="text-sm font-semibold flex items-center gap-2 dark:text-slate-100">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Actionable insights
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground dark:text-slate-300">
            {data.insights.map((line: string, i: number) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard title="Total Questions" value={c.totalQuestions} icon={FileQuestion} />
        <MetricCard title="Reviewed" value={c.questionsReviewed} icon={CheckCircle2} />
        <MetricCard title="Pending Reviews" value={c.pendingReviews} icon={Clock} />
        <MetricCard title="Open Issues" value={c.openIssues} icon={AlertTriangle} />
        <MetricCard title="Critical Issues" value={c.criticalIssues} icon={AlertTriangle} />
        <MetricCard title="Resolved" value={c.resolvedIssues} icon={CheckCircle2} />
        <MetricCard title="Approved" value={c.questionsApproved} icon={CheckCircle2} />
        <MetricCard title="Needs Revision" value={c.questionsRequiringRevision} icon={BarChart3} />
        <MetricCard title="Active Reviewers" value={c.activeReviewers} icon={Users} />
        <MetricCard
          title="Avg Rating"
          value={c.averageQuestionRating ?? "—"}
          icon={Star}
        />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <BarChart
          title="Most reported systems"
          items={data.charts.mostReportedSystems ?? []}
        />
        <BarChart
          title="Most reported topics"
          items={data.charts.mostReportedTopics ?? []}
        />
        <BarChart
          title="Issue categories"
          items={data.charts.issueCategories ?? []}
        />
        <BarChart
          title="Severity distribution"
          items={data.charts.severityDistribution ?? []}
        />
        <BarChart
          title="Reviewer activity"
          items={data.charts.reviewerActivity ?? []}
        />
        <Card className="p-4 border-border/60">
          <h3 className="text-sm font-semibold mb-2 dark:text-slate-100">
            Avg resolution time
          </h3>
          <p className="text-3xl font-bold dark:text-slate-100">
            {data.charts.averageResolutionHours != null
              ? `${data.charts.averageResolutionHours}h`
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Time from issue creation to resolution
          </p>
        </Card>
      </div>
    </div>
  );
}
