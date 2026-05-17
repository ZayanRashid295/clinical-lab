"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { databaseConversationService } from "@/lib/fyp/database-conversation-service"
import { sampleCases, type MedicalCase } from "@/lib/fyp/data-models"
import { SOAPNoteEditor } from "@/app/components/medprep-ai/fyp/soap-note-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authService } from "@/shared/services/auth.service"
import { getClinicalUserId } from "@/lib/fyp/medprep-user"
import {
  caseSnapshotFromSession,
  fetchMedprepSession,
  resolveMedprepUserId,
} from "@/lib/fyp/medprep-persistence-service"

function buildFallbackCase(caseId: string, conversation: unknown): MedicalCase {
  const title = (conversation as { case?: { title?: string }; title?: string })?.case?.title
    || (conversation as { title?: string })?.title
    || "Practice Case"
  const specialty = (conversation as { case?: { specialty?: string } })?.case?.specialty || "general"
  const difficultyRaw = String(
    (conversation as { case?: { difficulty?: string } })?.case?.difficulty || "intermediate",
  ).toLowerCase()
  const difficulty =
    difficultyRaw === "beginner" || difficultyRaw === "advanced" ? difficultyRaw : "intermediate"

  return {
    id: caseId || "unknown-case",
    title,
    description: "Case details were partially unavailable. SOAP note is still available for this conversation.",
    difficulty,
    disease: "Undifferentiated condition",
    diseaseName: "Undifferentiated condition",
    specialty,
    isRare: false,
    symptoms: [],
    history: [],
    labs: {},
    expectedQuestions: [],
    patientProfile: {
      name: "Patient",
      age: 40,
      gender: "Unknown",
      occupation: "Unknown",
    },
    createdAt: new Date().toISOString(),
  }
}

function resolveCaseFromId(caseId: string, dbSession: Awaited<ReturnType<typeof fetchMedprepSession>>): MedicalCase | null {
  const fromDb = dbSession ? caseSnapshotFromSession(dbSession) : null
  if (fromDb) return fromDb

  let resolved = sampleCases.find((c) => c.id === caseId) || null
  if (resolved) return resolved

  let originalCaseId = caseId
  if (caseId.startsWith("practice_")) {
    const parts = caseId.split("_")
    if (parts.length >= 2) originalCaseId = parts[1]
  } else if (caseId.includes("_")) {
    originalCaseId = caseId.split("_")[0]
  }
  if (originalCaseId) {
    resolved = sampleCases.find((c) => c.id === originalCaseId) || null
  }
  return resolved
}

export function SoapConversationRoute({ conversationId }: { conversationId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [conversation, setConversation] = useState<Awaited<
    ReturnType<typeof databaseConversationService.getConversation>
  > | null>(null)
  const [medicalCase, setMedicalCase] = useState<MedicalCase | null>(null)
  const [error, setError] = useState<string>("")
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const syncAuth = () => {
      const uid = resolveMedprepUserId() || getClinicalUserId(authService.getCurrentUser())
      setStudentId(uid && uid !== "anonymous" ? uid : null)
    }
    syncAuth()
    const t = window.setTimeout(syncAuth, 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!conversationId) return
      setIsLoading(true)
      setError("")

      try {
        const userId = resolveMedprepUserId() || getClinicalUserId(authService.getCurrentUser())
        if (!userId || userId === "anonymous") {
          setError("Sign in to view and save your SOAP note.")
          setIsLoading(false)
          return
        }
        setStudentId(userId)

        const dbSession = await fetchMedprepSession(conversationId, userId)
        const conv = await databaseConversationService.getConversation(conversationId, userId)
        if (!conv) {
          setError("Conversation not found.")
          setIsLoading(false)
          return
        }
        setConversation(conv)

        const resolvedCase = resolveCaseFromId(conv.caseId, dbSession)
        setMedicalCase(resolvedCase || buildFallbackCase(conv.caseId, dbSession ?? conv))
      } catch (loadError) {
        console.error("Failed to load SOAP page data:", loadError)
        setError(loadError instanceof Error ? loadError.message : "Failed to load SOAP page.")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [conversationId])

  const centerShell = "flex min-h-[50vh] w-full flex-1 items-center justify-center py-8"

  if (isLoading) {
    return (
      <div className={centerShell}>
        <Card className="w-full max-w-md border-border shadow-sm">
          <CardHeader>
            <CardTitle>Loading SOAP Note...</CardTitle>
            <CardDescription>Please wait while we load your case conversation.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !conversation || !medicalCase || !studentId) {
    return (
      <div className={centerShell}>
        <Card className="w-full max-w-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>SOAP Note Unavailable</CardTitle>
            <CardDescription>
              {error || "Unable to resolve the case for this conversation."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/medprep-ai/practice-cases">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Practice Cases
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const student = {
    id: studentId,
    name: authService.getCurrentUser()?.name || "Student",
    email: authService.getCurrentUser()?.email || "student@local",
  }

  return <SOAPNoteEditor conversation={conversation} medicalCase={medicalCase} student={student} />
}
