"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { CaseChat } from "@/app/components/medprep-ai/fyp/case-chat"
import { sampleCases } from "@/lib/fyp/data-models"
import type { User } from "@/lib/fyp/medprep-user"
import { toMedPrepUser } from "@/lib/fyp/medprep-user"
import { authService } from "@/shared/services/auth.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

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

function CasePageInner() {
  const router = useRouter()
  const pathname = useMemo(
    () => (router.asPath || "").split("?")[0] || "",
    [router.asPath]
  )
  const caseId = caseIdFromPathname(pathname) || ""
  const evaluationMode = router.query.mode === "evaluation"
  const resumeConversationId =
    typeof router.query.conversationId === "string" ? router.query.conversationId : undefined

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
        const existingCase = sampleCases.find((c) => c.id === caseId)
        if (existingCase) {
          setMedicalCase(existingCase)
          setLoading(false)
          return
        }

        const generatedCaseData = localStorage.getItem("generatedCase")
        if (generatedCaseData) {
          try {
            const generatedCase = JSON.parse(generatedCaseData)
            setMedicalCase(generatedCase)
            setLoading(false)
            return
          } catch (parseError) {
            console.error("Error parsing generated case:", parseError)
          }
        }

        const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}`)
        if (response.ok) {
          const data = await response.json()
          const payload = data.case ?? data
          setMedicalCase(payload)
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
  }, [router.isReady, caseId])

  if (!router.isReady) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!caseId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
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
      <div className="flex flex-1 items-center justify-center p-8">
        <Card>
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading case...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !medicalCase) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
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
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      }
    >
      <CasePageInner />
    </Suspense>
  )
}
