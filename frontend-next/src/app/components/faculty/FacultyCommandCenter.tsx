"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { facultyApiService } from "@/app/services/faculty/faculty-api.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, ClipboardList, MessageSquare, Stethoscope } from "lucide-react";

export function FacultyCommandCenter() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    void facultyApiService.getDashboard().then(setData).catch(console.error);
  }, []);

  const stats = data?.stats ?? {};

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Students", value: stats.totalStudents ?? 0, icon: Users },
          { label: "Active (7d)", value: stats.activeStudents7d ?? 0, icon: Activity },
          { label: "Cases done (7d)", value: stats.medprepCompleted7d ?? 0, icon: Stethoscope },
          { label: "Open assignments", value: stats.openAssignments ?? 0, icon: ClipboardList },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="dark:border-white/10 dark:bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-primary-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle>Recent student activity</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 space-y-2 overflow-y-auto">
            {(data?.recentActivity ?? []).map((e: any) => (
              <div
                key={e.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {e.user?.firstName} {e.user?.lastName}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {e.summary ?? e.type} · {new Date(e.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/faculty/assignments">Create assignment</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/faculty/cases">Publish a case</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/faculty/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Message students
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/faculty/students">View roster</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
