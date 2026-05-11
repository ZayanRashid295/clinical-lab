"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/shared/ui/use-toast"
import { toastApiError } from "@/app/services/base/api-http-error"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

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
  medicalCase
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {submissionResult.feedback.isCorrect ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            Diagnosis Submission Result
          </CardTitle>
          <CardDescription>
            {submissionResult.feedback.isCorrect ? "Correct!" : "Incorrect"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={submissionResult.feedback.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {submissionResult.feedback.message}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-600">Your Diagnosis:</h4>
              <p className="text-lg">{submissionResult.feedback.submittedDiagnosis}</p>
            </div>
            {mode !== "assessment" && (
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Actual Diagnosis:</h4>
                <p className="text-lg">{submissionResult.feedback.actualDiagnosis}</p>
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Your Diagnosis</CardTitle>
        <CardDescription>
          Based on your conversation with the patient, what do you think is the diagnosis?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="diagnosis" className="text-sm font-medium">
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
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This is a rare disease case! Consider subtle clues, family history, 
              and specialized testing that might be needed for diagnosis.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSubmit} 
          disabled={!diagnosis.trim() || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Diagnosis"}
        </Button>
      </CardContent>
    </Card>
  )
}

