"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LearningSession, LearningConversationMessage } from "@/lib/fyp/learning-service"
import { sampleCases } from "@/lib/fyp/data-models"
import { learningService } from "@/lib/fyp/learning-service"
import { getClinicalUserId } from "@/lib/fyp/medprep-user"
import { authService } from "@/shared/services/auth.service"
import { databaseConversationService } from "@/lib/fyp/database-conversation-service"
import { 
  ArrowLeft, Play, Pause, MessageCircle, FileText, User, Users, Stethoscope, 
  HelpCircle, Clock, CheckCircle, AlertCircle, AlertTriangle, Sparkles, BookOpen, 
  Brain, Star, GraduationCap, Heart, Activity, Target, Zap, 
  ChevronRight, Lightbulb, Award, TrendingUp, Mic, Video, 
  Share, Download, RefreshCw, Eye, EyeOff, Send, X, Minimize2, 
  ChevronDown, ChevronUp
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/shared/utils/cn"
import { APP_PAGE_SHELL } from "@/app/config/app-shell"

function learningConversationSoapFingerprint(messages: LearningConversationMessage[]): string {
  try {
    return JSON.stringify(
      messages.map((m) => ({ role: m.role, content: m.content, ts: m.timestamp })),
    )
  } catch {
    return String(messages.length)
  }
}

function formatSessionDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0
  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 1) return "< 1 min"
  if (totalMin < 60) return `${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
import remarkGfm from "remark-gfm"

interface LearningInterfaceProps {
  session: LearningSession
  onSessionUpdate: (session: LearningSession) => void
  medicalCase?: any
  /** When true, session was loaded from the server; skip local "Continue Learning?" prompt on first paint. */
  hydratedFromDatabase?: boolean
}

export function LearningInterface({
  session,
  onSessionUpdate,
  medicalCase: propMedicalCase,
  hydratedFromDatabase = false,
}: LearningInterfaceProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [studentQuestion, setStudentQuestion] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSOAPNote, setShowSOAPNote] = useState(false)
  const [studentQuestionResponse, setStudentQuestionResponse] = useState("")
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [hasLoadedSession, setHasLoadedSession] = useState(false)
  const [justResumed, setJustResumed] = useState(false)
  const [activeTab, setActiveTab] = useState<"conversation" | "soap">("conversation")
  /** Eye toggle in header: Learning Insight panels under doctor messages in the conversation. */
  const [showConversationInsights, setShowConversationInsights] = useState(true)
  const [conversationSpeed, setConversationSpeed] = useState(1)
  const lastResumedSessionId = useRef<string | null>(null)
  const simulationFlowLock = useRef(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [simulationError, setSimulationError] = useState<string | null>(null)
  /** Fingerprint of the conversation the current SOAP note was generated for (learning tab). */
  const soapSyncedConversationFingerprintRef = useRef<string | null>(null)
  const soapFetchAbortRef = useRef<AbortController | null>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const onSessionUpdateRef = useRef(onSessionUpdate)
  onSessionUpdateRef.current = onSessionUpdate
  const [isSoapRefreshing, setIsSoapRefreshing] = useState(false)

  /** Content-addressed primitive — effect deps stable across conversation array identity churn. */
  const conversationContentKey = learningConversationSoapFingerprint(session.conversation)

  /** Nurse Report → Session Progress: derive from simulated interview (doctor ↔ patient). */
  const sessionProgressMetrics = useMemo(() => {
    const msgs = session.conversation ?? []
    const doctorTurns = msgs.filter((m) => m.role === "doctor").length
    const patientTurns = msgs.filter((m) => m.role === "patient").length
    const exchangePairs = Math.min(doctorTurns, patientTurns)
    const conversationQuality = Math.min(100, Math.round((exchangePairs / 10) * 100))
    return { questionsAsked: doctorTurns, conversationQuality }
  }, [session.conversation])

  const [sessionProgressClock, setSessionProgressClock] = useState(() => Date.now())
  useEffect(() => {
    if (session.isComplete) return
    setSessionProgressClock(Date.now())
  }, [session.isComplete, conversationContentKey])
  useEffect(() => {
    if (session.isComplete) return
    const id = window.setInterval(() => setSessionProgressClock(Date.now()), 15000)
    return () => window.clearInterval(id)
  }, [session.isComplete])

  const sessionProgressDurationMs = useMemo(() => {
    const start = Date.parse(session.createdAt)
    if (!Number.isFinite(start)) return 0
    if (session.isComplete) {
      let end = start
      for (const m of session.conversation ?? []) {
        const t = Date.parse(m.timestamp)
        if (Number.isFinite(t) && t >= end) end = t
      }
      return Math.max(0, end - start)
    }
    return Math.max(0, sessionProgressClock - start)
  }, [session.createdAt, session.isComplete, session.conversation, sessionProgressClock])

  const sessionProgressDurationLabel = useMemo(() => formatSessionDuration(sessionProgressDurationMs), [sessionProgressDurationMs])

  // Persist learning sessions under the real user id (matches dashboard "ongoing cases").
  useEffect(() => {
    const uid = getClinicalUserId(authService.getCurrentUser())
    if (!uid || session.studentId === uid) return
    onSessionUpdateRef.current({ ...sessionRef.current, studentId: uid })
  }, [session.studentId])

  // Ask Doctor popup state
  const [isDoctorChatOpen, setIsDoctorChatOpen] = useState(false)
  const [isDoctorChatMinimized, setIsDoctorChatMinimized] = useState(false)
  const [studentDoctorChat, setStudentDoctorChat] = useState<Array<{ role: string; content: string; timestamp: string }>>([])
  const [isDoctorResponding, setIsDoctorResponding] = useState(false)
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<{
    demographics: boolean
    medicalHistory: boolean
    socialHistory: boolean
    familyHistory: boolean
    chiefComplaint: boolean
    presentingSymptoms: boolean
    vitalSigns: boolean
    clinicalNotes: boolean
    initialAssessment: boolean
    learningGuidelines: boolean
    clinicalTips: boolean
    keyAreas: boolean
    redFlags: boolean
    sessionProgress: boolean
  }>({
    demographics: false,
    medicalHistory: false,
    socialHistory: false,
    familyHistory: false,
    chiefComplaint: false,
    presentingSymptoms: false,
    vitalSigns: false,
    clinicalNotes: false,
    initialAssessment: false,
    learningGuidelines: false,
    clinicalTips: false,
    keyAreas: false,
    redFlags: false,
    sessionProgress: false
  })

  // Tab states for each section
  const [activeTabs, setActiveTabs] = useState<{
    demographics: string
    medicalHistory: string
    socialHistory: string
    familyHistory: string
    chiefComplaint: string
    presentingSymptoms: string
    vitalSigns: string
    clinicalNotes: string
    initialAssessment: string
    learningGuidelines: string
    clinicalTips: string
    keyAreas: string
    redFlags: string
    sessionProgress: string
  }>({
    demographics: 'overview',
    medicalHistory: 'overview',
    socialHistory: 'overview',
    familyHistory: 'overview',
    chiefComplaint: 'overview',
    presentingSymptoms: 'overview',
    vitalSigns: 'overview',
    clinicalNotes: 'overview',
    initialAssessment: 'overview',
    learningGuidelines: 'overview',
    clinicalTips: 'overview',
    keyAreas: 'overview',
    redFlags: 'overview',
    sessionProgress: 'overview'
  })

  // Nurse report section navigation state
  const [activeNurseReportSection, setActiveNurseReportSection] = useState<string>('chiefComplaint')
  const [showAllNurseReport, setShowAllNurseReport] = useState<boolean>(false)

  // Patient information section navigation state
  const [activePatientInfoSection, setActivePatientInfoSection] = useState<string>('demographics')
  const [showAllPatientInfo, setShowAllPatientInfo] = useState<boolean>(false)

  // Load medical case data - check both sample cases and localStorage for generated cases
  const [medicalCase, setMedicalCase] = useState<any>(null)
  const medicalCaseRef = useRef<any>(null)
  medicalCaseRef.current = medicalCase

  // Patient information state
  const [patientInfo, setPatientInfo] = useState<{
    demographics: { maritalStatus: string; insurance: string }
    medicalHistory: string[]
    socialHistory: { smoking: string; alcohol: string; exercise: string }
    familyHistory: { mother: string; father: string }
  } | null>(null)
  const [isLoadingPatientInfo, setIsLoadingPatientInfo] = useState(false)
  
  // Vital signs state
  const [vitalSigns, setVitalSigns] = useState<{
    bloodPressure: string
    heartRate: number
    temperature: string
    respiratoryRate: number
  } | null>(null)
  const [isLoadingVitalSigns, setIsLoadingVitalSigns] = useState(false)

  const parseApiJson = useCallback(async (response: Response, fallbackError: string) => {
    const rawText = await response.text()
    let payload: any = null
    try {
      payload = rawText ? JSON.parse(rawText) : null
    } catch {
      if (!response.ok) {
        throw new Error(`${fallbackError} (${response.status}): ${rawText.slice(0, 140)}`)
      }
      throw new Error(`${fallbackError}: invalid JSON response`)
    }
    if (!response.ok) {
      const apiError = payload?.error || payload?.message || rawText || fallbackError
      throw new Error(`${fallbackError} (${response.status}): ${apiError}`)
    }
    return payload
  }, [])
  
  // Generate patient information using LLM
  const generatePatientInformation = useCallback(async () => {
    if (!medicalCase || patientInfo || isLoadingPatientInfo) {
      return
    }
    
    setIsLoadingPatientInfo(true)
    try {
      const response = await fetch("/api/learning/patient-information", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disease: medicalCase.disease,
          specialty: medicalCase.specialty,
          patientProfile: sessionRef.current.patientProfile,
          symptoms: medicalCase.symptoms,
        }),
      })
      const generatedInfo = await parseApiJson(response, "Failed to generate patient information")
      setPatientInfo(generatedInfo)
      onSessionUpdateRef.current({
        ...sessionRef.current,
        patientInfo: generatedInfo,
      })
    } catch (error) {
      console.error("Error generating patient information:", error)
    } finally {
      setIsLoadingPatientInfo(false)
    }
  }, [medicalCase, patientInfo, isLoadingPatientInfo, parseApiJson])

  const generateVitalSigns = useCallback(async () => {
    if (!medicalCase || vitalSigns || isLoadingVitalSigns) {
      return
    }

    setIsLoadingVitalSigns(true)

    try {
      const response = await fetch("/api/learning/vital-signs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disease: medicalCase.disease,
          specialty: medicalCase.specialty,
          patientProfile: sessionRef.current.patientProfile,
          symptoms: medicalCase.symptoms,
        }),
      })
      const generatedVitalSigns = await parseApiJson(response, "Failed to generate vital signs")
      setVitalSigns(generatedVitalSigns)
      onSessionUpdateRef.current({
        ...sessionRef.current,
        vitalSigns: generatedVitalSigns,
      })
    } catch (error) {
      console.error("Error generating vital signs:", error)
      const defaultVitalSigns = {
        bloodPressure: "120/80",
        heartRate: 72,
        temperature: "98.6°F",
        respiratoryRate: 16,
      }
      setVitalSigns(defaultVitalSigns)
      onSessionUpdateRef.current({
        ...sessionRef.current,
        vitalSigns: defaultVitalSigns,
      })
    } finally {
      setIsLoadingVitalSigns(false)
    }
  }, [medicalCase, vitalSigns, isLoadingVitalSigns, parseApiJson])

  useEffect(() => {
    // Use prop medical case if available, otherwise load from sample cases or localStorage
    if (propMedicalCase) {
      setMedicalCase(propMedicalCase)
      return
    }
    
    // First check if it's an existing case
    let caseData = sampleCases.find((c) => c.id === session.caseId)
    
    // If not found in sample cases, check localStorage for generated cases
    if (!caseData) {
      const generatedCaseData = localStorage.getItem('generatedCase')
      if (generatedCaseData) {
        try {
          const generatedCase = JSON.parse(generatedCaseData)
          if (generatedCase.id === session.caseId) {
            caseData = generatedCase
          }
        } catch (parseError) {
          console.error("Error parsing generated case:", parseError)
        }
      }
    }
    
    setMedicalCase(caseData)
  }, [session.caseId, propMedicalCase])

  // Generate patient information when medical case is loaded
  useEffect(() => {
    
    // If session already has patient info, use it
    if (session.patientInfo && !patientInfo) {
      setPatientInfo(session.patientInfo)
      return
    }
    
    if (medicalCase && !patientInfo && !isLoadingPatientInfo) {
      generatePatientInformation()
    }
  }, [generatePatientInformation, isLoadingPatientInfo, medicalCase, patientInfo, session.patientInfo, generatePatientInformation])

  // Generate vital signs when medical case is loaded
  useEffect(() => {
    
    // If session already has vital signs, use them
    if (session.vitalSigns && !vitalSigns) {
      setVitalSigns(session.vitalSigns)
      return
    }
    
    if (medicalCase && !vitalSigns && !isLoadingVitalSigns) {
      generateVitalSigns()
    }
  }, [medicalCase, vitalSigns, isLoadingVitalSigns, session.vitalSigns, generateVitalSigns])

  const didApplyDbUiRef = useRef(false)
  // Restore UI layout once when session was hydrated from the database
  useEffect(() => {
    if (!hydratedFromDatabase || !session.uiState || didApplyDbUiRef.current) return
    didApplyDbUiRef.current = true
    setActivePatientInfoSection(session.uiState.activePatientInfoSection || "demographics")
    setActiveNurseReportSection(session.uiState.activeNurseReportSection || "chiefComplaint")
    setActiveTab(session.uiState.activeTab || "conversation")
    if (session.uiState.collapsedSections) {
      setCollapsedSections((prev) => ({ ...prev, ...session.uiState!.collapsedSections }))
    }
  }, [hydratedFromDatabase, session.uiState])

  // Save UI state when it changes — merge onto latest session via ref so this callback does not
  // thrash whenever the parent swaps the session object (avoids persistent save→re-render loops).
  const saveUIState = useCallback(() => {
    const s = sessionRef.current
    const nextUi = {
      activePatientInfoSection,
      activeNurseReportSection,
      activeTab,
      collapsedSections,
    }
    const prevUi = s.uiState
    if (
      prevUi &&
      prevUi.activePatientInfoSection === nextUi.activePatientInfoSection &&
      prevUi.activeNurseReportSection === nextUi.activeNurseReportSection &&
      prevUi.activeTab === nextUi.activeTab &&
      JSON.stringify(prevUi.collapsedSections) === JSON.stringify(nextUi.collapsedSections)
    ) {
      return
    }
    onSessionUpdateRef.current({
      ...s,
      uiState: nextUi,
    })
  }, [activePatientInfoSection, activeNurseReportSection, activeTab, collapsedSections])

  // Save UI state when it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveUIState()
    }, 500) // Debounce UI state saves

    return () => clearTimeout(timeoutId)
  }, [activePatientInfoSection, activeNurseReportSection, activeTab, collapsedSections, saveUIState])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [session.conversation])

  useEffect(() => {
    if (!hasLoadedSession) {
      setHasLoadedSession(true)
    }
  }, [session.id, hasLoadedSession])

  useEffect(() => {
    soapSyncedConversationFingerprintRef.current = null
  }, [session.id])

  useEffect(() => {
    // Resume guard: clear one-time marker after resume flow.
    if (lastResumedSessionId.current === session.id) {
      lastResumedSessionId.current = null
    }
  }, [hasLoadedSession, session.id])

  useEffect(() => {
    const fp = conversationContentKey
    const conversationChangedVersusSoap =
      soapSyncedConversationFingerprintRef.current !== null &&
      soapSyncedConversationFingerprintRef.current !== fp

    const shouldFetchSoap =
      activeTab === "soap" &&
      !session.isComplete &&
      (conversationChangedVersusSoap ||
        soapSyncedConversationFingerprintRef.current === null)

    if (!shouldFetchSoap) {
      return
    }

    soapFetchAbortRef.current?.abort()
    const ac = new AbortController()
    soapFetchAbortRef.current = ac

    const run = async () => {
      setIsSoapRefreshing(true)
      const fpAtRequest = fp
      try {
        const ctxSession = sessionRef.current
        const caseData = medicalCaseRef.current
        const context = {
          caseId: ctxSession.caseId,
          disease: ctxSession.disease,
          diseaseName: caseData?.diseaseName ?? caseData?.disease ?? ctxSession.disease,
          specialty: caseData?.specialty ?? "",
          isRare: Boolean(caseData?.isRare),
          symptoms: caseData?.symptoms ?? [],
          history: caseData?.history ?? [],
          labs: caseData?.labs ?? {},
          patientProfile: ctxSession.patientProfile,
          conversationHistory: ctxSession.conversation.map((msg) => ({
            role: msg.role as "student" | "patient" | "doctor",
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        }

        const response = await fetch("/api/learning/soap-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation: ctxSession.conversation,
            context,
          }),
          signal: ac.signal,
        })
        const soapNote = await parseApiJson(response, "Failed to generate SOAP note")
        if (ac.signal.aborted) return

        const hasBody =
          Boolean(soapNote.subjective?.trim()) ||
          Boolean(soapNote.objective?.trim()) ||
          Boolean(soapNote.assessment?.trim()) ||
          Boolean(soapNote.plan?.trim())

        if (hasBody) {
          soapSyncedConversationFingerprintRef.current = fpAtRequest
          onSessionUpdateRef.current({
            ...sessionRef.current,
            soapNote,
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return
        console.error("Error generating SOAP note:", error)
      } finally {
        setIsSoapRefreshing(false)
      }
    }

    void run()

    return () => {
      ac.abort()
      setIsSoapRefreshing(false)
    }
  }, [activeTab, session.isComplete, conversationContentKey, parseApiJson])

  useEffect(() => {
    if (hasLoadedSession) {
      learningService.saveLearningSession(session).catch(console.error)
    }
  }, [session, hasLoadedSession])

  const activeCaseIdRef = useRef<string | null>(null)

  // Clear conversation only when navigating to a different case (not on every message).
  // getLearningSession() no longer reads localStorage, so we must not treat "no cache" as stale.
  useEffect(() => {
    if (lastResumedSessionId.current === session.id) {
      lastResumedSessionId.current = null
      return
    }

    const previousCaseId = activeCaseIdRef.current
    activeCaseIdRef.current = session.caseId

    if (
      previousCaseId !== null &&
      previousCaseId !== session.caseId &&
      session.conversation.length > 0
    ) {
      onSessionUpdate({
        ...session,
        conversation: [],
        isComplete: false,
        soapNote: undefined,
      })
    }
  }, [onSessionUpdate, session, session.caseId, session.id])

  const generateSoapForCase = useCallback(async () => {
      if (
        activeTab === "soap" &&
        (!session.soapNote || !session.soapNote.subjective) &&
        !isProcessing
      ) {
        setIsProcessing(true)
        try {
          const context = {
            caseId: session.caseId,
            disease: session.disease,
            symptoms: medicalCase?.symptoms || [],
            patientProfile: session.patientProfile,
            conversationHistory: [],
          }
          const response = await fetch("/api/learning/soap-note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversation: [], context }),
          })
          const soapNote = await parseApiJson(response, "Failed to generate SOAP note")
          if (
            soapNote.subjective?.trim() ||
            soapNote.objective?.trim() ||
            soapNote.assessment?.trim() ||
            soapNote.plan?.trim()
          ) {
            const updatedSession = {
              ...session,
              soapNote,
            }
            onSessionUpdate(updatedSession)
          }
        } catch (error) {
          console.error("Error generating SOAP note:", error)
        } finally {
          setIsProcessing(false)
        }
      }
  }, [activeTab, isProcessing, medicalCase?.symptoms, onSessionUpdate, parseApiJson, session])

  useEffect(() => {
    generateSoapForCase()
  }, [generateSoapForCase])

  const startConversation = async () => {
    if (session.conversation.length > 0 || simulationFlowLock.current || session.isComplete) return

    simulationFlowLock.current = true
    setIsPlaying(true)
    setIsProcessing(true)
    setSimulationError(null)

    try {
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: [],
      }

      const response = await fetch("/api/learning/doctor-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, conversation: [] }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate doctor question")
      }

      const { question, explanation } = await parseApiJson(response, "Failed to generate doctor question")

      const doctorMessage: LearningConversationMessage = {
        role: "doctor",
        content: question,
        explanation,
        timestamp: new Date().toISOString(),
      }

      const updatedSession = {
        ...session,
        conversation: [doctorMessage],
      }

      onSessionUpdate(updatedSession)
    } catch (error) {
      console.error("Error starting conversation:", error)
      setSimulationError(
        error instanceof Error ? error.message : "Could not start the simulation. A default opening question was loaded."
      )
      // Ensure simulation can still begin even if AI endpoint fails.
      const fallbackDoctorMessage: LearningConversationMessage = {
        role: "doctor",
        content: "Hello, I am your attending doctor today. Can you tell me what brings you in and when your symptoms began?",
        explanation:
          "We begin with an open-ended question to establish the chief complaint and symptom timeline.",
        timestamp: new Date().toISOString(),
      }
      onSessionUpdate({
        ...session,
        conversation: [fallbackDoctorMessage],
      })
    } finally {
      setIsProcessing(false)
      simulationFlowLock.current = false
    }
  }

  const continueConversation = async () => {
    if (session.conversation.length === 0 || session.isComplete || simulationFlowLock.current) return

    simulationFlowLock.current = true
    setIsProcessing(true)
    setSimulationError(null)

    try {
      const lastMessage = session.conversation[session.conversation.length - 1]

      if (lastMessage.role === "doctor") {
        const context = {
          caseId: session.caseId,
          disease: session.disease,
          symptoms: medicalCase?.symptoms || [],
          patientProfile: session.patientProfile,
          conversationHistory: session.conversation.map((msg) => ({
            role: msg.role as "student" | "patient" | "doctor",
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        }

        const patientResponse = await fetch("/api/learning/patient-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: lastMessage.content, context }),
        })

        if (!patientResponse.ok) {
          throw new Error("Failed to generate patient response")
        }

        const { response: patientResponseText } = await parseApiJson(
          patientResponse,
          "Failed to generate patient response"
        )

        const patientMessage: LearningConversationMessage = {
          role: "patient",
          content: patientResponseText,
          timestamp: new Date().toISOString(),
        }

        const updatedConversation = [...session.conversation, patientMessage]

        const shouldEndResponse = await fetch("/api/learning/should-end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation: updatedConversation, disease: session.disease }),
        })

        if (!shouldEndResponse.ok) {
          throw new Error("Failed to check conversation status")
        }

        const { shouldEnd, reason } = await parseApiJson(
          shouldEndResponse,
          "Failed to check conversation status"
        )

        if (shouldEnd) {
          const soapResponse = await fetch("/api/learning/soap-note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversation: updatedConversation, context }),
          })

          if (!soapResponse.ok) {
            throw new Error("Failed to generate SOAP note")
          }

          const soapNote = await parseApiJson(soapResponse, "Failed to generate SOAP note")

          const finalSession = {
            ...session,
            conversation: updatedConversation,
            soapNote,
            isComplete: true,
          }

          onSessionUpdate(finalSession)
          setIsPlaying(false)
          setShowSOAPNote(true)
          
          // Track case completion
          // Note: studentId tracking would need to be implemented in the session
        } else {
          const doctorResponse = await fetch("/api/learning/doctor-question", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context, conversation: updatedConversation }),
          })

          if (!doctorResponse.ok) {
            throw new Error("Failed to generate doctor question")
          }

          const { question, explanation } = await parseApiJson(
            doctorResponse,
            "Failed to generate doctor question"
          )

          const nextDoctorMessage: LearningConversationMessage = {
            role: "doctor",
            content: question,
            explanation,
            timestamp: new Date().toISOString(),
          }

          const updatedSession = {
            ...session,
            conversation: [...updatedConversation, nextDoctorMessage],
          }

          onSessionUpdate(updatedSession)
        }
      } else if (lastMessage.role === "patient") {
        const context = {
          caseId: session.caseId,
          disease: session.disease,
          symptoms: medicalCase?.symptoms || [],
          patientProfile: session.patientProfile,
          conversationHistory: session.conversation.map((msg) => ({
            role: msg.role as "student" | "patient" | "doctor",
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        }
        const doctorResponse = await fetch("/api/learning/doctor-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context, conversation: session.conversation }),
        })
        if (!doctorResponse.ok) {
          throw new Error("Failed to generate doctor question")
        }
        const { question, explanation } = await parseApiJson(
          doctorResponse,
          "Failed to generate doctor question"
        )
        const nextDoctorMessage: LearningConversationMessage = {
          role: "doctor",
          content: question,
          explanation,
          timestamp: new Date().toISOString(),
        }
        onSessionUpdate({
          ...session,
          conversation: [...session.conversation, nextDoctorMessage],
        })
      }
    } catch (error) {
      console.error("Error continuing conversation:", error)
      setSimulationError(
        error instanceof Error
          ? error.message
          : "The simulation hit a network or server error. Check your connection and try Continue again."
      )
    } finally {
      setIsProcessing(false)
      simulationFlowLock.current = false
    }
  }

  const handleStudentQuestion = async () => {
    if (!studentQuestion.trim() || isProcessing) return

    setIsProcessing(true)

    try {
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: session.conversation.map((msg) => ({
          role: msg.role as "student" | "patient" | "doctor",
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      }

      const response = await fetch("/api/learning/answer-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: studentQuestion, context, conversation: session.conversation }),
      })

      if (!response.ok) {
        throw new Error("Failed to answer question")
      }

      const { answer } = await parseApiJson(response, "Failed to answer question")
      setStudentQuestionResponse(answer)
      setStudentQuestion("")
    } catch (error) {
      console.error("Error answering student question:", error)
      setStudentQuestionResponse(
        "I apologize, but I'm having trouble processing your question right now. Please try again.",
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResume = async () => {
    const userId = session.studentId?.trim()
    const conversationId = session.conversationId?.trim()
    if (userId && conversationId) {
      try {
        const fromDb = await learningService.getLearningSessionFromDatabase(
          conversationId,
          userId,
          medicalCase,
        )
        if (fromDb) {
          lastResumedSessionId.current = fromDb.id
          if (fromDb.patientInfo) setPatientInfo(fromDb.patientInfo)
          if (fromDb.vitalSigns) setVitalSigns(fromDb.vitalSigns)
          if (fromDb.uiState) {
            setActivePatientInfoSection(fromDb.uiState.activePatientInfoSection || "demographics")
            setActiveNurseReportSection(fromDb.uiState.activeNurseReportSection || "chiefComplaint")
            setActiveTab(fromDb.uiState.activeTab || "conversation")
            if (fromDb.uiState.collapsedSections) {
              setCollapsedSections((prev) => ({ ...prev, ...fromDb.uiState!.collapsedSections }))
            }
          }
          onSessionUpdate(fromDb)
        }
      } catch (error) {
        console.error("Error resuming learning session:", error)
      }
    }
    setShowResumePrompt(false)
  }

  const handleStartOver = async () => {
    await learningService.abandonBackendSession(
      session.studentId || "",
      session.conversationId || ""
    )
    const resetSession: LearningSession = {
      ...session,
      conversation: [],
      isComplete: false,
      soapNote: undefined,
      conversationId: undefined,
      lastSyncedMessageCount: 0,
    }
    onSessionUpdate(resetSession)
    setShowResumePrompt(false)
    setSimulationError(null)
  }

  // Function to handle student questions to the doctor
  const handleStudentToDoctorQuestion = async () => {
    if (!studentQuestion.trim() || isDoctorResponding) return
    
    setStudentDoctorChat((prev) => [
      ...prev,
      { role: "student", content: studentQuestion, timestamp: new Date().toISOString() },
    ])
    setIsDoctorResponding(true)
    
    try {
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: session.conversation.map((msg) => ({
          role: msg.role as "student" | "patient" | "doctor",
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      }

      const response = await fetch("/api/learning/answer-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: studentQuestion, context, conversation: session.conversation }),
      })

      if (!response.ok) {
        throw new Error("Failed to answer question")
      }

      const { answer } = await parseApiJson(response, "Failed to answer question")
      
      setStudentDoctorChat((prev) => [
        ...prev,
        { role: "doctor", content: answer, timestamp: new Date().toISOString() },
      ])
    } catch (error) {
      console.error("Error answering student question:", error)
      setStudentDoctorChat((prev) => [
        ...prev,
        { role: "doctor", content: "I apologize, but I'm having trouble processing your question right now. Please try again.", timestamp: new Date().toISOString() },
      ])
    } finally {
      setIsDoctorResponding(false)
      setStudentQuestion("")
    }
  }

  // Functions for doctor chat dragging
  const handleChatMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.chat-header')) {
      setIsDragging(true)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleChatMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setChatPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleChatMouseUp = () => {
    setIsDragging(false)
  }

  // Toggle collapsible sections
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Handle tab changes
  const handleTabChange = (section: keyof typeof activeTabs, tab: string) => {
    setActiveTabs(prev => ({
      ...prev,
      [section]: tab
    }))
  }

  // Handle nurse report section navigation
  const handleNurseReportSectionChange = (section: string) => {
    setActiveNurseReportSection(section)
  }

  // Handle patient information section navigation
  const handlePatientInfoSectionChange = (section: string) => {
    setActivePatientInfoSection(section)
    setShowAllPatientInfo(false) // Reset show all when selecting specific section
  }

  // Handle show all patient information
  const handleShowAllPatientInfo = () => {
    setShowAllPatientInfo(!showAllPatientInfo)
    if (!showAllPatientInfo) {
      setActivePatientInfoSection('') // Clear active section when showing all
    }
  }

  return (
    <div
      className={cn(
        APP_PAGE_SHELL,
        "flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-background text-foreground"
      )}
    >
      {/* Resume Modal */}
      {showResumePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-border">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-4">Continue Learning?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You have an unfinished learning session. Would you like to continue where you left off or start fresh?
              </p>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={handleStartOver}
                className="flex-1 h-12 text-sm border-2 transition-all duration-300 rounded-xl"
              >
                Start Fresh
              </Button>
              <Button 
                onClick={handleResume}
                className="flex-1 h-12 text-sm bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
              >
                Continue Learning
              </Button>
            </div>
          </div>
        </div>
      )}

      {simulationError && (
        <div
          role="alert"
          className="mx-4 mt-2 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-500/25 bg-red-50 dark:bg-red-500/10 px-4 py-2 text-sm text-red-900 dark:text-red-200 sm:mx-6"
        >
          <span className="min-w-0 flex-1">{simulationError}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-red-800 dark:text-red-200 hover:text-red-950"
            onClick={() => setSimulationError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="shrink-0 bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={() => (window.location.href = "/")}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg px-4 py-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Learning Simulator</h1>
                <p className="text-xs text-muted-foreground">
                  {medicalCase?.title && medicalCase?.specialty && medicalCase?.symptoms?.length > 0
                    ? `${medicalCase.title} (${medicalCase.specialty})`
                    : medicalCase?.title || "Medical Case"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-secondary rounded-full px-4 py-2">
              {session.isComplete ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-semibold text-green-600 dark:text-emerald-300">Complete</span>
                </>
              ) : session.conversation.length > 0 ? (
                <>
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">In Progress</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-muted-foreground">Ready</span>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              type="button"
              title={
                showConversationInsights
                  ? "Hide Learning Insights in conversation"
                  : "Show Learning Insights in conversation"
              }
              aria-pressed={showConversationInsights}
              aria-label={
                showConversationInsights
                  ? "Hide Learning Insights under doctor messages"
                  : "Show Learning Insights under doctor messages"
              }
              onClick={() => setShowConversationInsights((v) => !v)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {showConversationInsights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>

            {!session.isComplete && (
              <Button
                onClick={session.conversation.length === 0 ? startConversation : continueConversation}
                disabled={isProcessing}
                className="bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 rounded-lg font-semibold"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : isPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {session.conversation.length === 0 ? "Start Simulation" : "Continue"}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area — flex-1 + min-h-0 so sidebars scroll to the true bottom */}
      <div className="flex min-h-0 flex-1 bg-gray-50 dark:bg-transparent">
        {/* Left Sidebar - Patient Information */}
        <div className="flex h-full min-h-0 w-80 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-white/10 dark:bg-slate-950/50">
          <Card className="flex h-full min-h-0 flex-1 flex-col gap-0 rounded-none border-0 py-0 shadow-none">
              <CardHeader className="shrink-0 border-b border-primary-100/80 bg-gradient-to-r from-primary-50 to-primary-100/60 pt-4 dark:border-white/10 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-primary-900/22 dark:!to-slate-900">
                <CardTitle className="flex items-center justify-between gap-2 text-sm text-foreground">
                  <div className="flex min-w-0 items-center">
                    <User className="mr-2 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-300" />
                    <span className="truncate font-semibold">Patient Information</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowAllPatientInfo}
                    className="h-7 shrink-0 border-border/90 bg-background/90 px-2.5 text-xs font-medium text-foreground shadow-none hover:bg-muted/80 dark:border-white/15 dark:bg-slate-900/55 dark:text-slate-100 dark:hover:bg-slate-800/90 dark:hover:text-white"
                  >
                    {showAllPatientInfo ? "Hide All" : "Show All"}
                  </Button>
                </CardTitle>
              </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <ScrollArea className="h-full min-h-0 flex-1 overflow-hidden">
                <div className="min-w-0 space-y-2 p-3 pb-6">
                  {/* Patient Avatar and Basic Info */}
                  <div className="mb-2 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100/60 p-3 text-center dark:!bg-gradient-to-br dark:!from-slate-950 dark:!via-primary-900/22 dark:!to-slate-900">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <span className="text-xl font-bold text-white">
                        {session.patientProfile.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{session.patientProfile.name}</h3>
                    <div className="flex items-center justify-center space-x-2 text-xs mb-2">
                      <span className="flex items-center bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3 mr-1" />
                        {session.patientProfile.age} years
                      </span>
                      <span className="flex items-center bg-green-100 dark:bg-emerald-500/15 text-green-800 dark:text-emerald-200 px-2 py-1 rounded-full">
                        <User className="h-3 w-3 mr-1" />
                        {session.patientProfile.gender}
                      </span>
                      </div>
                    <p className="text-xs text-muted-foreground">{session.patientProfile.occupation}</p>
                    </div>

              {/* Patient Information Navigation Buttons */}
              {!showAllPatientInfo && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => handlePatientInfoSectionChange('demographics')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      activePatientInfoSection === 'demographics'
                        ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-500/25'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                    }`}
                  >
                    <User className="h-3 w-3 inline mr-1" />
                    Demographics
                  </button>
                  <button
                    onClick={() => handlePatientInfoSectionChange('medicalHistory')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      activePatientInfoSection === 'medicalHistory'
                        ? 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-500/25'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                    }`}
                  >
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Medical History
                  </button>
                  <button
                    onClick={() => handlePatientInfoSectionChange('socialHistory')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      activePatientInfoSection === 'socialHistory'
                        ? 'bg-green-100 dark:bg-emerald-500/15 text-green-800 dark:text-emerald-200 border border-green-200 dark:border-emerald-500/25'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                    }`}
                  >
                    <Users className="h-3 w-3 inline mr-1" />
                    Social History
                  </button>
                  <button
                    onClick={() => handlePatientInfoSectionChange('familyHistory')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      activePatientInfoSection === 'familyHistory'
                        ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-500/25'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                    }`}
                  >
                    <Users className="h-3 w-3 inline mr-1" />
                    Family History
                  </button>
                </div>
              )}
                
              {/* Demographics */}
              {(showAllPatientInfo || activePatientInfoSection === 'demographics') && (
              <div className="rounded-lg bg-gray-50 p-2 dark:!bg-slate-900/60">
                <button
                  onClick={() => toggleSection('demographics')}
                  className="-m-2 mb-2 flex w-full items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:!bg-slate-800/70"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Demographics
                </h4>
                  {collapsedSections.demographics ? (
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-slate-300" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-gray-600 dark:text-slate-300" />
                  )}
                </button>
                {!collapsedSections.demographics && (
                  <>
                    {/* Tab Navigation */}
                    <div className="mb-2 flex space-x-1 rounded-lg bg-gray-100 p-1 dark:!bg-slate-950/85">
                      {['overview', 'details', 'guidelines'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => handleTabChange('demographics', tab)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            activeTabs.demographics === tab
                              ? 'bg-white text-gray-900 shadow-sm dark:!bg-slate-800 dark:!text-slate-50 dark:shadow-md dark:ring-1 dark:ring-white/10'
                              : 'text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100'
                          }`}
                        >
                          {tab === 'overview' ? 'Overview' : tab === 'details' ? 'Details' : 'Guidelines'}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    {activeTabs.demographics === 'overview' && (
                      <>
                {isLoadingPatientInfo ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">Generating patient info...</span>
              </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Date of Birth:</span>
                      <span className="text-gray-900 dark:text-slate-100 font-medium">{new Date(Date.now() - session.patientProfile.age * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Marital Status:</span>
                      <span className="text-gray-900 dark:text-slate-100 font-medium">{patientInfo?.demographics.maritalStatus || "Single"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Insurance:</span>
                      <span className="text-gray-900 dark:text-slate-100 font-medium">{patientInfo?.demographics.insurance || "Private Insurance"}</span>
                    </div>
                  </div>
                )}
                      </>
                    )}

                    {activeTabs.demographics === 'details' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-white rounded-lg dark:!bg-slate-900/75 p-2 border border-gray-200 dark:border-white/10">
                          <h5 className="font-semibold text-gray-800 dark:text-slate-100 mb-1">Demographic Analysis</h5>
                          <p className="text-gray-700 dark:text-slate-200 text-xs leading-relaxed">
                            Patient demographics provide important context for clinical decision-making. 
                            Age, marital status, and insurance coverage can influence treatment options 
                            and social support systems.
                          </p>
              </div>
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-500/30 dark:!bg-blue-950/45">
                          <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Clinical Relevance</h5>
                          <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1">
                            <li>• Age affects medication dosing and disease risk</li>
                            <li>• Marital status indicates social support</li>
                            <li>• Insurance impacts treatment accessibility</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTabs.demographics === 'guidelines' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-green-50 dark:!bg-emerald-950/40 rounded-lg p-3 border border-green-200 dark:border-emerald-500/30">
                          <h5 className="font-semibold text-green-800 dark:text-emerald-200 mb-2">Learning Guidelines</h5>
                          <ul className="text-green-700 dark:text-emerald-300 text-xs space-y-1">
                            <li>• Always consider patient demographics in clinical reasoning</li>
                            <li>• Understand how age affects disease presentation</li>
                            <li>• Recognize social factors that impact health outcomes</li>
                            <li>• Consider insurance limitations in treatment planning</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              )}

              {/* Medical History */}
              {(showAllPatientInfo || activePatientInfoSection === 'medicalHistory') && (
              <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-2">
                <button
                  onClick={() => toggleSection('medicalHistory')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-red-900 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Medical History
                </h4>
                  {collapsedSections.medicalHistory ? (
                    <ChevronDown className="h-4 w-4 text-red-600 dark:text-red-300" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-red-600 dark:text-red-300" />
                  )}
                </button>
                {!collapsedSections.medicalHistory && (
                  <>
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 mb-2 bg-red-100 dark:bg-red-500/15 rounded-lg p-1">
                      {['overview', 'details', 'guidelines'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => handleTabChange('medicalHistory', tab)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            activeTabs.medicalHistory === tab
                              ? 'bg-white text-red-900 shadow-sm dark:!bg-red-950/50 dark:!text-red-50'
                              : 'text-red-600 dark:text-red-300 hover:text-red-900'
                          }`}
                        >
                          {tab === 'overview' ? 'Overview' : tab === 'details' ? 'Details' : 'Guidelines'}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    {activeTabs.medicalHistory === 'overview' && (
                      <>
                {isLoadingPatientInfo ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">Generating medical history...</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {patientInfo?.medicalHistory && patientInfo.medicalHistory.length > 0 ? (
                      patientInfo.medicalHistory.map((historyItem: string, index: number) => (
                        <div key={index}>
                          <span className="text-red-700 dark:text-red-300 font-medium">History:</span>
                          <p className="text-red-900 dark:text-red-200 mt-1">{historyItem}</p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div>
                          <span className="text-red-700 dark:text-red-300 font-medium">Allergies:</span>
                          <p className="text-red-900 dark:text-red-200 mt-1">No known allergies</p>
                        </div>
                        <div>
                          <span className="text-red-700 dark:text-red-300 font-medium">Current Medications:</span>
                          <p className="text-red-900 dark:text-red-200 mt-1">None</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                      </>
                    )}

                    {activeTabs.medicalHistory === 'details' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-white rounded-lg dark:!bg-slate-900/75 p-3 border border-red-200 dark:border-red-500/25">
                          <h5 className="font-semibold text-red-800 dark:text-red-200 mb-2">Medical History Analysis</h5>
                          <p className="text-red-700 dark:text-red-300 text-xs leading-relaxed">
                            Understanding a patient's medical history is crucial for identifying risk factors, 
                            drug interactions, and potential complications. This information guides clinical 
                            decision-making and treatment planning.
                          </p>
              </div>
                        <div className="bg-orange-50 dark:bg-orange-500/10 rounded-lg p-3 border border-orange-200 dark:border-orange-500/25">
                          <h5 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Key Considerations</h5>
                          <ul className="text-orange-700 dark:text-orange-300 text-xs space-y-1">
                            <li>• Previous diagnoses and their management</li>
                            <li>• Medication allergies and adverse reactions</li>
                            <li>• Surgical history and complications</li>
                            <li>• Chronic conditions requiring ongoing care</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTabs.medicalHistory === 'guidelines' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-green-50 dark:!bg-emerald-950/40 rounded-lg p-3 border border-green-200 dark:border-emerald-500/30">
                          <h5 className="font-semibold text-green-800 dark:text-emerald-200 mb-2">Learning Guidelines</h5>
                          <ul className="text-green-700 dark:text-emerald-300 text-xs space-y-1">
                            <li>• Always ask about medication allergies first</li>
                            <li>• Document previous diagnoses chronologically</li>
                            <li>• Consider drug interactions with current medications</li>
                            <li>• Assess impact of chronic conditions on current presentation</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              )}

              {/* Social History */}
              {(showAllPatientInfo || activePatientInfoSection === 'socialHistory') && (
              <div className="bg-green-50 dark:!bg-emerald-950/35 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('socialHistory')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-green-100 dark:hover:bg-emerald-500/20 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-green-900 dark:text-emerald-200 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Social History
                </h4>
                  {collapsedSections.socialHistory ? (
                    <ChevronDown className="h-4 w-4 text-green-600 dark:text-emerald-300" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-green-600 dark:text-emerald-300" />
                  )}
                </button>
                {!collapsedSections.socialHistory && (
                  <>
                {isLoadingPatientInfo ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">Generating social history...</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-emerald-300">Smoking:</span>
                      <span className="text-green-900 dark:text-emerald-200 font-medium">{patientInfo?.socialHistory.smoking || "Never"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-emerald-300">Alcohol:</span>
                      <span className="text-green-900 dark:text-emerald-200 font-medium">{patientInfo?.socialHistory.alcohol || "Social drinking"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-emerald-300">Exercise:</span>
                      <span className="text-green-900 dark:text-emerald-200 font-medium">{patientInfo?.socialHistory.exercise || "Regular"}</span>
                    </div>
                  </div>
                    )}
                  </>
                )}
              </div>
              )}

              {/* Family History */}
              {(showAllPatientInfo || activePatientInfoSection === 'familyHistory') && (
              <div className="bg-purple-50 dark:bg-purple-500/10 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('familyHistory')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Family History
                </h4>
                  {collapsedSections.familyHistory ? (
                    <ChevronDown className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  )}
                </button>
                {!collapsedSections.familyHistory && (
                  <>
                {isLoadingPatientInfo ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">Generating family history...</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-purple-700 dark:text-purple-300 font-medium">Mother:</span>
                      <p className="text-purple-900 dark:text-purple-200 mt-1">{patientInfo?.familyHistory.mother || "No significant family history"}</p>
                    </div>
                    <div>
                      <span className="text-purple-700 dark:text-purple-300 font-medium">Father:</span>
                      <p className="text-purple-900 dark:text-purple-200 mt-1">{patientInfo?.familyHistory.father || "No significant family history"}</p>
                    </div>
                  </div>
                    )}
                  </>
                )}
                </div>
              )}
                </div>
              </ScrollArea>
                </CardContent>
              </Card>
        </div>

        {/* Right Sidebar - Nurse Report */}
        <div
          className="flex h-full min-h-0 w-96 shrink-0 flex-col border-l border-gray-200 bg-white dark:border-white/10 dark:bg-slate-950/50"
          style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
        >
          <Card className="flex h-full min-h-0 flex-1 flex-col gap-0 rounded-none border-0 py-0 shadow-none">
            <CardHeader className="shrink-0 border-b border-primary-100/80 bg-gradient-to-r from-primary-50 to-primary-100/60 pt-4 dark:border-white/10 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-primary-900/22 dark:!to-slate-900">
                <CardTitle className="flex items-center justify-between gap-2 text-sm text-foreground">
                  <div className="flex min-w-0 items-center">
                    <Stethoscope className="mr-2 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-300" />
                    <span className="truncate font-semibold">Nurse Report</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllNurseReport(!showAllNurseReport)}
                    className="h-7 shrink-0 border-border/90 bg-background/90 px-2.5 text-xs font-medium text-foreground shadow-none hover:bg-muted/80 dark:border-white/15 dark:bg-slate-900/55 dark:text-slate-100 dark:hover:bg-slate-800/90 dark:hover:text-white"
                  >
                    {showAllNurseReport ? "Hide All" : "Show All"}
                  </Button>
                </CardTitle>
              </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <ScrollArea className="h-full min-h-0 flex-1 overflow-hidden">
                <div
                  className="min-w-0 space-y-2 break-words p-3 pb-6"
                  style={{ wordWrap: "break-word", overflowWrap: "break-word", hyphens: "auto" }}
                >
                  {/* Nurse Report Navigation Buttons */}
                  {!showAllNurseReport && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => handleNurseReportSectionChange('chiefComplaint')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'chiefComplaint'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <Target className="h-3 w-3 inline mr-1" />
                  Chief Complaint
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('presentingSymptoms')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'presentingSymptoms'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <Activity className="h-3 w-3 inline mr-1" />
                  Presenting Symptoms
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('vitalSigns')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'vitalSigns'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <Activity className="h-3 w-3 inline mr-1" />
                  Vital Signs
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('clinicalNotes')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'clinicalNotes'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Clinical Notes
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('initialAssessment')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'initialAssessment'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <Activity className="h-3 w-3 inline mr-1" />
                  Initial Assessment
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('learningGuidelines')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'learningGuidelines'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <BookOpen className="h-3 w-3 inline mr-1" />
                  Learning Guidelines
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('clinicalTips')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'clinicalTips'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <Target className="h-3 w-3 inline mr-1" />
                  Clinical Tips
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('keyAreas')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'keyAreas'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <Activity className="h-3 w-3 inline mr-1" />
                  Key Areas
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('redFlags')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'redFlags'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Red Flags
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('sessionProgress')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'sessionProgress'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:!bg-slate-800/50 dark:text-slate-300 dark:hover:!bg-slate-800/75'
                  }`}
                >
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Session Progress
                </button>
                    </div>
                  )}
              {/* Chief Complaint */}
              {(showAllNurseReport || activeNurseReportSection === 'chiefComplaint') && (
              <div className="bg-primary/5 rounded-lg p-2 mb-2 border border-primary/10">
                <button
                  onClick={() => toggleSection('chiefComplaint')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-primary/10 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-bold text-primary flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Chief Complaint
                </h4>
                  {collapsedSections.chiefComplaint ? (
                    <ChevronDown className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-primary" />
                  )}
                </button>
                {!collapsedSections.chiefComplaint && (
                  <>
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 mb-2 bg-primary/10 rounded-lg p-1">
                      {['overview', 'analysis', 'guidelines'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => handleTabChange('chiefComplaint', tab)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            activeTabs.chiefComplaint === tab
                              ? 'bg-white text-primary shadow-sm dark:!bg-slate-800 dark:!text-primary-200 dark:shadow-md dark:ring-1 dark:ring-primary-500/25'
                              : 'text-primary/80 hover:text-primary'
                          }`}
                        >
                          {tab === 'overview' ? 'Overview' : tab === 'analysis' ? 'Analysis' : 'Guidelines'}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    {activeTabs.chiefComplaint === 'overview' && (
                      <div className="bg-white rounded-lg dark:!bg-slate-900/75 p-2 border border-primary/20 max-w-full overflow-hidden">
                        <div className="text-primary font-medium text-sm prose prose-sm max-w-full break-words overflow-hidden">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-0 break-words text-sm">{children}</p>,
                              strong: ({ children }) => <strong className="font-medium break-words text-sm">{children}</strong>,
                              em: ({ children }) => <em className="italic break-words text-sm">{children}</em>,
                              code: ({ children }) => <code className="bg-primary/10 px-1 py-0.5 rounded text-xs font-mono break-words">{children}</code>
                            }}
                          >
                    {medicalCase?.symptoms?.[0] || session.disease || "Abdominal pain"}
                          </ReactMarkdown>
                        </div>
                </div>
                    )}

                    {activeTabs.chiefComplaint === 'analysis' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-white rounded-lg dark:!bg-slate-900/75 p-2 border border-primary/20">
                          <h5 className="font-semibold text-primary mb-1">Chief Complaint Analysis</h5>
                          <p className="text-primary/90 text-xs leading-relaxed">
                            The chief complaint is the primary reason for the patient's visit. It should be 
                            documented in the patient's own words and provides the foundation for the 
                            clinical assessment and differential diagnosis.
                          </p>
              </div>
                        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                          <h5 className="font-semibold text-primary mb-2">Clinical Significance</h5>
                          <ul className="text-primary/90 text-xs space-y-1">
                            <li>• Guides the history-taking process</li>
                            <li>• Helps prioritize differential diagnoses</li>
                            <li>• Determines urgency of care needed</li>
                            <li>• Sets the framework for clinical reasoning</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTabs.chiefComplaint === 'guidelines' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                          <h5 className="font-semibold text-primary mb-2">Learning Guidelines</h5>
                          <ul className="text-primary/90 text-xs space-y-1">
                            <li>• Always document the chief complaint in patient's own words</li>
                            <li>• Use open-ended questions to explore the complaint</li>
                            <li>• Consider the duration and severity of symptoms</li>
                            <li>• Think about red flags that require immediate attention</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              )}

              {/* Presenting Symptoms */}
              {(showAllNurseReport || activeNurseReportSection === 'presentingSymptoms') && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleSection('presentingSymptoms')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-primary/10 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Presenting Symptoms
                </h4>
                  {collapsedSections.presentingSymptoms ? (
                    <ChevronDown className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-primary" />
                  )}
                </button>
                {!collapsedSections.presentingSymptoms && (
                  <div className="space-y-2" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                    <div className="text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                      <span className="text-primary/85 font-medium">Primary Complaint:</span>
                      <div className="text-primary font-medium prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-0 text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</p>,
                            strong: ({ children }) => <strong className="font-medium text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</strong>,
                            em: ({ children }) => <em className="italic text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</em>,
                            code: ({ children }) => <code className="bg-primary/10 px-1 py-0.5 rounded text-xs font-mono" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</code>
                          }}
                        >
                        {medicalCase?.symptoms?.[0] || session.disease || "Abdominal pain"}
                        </ReactMarkdown>
                    </div>
                    </div>
                    <div className="text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                      <span className="text-primary/85 font-medium">Additional Symptoms:</span>
                    <div className="flex flex-col gap-1 mt-1" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                        {medicalCase?.symptoms?.slice(1).map((symptom: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-sm bg-primary/10 text-primary border-primary/20" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                            <div className="prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => <span className="mb-0 text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</span>,
                                  strong: ({ children }) => <strong className="font-medium text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</strong>,
                                  em: ({ children }) => <em className="italic text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</em>
                                }}
                              >
                          {symptom}
                              </ReactMarkdown>
                            </div>
                        </Badge>
                        )) || (
                          <>
                            <Badge variant="outline" className="text-sm bg-primary/10 text-primary border-primary/20" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                              <div className="prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <span className="mb-0 text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</span>,
                                    strong: ({ children }) => <strong className="font-medium text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</strong>,
                                    em: ({ children }) => <em className="italic text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</em>
                                  }}
                                >
                                  Nausea
                                </ReactMarkdown>
                              </div>
                            </Badge>
                            <Badge variant="outline" className="text-sm bg-primary/10 text-primary border-primary/20" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                              <div className="prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <span className="mb-0 text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</span>,
                                    strong: ({ children }) => <strong className="font-medium text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</strong>,
                                    em: ({ children }) => <em className="italic text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</em>
                                  }}
                                >
                                  Fever
                                </ReactMarkdown>
                              </div>
                            </Badge>
                            <Badge variant="outline" className="text-sm bg-primary/10 text-primary border-primary/20" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                              <div className="prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <span className="mb-0 text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</span>,
                                    strong: ({ children }) => <strong className="font-medium text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</strong>,
                                    em: ({ children }) => <em className="italic text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</em>
                                  }}
                                >
                                  Vomiting
                                </ReactMarkdown>
                              </div>
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    </div>
                )}
                  </div>
              )}
                  
              {/* Vital Signs */}
              {(showAllNurseReport || activeNurseReportSection === 'vitalSigns') && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                <button
                  onClick={() => toggleSection('vitalSigns')}
                  className="w-full flex items-center justify-between mb-3 hover:bg-primary/10 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Vital Signs
                </h4>
                  {collapsedSections.vitalSigns ? (
                    <ChevronDown className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-primary" />
                  )}
                </button>
                {!collapsedSections.vitalSigns && (
                  <>
                    {isLoadingVitalSigns ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">Generating vital signs...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white rounded-lg dark:!bg-slate-900/75 px-3 py-2 shadow-sm border border-primary/20">
                          <span className="text-primary/85 font-medium">BP:</span> 
                          <span className="text-primary font-bold ml-1">{vitalSigns?.bloodPressure || "120/80"}</span>
                        </div>
                        <div className="bg-white rounded-lg dark:!bg-slate-900/75 px-3 py-2 shadow-sm border border-primary/20">
                          <span className="text-primary/85 font-medium">HR:</span> 
                          <span className="text-primary font-bold ml-1">{vitalSigns?.heartRate || 72}</span>
                        </div>
                        <div className="bg-white rounded-lg dark:!bg-slate-900/75 px-3 py-2 shadow-sm border border-primary/20">
                          <span className="text-primary/85 font-medium">Temp:</span> 
                          <span className="text-primary font-bold ml-1">{vitalSigns?.temperature || "98.6°F"}</span>
                        </div>
                        <div className="bg-white rounded-lg dark:!bg-slate-900/75 px-3 py-2 shadow-sm border border-primary/20">
                          <span className="text-primary/85 font-medium">RR:</span> 
                          <span className="text-primary font-bold ml-1">{vitalSigns?.respiratoryRate || 16}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                  </div>
              )}

              {/* Clinical Notes */}
              {(showAllNurseReport || activeNurseReportSection === 'clinicalNotes') && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                <button
                  onClick={() => toggleSection('clinicalNotes')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-primary/10 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Clinical Notes
                </h4>
                  {collapsedSections.clinicalNotes ? (
                    <ChevronDown className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-primary" />
                  )}
                </button>
                {!collapsedSections.clinicalNotes && (
                <div className="text-sm text-primary/90 space-y-1 prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-1">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-primary/10 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      ul: ({ children }) => <ul className="list-disc list-inside ml-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside ml-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>
                    }}
                  >
                    {`• Patient arrived via outpatient clinic
• Initial assessment completed by nursing staff
• Patient is alert and oriented x3 (person, place, time)
• No immediate life-threatening conditions observed
• Patient appears comfortable at rest
• Ready for physician evaluation`}
                  </ReactMarkdown>
                  </div>
                )}
                </div>
              )}

              {/* Initial Assessment */}
              {(showAllNurseReport || activeNurseReportSection === 'initialAssessment') && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                <button
                  onClick={() => toggleSection('initialAssessment')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-primary/10 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Initial Assessment
                </h4>
                  {collapsedSections.initialAssessment ? (
                    <ChevronDown className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-primary" />
                  )}
                </button>
                {!collapsedSections.initialAssessment && (
                  <div className="text-sm text-primary/90 space-y-1 prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-1">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-primary/10 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        ul: ({ children }) => <ul className="list-disc list-inside ml-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside ml-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>
                      }}
                    >
                      {`• Patient reports ${medicalCase?.symptoms?.[0]?.toLowerCase() || session.disease?.toLowerCase() || "abdominal pain"}
• Onset: ${medicalCase?.difficulty === 'beginner' ? 'Gradual' : medicalCase?.difficulty === 'intermediate' ? 'Subacute' : 'Variable'} presentation
• Severity: ${medicalCase?.difficulty === 'beginner' ? 'Mild to moderate' : medicalCase?.difficulty === 'intermediate' ? 'Moderate' : 'Moderate to severe'}
• Associated symptoms: ${medicalCase?.symptoms?.slice(1).join(", ") || "nausea, fever, vomiting"}
• No known drug allergies
• Previous medical history: ${medicalCase?.difficulty === 'beginner' ? 'Unremarkable' : 'Requires further evaluation'}`}
                    </ReactMarkdown>
          </div>
                )}
        </div>
              )}

              {/* Learning Mode Specific Notes */}
              {(showAllNurseReport || activeNurseReportSection === 'learningGuidelines') && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                <button
                  onClick={() => toggleSection('learningGuidelines')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-primary/10 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Learning Guidelines
                </h4>
                  {collapsedSections.learningGuidelines ? (
                    <ChevronDown className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-primary" />
                  )}
                </button>
                {!collapsedSections.learningGuidelines && (
                <div className="text-sm text-primary/90 space-y-1 prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-1">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-primary/10 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      ul: ({ children }) => <ul className="list-disc list-inside ml-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside ml-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>
                    }}
                  >
                    {`• This is a guided learning session with educational support
• Take time to think through your clinical reasoning process
• Ask questions systematically and build your knowledge
• Receive real-time feedback and educational insights
• Focus on understanding the underlying medical concepts`}
                  </ReactMarkdown>
                </div>
                )}
              </div>
              )}

              {/* Clinical Guidance */}
              {(showAllNurseReport || activeNurseReportSection === 'clinicalTips') && (
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('clinicalTips')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Clinical Tips
                </h4>
                  {collapsedSections.clinicalTips ? (
                    <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  )}
                </button>
                {!collapsedSections.clinicalTips && (
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  Focus on gathering a comprehensive history. Ask about symptom onset, duration, severity, and any associated symptoms.
                    </p>
                )}
                  </div>
              )}

              {/* Key Areas to Explore */}
              {(showAllNurseReport || activeNurseReportSection === 'keyAreas') && (
              <div className="bg-green-50 dark:!bg-emerald-950/35 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('keyAreas')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-green-100 dark:hover:bg-emerald-500/20 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-green-900 dark:text-emerald-200 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Key Areas to Explore
                </h4>
                  {collapsedSections.keyAreas ? (
                    <ChevronDown className="h-4 w-4 text-green-600 dark:text-emerald-300" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-green-600 dark:text-emerald-300" />
                  )}
                </button>
                {!collapsedSections.keyAreas && (
                <ul className="text-sm text-green-700 dark:text-emerald-300 space-y-1">
                  <li>• Symptom characteristics and timing</li>
                  <li>• Associated symptoms and triggers</li>
                  <li>• Medical history and medications</li>
                  <li>• Social and family history</li>
                </ul>
                )}
                </div>
              )}

              {/* Red Flags */}
              {(showAllNurseReport || activeNurseReportSection === 'redFlags') && (
              <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('redFlags')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-red-900 dark:text-red-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Red Flags to Watch For
                </h4>
                  {collapsedSections.redFlags ? (
                    <ChevronDown className="h-4 w-4 text-red-600 dark:text-red-300" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-red-600 dark:text-red-300" />
                  )}
                </button>
                {!collapsedSections.redFlags && (
                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                  Be alert for symptoms that suggest serious conditions requiring immediate attention.
                </p>
                )}
          </div>
              )}

              {/* Session Progress */}
              {(showAllNurseReport || activeNurseReportSection === 'sessionProgress') && (
              <div className="bg-purple-50 dark:bg-purple-500/10 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('sessionProgress')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Session Progress
                </h4>
                  {collapsedSections.sessionProgress ? (
                    <ChevronDown className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  )}
                </button>
                {!collapsedSections.sessionProgress && (
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-purple-700 dark:text-purple-300">Conversation Quality</span>
                      <span className="text-purple-800 dark:text-purple-200 font-medium">{sessionProgressMetrics.conversationQuality}%</span>
                    </div>
                    <div className="w-full bg-purple-100 dark:bg-purple-500/15 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-[width] duration-300 ease-out"
                        style={{ width: `${sessionProgressMetrics.conversationQuality}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300">Questions Asked</span>
                    <span className="text-purple-800 dark:text-purple-200 font-medium">{sessionProgressMetrics.questionsAsked}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300">Time Spent</span>
                    <span className="text-purple-800 dark:text-purple-200 font-medium">{sessionProgressDurationLabel}</span>
                  </div>
                </div>
                )}
                </div>
              )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex h-full min-h-0 flex-1 flex-col bg-white dark:bg-slate-950/35">
          {/* Conversation Header */}
          <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-white/10 dark:!bg-slate-950/55">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">AI Consultation</h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Interactive doctor-patient simulation</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "conversation" | "soap")}>
                  <TabsList className="border border-gray-300 bg-gray-100 dark:border-white/10 dark:!bg-slate-950/90">
                    <TabsTrigger value="conversation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Conversation
                    </TabsTrigger>
                    <TabsTrigger value="soap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      SOAP Note
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === "conversation" ? (
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="p-6 space-y-6">
                  {session.conversation.length === 0 ? (
                    <div className="py-32 text-center">
                      <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-primary-700 shadow-2xl">
                        <MessageCircle className="h-16 w-16 text-white" />
                      </div>
                      <h3 className="mb-4 text-2xl font-bold text-gray-800 dark:text-slate-100">Ready to Start Simulation</h3>
                      <p className="mx-auto mb-8 max-w-md text-lg text-gray-600 dark:text-slate-300">Click &quot;Start Simulation&quot; to begin the AI consultation and start your learning journey</p>
                      <div className="mx-auto flex max-w-md items-center justify-center space-x-3 rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100/60 px-8 py-4 text-sm text-gray-700 dark:border-primary-500/35 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-primary-900/38 dark:!to-slate-900 dark:text-slate-100">
                        <Sparkles className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                        <span>Learn from expert clinical interactions</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {session.conversation.map((message, index) => (
                        <div key={index} className="space-y-3">
                        <div className={`flex ${message.role === "doctor" ? "justify-start" : "justify-end"}`}>
                            <div className={`flex items-start space-x-3 max-w-2xl ${message.role === "doctor" ? "flex-row" : "flex-row-reverse"}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.role === "doctor" 
                                  ? "bg-primary" 
                                  : "bg-primary/70 dark:bg-primary/60"
                            }`}>
                              {message.role === "doctor" ? (
                                  <Stethoscope className="h-5 w-5 text-white" />
                              ) : (
                                  <User className="h-5 w-5 text-white" />
                              )}
                            </div>
                              <div className={`rounded-lg px-4 py-3 ${
                              message.role === "doctor"
                                  ? "bg-gray-100 text-gray-800 dark:!bg-slate-800/85 dark:text-slate-100"
                                  : "bg-primary text-primary-foreground"
                              }`}>
                                <div className="flex items-center mb-1">
                                  <span className="font-semibold text-sm capitalize">{message.role}</span>
                                  <span className="text-xs opacity-70 ml-2">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-2 text-left last:mb-0">{children}</p>,
                                    h1: ({ children }) => <h1 className="mb-2 text-left text-lg font-bold">{children}</h1>,
                                    h2: ({ children }) => <h2 className="mb-2 text-left text-base font-semibold">{children}</h2>,
                                    h3: ({ children }) => <h3 className="mb-1 text-left text-sm font-semibold">{children}</h3>,
                                    ul: ({ children }) => <ul className="mb-2 list-inside list-disc space-y-1 text-left">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-2 list-inside list-decimal space-y-1 text-left">{children}</ol>,
                                    li: ({ children }) => <li className="text-left text-sm">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    code: ({ children }) => <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">{children}</code>,
                                    blockquote: ({ children }) => <blockquote className="border-l-2 border-current/30 pl-2 italic opacity-90">{children}</blockquote>
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                        {showConversationInsights && message.explanation && (
                            <div className="ml-13 rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4 dark:border-amber-400/70 dark:bg-slate-800/95 dark:shadow-inner dark:shadow-black/20">
                              <div className="mb-2 flex items-center">
                                <Lightbulb className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-300" />
                                <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">Learning Insight</span>
                            </div>
                              <div className="prose prose-sm max-w-none text-sm leading-relaxed text-amber-950 dark:prose-invert dark:text-slate-200">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-2 text-left last:mb-0 text-amber-950 dark:text-slate-200">{children}</p>,
                                    h1: ({ children }) => <h1 className="mb-2 text-left text-lg font-bold text-amber-950 dark:text-slate-100">{children}</h1>,
                                    h2: ({ children }) => <h2 className="mb-2 text-left text-base font-semibold text-amber-950 dark:text-slate-100">{children}</h2>,
                                    h3: ({ children }) => <h3 className="mb-1 text-left text-sm font-semibold text-amber-950 dark:text-slate-100">{children}</h3>,
                                    ul: ({ children }) => <ul className="mb-2 list-inside list-disc space-y-1 text-left text-amber-950 dark:text-slate-200">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-2 list-inside list-decimal space-y-1 text-left text-amber-950 dark:text-slate-200">{children}</ol>,
                                    li: ({ children }) => <li className="text-left text-sm text-amber-950 dark:text-slate-200">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold text-amber-950 dark:text-white">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-amber-900 dark:text-slate-300">{children}</em>,
                                    code: ({ children }) => <code className="rounded bg-amber-200/60 px-1 py-0.5 font-mono text-xs text-amber-950 dark:bg-slate-700 dark:text-amber-100">{children}</code>,
                                    blockquote: ({ children }) => <blockquote className="border-l-2 border-amber-400 pl-2 italic text-amber-900 dark:border-amber-500/50 dark:text-slate-300">{children}</blockquote>
                                  }}
                                >
                                  {message.explanation}
                                </ReactMarkdown>
                              </div>
                          </div>
                        )}
                      </div>
                      ))}
                    </div>
                  )}
                  {isProcessing && (
                    <div className="flex justify-center py-12">
                      <div className="flex items-center space-x-4 rounded-full border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100/70 px-8 py-4 shadow-xl dark:border-primary-500/35 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-primary-900/38 dark:!to-slate-900 dark:shadow-black/40">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-500"></div>
                        <span className="text-sm font-semibold text-primary-700 dark:text-primary-200">Generating response...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full overflow-y-auto p-6">
                {isSoapRefreshing && (
                  <div className="mb-6 flex justify-center">
                    <div className="flex items-center space-x-4 rounded-full border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100/70 px-8 py-4 shadow-xl dark:border-primary-500/35 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-primary-900/38 dark:!to-slate-900 dark:shadow-black/40">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-500"></div>
                      <span className="text-sm font-semibold text-primary-700 dark:text-primary-200">
                        Updating SOAP note to match your conversation…
                      </span>
                    </div>
                  </div>
                )}
                {session.soapNote && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 shadow-lg dark:border-emerald-500/30 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-emerald-950/45 dark:!to-slate-900">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <h3 className="text-lg font-bold text-green-800 dark:text-emerald-200">Subjective</h3>
                      </div>
                      <div className="bg-white rounded-xl dark:!bg-slate-900/75 p-4 border border-green-100 mb-4 dark:border-emerald-500/20">
                        <p className="text-gray-700 leading-relaxed text-sm dark:text-slate-200">{session.soapNote.subjective}</p>
                      </div>
                      {session.soapNote.subjectiveExplanation && (
                        <div className="bg-gradient-to-r from-primary-50 to-primary-100/60 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-primary-900/32 dark:!to-slate-900 rounded-xl p-4 border border-primary-200 dark:border-primary-500/30">
                          <div className="flex items-center mb-2">
                            <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-300 mr-2" />
                            <span className="font-semibold text-primary-700 dark:text-primary-100 text-sm">Educational Note</span>
                          </div>
                          <p className="text-primary-800 dark:text-primary-200 leading-relaxed text-sm">{session.soapNote.subjectiveExplanation}</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 shadow-lg dark:border-teal-500/30 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-teal-950/42 dark:!to-slate-900">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-xl">O</span>
                        </div>
                        <h3 className="text-lg font-bold text-teal-800 dark:text-teal-200">Objective</h3>
                      </div>
                      <div className="bg-white rounded-xl dark:!bg-slate-900/75 p-4 border border-teal-100 mb-4 dark:border-teal-500/20">
                        <p className="text-gray-700 leading-relaxed text-sm dark:text-slate-200">{session.soapNote.objective}</p>
                      </div>
                      {session.soapNote.objectiveExplanation && (
                        <div className="bg-gradient-to-r from-primary-50 to-primary-100/60 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-primary-900/32 dark:!to-slate-900 rounded-xl p-4 border border-primary-200 dark:border-primary-500/30">
                          <div className="flex items-center mb-2">
                            <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-300 mr-2" />
                            <span className="font-semibold text-primary-700 dark:text-primary-100 text-sm">Educational Note</span>
                          </div>
                          <p className="text-primary-800 dark:text-primary-200 leading-relaxed text-sm">{session.soapNote.objectiveExplanation}</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-6 shadow-lg dark:border-emerald-500/30 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-emerald-950/45 dark:!to-slate-900">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">Assessment</h3>
                      </div>
                      <div className="bg-white rounded-xl dark:!bg-slate-900/75 p-4 border border-emerald-100 mb-4 dark:border-emerald-500/20">
                        <p className="text-gray-700 leading-relaxed text-sm dark:text-slate-200">{session.soapNote.assessment}</p>
                      </div>
                      {session.soapNote.assessmentExplanation && (
                        <div className="bg-gradient-to-r from-primary-50 to-primary-100/60 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-primary-900/32 dark:!to-slate-900 rounded-xl p-4 border border-primary-200 dark:border-primary-500/30">
                          <div className="flex items-center mb-2">
                            <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-300 mr-2" />
                            <span className="font-semibold text-primary-700 dark:text-primary-100 text-sm">Educational Note</span>
                          </div>
                          <p className="text-primary-800 dark:text-primary-200 leading-relaxed text-sm">{session.soapNote.assessmentExplanation}</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-teal-50 p-6 shadow-lg dark:border-emerald-500/30 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-emerald-950/40 dark:!to-slate-900">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <h3 className="text-lg font-bold text-green-800 dark:text-emerald-200">Plan</h3>
                      </div>
                      <div className="bg-white rounded-xl dark:!bg-slate-900/75 p-4 border border-green-100 mb-4 dark:border-emerald-500/20">
                        <p className="text-gray-700 leading-relaxed text-sm dark:text-slate-200">{session.soapNote.plan}</p>
                      </div>
                      {session.soapNote.planExplanation && (
                        <div className="bg-gradient-to-r from-primary-50 to-primary-100/60 dark:!bg-gradient-to-r dark:!from-slate-950 dark:!via-primary-900/32 dark:!to-slate-900 rounded-xl p-4 border border-primary-200 dark:border-primary-500/30">
                          <div className="flex items-center mb-2">
                            <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-300 mr-2" />
                            <span className="font-semibold text-primary-700 dark:text-primary-100 text-sm">Educational Note</span>
                          </div>
                          <p className="text-primary-800 dark:text-primary-200 leading-relaxed text-sm">{session.soapNote.planExplanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Ask Doctor Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsDoctorChatOpen(!isDoctorChatOpen)}
          className="rounded-full shadow-lg bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white px-6 py-3 animate-bounce"
          size="lg"
        >
          <Brain className="h-5 w-5 mr-2" />
          {isDoctorChatOpen ? "Hide Doctor" : "Ask Doctor"}
          <div className="ml-2 animate-pulse">💬</div>
        </Button>
      </div>

      {/* Ask Doctor Chat Modal */}
      {isDoctorChatOpen && (
        <div 
          className={`fixed w-80 bg-card rounded-lg shadow-xl border border-border z-50 transition-all duration-300 ${
            isDoctorChatMinimized ? 'h-12' : 'h-96'
          }`}
          style={{
            left: chatPosition.x || 'calc(100vw - 340px)',
            top: chatPosition.y || 'calc(100vh - 400px)',
          }}
          onMouseDown={handleChatMouseDown}
          onMouseMove={handleChatMouseMove}
          onMouseUp={handleChatMouseUp}
          onMouseLeave={handleChatMouseUp}
        >
          {/* Chat Header */}
          <div className="chat-header p-3 border-b bg-secondary rounded-t-lg cursor-move">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                <h3 className="text-xs font-semibold text-foreground">Ask Doctor</h3>
                {studentDoctorChat.length > 0 && (
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary-500"></div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDoctorChatMinimized(!isDoctorChatMinimized)}
                  className="h-6 w-6 p-0 hover:bg-accent"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsDoctorChatOpen(false)
                    setIsDoctorChatMinimized(false)
                  }}
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {!isDoctorChatMinimized && (
            <>
              <div className="h-64 overflow-y-auto p-3 space-y-2">
                {studentDoctorChat.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <Brain className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p>Ask the doctor any questions about the case</p>
                    <p className="mt-1 text-xs">Get guidance on clinical reasoning</p>
                  </div>
                )}
                
                {studentDoctorChat.map((msg, idx) => (
                  <div key={idx} className="space-y-1">
                    {msg.role === "student" && (
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg p-2 max-w-xs text-xs shadow-sm">
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    )}
                    
                    {msg.role === "doctor" && (
                      <div className="rounded-lg border border-border bg-secondary p-2 text-xs">
                        <div className="mb-1 flex items-center gap-1">
                          <Brain className="h-3 w-3 text-primary-600 dark:text-primary-300" />
                          <span className="text-xs font-medium text-primary-700 dark:text-primary-200">Doctor</span>
                        </div>
                        <div className="prose prose-xs max-w-none text-xs text-foreground">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="mb-1 text-sm font-bold">{children}</h1>,
                              h2: ({ children }) => <h2 className="mb-1 text-xs font-semibold">{children}</h2>,
                              h3: ({ children }) => <h3 className="mb-1 text-xs font-semibold">{children}</h3>,
                              ul: ({ children }) => <ul className="mb-1 list-inside list-disc space-y-0.5">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-1 list-inside list-decimal space-y-0.5">{children}</ol>,
                              li: ({ children }) => <li className="text-xs">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">{children}</code>,
                              blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-1 italic">{children}</blockquote>
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isDoctorResponding && (
                  <div className="rounded-lg border border-border bg-secondary p-2 text-xs">
                    <div className="mb-1 flex items-center gap-1">
                      <Brain className="h-3 w-3 text-primary-600 dark:text-primary-300" />
                      <span className="text-xs font-medium text-primary-700 dark:text-primary-200">Doctor</span>
                      <div className="ml-2 flex gap-1">
                        <div className="h-1 w-1 animate-bounce rounded-full bg-primary-500"></div>
                        <div className="h-1 w-1 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: "0.1s" }}></div>
                        <div className="h-1 w-1 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Doctor is thinking...</p>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-3 border-t bg-secondary rounded-b-lg">
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 text-xs border-border focus:border-primary"
                    value={studentQuestion}
                    onChange={(e) => setStudentQuestion(e.target.value)}
                    placeholder="Ask the doctor..."
                    disabled={isDoctorResponding}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isDoctorResponding) handleStudentToDoctorQuestion()
                    }}
                  />
                  <Button
                    onClick={handleStudentToDoctorQuestion}
                    disabled={isDoctorResponding || !studentQuestion.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}