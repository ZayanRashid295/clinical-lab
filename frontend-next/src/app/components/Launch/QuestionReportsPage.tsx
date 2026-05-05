"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Textarea } from "@/shared/ui/textarea";
import {
  Flag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock3,
  XCircle,
  ShieldQuestion,
  ShieldCheck,
} from "lucide-react";
import {
  questionReportsService,
  onNotification,
  type QuestionReport,
  type QuestionReportStatus,
} from "@/app/services/launch";
import { authService } from "@/shared";

const STATUSES: QuestionReportStatus[] = [
  "OPEN",
  "TRIAGED",
  "ACCEPTED",
  "REJECTED",
  "RESOLVED",
];

const STATUS: Record<
  QuestionReportStatus,
  { color: string; Icon: any; label: string }
> = {
  OPEN: { color: "bg-blue-100 text-blue-700", Icon: AlertCircle, label: "Open" },
  TRIAGED: {
    color: "bg-amber-100 text-amber-700",
    Icon: Clock3,
    label: "Triaged",
  },
  ACCEPTED: {
    color: "bg-emerald-100 text-emerald-700",
    Icon: CheckCircle2,
    label: "Accepted",
  },
  REJECTED: {
    color: "bg-rose-100 text-rose-700",
    Icon: XCircle,
    label: "Rejected",
  },
  RESOLVED: {
    color: "bg-emerald-100 text-emerald-700",
    Icon: CheckCircle2,
    label: "Resolved",
  },
};

function normalizeRoles(user: any): string[] {
  const raw = user?.roles ?? [];
  return raw
    .map((r: any) =>
      typeof r === "string"
        ? r.toUpperCase()
        : String(r?.name || r?.role?.name || "").toUpperCase()
    )
    .filter(Boolean);
}

export default function QuestionReportsPage() {
  const [isStaff, setIsStaff] = useState(false);
  const [items, setItems] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<QuestionReportStatus | "ALL">(
    "ALL"
  );

  useEffect(() => {
    try {
      const u = authService.getCurrentUser?.();
      const roles = normalizeRoles(u);
      setIsStaff(roles.some((r) => ["SUPERADMIN", "ADMIN"].includes(r)));
    } catch {
      setIsStaff(false);
    }
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const list = isStaff
        ? await questionReportsService.listAll(
            statusFilter === "ALL" ? {} : { status: statusFilter }
          )
        : await questionReportsService.listMine();
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isStaff, statusFilter]);

  // Live refresh on report-related notifications
  useEffect(() => {
    return onNotification((n) => {
      if (n.type === "QUESTION_REPORT_UPDATE") load();
    });
  }, [isStaff, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length };
    for (const r of items) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [items]);

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {isStaff ? (
            <ShieldCheck className="text-emerald-600" />
          ) : (
            <Flag className="text-rose-600" />
          )}
          {isStaff ? "Reports Triage" : "My Question Reports"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isStaff
            ? "Review and resolve question reports submitted by students."
            : "Track the status of questions you've flagged for review."}
        </p>
      </div>

      {!isStaff && (
        <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-900/10">
          <CardContent className="p-4 flex items-start gap-3 text-sm">
            <ShieldQuestion className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-200">
                Spotted an issue with a question?
              </p>
              <p className="text-blue-800/80 dark:text-blue-200/80 mt-0.5">
                Click the flag icon next to any question in the question bank or
                test session to report it. Our content team reviews every
                report.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isStaff && (
        <div className="flex flex-wrap gap-1.5">
          {(["ALL", ...STATUSES] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s as any)}
              className="gap-1"
            >
              {s}
              {counts[s] !== undefined && (
                <span className="ml-1 text-xs opacity-70">({counts[s]})</span>
              )}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Flag className="mx-auto mb-3 text-gray-300" size={42} />
            <p className="font-medium">
              {isStaff
                ? "No reports to triage."
                : "You haven't reported any questions yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              isStaff={isStaff}
              onUpdated={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportRow({
  report,
  isStaff,
  onUpdated,
}: {
  report: QuestionReport;
  isStaff: boolean;
  onUpdated: () => void;
}) {
  const meta = STATUS[report.status];
  const [editing, setEditing] = useState(false);
  const [resolution, setResolution] = useState(report.resolution ?? "");
  const [saving, setSaving] = useState<QuestionReportStatus | null>(null);

  const setStatus = async (status: QuestionReportStatus) => {
    setSaving(status);
    try {
      await questionReportsService.update(report.id, {
        status,
        resolution: resolution || undefined,
      });
      setEditing(false);
      onUpdated();
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={meta.color + " gap-1"}>
              <meta.Icon className="h-3 w-3" />
              {meta.label}
            </Badge>
            <Badge variant="outline">{report.reason.replace("_", " ")}</Badge>
            <span className="text-xs text-muted-foreground font-mono truncate">
              Q: {report.questionId.slice(0, 12)}…
            </span>
            {isStaff && (
              <span className="text-xs text-muted-foreground font-mono truncate">
                Reporter: {report.reporterId.slice(0, 8)}…
              </span>
            )}
          </div>
          {report.details && (
            <p className="text-sm mt-2 line-clamp-3">{report.details}</p>
          )}
          {report.resolution && !editing && (
            <div className="mt-2 p-2 rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-sm">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Resolution
              </p>
              <p className="text-emerald-900 dark:text-emerald-100 mt-0.5">
                {report.resolution}
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Reported {new Date(report.createdAt).toLocaleString()}
            {report.resolvedAt &&
              ` • Resolved ${new Date(report.resolvedAt).toLocaleString()}`}
          </p>

          {isStaff && (
            <div className="mt-3 space-y-2">
              {editing ? (
                <Textarea
                  rows={2}
                  placeholder="Resolution note (optional)…"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  Add resolution note
                </Button>
              )}
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.filter((s) => s !== report.status).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    disabled={saving !== null}
                    onClick={() => setStatus(s)}
                  >
                    {saving === s && (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    )}
                    Mark {s.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
