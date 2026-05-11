"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import {
  ClipboardList,
  Timer,
  Play,
  History,
  Trophy,
  Loader2,
  ListChecks,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  mockExamsService,
  type MockExam,
  type MockExamAttempt,
} from "@/app/services/launch";
import { useToast } from "@/shared/ui/use-toast";
import { toastApiError } from "@/app/services/base/api-http-error";

const DIFF_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
  mixed: "bg-indigo-100 text-indigo-700",
};

export default function MockExamsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<"available" | "history">("available");
  const [exams, setExams] = useState<MockExam[]>([]);
  const [attempts, setAttempts] = useState<MockExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [e, a] = await Promise.all([
        mockExamsService.list(),
        mockExamsService.myAttempts(),
      ]);
      setExams(Array.isArray(e) ? e : []);
      setAttempts(Array.isArray(a) ? a : []);
    } catch {
      setExams([]);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onStart = async (exam: MockExam) => {
    setStarting(exam.id);
    try {
      const { questionPaperId } = await mockExamsService.start(exam.id);
      router.push(
        `/question-generator/student?questionPaperId=${questionPaperId}&mode=tutor&tutor=true&limit=${exam.totalQuestions}`
      );
    } catch (e) {
      toastApiError(toast, e, "Couldn’t start exam");
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="text-rose-600" /> Mock Exams
          </h1>
          <p className="text-muted-foreground mt-1">
            Take full-length, timed practice exams and track your performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={tab === "available" ? "default" : "outline"}
            onClick={() => setTab("available")}
          >
            Available
          </Button>
          <Button
            variant={tab === "history" ? "default" : "outline"}
            onClick={() => setTab("history")}
            className="gap-2"
          >
            <History className="h-4 w-4" /> My history
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : tab === "available" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-12 text-center text-muted-foreground">
                <ClipboardList className="mx-auto mb-3 text-gray-300" size={42} />
                <p className="font-medium">No mock exams available right now.</p>
                <p className="text-xs">
                  Your educators will publish exams here soon.
                </p>
              </CardContent>
            </Card>
          ) : (
            exams.map((e) => (
              <Card
                key={e.id}
                className="hover:shadow-md transition-shadow flex flex-col"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {e.title}
                    </CardTitle>
                    <Badge
                      className={
                        DIFF_COLORS[e.difficulty?.toLowerCase()] ?? ""
                      }
                    >
                      {e.difficulty}
                    </Badge>
                  </div>
                  {e.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                      {e.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <ListChecks className="h-4 w-4 text-emerald-600" />
                      <span>{e.totalQuestions} Qs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Timer className="h-4 w-4 text-rose-600" />
                      <span>{e.durationMinutes} min</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => onStart(e)}
                    disabled={starting === e.id}
                    className="gap-2"
                  >
                    {starting === e.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Start exam
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <History className="mx-auto mb-3 text-gray-300" size={42} />
                <p className="font-medium">No attempts yet.</p>
                <p className="text-xs">Start your first mock exam to see results.</p>
              </CardContent>
            </Card>
          ) : (
            attempts.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {a.mockExam?.title ?? "Mock exam"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.startedAt).toLocaleString()}
                    </p>
                    <Progress value={a.scorePercent} className="h-1.5 mt-2 max-w-md" />
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="font-bold text-lg">
                        {a.scorePercent.toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Correct</p>
                      <p className="font-bold text-lg flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        {a.correctAnswers}/{a.totalQuestions}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-bold text-lg flex items-center gap-1">
                        <Clock className="h-4 w-4 text-rose-600" />
                        {Math.floor(a.timeSpentSeconds / 60)}m
                      </p>
                    </div>
                    <Badge
                      className={
                        a.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : a.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                      }
                    >
                      {a.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
