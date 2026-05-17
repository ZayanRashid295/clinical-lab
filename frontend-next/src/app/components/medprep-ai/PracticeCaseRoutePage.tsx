"use client"

import type { ReactNode } from "react"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { MedPrepSlugGate } from "@/app/components/medprep-ai/MedPrepSlugGate"
import Link from "next/link"
import { CaseChat } from "@/app/components/medprep-ai/fyp/case-chat"
import { sampleCases } from "@/lib/fyp/data-models"
import { databaseConversationService } from "@/lib/fyp/database-conversation-service"
import type { User } from "@/lib/fyp/medprep-user"
import { toMedPrepUser } from "@/lib/fyp/medprep-user"
import { trimMedprepConversationIdQuery } from "@/lib/fyp/medprep-session-merge"
import { authService } from "@/shared/services/auth.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { APP_PAGE_SHELL } from "@/app/config/app-shell"

const ANON: User = {
  id: "anonymous",
  email: "student@local",
  name: "Student",
  role: "STUDENT",
  createdAt: new Date(),
  totalPoints: 0,
  level: 1,
  streak: 0,
  lastLogin: new Date(),
}

function caseIdFromPathname(pathname: string): string | null {
  const m = pathname.match(/^\/medprep-ai\/case\/([^/]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

/** `/medprep-ai/case` supports `?mode=evaluation` (evaluation UX on practice route) — gate by evaluation entitlement in that case. */
function PracticeCaseEntitlementGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  if (!router.isReady) {
    return (
      <div className={cn(APP_PAGE_SHELL, "flex flex-1 items-center justify-center p-8")}>
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }
  const evaluationMode = router.query.mode === "evaluation"
  return (
    <MedPrepSlugGate
      slug={evaluationMode ? "ai-evaluation" : "let-me-drive"}
      modeLabel={evaluationMode ? "AI Evaluation Mode" : "Practice Mode"}
    >
      {children}
    </MedPrepSlugGate>
  )
}

function CasePageInner() {
  const router = useRouter()
  const pathname = useMemo(
    () => (router.asPath || "").split("?")[0] || "",
    [router.asPath]
  )
  const caseId = caseIdFromPathname(pathname) || ""
  const evaluationMode = router.query.mode === "evaluation"
  const resumeConversationId =
    trimMedprepConversationIdQuery(router.query.conversationId) || undefined

  const [medicalCase, setMedicalCase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [student, setStudent] = useState<User>(ANON)

  useEffect(() => {
    const u = authService.getCurrentUser()
    const mapped = toMedPrepUser(u)
    setStudent(mapped || ANON)
  }, [])

  useEffect(() => {
    if (!router.isReady || !caseId) return

    const loadCase = async () => {
      setLoading(true)
      setError(null)
      try {
        // Same-tick as auth: do not use React `student` here — it can still be the default ANON
        // from the previous render while `setStudent` from the other effect has not committed yet.
        // Wrong userId → backend 403 Forbidden for owned learning/practice sessions.
        const sessionUser = toMedPrepUser(authService.getCurrentUser()) || ANON

        let resolvedCaseId = caseId
        if (resumeConversationId) {
          const resumedConversation = await databaseConversationService.getConversation(
            resumeConversationId,
            sessionUser.id
          )
          if (
            resumedConversation?.caseId &&
            (resolvedCaseId === "unknown" || !sampleCases.find((c) => c.id === resolvedCaseId))
          ) {
            resolvedCaseId = resumedConversation.caseId
          }
        }

        const existingCase = sampleCases.find((c) => c.id === resolvedCaseId)
        if (existingCase) {
          setMedicalCase(existingCase)
          setLoading(false)
          return
        }

        if (sessionUser.id && sessionUser.id !== "anonymous") {
          const { fetchResumeSession, caseSnapshotFromSession } = await import(
            "@/lib/fyp/medprep-persistence-service"
          )
          const dbSession = await fetchResumeSession(sessionUser.id, "PRACTICE", resolvedCaseId)
          const snap = dbSession ? caseSnapshotFromSession(dbSession) : null
          if (snap) {
            setMedicalCase(snap)
            setLoading(false)
            return
          }
        }

        const response = await fetch(`/api/cases/get?caseId=${encodeURIComponent(resolvedCaseId)}`)
        if (response.ok) {
          const rawText = await response.text()
          let data: any
          try {
            data = rawText ? JSON.parse(rawText) : null
          } catch {
            setError("Case not found")
            return
          }
          const payload = data?.caseData ?? data?.case ?? data
          if (payload && payload.id) {
            setMedicalCase(payload)
          } else {
            setError("Case not found")
          }
        } else {
          setError("Case not found")
        }
      } catch (err) {
        console.error("Error loading case:", err)
        setError("Failed to load case")
      } finally {
        setLoading(false)
      }
    }

    void loadCase()
    // User id for resume is read inside loadCase via authService — not `student` state — to avoid a
    // stale ANON id on the same tick as route hydration (403 Forbidden on learning resume).
  }, [router.isReady, caseId, resumeConversationId])

  if (!router.isReady) {
    return (
      <div className={cn(APP_PAGE_SHELL, "flex flex-1 items-center justify-center p-8")}>
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!caseId) {
    return (
      <div className={cn(APP_PAGE_SHELL, "flex flex-1 items-center justify-center p-8")}>
        <Card>
          <CardHeader>
            <CardTitle>Invalid case URL</CardTitle>
            <CardDescription>Open a case from Practice (Let me drive) to start a session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/medprep-ai/let-me-drive">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn(APP_PAGE_SHELL, "flex flex-1 items-center justify-center p-8")}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-gray-600 dark:text-slate-400">Loading case...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !medicalCase) {
    return (
      <div className={cn(APP_PAGE_SHELL, "flex flex-1 items-center justify-center p-8")}>
        <Card>
          <CardHeader>
            <CardTitle>Case Not Found</CardTitle>
            <CardDescription>{error || "The requested case could not be found."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/medprep-ai/let-me-drive">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <CaseChat
        medicalCase={medicalCase}
        student={student}
        evaluationMode={evaluationMode}
        resumeConversationId={resumeConversationId}
      />
    </div>
  )
}

export function PracticeCaseRoutePage() {
  return (
    <PracticeCaseEntitlementGate>
      <Suspense
        fallback={
          <div className={cn(APP_PAGE_SHELL, "flex flex-1 items-center justify-center p-8")}>
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        }
      >
        <CasePageInner />
      </Suspense>
    </PracticeCaseEntitlementGate>
  )
}
