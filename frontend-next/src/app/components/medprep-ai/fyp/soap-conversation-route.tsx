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

function buildFallbackCase(caseId: string, conversation: any): MedicalCase {
  const title = conversation?.case?.title || conversation?.title || "Practice Case"
  const specialty = conversation?.case?.specialty || "general"
  const difficultyRaw = String(conversation?.case?.difficulty || "intermediate").toLowerCase()
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

export function SoapConversationRoute({ conversationId }: { conversationId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [conversation, setConversation] = useState<any>(null)
  const [medicalCase, setMedicalCase] = useState<MedicalCase | null>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      if (!conversationId) return
      setIsLoading(true)
      setError("")

      try {
        const user = authService.getCurrentUser()
        const userId = user?.id ? String(user.id) : "anonymous"
        const conv = await databaseConversationService.getConversation(conversationId, userId)
        if (!conv) {
          setError("Conversation not found.")
          setIsLoading(false)
          return
        }
        setConversation(conv)

        let resolvedCase = sampleCases.find((c) => c.id === conv.caseId) || null
        if (!resolvedCase && typeof conv.caseId === "string") {
          const safeCaseId = conv.caseId
          let originalCaseId = safeCaseId
          if (safeCaseId.startsWith("practice_")) {
            const parts = safeCaseId.split("_")
            if (parts.length >= 2) originalCaseId = parts[1]
          } else if (safeCaseId.includes("_")) {
            originalCaseId = safeCaseId.split("_")[0]
          }
          if (originalCaseId) {
            resolvedCase = sampleCases.find((c) => c.id === originalCaseId) || null
          }
        }

        if (!resolvedCase) {
          const savedCase = localStorage.getItem(`soap_case_${conversationId}`)
          if (savedCase) {
            try {
              const parsed = JSON.parse(savedCase)
              if (parsed?.id) {
                resolvedCase = parsed
              }
            } catch {
              // Ignore malformed local cache and continue with other fallbacks.
            }
          }
        }

        if (!resolvedCase) {
          const generatedCaseData = localStorage.getItem("generatedCase")
          if (generatedCaseData) {
            const generatedCase = JSON.parse(generatedCaseData)
            if (
              generatedCase?.id === conv.caseId ||
              `${generatedCase?.id}_${generatedCase?.title}_${generatedCase?.disease}`.replace(/\s+/g, "_") === conv.caseId
            ) {
              resolvedCase = generatedCase
            }
          }
        }

        setMedicalCase(resolvedCase || buildFallbackCase(conv.caseId, conv))
      } catch (loadError) {
        console.error("Failed to load SOAP page data:", loadError)
        setError(loadError instanceof Error ? loadError.message : "Failed to load SOAP page.")
      } finally {
        setIsLoading(false)
      }
    }

    load()
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

  if (error || !conversation || !medicalCase) {
    return (
      <div className={centerShell}>
        <Card className="w-full max-w-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>SOAP Note Unavailable</CardTitle>
            <CardDescription>{error || "Unable to resolve the case for this conversation."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const student = {
    id: String(conversation.studentId || "student"),
    name: "Student",
    email: "student@local",
  }

  return <SOAPNoteEditor conversation={conversation} medicalCase={medicalCase} student={student} />
}
