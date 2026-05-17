"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/router"
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent"
import type { Conversation, MedicalCase, SOAPNote } from "@/lib/fyp/data-models"
import type { SOAPGrading } from "@/lib/fyp/soap-service"
import type { ConversationGrading } from "@/lib/fyp/ai-service"
import { soapAssistantService } from "@/lib/fyp/soap-assistant-service"
import type { ComprehensiveTabReports } from "@/lib/fyp/comprehensive-tab-report-service"
import { databaseConversationService } from "@/lib/fyp/database-conversation-service"
import { parseFetchJson } from "@/lib/api/parse-fetch-json"
import {
  ensureCaseSnapshotOnSession,
  fetchSoapDraft,
  patchMedprepSession,
  saveSoapDraft,
} from "@/lib/fyp/medprep-persistence-service"
import { GradingReport } from "./grading-report"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle,
  Loader2,
  Lightbulb,
  Zap,
  AlertCircle,
  HelpCircle,
  Download,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { APP_GLASS_CARD, APP_PAGE_PADDING } from "@/app/config/app-shell"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip"

interface StudentLike {
  id: string
  name: string
  email: string
}

interface SOAPNoteEditorProps {
  conversation: Conversation
  medicalCase: MedicalCase
  student: StudentLike
}

type SectionKey = "subjective" | "objective" | "assessment" | "plan"

const SECTION_META: Record<SectionKey, { title: string; description: string; minChars: number; placeholder: string }> = {
  subjective: {
    title: "Subjective",
    description: "Patient history, symptoms, and subjective info",
    minChars: 50,
    placeholder: "Chief complaint, HPI, PMH, meds, allergies, social and family history...",
  },
  objective: {
    title: "Objective",
    description: "Exam findings, vitals, and diagnostics",
    minChars: 50,
    placeholder: "Vitals, physical exam findings, investigations...",
  },
  assessment: {
    title: "Assessment",
    description: "Clinical impression and differential",
    minChars: 30,
    placeholder: "Primary diagnosis, differential diagnosis, clinical reasoning...",
  },
  plan: {
    title: "Plan",
    description: "Treatment, monitoring, and follow-up",
    minChars: 30,
    placeholder: "Medications, interventions, monitoring, education, follow-up...",
  },
}

