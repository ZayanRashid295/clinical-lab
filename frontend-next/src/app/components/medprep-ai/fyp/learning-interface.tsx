"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LearningSession, LearningConversationMessage } from "@/lib/fyp/learning-service"
import { sampleCases } from "@/lib/fyp/data-models"
import { learningService } from "@/lib/fyp/learning-service"
import { databaseConversationService } from "@/lib/fyp/database-conversation-service"
import { caseProgressService } from "@/lib/fyp/case-progress-service"
import { 
  ArrowLeft, Play, Pause, MessageCircle, FileText, User, Users, Stethoscope, 
  HelpCircle, Clock, CheckCircle, AlertCircle, AlertTriangle, Sparkles, BookOpen, 
  Brain, Star, GraduationCap, Heart, Activity, Target, Zap, 
  ChevronRight, Lightbulb, Award, TrendingUp, Mic, Video, 
  Settings, Share, Download, RefreshCw, Eye, EyeOff, Send, X, Minimize2, 
  ChevronDown, ChevronUp
} from "lucide-react"
import ReactMarkdown from "react-markdown"

interface LearningInterfaceProps {
  session: LearningSession
  onSessionUpdate: (session: LearningSession) => void
  medicalCase?: any
}

export function LearningInterface({ session, onSessionUpdate, medicalCase: propMedicalCase }: LearningInterfaceProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [studentQuestion, setStudentQuestion] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSOAPNote, setShowSOAPNote] = useState(false)
  const [studentQuestionResponse, setStudentQuestionResponse] = useState("")
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [hasLoadedSession, setHasLoadedSession] = useState(false)
  const [justResumed, setJustResumed] = useState(false)
  const [activeTab, setActiveTab] = useState<"conversation" | "soap">("conversation")
  const [showPatientDetails, setShowPatientDetails] = useState(true)
  const [conversationSpeed, setConversationSpeed] = useState(1)
  const lastResumedSessionId = useRef<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
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
      console.log("Skipping patient info generation:", { medicalCase: !!medicalCase, patientInfo: !!patientInfo, isLoadingPatientInfo })
      return
    }
    
    console.log("Starting patient info generation for case:", medicalCase)
    setIsLoadingPatientInfo(true)
    try {
      const response = await fetch("/api/learning/patient-information", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disease: medicalCase.disease,
          specialty: medicalCase.specialty,
          patientProfile: session.patientProfile,
          symptoms: medicalCase.symptoms,
        }),
      })
      const generatedInfo = await parseApiJson(response, "Failed to generate patient information")
      setPatientInfo(generatedInfo)
      onSessionUpdate({
        ...session,
        patientInfo: generatedInfo,
      })
    } catch (error) {
      console.error("Error generating patient information:", error)
    } finally {
      setIsLoadingPatientInfo(false)
    }
  }, [medicalCase, patientInfo, isLoadingPatientInfo, parseApiJson, session, onSessionUpdate])

  useEffect(() => {
    // Use prop medical case if available, otherwise load from sample cases or localStorage
    if (propMedicalCase) {
      setMedicalCase(propMedicalCase)
      console.log("LearningInterface - Using prop medical case:", propMedicalCase)
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
    console.log("LearningInterface - Loaded medical case:", caseData)
  }, [session.caseId, propMedicalCase])

  // Generate patient information when medical case is loaded
  useEffect(() => {
    console.log("Patient info useEffect triggered:", { 
      medicalCase: !!medicalCase, 
      patientInfo: !!patientInfo, 
      isLoadingPatientInfo,
      sessionPatientInfo: !!session.patientInfo
    })
    
    // If session already has patient info, use it
    if (session.patientInfo && !patientInfo) {
      console.log("Restoring patient info from session")
      setPatientInfo(session.patientInfo)
      return
    }
    
    if (medicalCase && !patientInfo && !isLoadingPatientInfo) {
      console.log("Calling generatePatientInformation")
      generatePatientInformation()
    }
  }, [medicalCase, patientInfo, isLoadingPatientInfo, session.patientInfo])

  // Generate vital signs when medical case is loaded
  useEffect(() => {
    console.log("Vital signs useEffect triggered:", { 
      medicalCase: !!medicalCase, 
      vitalSigns: !!vitalSigns, 
      isLoadingVitalSigns,
      sessionVitalSigns: !!session.vitalSigns
    })
    
    // If session already has vital signs, use them
    if (session.vitalSigns && !vitalSigns) {
      console.log("Restoring vital signs from session")
      setVitalSigns(session.vitalSigns)
      return
    }
    
    if (medicalCase && !vitalSigns && !isLoadingVitalSigns) {
      console.log("Calling generateVitalSigns")
      generateVitalSigns()
    }
  }, [medicalCase, vitalSigns, isLoadingVitalSigns, session.vitalSigns])

  // Generate vital signs using LLM
  const generateVitalSigns = useCallback(async () => {
    if (!medicalCase || vitalSigns || isLoadingVitalSigns) {
      console.log("Skipping vital signs generation:", { medicalCase: !!medicalCase, vitalSigns: !!vitalSigns, isLoadingVitalSigns })
      return
    }
    
    console.log("Starting LLM vital signs generation for case:", medicalCase)
    setIsLoadingVitalSigns(true)
    
    try {
      const response = await fetch("/api/learning/vital-signs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disease: medicalCase.disease,
          specialty: medicalCase.specialty,
          patientProfile: session.patientProfile,
          symptoms: medicalCase.symptoms,
        }),
      })
      const generatedVitalSigns = await parseApiJson(response, "Failed to generate vital signs")
      setVitalSigns(generatedVitalSigns)
      const updatedSession = {
        ...session,
        vitalSigns: generatedVitalSigns,
      }
      onSessionUpdate(updatedSession)
    } catch (error) {
      console.error("Error generating vital signs:", error)
      const defaultVitalSigns = {
        bloodPressure: "120/80",
        heartRate: 72,
        temperature: "98.6°F",
        respiratoryRate: 16,
      }
      setVitalSigns(defaultVitalSigns)
      onSessionUpdate({
        ...session,
        vitalSigns: defaultVitalSigns,
      })
    } finally {
      setIsLoadingVitalSigns(false)
    }
  }, [medicalCase, vitalSigns, isLoadingVitalSigns, parseApiJson, session, onSessionUpdate])

  // Save UI state when it changes
  const saveUIState = useCallback(() => {
    const updatedSession = {
      ...session,
      uiState: {
        activePatientInfoSection,
        activeNurseReportSection,
        activeTab,
        collapsedSections
      }
    }
    onSessionUpdate(updatedSession)
  }, [session, activePatientInfoSection, activeNurseReportSection, activeTab, collapsedSections, onSessionUpdate])

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
      const savedSession = learningService.getLearningSession(session.id)
      if (savedSession && savedSession.conversation.length > 0 && !savedSession.isComplete) {
        setShowResumePrompt(true)
      }
      setHasLoadedSession(true)
      
      // Track case progress - mark as started
      // Note: studentId tracking would need to be implemented in the session
    }
  }, [session.id])

  useEffect(() => {
    if (hasLoadedSession) {
      learningService.saveLearningSession(session).catch(console.error)
    }
  }, [session, hasLoadedSession])

  useEffect(() => {
    console.log("useEffect triggered - session.caseId:", session.caseId, "session.id:", session.id, "lastResumedSessionId:", lastResumedSessionId.current)
    
    // Don't reset conversation if we just resumed this session
    if (lastResumedSessionId.current === session.id) {
      console.log("Skipping conversation reset - session was just resumed")
      lastResumedSessionId.current = null
      return
    }
    
    // Only reset conversation if we're starting a completely new case
    // Check if there's a saved session with conversation history
    const savedSession = learningService.getLearningSession(session.id)
    console.log("Saved session exists:", !!savedSession, "Saved conversation length:", savedSession?.conversation?.length || 0)
    
    if (session.conversation.length > 0 && (!savedSession || savedSession.conversation.length === 0)) {
      console.log("Resetting conversation for new case")
      const resetSession = {
        ...session,
        conversation: [],
        isComplete: false,
        soapNote: undefined,
      }
      onSessionUpdate(resetSession)
    }
  }, [session.caseId, session.id])

  useEffect(() => {
    const generateSoapForCase = async () => {
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
    }
    generateSoapForCase()
  }, [activeTab])

  const startConversation = async () => {
    if (session.conversation.length > 0) return

    setIsPlaying(true)
    setIsProcessing(true)

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
    } finally {
      setIsProcessing(false)
    }
  }

  const continueConversation = async () => {
    if (session.conversation.length === 0 || session.isComplete) return

    setIsProcessing(true)

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
      }
    } catch (error) {
      console.error("Error continuing conversation:", error)
    } finally {
      setIsProcessing(false)
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

  const handleResume = () => {
    const savedSession = learningService.getLearningSession(session.id)
    if (savedSession) {
      lastResumedSessionId.current = savedSession.id
      
      // Restore patient information if available
      if (savedSession.patientInfo) {
        setPatientInfo(savedSession.patientInfo)
      }
      
      // Restore vital signs if available
      if (savedSession.vitalSigns) {
        setVitalSigns(savedSession.vitalSigns)
      }
      
      // Restore UI state if available
      if (savedSession.uiState) {
        setActivePatientInfoSection(savedSession.uiState.activePatientInfoSection || 'demographics')
        setActiveNurseReportSection(savedSession.uiState.activeNurseReportSection || 'chiefComplaint')
        setActiveTab(savedSession.uiState.activeTab || 'conversation')
        setCollapsedSections(savedSession.uiState.collapsedSections || {
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
      }
      
      console.log("Resuming session with conversation length:", savedSession.conversation.length)
      onSessionUpdate(savedSession)
    }
    setShowResumePrompt(false)
  }

  const handleStartOver = () => {
    const resetSession = {
      ...session,
      conversation: [],
      isComplete: false,
      soapNote: undefined,
    }
    onSessionUpdate(resetSession)
    setShowResumePrompt(false)
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Resume Modal */}
      {showResumePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-900/80 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-border">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
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
                className="flex-1 h-12 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
              >
                Continue Learning
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="bg-card border-b border-border px-6 py-4">
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
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
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
                  <span className="text-xs font-semibold text-green-600">Complete</span>
                </>
              ) : session.conversation.length > 0 ? (
                <>
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-600">In Progress</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-muted-foreground">Ready</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPatientDetails(!showPatientDetails)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {showPatientDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {!session.isComplete && (
              <Button
                onClick={session.conversation.length === 0 ? startConversation : continueConversation}
                disabled={isProcessing}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 rounded-lg font-semibold"
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

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-80px)] bg-gray-50">
        {/* Left Sidebar - Patient Information */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <Card className="flex-1 rounded-none border-0 shadow-none">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center justify-between text-sm text-foreground">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-blue-600 mr-2" />
                    Patient Information
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowAllPatientInfo}
                    className="text-xs px-2 py-1 h-6 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"
                  >
                    {showAllPatientInfo ? "Hide All" : "Show All"}
                  </Button>
                </CardTitle>
              </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="p-3 space-y-2">
                  {/* Patient Avatar and Basic Info */}
                  <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 mb-2">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <span className="text-xl font-bold text-white">
                        {session.patientProfile.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{session.patientProfile.name}</h3>
                    <div className="flex items-center justify-center space-x-2 text-xs mb-2">
                      <span className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3 mr-1" />
                        {session.patientProfile.age} years
                      </span>
                      <span className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full">
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
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <User className="h-3 w-3 inline mr-1" />
                    Demographics
                  </button>
                  <button
                    onClick={() => handlePatientInfoSectionChange('medicalHistory')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      activePatientInfoSection === 'medicalHistory'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Medical History
                  </button>
                  <button
                    onClick={() => handlePatientInfoSectionChange('socialHistory')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      activePatientInfoSection === 'socialHistory'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="h-3 w-3 inline mr-1" />
                    Social History
                  </button>
                  <button
                    onClick={() => handlePatientInfoSectionChange('familyHistory')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      activePatientInfoSection === 'familyHistory'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="h-3 w-3 inline mr-1" />
                    Family History
                  </button>
                </div>
              )}
                
              {/* Demographics */}
              {(showAllPatientInfo || activePatientInfoSection === 'demographics') && (
              <div className="bg-gray-50 rounded-lg p-2">
                <button
                  onClick={() => toggleSection('demographics')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Demographics
                </h4>
                  {collapsedSections.demographics ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {!collapsedSections.demographics && (
                  <>
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 mb-2 bg-gray-100 rounded-lg p-1">
                      {['overview', 'details', 'guidelines'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => handleTabChange('demographics', tab)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            activeTabs.demographics === tab
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
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
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    <span className="ml-2 text-sm text-gray-600">Generating patient info...</span>
              </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="text-gray-900 font-medium">{new Date(Date.now() - session.patientProfile.age * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marital Status:</span>
                      <span className="text-gray-900 font-medium">{patientInfo?.demographics.maritalStatus || "Single"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance:</span>
                      <span className="text-gray-900 font-medium">{patientInfo?.demographics.insurance || "Private Insurance"}</span>
                    </div>
                  </div>
                )}
                      </>
                    )}

                    {activeTabs.demographics === 'details' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <h5 className="font-semibold text-gray-800 mb-1">Demographic Analysis</h5>
                          <p className="text-gray-700 text-xs leading-relaxed">
                            Patient demographics provide important context for clinical decision-making. 
                            Age, marital status, and insurance coverage can influence treatment options 
                            and social support systems.
                          </p>
              </div>
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <h5 className="font-semibold text-blue-800 mb-1">Clinical Relevance</h5>
                          <ul className="text-blue-700 text-xs space-y-1">
                            <li>• Age affects medication dosing and disease risk</li>
                            <li>• Marital status indicates social support</li>
                            <li>• Insurance impacts treatment accessibility</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTabs.demographics === 'guidelines' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <h5 className="font-semibold text-green-800 mb-2">Learning Guidelines</h5>
                          <ul className="text-green-700 text-xs space-y-1">
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
              <div className="bg-red-50 rounded-lg p-2">
                <button
                  onClick={() => toggleSection('medicalHistory')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-red-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-red-900 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Medical History
                </h4>
                  {collapsedSections.medicalHistory ? (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-red-600" />
                  )}
                </button>
                {!collapsedSections.medicalHistory && (
                  <>
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 mb-2 bg-red-100 rounded-lg p-1">
                      {['overview', 'details', 'guidelines'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => handleTabChange('medicalHistory', tab)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            activeTabs.medicalHistory === tab
                              ? 'bg-white text-red-900 shadow-sm'
                              : 'text-red-600 hover:text-red-900'
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
                    <span className="ml-2 text-sm text-gray-600">Generating medical history...</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {patientInfo?.medicalHistory && patientInfo.medicalHistory.length > 0 ? (
                      patientInfo.medicalHistory.map((historyItem: string, index: number) => (
                        <div key={index}>
                          <span className="text-red-700 font-medium">History:</span>
                          <p className="text-red-900 mt-1">{historyItem}</p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div>
                          <span className="text-red-700 font-medium">Allergies:</span>
                          <p className="text-red-900 mt-1">No known allergies</p>
                        </div>
                        <div>
                          <span className="text-red-700 font-medium">Current Medications:</span>
                          <p className="text-red-900 mt-1">None</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                      </>
                    )}

                    {activeTabs.medicalHistory === 'details' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-white rounded-lg p-3 border border-red-200">
                          <h5 className="font-semibold text-red-800 mb-2">Medical History Analysis</h5>
                          <p className="text-red-700 text-xs leading-relaxed">
                            Understanding a patient's medical history is crucial for identifying risk factors, 
                            drug interactions, and potential complications. This information guides clinical 
                            decision-making and treatment planning.
                          </p>
              </div>
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <h5 className="font-semibold text-orange-800 mb-2">Key Considerations</h5>
                          <ul className="text-orange-700 text-xs space-y-1">
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
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <h5 className="font-semibold text-green-800 mb-2">Learning Guidelines</h5>
                          <ul className="text-green-700 text-xs space-y-1">
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
              <div className="bg-green-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('socialHistory')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-green-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Social History
                </h4>
                  {collapsedSections.socialHistory ? (
                    <ChevronDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-green-600" />
                  )}
                </button>
                {!collapsedSections.socialHistory && (
                  <>
                {isLoadingPatientInfo ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    <span className="ml-2 text-sm text-gray-600">Generating social history...</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Smoking:</span>
                      <span className="text-green-900 font-medium">{patientInfo?.socialHistory.smoking || "Never"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Alcohol:</span>
                      <span className="text-green-900 font-medium">{patientInfo?.socialHistory.alcohol || "Social drinking"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Exercise:</span>
                      <span className="text-green-900 font-medium">{patientInfo?.socialHistory.exercise || "Regular"}</span>
                    </div>
                  </div>
                    )}
                  </>
                )}
              </div>
              )}

              {/* Family History */}
              {(showAllPatientInfo || activePatientInfoSection === 'familyHistory') && (
              <div className="bg-purple-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('familyHistory')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-purple-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Family History
                </h4>
                  {collapsedSections.familyHistory ? (
                    <ChevronDown className="h-4 w-4 text-purple-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-purple-600" />
                  )}
                </button>
                {!collapsedSections.familyHistory && (
                  <>
                {isLoadingPatientInfo ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    <span className="ml-2 text-sm text-gray-600">Generating family history...</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-purple-700 font-medium">Mother:</span>
                      <p className="text-purple-900 mt-1">{patientInfo?.familyHistory.mother || "No significant family history"}</p>
                    </div>
                    <div>
                      <span className="text-purple-700 font-medium">Father:</span>
                      <p className="text-purple-900 mt-1">{patientInfo?.familyHistory.father || "No significant family history"}</p>
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
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
          <Card className="flex-1 rounded-none border-0 shadow-none">
            <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-teal-50 border-b">
                <CardTitle className="flex items-center justify-between text-sm text-foreground">
                  <div className="flex items-center">
                    <Stethoscope className="h-5 w-5 text-green-600 mr-2" />
                    Nurse Report
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllNurseReport(!showAllNurseReport)}
                    className="text-xs px-2 py-1 h-6 bg-green-100 hover:bg-green-200 text-green-700 border border-green-200"
                  >
                    {showAllNurseReport ? "Hide All" : "Show All"}
                  </Button>
                    </CardTitle>
                  </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="p-3 space-y-2 w-full overflow-hidden" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
                  {/* Nurse Report Navigation Buttons */}
                  {!showAllNurseReport && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => handleNurseReportSectionChange('chiefComplaint')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'chiefComplaint'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Target className="h-3 w-3 inline mr-1" />
                  Chief Complaint
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('presentingSymptoms')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'presentingSymptoms'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Activity className="h-3 w-3 inline mr-1" />
                  Presenting Symptoms
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('vitalSigns')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'vitalSigns'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Activity className="h-3 w-3 inline mr-1" />
                  Vital Signs
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('clinicalNotes')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'clinicalNotes'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Clinical Notes
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('initialAssessment')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'initialAssessment'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Activity className="h-3 w-3 inline mr-1" />
                  Initial Assessment
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('learningGuidelines')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'learningGuidelines'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <BookOpen className="h-3 w-3 inline mr-1" />
                  Learning Guidelines
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('clinicalTips')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'clinicalTips'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Target className="h-3 w-3 inline mr-1" />
                  Clinical Tips
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('keyAreas')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'keyAreas'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Activity className="h-3 w-3 inline mr-1" />
                  Key Areas
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('redFlags')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'redFlags'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Red Flags
                </button>
                <button
                  onClick={() => handleNurseReportSectionChange('sessionProgress')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeNurseReportSection === 'sessionProgress'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Session Progress
                </button>
                    </div>
                  )}
              {/* Chief Complaint */}
              {(showAllNurseReport || activeNurseReportSection === 'chiefComplaint') && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-2 mb-2">
                <button
                  onClick={() => toggleSection('chiefComplaint')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-orange-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-bold text-orange-900 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Chief Complaint
                </h4>
                  {collapsedSections.chiefComplaint ? (
                    <ChevronDown className="h-4 w-4 text-orange-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-orange-600" />
                  )}
                </button>
                {!collapsedSections.chiefComplaint && (
                  <>
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 mb-2 bg-orange-100 rounded-lg p-1">
                      {['overview', 'analysis', 'guidelines'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => handleTabChange('chiefComplaint', tab)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            activeTabs.chiefComplaint === tab
                              ? 'bg-white text-orange-900 shadow-sm'
                              : 'text-orange-600 hover:text-orange-900'
                          }`}
                        >
                          {tab === 'overview' ? 'Overview' : tab === 'analysis' ? 'Analysis' : 'Guidelines'}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    {activeTabs.chiefComplaint === 'overview' && (
                      <div className="bg-white rounded-lg p-2 border border-orange-200 max-w-full overflow-hidden">
                        <div className="text-orange-800 font-medium text-sm prose prose-sm max-w-full break-words overflow-hidden">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-0 break-words text-sm">{children}</p>,
                              strong: ({ children }) => <strong className="font-medium break-words text-sm">{children}</strong>,
                              em: ({ children }) => <em className="italic break-words text-sm">{children}</em>,
                              code: ({ children }) => <code className="bg-orange-100 px-1 py-0.5 rounded text-xs font-mono break-words">{children}</code>
                            }}
                          >
                    {medicalCase?.symptoms?.[0] || session.disease || "Abdominal pain"}
                          </ReactMarkdown>
                        </div>
                </div>
                    )}

                    {activeTabs.chiefComplaint === 'analysis' && (
                      <div className="space-y-2 text-sm">
                        <div className="bg-white rounded-lg p-2 border border-orange-200">
                          <h5 className="font-semibold text-orange-800 mb-1">Chief Complaint Analysis</h5>
                          <p className="text-orange-700 text-xs leading-relaxed">
                            The chief complaint is the primary reason for the patient's visit. It should be 
                            documented in the patient's own words and provides the foundation for the 
                            clinical assessment and differential diagnosis.
                          </p>
              </div>
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                          <h5 className="font-semibold text-yellow-800 mb-2">Clinical Significance</h5>
                          <ul className="text-yellow-700 text-xs space-y-1">
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
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <h5 className="font-semibold text-green-800 mb-2">Learning Guidelines</h5>
                          <ul className="text-green-700 text-xs space-y-1">
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
              <div className="bg-orange-50 rounded-lg p-3" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleSection('presentingSymptoms')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-orange-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-orange-900 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Presenting Symptoms
                </h4>
                  {collapsedSections.presentingSymptoms ? (
                    <ChevronDown className="h-4 w-4 text-orange-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-orange-600" />
                  )}
                </button>
                {!collapsedSections.presentingSymptoms && (
                  <div className="space-y-2" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                    <div className="text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                      <span className="text-orange-700 font-medium">Primary Complaint:</span>
                      <div className="text-orange-900 font-medium prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-0 text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</p>,
                            strong: ({ children }) => <strong className="font-medium text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</strong>,
                            em: ({ children }) => <em className="italic text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</em>,
                            code: ({ children }) => <code className="bg-orange-100 px-1 py-0.5 rounded text-xs font-mono" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', whiteSpace: 'normal' }}>{children}</code>
                          }}
                        >
                        {medicalCase?.symptoms?.[0] || session.disease || "Abdominal pain"}
                        </ReactMarkdown>
                    </div>
                    </div>
                    <div className="text-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                      <span className="text-orange-700 font-medium">Additional Symptoms:</span>
                    <div className="flex flex-col gap-1 mt-1" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden' }}>
                        {medicalCase?.symptoms?.slice(1).map((symptom: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-sm bg-orange-100 text-orange-800 border-orange-200" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                            <div className="prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                              <ReactMarkdown
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
                            <Badge variant="outline" className="text-sm bg-orange-100 text-orange-800 border-orange-200" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                              <div className="prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                                <ReactMarkdown
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
                            <Badge variant="outline" className="text-sm bg-orange-100 text-orange-800 border-orange-200" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                              <div className="prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                                <ReactMarkdown
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
                            <Badge variant="outline" className="text-sm bg-orange-100 text-orange-800 border-orange-200" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                              <div className="prose prose-sm" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'normal' }}>
                                <ReactMarkdown
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
              <div className="bg-blue-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('vitalSigns')}
                  className="w-full flex items-center justify-between mb-3 hover:bg-blue-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Vital Signs
                </h4>
                  {collapsedSections.vitalSigns ? (
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-blue-600" />
                  )}
                </button>
                {!collapsedSections.vitalSigns && (
                  <>
                    {isLoadingVitalSigns ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-sm text-gray-600">Generating vital signs...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100">
                          <span className="text-blue-700 font-medium">BP:</span> 
                          <span className="text-blue-900 font-bold ml-1">{vitalSigns?.bloodPressure || "120/80"}</span>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100">
                          <span className="text-blue-700 font-medium">HR:</span> 
                          <span className="text-blue-900 font-bold ml-1">{vitalSigns?.heartRate || 72}</span>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100">
                          <span className="text-blue-700 font-medium">Temp:</span> 
                          <span className="text-blue-900 font-bold ml-1">{vitalSigns?.temperature || "98.6°F"}</span>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100">
                          <span className="text-blue-700 font-medium">RR:</span> 
                          <span className="text-blue-900 font-bold ml-1">{vitalSigns?.respiratoryRate || 16}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                  </div>
              )}

              {/* Clinical Notes */}
              {(showAllNurseReport || activeNurseReportSection === 'clinicalNotes') && (
              <div className="bg-green-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('clinicalNotes')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-green-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Clinical Notes
                </h4>
                  {collapsedSections.clinicalNotes ? (
                    <ChevronDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-green-600" />
                  )}
                </button>
                {!collapsedSections.clinicalNotes && (
                <div className="text-sm text-green-800 space-y-1 prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-green-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
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
              <div className="bg-purple-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('initialAssessment')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-purple-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Initial Assessment
                </h4>
                  {collapsedSections.initialAssessment ? (
                    <ChevronDown className="h-4 w-4 text-purple-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-purple-600" />
                  )}
                </button>
                {!collapsedSections.initialAssessment && (
                  <div className="text-sm text-purple-800 space-y-1 prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-purple-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        ul: ({ children }) => <ul className="list-disc list-inside ml-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside ml-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>
                      }}
                    >
                      {`• Patient reports ${medicalCase?.symptoms?.[0]?.toLowerCase() || session.disease?.toLowerCase() || "abdominal pain"}
• Onset: ${medicalCase?.difficulty === 'beginner' ? 'Gradual' : medicalCase?.difficulty === 'intermediate' ? 'Subacute' : 'Variable'} presentation
• Severity: ${medicalCase?.difficulty === 'beginner' ? 'Mild to moderate' : medicalCase?.difficulty === 'intermediate' ? 'Moderate' : 'Moderate to severe'}
• Associated symptoms: ${medicalCase?.symptoms?.slice(1, 3).join(', ') || "nausea, fever, vomiting"}
• No known drug allergies
• Previous medical history: ${medicalCase?.difficulty === 'beginner' ? 'Unremarkable' : 'Requires further evaluation'}`}
                    </ReactMarkdown>
          </div>
                )}
        </div>
              )}

              {/* Learning Mode Specific Notes */}
              {(showAllNurseReport || activeNurseReportSection === 'learningGuidelines') && (
              <div className="bg-indigo-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('learningGuidelines')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-indigo-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Learning Guidelines
                </h4>
                  {collapsedSections.learningGuidelines ? (
                    <ChevronDown className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-indigo-600" />
                  )}
                </button>
                {!collapsedSections.learningGuidelines && (
                <div className="text-sm text-indigo-800 space-y-1 prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-indigo-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
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
              <div className="bg-blue-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('clinicalTips')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-blue-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Clinical Tips
                </h4>
                  {collapsedSections.clinicalTips ? (
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-blue-600" />
                  )}
                </button>
                {!collapsedSections.clinicalTips && (
                <p className="text-sm text-blue-700 leading-relaxed">
                  Focus on gathering a comprehensive history. Ask about symptom onset, duration, severity, and any associated symptoms.
                    </p>
                )}
                  </div>
              )}

              {/* Key Areas to Explore */}
              {(showAllNurseReport || activeNurseReportSection === 'keyAreas') && (
              <div className="bg-green-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('keyAreas')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-green-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Key Areas to Explore
                </h4>
                  {collapsedSections.keyAreas ? (
                    <ChevronDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-green-600" />
                  )}
                </button>
                {!collapsedSections.keyAreas && (
                <ul className="text-sm text-green-700 space-y-1">
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
              <div className="bg-red-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('redFlags')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-red-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Red Flags to Watch For
                </h4>
                  {collapsedSections.redFlags ? (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-red-600" />
                  )}
                </button>
                {!collapsedSections.redFlags && (
                <p className="text-sm text-red-700 leading-relaxed">
                  Be alert for symptoms that suggest serious conditions requiring immediate attention.
                </p>
                )}
          </div>
              )}

              {/* Session Progress */}
              {(showAllNurseReport || activeNurseReportSection === 'sessionProgress') && (
              <div className="bg-purple-50 rounded-lg p-3">
                <button
                  onClick={() => toggleSection('sessionProgress')}
                  className="w-full flex items-center justify-between mb-2 hover:bg-purple-100 rounded-lg p-2 -m-2 transition-colors"
                >
                  <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Session Progress
                </h4>
                  {collapsedSections.sessionProgress ? (
                    <ChevronDown className="h-4 w-4 text-purple-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-purple-600" />
                  )}
                </button>
                {!collapsedSections.sessionProgress && (
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-purple-700">Conversation Quality</span>
                      <span className="text-purple-800 font-medium">0%</span>
                    </div>
                    <div className="w-full bg-purple-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">Questions Asked</span>
                    <span className="text-purple-800 font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">Time Spent</span>
                    <span className="text-purple-800 font-medium">2 min</span>
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
        <div className="flex-1 flex flex-col bg-white">
          {/* Conversation Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">AI Consultation</h2>
                  <p className="text-sm text-gray-600">Interactive doctor-patient simulation</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "conversation" | "soap")}>
                  <TabsList className="bg-gray-100 border border-gray-300">
                    <TabsTrigger value="conversation" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Conversation
                    </TabsTrigger>
                    <TabsTrigger value="soap" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
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
                    <div className="text-center py-32">
                      <div className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <MessageCircle className="h-16 w-16 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Simulation</h3>
                      <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">Click "Start Simulation" to begin the AI consultation and start your learning journey</p>
                      <div className="flex items-center justify-center space-x-3 text-sm text-gray-600 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl px-8 py-4 border border-green-200 max-w-md mx-auto">
                        <Sparkles className="h-6 w-6 text-green-600" />
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
                                  ? "bg-green-600" 
                                  : "bg-blue-600"
                            }`}>
                              {message.role === "doctor" ? (
                                  <Stethoscope className="h-5 w-5 text-white" />
                              ) : (
                                  <User className="h-5 w-5 text-white" />
                              )}
                            </div>
                              <div className={`rounded-lg px-4 py-3 ${
                              message.role === "doctor"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-blue-600 text-white"
                              }`}>
                                <div className="flex items-center mb-1">
                                  <span className="font-semibold text-sm capitalize">{message.role}</span>
                                  <span className="text-xs opacity-70 ml-2">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="text-left mb-2 last:mb-0">{children}</p>,
                                    h1: ({ children }) => <h1 className="text-left text-lg font-bold mb-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-left text-base font-semibold mb-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-left text-sm font-semibold mb-1">{children}</h3>,
                                    ul: ({ children }) => <ul className="text-left list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="text-left list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-left text-sm">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                    blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-2 italic">{children}</blockquote>
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                        {message.explanation && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 ml-13 rounded-r-lg">
                              <div className="flex items-center mb-2">
                                <Lightbulb className="h-4 w-4 text-green-600 mr-2" />
                                <span className="font-semibold text-green-700 text-sm">Learning Insight</span>
                            </div>
                              <div className="text-green-800 leading-relaxed text-sm prose prose-sm max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="text-left mb-2 last:mb-0">{children}</p>,
                                    h1: ({ children }) => <h1 className="text-left text-lg font-bold mb-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-left text-base font-semibold mb-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-left text-sm font-semibold mb-1">{children}</h3>,
                                    ul: ({ children }) => <ul className="text-left list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="text-left list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-left text-sm">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                    blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-2 italic">{children}</blockquote>
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
                      <div className="flex items-center space-x-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-8 py-4 shadow-xl border border-green-200">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                        <span className="text-sm font-semibold text-green-700">Generating response...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full overflow-y-auto p-6">
                {isProcessing && !session.soapNote && (
                  <div className="flex justify-center items-center h-64">
                    <div className="flex items-center space-x-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-8 py-4 shadow-xl border border-green-200">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                      <span className="text-sm font-semibold text-green-700">Generating SOAP Note...</span>
                    </div>
                  </div>
                )}
                {session.soapNote && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-lg">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <h3 className="text-lg font-bold text-green-800">Subjective</h3>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-green-100 mb-4">
                        <p className="text-gray-700 leading-relaxed text-sm">{session.soapNote.subjective}</p>
                      </div>
                      {session.soapNote.subjectiveExplanation && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center mb-2">
                            <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="font-semibold text-blue-800 text-sm">Educational Note</span>
                          </div>
                          <p className="text-blue-700 leading-relaxed text-sm">{session.soapNote.subjectiveExplanation}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200 shadow-lg">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-xl">O</span>
                        </div>
                        <h3 className="text-lg font-bold text-teal-800">Objective</h3>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-teal-100 mb-4">
                        <p className="text-gray-700 leading-relaxed text-sm">{session.soapNote.objective}</p>
                      </div>
                      {session.soapNote.objectiveExplanation && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center mb-2">
                            <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="font-semibold text-blue-800 text-sm">Educational Note</span>
                          </div>
                          <p className="text-blue-700 leading-relaxed text-sm">{session.soapNote.objectiveExplanation}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 shadow-lg">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <h3 className="text-lg font-bold text-emerald-800">Assessment</h3>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-emerald-100 mb-4">
                        <p className="text-gray-700 leading-relaxed text-sm">{session.soapNote.assessment}</p>
                      </div>
                      {session.soapNote.assessmentExplanation && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center mb-2">
                            <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="font-semibold text-blue-800 text-sm">Educational Note</span>
                          </div>
                          <p className="text-blue-700 leading-relaxed text-sm">{session.soapNote.assessmentExplanation}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-200 shadow-lg">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <h3 className="text-lg font-bold text-green-800">Plan</h3>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-green-100 mb-4">
                        <p className="text-gray-700 leading-relaxed text-sm">{session.soapNote.plan}</p>
                      </div>
                      {session.soapNote.planExplanation && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center mb-2">
                            <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="font-semibold text-blue-800 text-sm">Educational Note</span>
                          </div>
                          <p className="text-blue-700 leading-relaxed text-sm">{session.soapNote.planExplanation}</p>
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
          className="rounded-full shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 animate-bounce"
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
                <Brain className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-foreground text-xs">Ask Doctor</h3>
                {studentDoctorChat.length > 0 && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
                  <div className="text-center text-muted-foreground text-xs py-8">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p>Ask the doctor any questions about the case</p>
                    <p className="text-xs mt-1">Get guidance on clinical reasoning</p>
                  </div>
                )}
                
                {studentDoctorChat.map((msg, idx) => (
                  <div key={idx} className="space-y-1">
                    {msg.role === "student" && (
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-2 max-w-xs text-xs shadow-sm">
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    )}
                    
                    {msg.role === "doctor" && (
                      <div className="bg-secondary rounded-lg p-2 text-xs border border-border">
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Doctor</span>
                        </div>
                        <div className="text-foreground text-xs prose prose-xs max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="text-sm font-bold mb-1">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xs font-semibold mb-1">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-xs font-semibold mb-1">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
                              li: ({ children }) => <li className="text-xs">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                              blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-1 italic">{children}</blockquote>
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
                  <div className="bg-secondary rounded-lg p-2 text-xs border border-border">
                    <div className="flex items-center gap-1 mb-1">
                      <Brain className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-600">Doctor</span>
                      <div className="flex gap-1 ml-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">Doctor is thinking...</p>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-3 border-t bg-secondary rounded-b-lg">
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 text-xs border-border focus:border-green-500"
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
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
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