"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/shared/ui/use-toast"
import { toastApiError } from "@/app/services/base/api-http-error"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react"

interface DiagnosisSubmissionProps {
  conversationId: string
  studentId: string
  caseId: string
  caseMetadata: {
    isRare: boolean
    specialty: string
    difficulty: string
  }
  onSubmissionComplete?: (result: any) => void
  mode?: "assessment" | "practice"
  onContinueToSOAP?: () => void
  medicalCase?: any
  /** Dismiss the surrounding modal (e.g. overlay in case chat). */
  onClose?: () => void
}

interface SubmissionResult {
  submission: {
    id: string
    isCorrect: boolean
    actualDiagnosis: string
    submittedDiagnosis: string
    caseMetadata: any
  }
  feedback: {
    isCorrect: boolean
    actualDiagnosis: string
    submittedDiagnosis: string
    message: string
    caseMetadata: any
  }
}

export function DiagnosisSubmission({
  conversationId,
  studentId,
  caseId,
  caseMetadata,
  onSubmissionComplete,
  mode = "assessment",
  onContinueToSOAP,
  medicalCase,
  onClose,
}: DiagnosisSubmissionProps) {
  const { toast } = useToast()
  const [diagnosis, setDiagnosis] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const [showForm, setShowForm] = useState(true)

  const handleSubmit = async () => {
    if (!diagnosis.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/diagnosis/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          studentId,
          submittedDiagnosis: diagnosis.trim(),
          caseId,
          medicalCase,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit diagnosis")
      }

      const rawText = await response.text()
      let result: SubmissionResult
      try {
        result = rawText ? JSON.parse(rawText) : (null as unknown as SubmissionResult)
      } catch {
        throw new Error(`Failed to parse diagnosis submission response (${response.status}).`)
      }
      setSubmissionResult(result)
      setShowForm(false)
      
      if (onSubmissionComplete) {
        onSubmissionComplete(result)
      }
    } catch (error) {
      console.error("Error submitting diagnosis:", error)
      toastApiError(toast, error, "Couldn’t submit diagnosis")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setDiagnosis("")
    setSubmissionResult(null)
    setShowForm(true)
  }

  if (!showForm && submissionResult) {
    return (
      <Card className="mx-auto w-full max-w-2xl border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-foreground">
                {submissionResult.feedback.isCorrect ? (
                  <CheckCircle className="h-6 w-6 shrink-0 text-primary" />
                ) : (
                  <XCircle className="h-6 w-6 shrink-0 text-red-500 dark:text-red-400" />
                )}
                Diagnosis Submission Result
              </CardTitle>
              <CardDescription>
                {submissionResult.feedback.isCorrect ? "Correct!" : "Incorrect"}
              </CardDescription>
            </div>
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert
            className={
              submissionResult.feedback.isCorrect
                ? "border-primary-200 bg-primary-50 dark:border-primary-500/25 dark:bg-primary-500/10"
                : "border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10"
            }
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-foreground">
              {submissionResult.feedback.message}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Your Diagnosis:</h4>
              <p className="text-lg text-foreground">{submissionResult.feedback.submittedDiagnosis}</p>
            </div>
            {mode !== "assessment" && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Actual Diagnosis:</h4>
                <p className="text-lg text-foreground">{submissionResult.feedback.actualDiagnosis}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Badge variant={caseMetadata.isRare ? "destructive" : "secondary"}>
              {caseMetadata.isRare ? "Rare Disease" : "Common Disease"}
            </Badge>
            <Badge variant="outline">{caseMetadata.specialty}</Badge>
            <Badge variant="outline">{caseMetadata.difficulty}</Badge>
          </div>

          {caseMetadata.isRare && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This was a rare disease case! Rare diseases can be challenging to diagnose 
                because they often mimic more common conditions. Consider factors like family 
                history, subtle physical findings, and specialized testing.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {onContinueToSOAP && (
              <Button onClick={onContinueToSOAP}>
                Continue to SOAP Note
              </Button>
            )}
            <Button onClick={handleReset} variant="outline">
              Submit Another Diagnosis
            </Button>
            <Button onClick={() => window.location.reload()}>
              Start New Case
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-2xl border-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="text-foreground">Submit Your Diagnosis</CardTitle>
            <CardDescription>
              Based on your conversation with the patient, what do you think is the diagnosis?
            </CardDescription>
          </div>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="diagnosis" className="text-sm font-medium text-foreground">
            Your Diagnosis:
          </label>
          <Input
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter your diagnosis..."
            className="text-lg"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSubmit()
              }
            }}
          />
        </div>

        <div className="flex gap-2">
          <Badge variant={caseMetadata.isRare ? "destructive" : "secondary"}>
            {caseMetadata.isRare ? "Rare Disease Case" : "Common Disease Case"}
          </Badge>
          <Badge variant="outline">{caseMetadata.specialty}</Badge>
          <Badge variant="outline">{caseMetadata.difficulty}</Badge>
        </div>

        {caseMetadata.isRare && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-950/25">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-foreground">
              This is a rare disease case! Consider subtle clues, family history, 
              and specialized testing that might be needed for diagnosis.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSubmit} 
          disabled={!diagnosis.trim() || isSubmitting}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-700 text-primary-foreground hover:brightness-105"
        >
          {isSubmitting ? "Submitting..." : "Submit Diagnosis"}
        </Button>
      </CardContent>
    </Card>
  )
}

