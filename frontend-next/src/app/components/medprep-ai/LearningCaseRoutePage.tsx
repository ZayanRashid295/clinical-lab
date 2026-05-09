"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { learningService, type LearningSession } from "@/lib/fyp/learning-service"
import { sampleCases } from "@/lib/fyp/data-models"
import { CaseValidationService } from "@/lib/fyp/case-validation"
import { LearningInterface } from "@/app/components/medprep-ai/fyp/learning-interface"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { authService } from "@/shared/services/auth.service"
import { getClinicalUserId } from "@/lib/fyp/medprep-user"

function caseIdFromPathname(pathname: string): string | null {
  const m = pathname.match(/^\/medprep-ai\/learn\/([^/]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export function LearningCaseRoutePage() {
  const router = useRouter()
  const pathname = useMemo(
    () => (router.asPath || "").split("?")[0] || "",
    [router.asPath]
  )
  const caseId = caseIdFromPathname(pathname) || ""

  const conversationIdFromQuery = useMemo(() => {
    const q = router.query.conversationId
    return typeof q === "string" && q.length > 0 ? q : null
  }, [router.query.conversationId])

  const [userId, setUserId] = useState("anonymous")
  const [session, setSession] = useState<LearningSession | null>(null)
  const [medicalCase, setMedicalCase] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hydratedFromDatabase, setHydratedFromDatabase] = useState(false)

  useEffect(() => {
    const sync = () => {
      const u = authService.getCurrentUser()
      setUserId(getClinicalUserId(u) ?? "anonymous")
    }
    sync()
    const t = window.setTimeout(sync, 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!router.isReady || !caseId) return

    let cancelled = false

    console.log("Loading learning case with ID:", caseId)
    let resolved = sampleCases.find((c) => c.id === caseId)

    if (!resolved) {
      const generatedCaseData = localStorage.getItem("generatedCase")
      if (generatedCaseData) {
        try {
          resolved = JSON.parse(generatedCaseData)
        } catch (parseError) {
          console.error("Error parsing generated case:", parseError)
        }
      }
    }

    if (!resolved) {
      setIsLoading(false)
      return
    }

    const validatedCase = CaseValidationService.validateAndFixCase(resolved)
    if (validatedCase !== resolved && localStorage.getItem("generatedCase")) {
      localStorage.setItem("generatedCase", JSON.stringify(validatedCase))
    }
    const mc = validatedCase
    setMedicalCase(mc)

    const run = async () => {
      setIsLoading(true)

      // 1) Resume from dashboard: ?conversationId=...
      if (conversationIdFromQuery && userId && userId !== "anonymous") {
        try {
          const fromDb = await learningService.getLearningSessionFromDatabase(
            conversationIdFromQuery,
            userId,
            mc
          )
          if (!cancelled && fromDb) {
            const sid = learningService.normalizeStudentId(userId)
            if (sid) fromDb.studentId = sid
            setSession(fromDb)
            setHydratedFromDatabase(true)
            learningService.saveLearningSession(fromDb).catch(console.error)
            setIsLoading(false)
            return
          }
        } catch (e) {
          console.error("Learning DB hydrate failed", e)
        }
      }

      if (cancelled) return

      // 2) Local backup
      const existingSession =
        learningService.getLearningSession(`learn_${caseId}`) ??
        learningService.getLearningSessionsForUser().find((s) => s.caseId === caseId)

      if (existingSession) {
        const sid = learningService.normalizeStudentId(userId)
        const merged: LearningSession = { ...existingSession, studentId: sid || existingSession.studentId }
        if (!cancelled) {
          setSession(merged)
          setHydratedFromDatabase(false)
          setIsLoading(false)
        }
        return
      }

      const sid = learningService.normalizeStudentId(userId)
      const newSession: LearningSession = {
        id: `learn_${caseId}`,
        caseId,
        disease: mc.disease,
        patientProfile: mc.patientProfile,
        conversation: [],
        isComplete: false,
        createdAt: new Date().toISOString(),
        studentId: sid,
      }

      if (!cancelled) {
        setSession(newSession)
        setHydratedFromDatabase(false)
        void learningService.saveLearningSession(newSession)
        setIsLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [router.isReady, caseId, userId, conversationIdFromQuery])

  const handleSessionUpdate = (updatedSession: LearningSession) => {
    const sid = learningService.normalizeStudentId(userId)
    const next =
      sid && updatedSession.studentId !== sid ? { ...updatedSession, studentId: sid } : updatedSession

    setSession(next)
    void (async () => {
      await learningService.saveLearningSession(next)
      setSession({ ...next })
    })()
  }

  if (!router.isReady) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!caseId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid learning URL</h1>
          <p className="text-gray-600 mb-6">Open a case from Learning (Q&amp;A) to start a session.</p>
          <Link href="/medprep-ai/qa">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Learning
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading learning session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Case Not Found</h1>
          <p className="text-gray-600 mb-6">The requested learning case could not be found.</p>
          <Link href="/medprep-ai/qa">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Learning
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-gray-50">
      <LearningInterface
        session={session}
        onSessionUpdate={handleSessionUpdate}
        medicalCase={medicalCase}
        hydratedFromDatabase={hydratedFromDatabase}
      />
    </div>
  )
}
