"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent"
import type { Conversation, MedicalCase, SOAPNote } from "@/lib/fyp/data-models"
import type { SOAPGrading } from "@/lib/fyp/soap-service"
import type { ConversationGrading } from "@/lib/fyp/ai-service"
import { soapAssistantService } from "@/lib/fyp/soap-assistant-service"
import { GradingReport } from "./grading-report"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Send, CheckCircle, Loader2, Lightbulb, Zap, AlertCircle, HelpCircle, Download } from "lucide-react"

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

export function SOAPNoteEditor({ conversation, medicalCase, student }: SOAPNoteEditorProps) {
  const router = useRouter()
  const [subjective, setSubjective] = useState("")
  const [objective, setObjective] = useState("")
  const [assessment, setAssessment] = useState("")
  const [plan, setPlan] = useState("")
  const [activeSection, setActiveSection] = useState<SectionKey>("subjective")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [grading, setGrading] = useState<SOAPGrading | null>(null)
  const [conversationGrading, setConversationGrading] = useState<ConversationGrading | null>(null)
  const [isGradingConversation, setIsGradingConversation] = useState(false)
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

  useEffect(() => {
    const timer = setInterval(() => setWritingTime((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadExistingSOAP = async () => {
      try {
        const response = await fetch(
          `/api/soap/get?conversationId=${conversation.id}&userId=${encodeURIComponent(student.id)}`
        )
        const result = await response.json()
        if (result.success && result.soapNote) {
          setSubjective(result.soapNote.subjective || "")
          setObjective(result.soapNote.objective || "")
          setAssessment(result.soapNote.assessment || "")
          setPlan(result.soapNote.plan || "")
          setIsSubmitted(Boolean(result.soapNote.grade))
        }
      } catch {}
    }
    loadExistingSOAP()
  }, [conversation.id])

  const handleSaveDraft = useCallback(async () => {
    const payload: SOAPNote = {
      id: crypto.randomUUID(),
      conversationId: conversation.id,
      studentId: student.id,
      subjective,
      objective,
      assessment,
      plan,
      submittedAt: new Date().toISOString(),
    }
    await fetch("/api/soap/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  }, [conversation.id, student.id, subjective, objective, assessment, plan])

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
    setError(null)
    setIsSubmitting(true)
    setIsGeneratingAI(true)
    try {
      const aiResponse = await fetch("/api/soap/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation, medicalCase }),
      })
      const aiResult = await aiResponse.json()
      if (!aiResult.success) throw new Error(aiResult.error || "Failed to generate AI SOAP note")
      setAiSOAP(aiResult.aiSOAP)
      setIsGeneratingAI(false)

      const gradeResponse = await fetch("/api/soap/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentSOAP: { conversationId: conversation.id, studentId: student.id, subjective, objective, assessment, plan, aiGeneratedSOAP: aiResult.aiSOAP },
          aiSOAP: aiResult.aiSOAP,
        }),
      })
      const gradeResult = await gradeResponse.json()
      if (!gradeResult.success) throw new Error(gradeResult.error || "Failed to grade SOAP note")
      setGrading(gradeResult.grading)

      setIsGradingConversation(true)
      const conversationGradeResponse = await fetch("/api/ai/grade-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation, medicalCase }),
      })
      const conversationGradeResult = await conversationGradeResponse.json()
      if (conversationGradeResult.success) setConversationGrading(conversationGradeResult.grading)
      setIsGradingConversation(false)

      await fetch("/api/soap/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          studentId: student.id,
          subjective,
          objective,
          assessment,
          plan,
          submittedAt: new Date().toISOString(),
          grade: gradeResult.grading.overallGrade,
          feedback: gradeResult.grading.feedback?.overall?.join(" ") || "",
          aiGeneratedSOAP: aiResult.aiSOAP,
        }),
      })
      setIsSubmitted(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit SOAP note")
    } finally {
      setIsSubmitting(false)
      setIsGeneratingAI(false)
      setIsGradingConversation(false)
    }
  }

  const writingClock = `${Math.floor(writingTime / 60)}:${String(writingTime % 60).padStart(2, "0")}`
  const canSubmit = conversation.messages.some((message) => message.role === "student")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back()
                  } else {
                    router.push("/")
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">SOAP Note - {medicalCase.title}</h1>
                <p className="text-sm text-gray-600">Patient: {medicalCase.patientProfile?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isSubmitted && <div className="text-sm text-gray-600">{autoSaveEnabled ? "Auto-save enabled" : "Auto-save disabled"}</div>}
              {!isSubmitted && <div className="flex items-center gap-2"><span className="text-sm text-gray-600">{completedSections}/4 sections</span><Progress value={completionPercent} className="w-20 h-2" /></div>}
              {!isSubmitted && <Button variant="outline" size="sm" onClick={handleSaveDraft}><Save className="h-4 w-4 mr-2" />Save Draft</Button>}
              {!isSubmitted && <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !canSubmit}><Send className="h-4 w-4 mr-2" />{isSubmitting ? "Submitting..." : "Submit for Grading"}</Button>}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {error && <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        {isGeneratingAI && <Alert><AlertDescription>Generating AI reference SOAP note...</AlertDescription></Alert>}

        {isSubmitted && grading ? (
          <Tabs defaultValue="comprehensive" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
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
                      <p className="text-sm">Subjective</p>
                      <p className="font-bold">{grading.subjectiveGrade}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm">Objective</p>
                      <p className="font-bold">{grading.objectiveGrade}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm">Assessment</p>
                      <p className="font-bold">{grading.assessmentGrade}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm">Plan</p>
                      <p className="font-bold">{grading.planGrade}%</p>
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
        ) : (
          <>
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div><h3 className="text-lg font-semibold text-blue-900">Writing Progress</h3><p className="text-sm text-blue-700">Track your SOAP note completion</p></div>
                  <div className="flex gap-4">
                    <div className="text-center"><div className="text-2xl font-bold text-blue-900">{completionPercent}%</div><div className="text-xs text-blue-700">Complete</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-blue-900">{writingClock}</div><div className="text-xs text-blue-700">Time</div></div>
                  </div>
                </div>
                <Progress value={completionPercent} className="h-3" />
              </CardContent>
            </Card>

            {showTips && (
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Lightbulb className="h-5 w-5" />Writing Tips - {SECTION_META[activeSection].title}</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowTips(false)}><CheckCircle className="h-4 w-4" /></Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {TIPS[activeSection].map((tip, i) => <div key={i} className="text-sm bg-white/60 rounded p-2">{tip}</div>)}
                  </div>
                </CardContent>
              </Card>
            )}

            {(Object.keys(SECTION_META) as SectionKey[]).map((section) => (
              <Card key={section}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">{SECTION_META[section].title} {completion[section] && <CheckCircle className="h-4 w-4 text-green-600" />}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{SECTION_META[section].description}</p>
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
                  {assistantSuggestions[section].length > 0 && (
                    <div className="border border-blue-200 bg-blue-50 rounded p-3 text-sm">
                      {assistantSuggestions[section].map((suggestion, index) => (
                        <div key={index} className="prose prose-sm max-w-none"><MarkdownContent variant="default">{suggestion}</MarkdownContent></div>
                      ))}
                    </div>
                  )}
                  <Textarea
                    value={values[section]}
                    onChange={(event) => setters[section](event.target.value)}
                    onFocus={() => setActiveSection(section)}
                    placeholder={SECTION_META[section].placeholder}
                    className="min-h-[200px]"
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
            <div className="bg-white rounded-lg shadow-lg border p-2 space-y-1">
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
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
              className="w-14 h-14 rounded-full shadow-lg"
              size="lg"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
