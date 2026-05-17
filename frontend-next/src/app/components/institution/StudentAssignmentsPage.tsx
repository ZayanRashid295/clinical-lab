"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { studentInstitutionApiService } from "@/app/services/faculty/student-institution-api.service";
import { medprepRouteForAssignmentItem } from "@/lib/fyp/institution-case";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, ClipboardList, Loader2 } from "lucide-react";
import {
  INSTITUTION_PAGE_OUTER,
  InstitutionPageHeader,
  InstitutionStatBadge,
  assignmentProgressBadgeClass,
} from "@/app/components/institution/institution-page-shell";
import { cn } from "@/shared/utils/cn";
import { APP_GLASS_CARD } from "@/app/config/app-shell";

export function StudentAssignmentsPage() {
  const [ctx, setCtx] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [c, a] = await Promise.all([
          studentInstitutionApiService.getContext(),
          studentInstitutionApiService.listAssignments(),
        ]);
        setCtx(c);
        setAssignments(Array.isArray(a) ? a : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className={INSTITUTION_PAGE_OUTER}>
        <InstitutionPageHeader title="Faculty assignments" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (ctx && !ctx.linked) {
    return (
      <div className={INSTITUTION_PAGE_OUTER}>
        <InstitutionPageHeader title="Faculty assignments" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-slate-600 dark:text-slate-400">
          <Building2 className="mb-4 h-12 w-12 opacity-40" />
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Not linked to an institution
          </p>
          <p className="mt-2 max-w-md text-sm">
            Sign up with your school email to receive faculty assignments.
          </p>
        </div>
      </div>
    );
  }

  const openCount = assignments.filter(
    (p) => p.status !== "SUBMITTED" && p.status !== "GRADED",
  ).length;

  return (
    <div className={INSTITUTION_PAGE_OUTER}>
      <InstitutionPageHeader
        title="Faculty assignments"
        subtitle={ctx?.institution?.name}
        actions={
          <InstitutionStatBadge>
            <ClipboardList className="h-3.5 w-3.5 opacity-90" />
            {openCount} open · {assignments.length} total
          </InstitutionStatBadge>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {assignments.map((p) => (
            <Card
              key={p.id}
              className={cn(APP_GLASS_CARD, "overflow-hidden")}
            >
              <CardHeader className="border-b border-slate-200/60 bg-white/50 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">
                      {p.assignment?.title}
                    </CardTitle>
                    <CardDescription className="mt-1 max-w-3xl">
                      {p.assignment?.instructions ??
                        "Complete the assigned activities."}
                    </CardDescription>
                  </div>
                  <span className={assignmentProgressBadgeClass(p.status)}>
                    {p.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
                {p.assignment?.dueAt && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Due {new Date(p.assignment.dueAt).toLocaleString()}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                {(p.assignment?.items ?? []).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-slate-900/40"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {item.institutionCase?.title ??
                          item.institutionQuestionSet?.title ??
                          item.itemType}
                      </p>
                      {item.medprepMode && (
                        <p className="text-xs text-slate-500">
                          {item.medprepMode}
                        </p>
                      )}
                    </div>
                    {item.institutionCaseId && p.assignment?.id ? (
                      <Button size="sm" asChild>
                        <Link
                          href={medprepRouteForAssignmentItem(
                            item.medprepMode,
                            item.institutionCaseId,
                            p.assignment.id,
                          )}
                        >
                          Start case
                        </Link>
                      </Button>
                    ) : item.institutionQuestionSetId ? (
                      <span className="text-xs text-slate-500">
                        MCQ set — review with faculty
                      </span>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {assignments.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20 dark:border-white/20 dark:bg-white/[0.02]">
              <ClipboardList className="mb-3 h-10 w-10 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">
                No assignments yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
