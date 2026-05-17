"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { learningService, type LearningSession } from "@/lib/fyp/learning-service";
import { trimMedprepConversationIdQuery } from "@/lib/fyp/medprep-session-merge";
import { resolveMedicalCase } from "@/lib/fyp/institution-case";
import { CaseValidationService } from "@/lib/fyp/case-validation";
import { LearningInterface } from "@/app/components/medprep-ai/fyp/learning-interface";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { authService } from "@/shared/services/auth.service";
import { getClinicalUserId } from "@/lib/fyp/medprep-user";
import { MedPrepSlugGate } from "@/app/components/medprep-ai/MedPrepSlugGate";
import { cn } from "@/shared/utils/cn";
import { APP_PAGE_SHELL } from "@/app/config/app-shell";

function caseIdFromPathname(pathname: string): string | null {
  const m = pathname.match(/^\/medprep-ai\/learn\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function LearningCaseRoutePage() {
  return (
    <MedPrepSlugGate slug="qa" modeLabel="Learning Mode">
      <LearningCaseRoutePageInner />
    </MedPrepSlugGate>
  );
}

function LearningCaseRoutePageInner() {
  const router = useRouter();
  const pathname = useMemo(
    () => (router.asPath || "").split("?")[0] || "",
    [router.asPath]
  );
  const caseId = caseIdFromPathname(pathname) || "";

  const conversationIdFromQuery = useMemo(() => {
    const id = trimMedprepConversationIdQuery(router.query.conversationId)
    return id.length > 0 ? id : null
  }, [router.query.conversationId]);

  const [userId, setUserId] = useState("anonymous");
  const [session, setSession] = useState<LearningSession | null>(null);
  const [medicalCase, setMedicalCase] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hydratedFromDatabase, setHydratedFromDatabase] = useState(false);

  useEffect(() => {
    const sync = () => {
      const u = authService.getCurrentUser();
      setUserId(getClinicalUserId(u) ?? "anonymous");
    };
    sync();
    const t = window.setTimeout(sync, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!router.isReady || !caseId) return;

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      let resolved =
        userId && userId !== "anonymous"
          ? await resolveMedicalCase(caseId, { userId, mode: "LEARNING" })
          : null;

      if (!resolved) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const mc = CaseValidationService.validateAndFixCase(resolved);
      if (!cancelled) setMedicalCase(mc);

      if (conversationIdFromQuery && userId && userId !== "anonymous") {
        try {
          const fromDb = await learningService.getLearningSessionFromDatabase(
            conversationIdFromQuery,
            userId,
            mc
          );
          if (!cancelled && fromDb) {
            const sid = learningService.normalizeStudentId(userId);
            if (sid) fromDb.studentId = sid;
            setSession(fromDb);
            setHydratedFromDatabase(true);
            learningService.saveLearningSession(fromDb).catch(console.error);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Learning DB hydrate failed", e);
        }
      }

      if (cancelled) return;

      const fromDb = await learningService.resolveLearningSessionFromDatabase(
        caseId,
        userId,
        conversationIdFromQuery,
        mc,
      );
      if (fromDb) {
        const sid = learningService.normalizeStudentId(userId);
        if (sid) fromDb.studentId = sid;
        if (!cancelled) {
          setSession(fromDb);
          setHydratedFromDatabase(true);
          setIsLoading(false);
        }
        return;
      }

      const sid = learningService.normalizeStudentId(userId);
      const newSession: LearningSession = {
        id: `learn_${caseId}`,
        caseId,
        disease: mc.disease,
        patientProfile: mc.patientProfile,
        conversation: [],
        isComplete: false,
        createdAt: new Date().toISOString(),
        studentId: sid,
      };

      if (!cancelled) {
        setSession(newSession);
        setHydratedFromDatabase(false);
        if (sid) {
          const { startMedprepSession } = await import("@/lib/fyp/medprep-persistence-service");
          const started = await startMedprepSession({
            userId: sid,
            mode: "LEARNING",
            caseId,
            title: mc.title,
            caseSnapshot: mc,
          });
          if (started?.id) {
            newSession.conversationId = started.id;
            setSession({ ...newSession });
          }
        }
        void learningService.saveLearningSession(newSession);
        setIsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, caseId, userId, conversationIdFromQuery]);

  const handleSessionUpdate = useCallback((updatedSession: LearningSession) => {
    const sid = learningService.normalizeStudentId(userId);
    const next =
      sid && updatedSession.studentId !== sid ? { ...updatedSession, studentId: sid } : updatedSession;

    setSession(next)
    void learningService.saveLearningSession(next)
  }, [userId])

  if (!router.isReady) {
    return (
      <div className={cn(APP_PAGE_SHELL, "flex flex-1 items-center justify-center p-8")}>
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!caseId) {
    return (
      <div
        className={cn(
          APP_PAGE_SHELL,
          "flex flex-1 items-center justify-center p-8"
        )}
      >
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-slate-100">
            Invalid learning URL
          </h1>
          <p className="mb-6 text-gray-600 dark:text-slate-400">
            Open a case from Learning (Q&amp;A) to start a session.
          </p>
          <Link href="/medprep-ai/qa">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Learning
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          APP_PAGE_SHELL,
          "flex flex-1 items-center justify-center"
        )}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-gray-600 dark:text-slate-400">Loading learning session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className={cn(
          APP_PAGE_SHELL,
          "flex flex-1 items-center justify-center"
        )}
      >
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-slate-100">
            Case Not Found
          </h1>
          <p className="mb-6 text-gray-600 dark:text-slate-400">
            The requested learning case could not be found.
          </p>
          <Link href="/medprep-ai/qa">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Learning
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        APP_PAGE_SHELL,
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      )}
    >
      <LearningInterface
        session={session}
        onSessionUpdate={handleSessionUpdate}
        medicalCase={medicalCase}
        hydratedFromDatabase={hydratedFromDatabase}
      />
    </div>
  );
}
