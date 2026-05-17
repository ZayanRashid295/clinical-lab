"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { studentInstitutionApiService } from "@/app/services/faculty/student-institution-api.service";

type InstContext =
  | { linked: false }
  | {
      linked: true;
      institution: { id: string; name: string };
      primaryFaculty: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      } | null;
    };

export function DashboardInstitutionPanel() {
  const [ctx, setCtx] = useState<InstContext | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [c, a, t] = await Promise.all([
          studentInstitutionApiService.getContext(),
          studentInstitutionApiService.listAssignments(),
          studentInstitutionApiService.listMessageThreads(),
        ]);
        setCtx(c);
        setAssignments(Array.isArray(a) ? a : []);
        setThreads(Array.isArray(t) ? t : []);
      } catch {
        setCtx({ linked: false });
      }
    })();
  }, []);

  if (!ctx?.linked) return null;

  const openAssignments = assignments.filter(
    (p) => p.status !== "SUBMITTED" && p.status !== "GRADED",
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-600 dark:bg-sky-950/50 dark:text-sky-100"
        >
          <Building2 className="mr-1 h-3 w-3" />
          {ctx.institution.name}
        </Badge>
        {ctx.primaryFaculty && (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Faculty contact: Dr. {ctx.primaryFaculty.firstName}{" "}
            {ctx.primaryFaculty.lastName}
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200/80 dark:border-white/10 dark:bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary-600" />
              Faculty assignments
            </CardTitle>
            <CardDescription>
              {openAssignments.length} open · {assignments.length} total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {openAssignments.slice(0, 3).map((p: any) => (
              <div
                key={p.id}
                className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-slate-900/50"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {p.assignment?.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Due{" "}
                  {p.assignment?.dueAt
                    ? new Date(p.assignment.dueAt).toLocaleDateString()
                    : "—"}{" "}
                  · {p.status}
                </p>
              </div>
            ))}
            {openAssignments.length === 0 && (
              <p className="text-sm text-slate-500">No open assignments.</p>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/assignments">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-white/10 dark:bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary-600" />
              Messages from faculty
            </CardTitle>
            <CardDescription>
              {threads.length} conversation{threads.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {threads.slice(0, 2).map((t: any) => (
              <div
                key={t.id}
                className="rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t.faculty?.firstName} {t.faculty?.lastName}
                </p>
                <p className="line-clamp-1 text-xs text-slate-500">
                  {t.lastMessage?.content ?? "No messages yet"}
                </p>
              </div>
            ))}
            <Button variant="outline" size="sm" asChild>
              <Link href="/messages">
                Open messages <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            {ctx.primaryFaculty && (
              <Button size="sm" className="w-full" asChild>
                <Link href={`/messages?facultyId=${ctx.primaryFaculty.id}`}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Message your faculty contact
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
