"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { facultyApiService } from "@/app/services/faculty/faculty-api.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, ArrowLeft } from "lucide-react";

export function FacultyStudentDetailPage({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!studentId) return;
    void facultyApiService.getStudent(studentId).then(setData).catch(console.error);
  }, [studentId]);

  const user = data?.user;

  const openMessage = async () => {
    const thread = await facultyApiService.openThreadWithStudent(studentId);
    const id = thread?.thread?.id;
    if (id) router.push(`/faculty/messages?thread=${id}`);
  };

  if (!user) {
    return <p className="text-slate-500">Loading student…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/faculty/students">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button size="sm" onClick={() => void openMessage()}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Message student
        </Button>
      </div>

      <Card className="dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle>
            {user.firstName} {user.lastName}
          </CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg">MedPrep sessions</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 space-y-2 overflow-y-auto">
            {(data?.sessions ?? []).map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10"
              >
                <span className="font-medium">{s.title ?? s.mode}</span>
                <Badge variant="outline">{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Assignment progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.assignmentProgress ?? []).map((p: any) => (
              <div
                key={p.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10"
              >
                <p className="font-medium">{p.assignment?.title}</p>
                <p className="text-slate-500">{p.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="text-lg">Activity</CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 space-y-2 overflow-y-auto">
          {(data?.events ?? []).map((e: any) => (
            <p key={e.id} className="text-sm text-slate-600 dark:text-slate-400">
              {e.summary ?? e.type} · {new Date(e.createdAt).toLocaleString()}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
