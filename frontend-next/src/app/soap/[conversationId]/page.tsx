"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { databaseConversationService } from "@/lib/fyp/database-conversation-service"
import { sampleCases, type MedicalCase } from "@/lib/fyp/data-models"
import { SOAPNoteEditor } from "@/app/components/medprep-ai/fyp/soap-note-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authService } from "@/shared/services/auth.service"

export default function SoapConversationPage() {
  const params = useParams<{ conversationId: string }>()
  const conversationId = params?.conversationId

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

        setMedicalCase(resolvedCase)
      } catch (loadError) {
        console.error("Failed to load SOAP page data:", loadError)
        setError(loadError instanceof Error ? loadError.message : "Failed to load SOAP page.")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [conversationId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>SOAP Note Unavailable</CardTitle>
            <CardDescription>{error || "Unable to resolve the case for this conversation."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
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