const TIPS: Record<SectionKey, string[]> = {
  subjective: ["Start with chief complaint", "Include clear HPI timeline", "Mention relevant PMH and current meds", "Capture social/family context"],
  objective: ["Add complete vitals", "Use system-wise exam findings", "Document labs/imaging clearly", "Use proper clinical terminology"],
  assessment: ["State primary diagnosis clearly", "Include differential diagnosis", "Explain reasoning from findings", "Mention risk/severity"],
  plan: ["Specify treatment with doses", "Add monitoring parameters", "Include patient education", "Define follow-up timing"],
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function SubmitReadinessRow({
  done,
  title,
  detail,
}: {
  done: boolean
  title: string
  detail: string
}) {
  return (
    <li className="flex gap-2.5">
      {done ? (
        <CheckCircle
          className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400"
          aria-hidden
        />
      ) : (
        <AlertCircle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            done ? "text-slate-900 dark:text-white" : "text-amber-950 dark:text-amber-50",
          )}
        >
          {title}
        </p>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{detail}</p>
      </div>
    </li>
  )
}

export function SOAPNoteEditor({ conversation, medicalCase, student }: SOAPNoteEditorProps) {
  const router = useRouter()
  const [subjective, setSubjective] = useState("")
  const [objective, setObjective] = useState("")
  const [assessment, setAssessment] = useState("")
  const [plan, setPlan] = useState("")
  const [activeSection, setActiveSection] = useState<SectionKey>("subjective")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [grading, setGrading] = useState<SOAPGrading | null>(null)
  const [conversationGrading, setConversationGrading] = useState<ConversationGrading | null>(null)
  const [tabReports, setTabReports] = useState<ComprehensiveTabReports | null>(null)
  const [isGradingConversation, setIsGradingConversation] = useState(false)
  const [isFinishingConsultation, setIsFinishingConsultation] = useState(false)
  const [soapNoteId, setSoapNoteId] = useState<string | undefined>(undefined)
  const [isLoadingSoap, setIsLoadingSoap] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [aiSOAP, setAiSOAP] = useState<SOAPNote["aiGeneratedSOAP"] | null>(null)
  const [writingTime, setWritingTime] = useState(0)
  const [showTips, setShowTips] = useState(true)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [assistantBusy, setAssistantBusy] = useState<SectionKey | null>(null)
  const [assistantSuggestions, setAssistantSuggestions] = useState<Record<SectionKey, string[]>>({
    subjective: [],
    objective: [],
    assessment: [],
    plan: [],
  })

  const values: Record<SectionKey, string> = { subjective, objective, assessment, plan }
  const setters: Record<SectionKey, (value: string) => void> = { subjective: setSubjective, objective: setObjective, assessment: setAssessment, plan: setPlan }
  const completion = (Object.keys(SECTION_META) as SectionKey[]).reduce(
    (acc, key) => ({ ...acc, [key]: values[key].trim().length >= SECTION_META[key].minChars }),
    { subjective: false, objective: false, assessment: false, plan: false },
  )
  const completedSections = Object.values(completion).filter(Boolean).length
  const completionPercent = Math.round((completedSections / 4) * 100)
  const studentQuestionCount = conversation.messages.filter(
    (message) => message.role === "student",
  ).length
  const hasCaseInterview = studentQuestionCount > 0
  const soapSectionsComplete = completedSections === 4
  const canSubmit = hasCaseInterview && soapSectionsComplete
  const submitBlockedReasons: string[] = []
  if (!soapSectionsComplete) {
    submitBlockedReasons.push(
      "Complete all four SOAP sections to the minimum length shown on each card.",
    )
  }
  if (!hasCaseInterview) {
    submitBlockedReasons.push(
      "Ask at least one question in the patient case interview. Submit stays locked until your encounter includes student messages.",
    )
  }
  const submitBlockedMessage = submitBlockedReasons.join(" ")
  const submitTooltip =
    canSubmit || isSubmitted
      ? "Submit your SOAP note for AI grading"
      : submitBlockedMessage

  useEffect(() => {
    const timer = setInterval(() => setWritingTime((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadExistingSOAP = async () => {
      setIsLoadingSoap(true)
      setSaveError(null)
      try {
        if (!student.id || student.id === "anonymous") {
          setSaveError("Sign in to load and save your SOAP note.")
          return
        }
        await ensureCaseSnapshotOnSession(conversation.id, student.id, medicalCase)
        const draft = await fetchSoapDraft(conversation.id, student.id)
        if (cancelled || !draft) return
        setSoapNoteId(draft.id)
        setSubjective(draft.subjective || "")
        setObjective(draft.objective || "")
        setAssessment(draft.assessment || "")
        setPlan(draft.plan || "")
        if (draft.aiGeneratedSOAP) {
          setAiSOAP({
            subjective: draft.aiGeneratedSOAP.subjective || "",
            objective: draft.aiGeneratedSOAP.objective || "",
            assessment: draft.aiGeneratedSOAP.assessment || "",
            plan: draft.aiGeneratedSOAP.plan || "",
          })
        }
        setIsSubmitted(draft.grade != null && draft.grade > 0)
      } catch (loadErr) {
        if (!cancelled) {
          console.warn("[SOAP] load draft failed", loadErr)
        }
      } finally {
        if (!cancelled) setIsLoadingSoap(false)
      }
    }
    void loadExistingSOAP()
    return () => {
      cancelled = true
    }
  }, [conversation.id, student.id, medicalCase])

  const handleSaveDraft = useCallback(async () => {
    if (!student.id || student.id === "anonymous") {
      setSaveError("Sign in to save your SOAP note.")
      return
    }
    const result = await saveSoapDraft({
      id: soapNoteId,
      conversationId: conversation.id,
      userId: student.id,
      subjective,
      objective,
      assessment,
      plan,
      aiGeneratedSOAP: aiSOAP ?? undefined,
    })
    if (!result.ok) {
      setSaveError(result.error || "Failed to save SOAP note.")
    } else {
      setSaveError(null)
    }
  }, [
    conversation.id,
    student.id,
    subjective,
    objective,
    assessment,
    plan,
    soapNoteId,
    aiSOAP,
  ])

  useEffect(() => {
    const hasContent = subjective || objective || assessment || plan
    if (!hasContent || isSubmitted || !autoSaveEnabled) return
    const timer = setTimeout(() => {
      handleSaveDraft()
    }, 2000)
    return () => clearTimeout(timer)
  }, [subjective, objective, assessment, plan, isSubmitted, autoSaveEnabled, handleSaveDraft])

  const handleGenerateSectionFromAI = async (section: SectionKey) => {
    setAssistantBusy(section)
    try {
      const draft = await soapAssistantService.generateSectionDraft(section, conversation, medicalCase)
      setters[section](draft)
    } finally {
      setAssistantBusy(null)
    }
  }

  const markConsultationComplete = useCallback(
    async (overallScore?: number) => {
      try {
        await databaseConversationService.completeConversation(
          conversation.id,
          student.id,
        )
      } catch (completeErr) {
        console.warn("[SOAP] completeConversation failed:", completeErr)
      }

      if (student.id && student.id !== "anonymous") {
        try {
          await patchMedprepSession(conversation.id, student.id, {
            status: "COMPLETED",
            ...(overallScore != null ? { score: overallScore } : {}),
          })
        } catch (progressErr) {
          console.warn("[SOAP] session completion patch failed:", progressErr)
        }
      }
    },
    [conversation.id, conversation.caseId, medicalCase.id, student.id],
  )

  const handleFinishConsultation = async () => {
    setIsFinishingConsultation(true)
    try {
      await markConsultationComplete(grading?.overallGrade)
      router.push("/medprep-ai/practice-cases")
    } catch (finishErr) {
      setError(
        finishErr instanceof Error
          ? finishErr.message
          : "Could not finish consultation. Try again or use Back to leave this page.",
      )
    } finally {
      setIsFinishingConsultation(false)
    }
  }

  const handleTipsFromAI = async (section: SectionKey) => {
    setAssistantBusy(section)
    try {
      const result = await soapAssistantService.generateSOAPSuggestions(section, values[section], conversation, medicalCase)
      setAssistantSuggestions((prev) => ({ ...prev, [section]: result.map((item) => item.suggestion) }))
    } finally {
      setAssistantBusy(null)
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError(submitBlockedMessage)
      return
    }
    setError(null)
    setIsSubmitting(true)
    const api = (path: string) =>
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path

    try {
      const aiResponse = await fetch(api("/api/soap/generate-ai"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation, medicalCase }),
      })
      const aiResult = (await parseFetchJson<Record<string, unknown>>(aiResponse)) ?? {}
      if (!aiResponse.ok || !aiResult.success) {
        const extra =
          typeof aiResult.details === "string" && aiResult.details.trim()
            ? ` (${aiResult.details.trim()})`
            : !aiResponse.ok
              ? ` (HTTP ${aiResponse.status})`
              : ""
        throw new Error((aiResult.error || "Failed to generate AI SOAP note") + extra)
      }
      const aiReferenceSoap = aiResult.aiSOAP as SOAPNote["aiGeneratedSOAP"]
      setAiSOAP(aiReferenceSoap ?? null)

      const gradeResponse = await fetch(api("/api/soap/grade"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentSOAP: { conversationId: conversation.id, studentId: student.id, subjective, objective, assessment, plan, aiGeneratedSOAP: aiReferenceSoap },
          aiSOAP: aiReferenceSoap,
        }),
      })
      const gradeResult = await parseFetchJson<{
        success?: boolean
        error?: string
        grading?: SOAPGrading
      }>(gradeResponse)
      if (!gradeResult?.success || !gradeResult.grading) {
        throw new Error(gradeResult?.error || "Failed to grade SOAP note")
      }
      setGrading(gradeResult.grading)

      let conversationGradingResult: ConversationGrading | null = null
      setIsGradingConversation(true)
      try {
        const conversationGradeResponse = await fetch(api("/api/ai/grade-conversation"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation, medicalCase }),
        })
        const conversationGradePayload = await parseFetchJson<{
          success?: boolean
          grading?: ConversationGrading
        }>(conversationGradeResponse)
        if (conversationGradeResponse.ok && conversationGradePayload?.success && conversationGradePayload.grading) {
          conversationGradingResult = conversationGradePayload.grading
          setConversationGrading(conversationGradePayload.grading)
        }
      } catch (gradeConvErr) {
        console.warn("[SOAP] grade-conversation failed; continuing without conversation report.", gradeConvErr)
      } finally {
        setIsGradingConversation(false)
      }

      const reportResponse = await fetch(api("/api/soap/comprehensive-report"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation,
          medicalCase,
          studentSoap: { subjective, objective, assessment, plan },
          soapGrading: gradeResult.grading,
          conversationGrading: conversationGradingResult,
          aiReferenceSoap: aiReferenceSoap,
        }),
      })
      const reportPayload = await parseFetchJson<{
        success?: boolean
        reports?: ComprehensiveTabReports
      }>(reportResponse)
      if (reportResponse.ok && reportPayload?.success && reportPayload.reports) {
        setTabReports(reportPayload.reports)
      } else {
        console.warn("[SOAP] comprehensive-report failed", reportPayload)
        setTabReports(null)
      }

      const finalSave = await saveSoapDraft(
        {
          id: soapNoteId,
          conversationId: conversation.id,
          userId: student.id,
          subjective,
          objective,
          assessment,
          plan,
          grade: gradeResult.grading.overallGrade,
          feedback: gradeResult.grading.feedback?.overall?.join(" ") || "",
          aiGeneratedSOAP: aiReferenceSoap,
        },
        { submit: true },
      )
      if (!finalSave.ok) {
        throw new Error(finalSave.error || "Failed to save graded SOAP note")
      }
      await markConsultationComplete(gradeResult.grading.overallGrade)
      setIsSubmitted(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit SOAP note")
    } finally {
      setIsSubmitting(false)
      setIsGradingConversation(false)
    }
  }

  const centerShell =
    "flex min-h-[50vh] w-full flex-1 items-center justify-center py-8"

  const writingClock = `${Math.floor(writingTime / 60)}:${String(writingTime % 60).padStart(2, "0")}`

  if (isSubmitting) {
    return (
      <div
        className={cn(
          "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col",
          APP_PAGE_PADDING,
        )}
      >
        <div className={centerShell}>
          <Card className="w-full max-w-md border-border shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle>Submitting for grading...</CardTitle>
              <CardDescription>
                Analyzing your interview and SOAP note, then generating AI
                feedback for Conversation, SOAP, and Recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-2">
              <Loader2
                className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400"
                aria-hidden
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const submitButton = (
    <Button
      size="sm"
      onClick={handleSubmit}
      disabled={isSubmitting || !canSubmit || isSubmitted}
      className={cn(
        !canSubmit &&
          !isSubmitting &&
          "disabled:opacity-50 dark:disabled:bg-slate-800 dark:disabled:text-slate-400",
      )}
    >
      <Send className="mr-2 h-4 w-4" />
      {isSubmitting ? "Submitting..." : "Submit for Grading"}
    </Button>
  )

  return (
    <div
      className={cn(
        "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-6 pb-28",
        APP_PAGE_PADDING,
      )}
    >
      <header className="sticky top-0 z-20 shrink-0 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] py-3 shadow-sm backdrop-blur-sm">
        <div className="w-full px-1 sm:px-2">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isSubmitted) {
                    void handleFinishConsultation()
                    return
                  }
                  if (window.history.length > 1) {
                    router.back()
                  } else {
                    router.push("/medprep-ai/practice-cases")
                  }
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isSubmitted ? "Practice cases" : "Back"}
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  SOAP Note - {medicalCase.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Patient: {medicalCase.patientProfile?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isSubmitted && (
                <div className="text-sm text-muted-foreground">
                  {autoSaveEnabled ? "Auto-save enabled" : "Auto-save disabled"}
                </div>
              )}
              {!isSubmitted && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {completedSections}/4 sections
                  </span>
                  <Progress value={completionPercent} className="h-2 w-20" />
                </div>
              )}
              {!isSubmitted && <Button variant="outline" size="sm" onClick={handleSaveDraft}><Save className="h-4 w-4 mr-2" />Save Draft</Button>}
              {!isSubmitted &&
                (canSubmit ? (
                  submitButton
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed rounded-md">
                        {submitButton}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-xs text-left leading-relaxed"
                    >
                      {submitTooltip}
                    </TooltipContent>
                  </Tooltip>
                ))}
            </div>
          </div>
          {!isSubmitted && !canSubmit && (
            <p className="mt-2 border-t border-[color:var(--app-border)] pt-2 text-xs text-amber-800 dark:text-amber-200/90">
              <span className="font-semibold">Submit locked:</span> {submitBlockedMessage}
            </p>
          )}
        </div>
      </header>

      <div className="flex w-full flex-1 flex-col space-y-6">
        {!isSubmitted && !canSubmit && (
          <Alert className="border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            <AlertDescription className="space-y-3">
              <div>
                <p className="font-semibold">Why is Submit for Grading disabled?</p>
                <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-100/90">
                  The progress bar only tracks SOAP section length. Submit also requires a
                  completed case interview so grading can compare your note with the encounter.
                </p>
              </div>
              <ul className="space-y-2">
                <SubmitReadinessRow
                  done={soapSectionsComplete}
                  title={`SOAP sections (${completedSections}/4)`}
                  detail={
                    soapSectionsComplete
                      ? "All sections meet the minimum character count."
                      : "Fill Subjective, Objective, Assessment, and Plan to each section minimum."
                  }
                />
                <SubmitReadinessRow
                  done={hasCaseInterview}
                  title={`Case interview (${studentQuestionCount} student question${studentQuestionCount === 1 ? "" : "s"})`}
                  detail={
                    hasCaseInterview
                      ? "Your encounter includes questions you asked the patient."
                      : "Go back to the case and ask at least one question before submitting."
                  }
                />
              </ul>
              {!hasCaseInterview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-amber-300 bg-white hover:bg-amber-50 dark:border-amber-600/50 dark:bg-transparent dark:hover:bg-amber-900/30"
                  onClick={() => {
                    if (window.history.length > 1) {
                      router.back()
                    } else {
                      router.push("/dashboard")
                    }
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Return to case interview
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}
        {isLoadingSoap && !isSubmitted ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your saved SOAP note…</p>
            </CardContent>
          </Card>
        ) : null}
        {isSubmitted && grading ? (
          <>
          <Card className="border-primary-200/80 bg-primary-50/80 dark:border-primary-500/30 dark:bg-primary-950/30">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Consultation complete
                </p>
                <p className="text-sm text-muted-foreground">
                  You have finished this practice case — interview, diagnosis, SOAP note, and
                  grading. Return to practice cases to start another encounter.
                </p>
              </div>
              <Button
                onClick={() => void handleFinishConsultation()}
                disabled={isFinishingConsultation}
                className="shrink-0"
              >
                {isFinishingConsultation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finishing…
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Return to practice cases
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          <Tabs defaultValue="comprehensive" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/60 text-muted-foreground dark:bg-muted/30">
              <TabsTrigger value="comprehensive">Comprehensive Report</TabsTrigger>
              <TabsTrigger value="comparison">AI Comparison</TabsTrigger>
              <TabsTrigger value="yours">Your SOAP Note</TabsTrigger>
            </TabsList>
            <TabsContent value="comprehensive" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    SOAP summary <Badge>{grading.overallGrade}%</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={grading.overallGrade} />
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Subjective</p>
                      <p className="font-bold text-foreground">{grading.subjectiveGrade}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Objective</p>
                      <p className="font-bold text-foreground">{grading.objectiveGrade}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Assessment</p>
                      <p className="font-bold text-foreground">{grading.assessmentGrade}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="font-bold text-foreground">{grading.planGrade}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {conversationGrading ? (
                <GradingReport
                  soapGrading={grading}
                  conversationGrading={conversationGrading}
                  conversation={conversation}
                  medicalCase={medicalCase}
                  tabReports={tabReports}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    {isGradingConversation ? (
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    ) : (
                      "Conversation grading not available"
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="comparison">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle>Your SOAP</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>{subjective}</p><p>{objective}</p><p>{assessment}</p><p>{plan}</p></CardContent></Card>
                <Card><CardHeader><CardTitle>AI Reference</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>{aiSOAP?.subjective}</p><p>{aiSOAP?.objective}</p><p>{aiSOAP?.assessment}</p><p>{aiSOAP?.plan}</p></CardContent></Card>
              </div>
            </TabsContent>
            <TabsContent value="yours">
              <Card><CardHeader><CardTitle>Your Submitted SOAP Note</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>{subjective}</p><p>{objective}</p><p>{assessment}</p><p>{plan}</p></CardContent></Card>
            </TabsContent>
          </Tabs>
          </>
        ) : (
          <>
            <Card className="border-blue-200/80 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-500/20 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/45">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      SOAP sections
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-200/90">
                      Minimum length per section — not the same as ready to submit
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center"><div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{completionPercent}%</div><div className="text-xs text-blue-700 dark:text-blue-200/80">Complete</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{writingClock}</div><div className="text-xs text-blue-700 dark:text-blue-200/80">Time</div></div>
                  </div>
                </div>
                <Progress value={completionPercent} className="h-3" />
              </CardContent>
            </Card>


            {(Object.keys(SECTION_META) as SectionKey[]).map((section) => (
              <Card key={section}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {SECTION_META[section].title}{" "}
                        {completion[section] && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {SECTION_META[section].description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{countWords(values[section])} words</Badge>
                      <Button variant="outline" size="sm" disabled={assistantBusy === section} onClick={() => handleTipsFromAI(section)}>
                        {assistantBusy === section ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />} Tips
                      </Button>
                      <Button variant="outline" size="sm" disabled={assistantBusy === section} onClick={() => handleGenerateSectionFromAI(section)}>
                        {assistantBusy === section ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Generate from AI
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {showTips && (
                    <div className="rounded-md border border-amber-200/80 bg-amber-50/90 p-3 dark:border-amber-500/25 dark:bg-amber-950/35">
                      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
                        <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Writing tips
                      </p>
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {TIPS[section].map((tip, i) => (
                          <li
                            key={i}
                            className="list-none rounded-md border border-amber-100/90 bg-white/80 px-2.5 py-2 text-sm text-amber-950 dark:border-amber-800/40 dark:bg-slate-900/50 dark:text-amber-50/95"
                          >
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {assistantSuggestions[section].length > 0 && (
                    <div className="rounded-md border border-blue-200/80 bg-blue-50/90 p-3 text-sm dark:border-blue-500/30 dark:bg-blue-900/25 dark:text-slate-200">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900 dark:text-blue-100">
                        AI suggestions
                      </p>
                      <div className="space-y-2">
                        {assistantSuggestions[section].map((suggestion, index) => (
                          <div key={index} className="prose prose-sm max-w-none dark:prose-invert">
                            <MarkdownContent variant="default">{suggestion}</MarkdownContent>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Textarea
                    value={values[section]}
                    onChange={(event) => setters[section](event.target.value)}
                    onFocus={() => setActiveSection(section)}
                    placeholder={SECTION_META[section].placeholder}
                    className="min-h-[200px] border-border bg-background text-foreground placeholder:text-muted-foreground dark:bg-slate-950/50"
                    disabled={isSubmitted}
                  />
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {!isSubmitted && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex flex-col gap-2">
            <div className={cn(APP_GLASS_CARD, "space-y-1 rounded-lg border p-2 shadow-lg")}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTips((prev) => !prev)}
                className="w-full justify-start"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                {showTips ? "Hide" : "Show"} Tips
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoSaveEnabled((prev) => !prev)}
                className="w-full justify-start"
              >
                <Save className="w-4 h-4 mr-2" />
                {autoSaveEnabled ? "Disable" : "Enable"} Auto-save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveDraft}
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex rounded-full",
                    !canSubmit && !isSubmitting && "cursor-not-allowed",
                  )}
                >
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canSubmit}
                    className="h-14 w-14 rounded-full shadow-lg"
                    size="lg"
                    aria-label={
                      canSubmit ? "Submit for grading" : `Submit locked: ${submitBlockedMessage}`
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Send className="h-6 w-6" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canSubmit && !isSubmitting && (
                <TooltipContent side="left" className="max-w-xs text-left leading-relaxed">
                  {submitTooltip}
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  )
}
