"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { MedicalCase, ChatMessage, ConversationContext } from "@/lib/fyp/data-models"
import type { User } from "@/lib/fyp/medprep-user"
import { databaseConversationService } from "@/lib/fyp/database-conversation-service"
import { caseInstanceService } from "@/lib/fyp/case-instance-service"
import { aiHintTrackingService } from "@/lib/fyp/ai-hint-tracking-service"
import { practiceGradingService, type PracticeSessionGrade } from "@/lib/fyp/practice-grading-service"
import { PracticeGradeModal } from "./practice-grade-modal"
import { MedPrepConversationBlockedModal } from "./MedPrepConversationBlockedModal"
import {
  MedPrepConversationRequestError,
  safeMapConversationFailureToModal,
  type ConversationBlockedModalState,
} from "@/lib/fyp/medprep-conversation-errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  UserIcon,
  Stethoscope,
  GraduationCap,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Brain,
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  Heart,
  Eye,
  Zap,
  Sparkles,
  Crown,
  Gem,
  Star,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Activity,
  Award,
  Timer,
  Shield,
  Flame,
  Rocket,
  Wand2,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  BookMarked,
  Users,
  Settings
} from "lucide-react"
import { AskQuestions } from "./ask-questions"
import { AvatarConfig } from "./avatar-config"
import { DiagnosisSubmission } from "./diagnosis-submission"
import Link from "next/link"
// import HeyGenAvatar, { type HeyGenAvatarRef } from "@/components/heygen-avatar"
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent"
import { cn } from "@/shared/utils/cn"
import { APP_GLASS_CARD, APP_PAGE_SHELL } from "@/app/config/app-shell"

function medCaseDifficultyBadgeClass(difficulty: string) {
  const d = String(difficulty).toLowerCase()
  switch (d) {
    case "beginner":
      return "border-green-200 bg-green-50 text-green-700 dark:border-emerald-500/35 dark:!bg-emerald-950/55 dark:!text-emerald-100"
    case "intermediate":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/35 dark:!bg-amber-950/55 dark:!text-amber-100"
    case "advanced":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/35 dark:!bg-rose-950/55 dark:!text-rose-100"
    default:
      return "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/35 dark:!bg-primary-900/55 dark:!text-primary-100"
  }
}

interface CaseChatProps {
  medicalCase: MedicalCase
  student: User
  evaluationMode?: boolean
  resumeConversationId?: string
}

// Enhanced Animated Counter Component
interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
  prefix?: string
}

const AnimatedCounter = ({ value, duration = 1000, suffix = '', prefix = '' }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      setCount(Math.floor(progress * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{prefix}{count}{suffix}</span>
}

// Enhanced Metric Card Component
interface MetricCardProps {
  title: string
  value: number
  suffix?: string
  icon: React.ComponentType<{ className?: string }>
  color?: "blue" | "green" | "yellow" | "red" | "purple"
  description?: string
}

const MetricCard = ({ title, value, suffix = '', icon: Icon, color = "blue", description = "" }: MetricCardProps) => {
  const getColorClasses = () => {
    const colors: Record<string, string> = {
      blue: "border-primary-200/80 bg-primary-50/80 text-primary-800 dark:border-primary-500/25 dark:bg-primary-950/35 dark:text-primary-200",
      green: "border-primary-300/80 bg-primary-50/90 text-primary-800 dark:border-primary-500/25 dark:bg-primary-950/35 dark:text-primary-200",
      yellow: "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-200",
      red: "border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-500/25 dark:bg-rose-950/30 dark:text-rose-200",
      purple: "border-primary-200/80 bg-primary-50/70 text-primary-800 dark:border-primary-500/25 dark:bg-primary-950/30 dark:text-primary-200"
    }
    return colors[color] || colors.blue
  }

  return (
    <Card className={`transform transition-all duration-300 hover:-translate-y-0.5 rounded-2xl border ${getColorClasses()} shadow-[0_8px_24px_-18px_rgba(var(--color-primary-600-rgb),0.35)]`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</CardTitle>
        <Icon className="h-5 w-5 opacity-80" />
      </CardHeader>
      <CardContent>
        <div className="mb-1 text-3xl font-bold tabular-nums text-slate-800 dark:text-slate-100">
          <AnimatedCounter value={value} suffix={suffix} duration={1000} />
        </div>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function CaseChat({
  medicalCase,
  student,
  evaluationMode = false,
  resumeConversationId,
}: CaseChatProps) {
  // Generate unique session ID for hint tracking (stable across renders)
  const sessionId = useRef(`practice_${medicalCase.id}_${Date.now()}`).current
  const [conversation, setConversation] = useState<any>(null)
  const [caseInstance, setCaseInstance] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [sessionBlockedModal, setSessionBlockedModal] =
    useState<ConversationBlockedModalState | null>(null)
  const [showIntervention, setShowIntervention] = useState(false)
  const [interventionMessage, setInterventionMessage] = useState("")
  const [questionRefreshTrigger, setQuestionRefreshTrigger] = useState(0)
  const [showDiagnosisSubmission, setShowDiagnosisSubmission] = useState(false)
  const [isListening, setIsListening] = useState(false)

  // Comment out HeyGen avatar states
  // const [showAvatars, setShowAvatars] = useState(false)
  // const [avatarConfig, setAvatarConfig] = useState({
  //   apiKey: "",
  //   patientAvatarId: "",
  //   doctorAvatarId: "",
  // })
  // const [avatarsReady, setAvatarsReady] = useState({
  //   patient: false,
  //   doctor: false,
  // })
  // const [peerConnectionStates, setPeerConnectionStates] = useState({
  //   patient: "new",
  //   doctor: "new",
  // })
  // const [doctorInitializationAllowed, setDoctorInitializationAllowed] = useState(false)
  // const [currentSpeakingText, setCurrentSpeakingText] = useState<{
  //   role: "patient" | "doctor"
  //   text: string
  // } | null>(null)

  // New audio conversation states
  const [audioEnabled, setAudioEnabled] = useState({
    studentInput: true,
    patientResponse: true,
    doctorResponse: true
  })
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentSpeakingText, setCurrentSpeakingText] = useState<{
    role: "patient" | "doctor"
    text: string
  } | null>(null)
  const [hintSession, setHintSession] = useState<any>(null)
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [sessionGrade, setSessionGrade] = useState<PracticeSessionGrade | null>(null)
  const [isGeneratingGrade, setIsGeneratingGrade] = useState(false)
  const [isCompletingCase, setIsCompletingCase] = useState(false)
  const [isTransitioningToSoap, setIsTransitioningToSoap] = useState(false)

  // New state for three-panel layout
  const [activeTab, setActiveTab] = useState("conversation")
  const [conversationStats, setConversationStats] = useState({
    questionsAsked: 0,
    timeSpent: 0,
    interventions: 0,
    efficiency: 0
  })

  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Comment out HeyGen avatar refs
  // const patientAvatarRef = useRef<HeyGenAvatarRef>(null)
  // const doctorAvatarRef = useRef<HeyGenAvatarRef>(null)
  
  // Audio conversation refs
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  const parseApiJson = async (response: Response, fallbackError: string) => {
    const rawText = await response.text()
    let payload: any = null
    try {
      payload = rawText ? JSON.parse(rawText) : null
    } catch {
      if (!response.ok) {
        throw new Error(`${fallbackError} (${response.status}): ${rawText.slice(0, 120)}`)
      }
      throw new Error(`${fallbackError}: invalid JSON response`)
    }

    if (!response.ok) {
      const apiError =
        payload?.details
          ? `${payload?.error || payload?.message || fallbackError}: ${payload.details}`
          : payload?.error || payload?.message || rawText || fallbackError
      throw new Error(`${fallbackError} (${response.status}): ${apiError}`)
    }
    return payload
  }

  useEffect(() => {
    let cancelled = false

    const initializeConversation = async () => {
      setSessionBlockedModal(null)
      console.log("🚀 CaseChat useEffect - Creating case instance and conversation")
      console.log("👤 Student ID:", student.id)
      console.log("🏥 Medical Case ID:", medicalCase.id)
      console.log("🏥 Medical Case Title:", medicalCase.title)
      console.log("🏥 Medical Case Disease:", medicalCase.disease)
      console.log("📋 Full Medical Case:", medicalCase)

      try {
        let resolvedConversationId: string | undefined
        if (resumeConversationId) {
          const existingConversation =
            await databaseConversationService.getConversation(resumeConversationId, student.id)
          if (existingConversation) {
            resolvedConversationId = existingConversation.id
            setConversation(existingConversation)
            setMessages(existingConversation.messages)
          } else {
            setSessionBlockedModal({
              variant: "generic",
              title: "Couldn't resume this session",
              description:
                "We couldn't load your saved conversation. Check your connection, or the session may have expired or been removed. Try MedPrep home and open your case again from Resume or Practice.",
            })
            return
          }
        } else {
          console.log("💬 Creating conversation directly for practice mode")
          const newConversation = await databaseConversationService.createConversation(
            student.id,
            medicalCase.id,
            medicalCase?.patientProfile?.name,
            medicalCase?.title,
            {
              mode: "PRACTICE",
              caseSnapshot: medicalCase,
              isGeneratedCase: Boolean(medicalCase.id?.includes?.("generated")),
            },
          )
          console.log("✅ Created conversation object:", newConversation)
          resolvedConversationId = newConversation.id
          setConversation(newConversation)
          setMessages(newConversation.messages)
        }

        if (cancelled) return
        const session = aiHintTrackingService.startSession(medicalCase.id, sessionId, {
          conversationId: resolvedConversationId,
          userId: student.id,
        })
        if (resolvedConversationId) {
          aiHintTrackingService.bindConversation(sessionId, resolvedConversationId, student.id)
        }
        setHintSession(session)
      } catch (error) {
        if (cancelled) return
        if (MedPrepConversationRequestError.is(error)) {
          console.warn("[CaseChat] conversation blocked:", error.status, error.message)
        } else {
          console.error("Error initializing conversation:", error)
        }
        setSessionBlockedModal(safeMapConversationFailureToModal(error))
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    }

    void initializeConversation().catch((error) => {
      if (cancelled) return
      console.error("[CaseChat] Unhandled conversation init rejection:", error)
      setSessionBlockedModal(safeMapConversationFailureToModal(error))
      setIsBootstrapping(false)
    })

    return () => {
      cancelled = true
    }
  }, [medicalCase, resumeConversationId, sessionId, student.id])

  useEffect(() => {
    // Keep the latest interaction visible when messages/loading/speaking state changes.
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading, currentSpeakingText])

  // Update conversation stats
  useEffect(() => {
    const studentMessages = messages.filter(m => m.role === "student")
    const doctorMessages = messages.filter(m => m.role === "doctor")
    
    setConversationStats({
      questionsAsked: studentMessages.length,
      timeSpent: Math.floor(messages.length * 2), // Rough estimate
      interventions: doctorMessages.length,
      efficiency: studentMessages.length > 0 ? Math.max(0, 100 - (doctorMessages.length / studentMessages.length) * 100) : 0
    })
  }, [messages])

  // Comment out HeyGen avatar config loading
  // useEffect(() => {
  //   const savedConfig = localStorage.getItem("heygen-avatar-config")
  //   if (savedConfig) {
  //     try {
  //       const config = JSON.parse(savedConfig)
  //       setAvatarConfig(config)
  //       if (config.apiKey && config.patientAvatarId && config.doctorAvatarId) {
  //         setShowAvatars(true)
  //       }
  //     } catch (error) {
  //       console.error("Error loading avatar config:", error)
  //     }
  //   }
  // }, [])

  // Initialize speech recognition and text-to-speech
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setCurrentMessage(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }
    }
    
    // Initialize text-to-speech
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Set up speech synthesis defaults
      const utterance = new SpeechSynthesisUtterance()
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      speechSynthesisRef.current = utterance
    }
  }, [])

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    console.log("📤 Sending message...")
    console.log("💬 Current conversation:", conversation)
    console.log("📝 Message content:", currentMessage)
    
    // If no conversation exists, create one
    let currentConversation = conversation
    if (!currentConversation) {
      console.log("⚠️ No conversation found, creating new one...")
      try {
        currentConversation = await databaseConversationService.createConversation(
          student.id,
          medicalCase.id,
          medicalCase?.patientProfile?.name,
          medicalCase?.title,
          {
            mode: "PRACTICE",
            caseSnapshot: medicalCase,
            isGeneratedCase: Boolean(medicalCase.id?.includes?.("generated")),
          },
        )
        setConversation(currentConversation)
        setMessages(currentConversation.messages)
      } catch (error) {
        if (MedPrepConversationRequestError.is(error)) {
          console.warn("[CaseChat] create conversation blocked:", error.status, error.message)
        } else {
          console.error("Error creating conversation:", error)
        }
        setSessionBlockedModal(safeMapConversationFailureToModal(error))
        return
      }
    }
    
    // If we have a local conversation (not in database), create a database one
    if (currentConversation.id.startsWith('local_')) {
      console.log("🔄 Converting local conversation to database conversation...")
      try {
        const dbConversation = await databaseConversationService.createConversation(
          student.id,
          medicalCase.id,
          medicalCase?.patientProfile?.name,
          medicalCase?.title,
          {
            mode: "PRACTICE",
            caseSnapshot: medicalCase,
            isGeneratedCase: Boolean(medicalCase.id?.includes?.("generated")),
          },
        )
        console.log("✅ Created database conversation:", dbConversation.id)
        setConversation(dbConversation)
        currentConversation = dbConversation
      } catch (error) {
        if (MedPrepConversationRequestError.is(error)) {
          console.warn("[CaseChat] DB conversion blocked:", error.status, error.message)
        } else {
          console.error("Error converting to database conversation:", error)
        }
        setSessionBlockedModal(safeMapConversationFailureToModal(error))
        return
      }
    }
    
    console.log("💬 Using conversation ID:", currentConversation.id)

    // Optimistically show the student's message immediately
    const tempId = `temp_${Date.now()}`
    const messageToSend = currentMessage
    const optimisticMessage = {
      id: tempId,
      role: "student" as const,
      content: messageToSend,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMessage])
    setCurrentMessage("")
    setIsLoading(true)

    try {
      // Persist student message, then reconcile the optimistic one
      const studentMessage = await databaseConversationService.addMessage(currentConversation.id, {
        role: "student",
        content: messageToSend,
      }, student.id)

      setMessages((prev) => prev.map(m => m.id === tempId ? studentMessage : m))

      // Create conversation context for AI
      const context: ConversationContext = {
        caseId: medicalCase.id,
        disease: evaluationMode ? "Unknown Condition" : medicalCase.disease, // Hide disease name in evaluation mode
        diseaseName: medicalCase.diseaseName, // Always pass the hidden disease name
        specialty: medicalCase.specialty,
        isRare: medicalCase.isRare,
        symptoms: medicalCase.symptoms,
        history: medicalCase.history,
        labs: medicalCase.labs,
        patientProfile: medicalCase.patientProfile,
        conversationHistory: [...messages, studentMessage].map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      }

      // First, check if doctor should intervene
      const evaluationResponse = await fetch("/api/ai/evaluate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentQuestion: messageToSend,
          context,
        }),
      })

      let doctorEvaluation: any = { shouldIntervene: false }
      doctorEvaluation = await parseApiJson(evaluationResponse, "Failed to evaluate question")

      if (doctorEvaluation.shouldIntervene) {
        // Show intervention alert
        setInterventionMessage(doctorEvaluation.content)
        setShowIntervention(true)

        // Add doctor intervention message
        const doctorMessage = await databaseConversationService.addMessage(currentConversation.id, {
          role: "doctor",
          content: doctorEvaluation.content,
          isIntervention: true,
        }, student.id)

        setMessages((prev) => [...prev, doctorMessage])

        // Comment out HeyGen avatar speaking
        // if (showAvatars && doctorAvatarRef.current) {
        //   doctorAvatarRef.current.speak(doctorEvaluation.content).catch(console.error)
        // }
        
        // Use text-to-speech for doctor responses
        if (audioEnabled.doctorResponse) {
          speakText(doctorEvaluation.content, "doctor")
        }

        // Hide intervention after 5 seconds
        setTimeout(() => {
          setShowIntervention(false)
        }, 5000)
      } else {
        const patientResponse = await fetch("/api/ai/patient-response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentQuestion: messageToSend,
            context,
          }),
        })

        const patientData = await parseApiJson(patientResponse, "Failed to generate patient response")

        const patientMessage = await databaseConversationService.addMessage(currentConversation.id, {
          role: "patient",
          content: patientData.content,
        }, student.id)

        setMessages((prev) => [...prev, patientMessage])

        // Comment out HeyGen avatar speaking
        // if (showAvatars && patientAvatarRef.current) {
        //   patientAvatarRef.current.speak(patientData.content).catch(console.error)
        // }
        
        // Use text-to-speech for patient responses
        if (audioEnabled.patientResponse) {
          speakText(patientData.content, "patient")
        }
      }

      // Always trigger question refresh after any response
      setQuestionRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Error sending message:", error)
      const errorText =
        error instanceof Error ? error.message : "Unable to connect to AI service."
      const errorMessage = await databaseConversationService.addMessage(currentConversation.id, {
        role: "doctor",
        content: `⚠️ ${errorText}`,
      }, student.id)
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCompleteCase = async () => {
    if (conversation) {
      // Always capture diagnosis before proceeding to SOAP note
      setShowDiagnosisSubmission(true)
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleQuestionSelect = (question: string) => {
    setCurrentMessage(question)
  }

  // Text-to-speech function
  const speakText = (text: string, role: "patient" | "doctor") => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Stop any current speech
      speechSynthesis.cancel()
      
      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = role === "doctor" ? 1.1 : 1.0
      utterance.volume = 0.8
      
      // Set voice based on role
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        role === "doctor" ? voice.name.includes("Male") : voice.name.includes("Female")
      ) || voices.find(voice => voice.default)
      
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
      
      // Set speaking state
      setIsSpeaking(true)
      setCurrentSpeakingText({ role, text })
      
      utterance.onstart = () => {
        console.log(`${role} started speaking`)
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setCurrentSpeakingText(null)
        console.log(`${role} finished speaking`)
      }
      
      utterance.onerror = (event) => {
        console.error(`Speech synthesis error for ${role}:`, event.error)
        setIsSpeaking(false)
        setCurrentSpeakingText(null)
      }
      
      speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      setCurrentSpeakingText(null)
    }
  }

  // Comment out HeyGen avatar handlers
  // const handleAvatarReady = (role: "patient" | "doctor") => {
  //   console.log(`[v0] ${role} avatar ready - connection state: connected`)
  //   setAvatarsReady((prev) => ({
  //     ...prev,
  //     [role]: true,
  //   }))

  //   setPeerConnectionStates((prev) => ({
  //     ...prev,
  //     [role]: "connected",
  //   }))

  //   if (role === "patient") {
  //     console.log("[v0] Patient connected ✅ - Now allowing doctor initialization")
  //     setDoctorInitializationAllowed(true)
  //   }
  // }

  // const handleAvatarSpeaking = (role: "patient" | "doctor", text: string) => {
  //   setCurrentSpeakingText({ role, text })
  // }

  // const handleAvatarStopSpeaking = () => {
  //   setCurrentSpeakingText(null)
  // }

  // Comment out HeyGen avatar timeout logic
  // useEffect(() => {
  //   if (showAvatars && !doctorInitializationAllowed) {
  //     const timer = setTimeout(() => {
  //       console.log("[v0] Patient avatar timeout - allowing doctor initialization")
  //       setDoctorInitializationAllowed(true)
  //     }, 10000) // 10 second timeout
  //     
  //     return () => clearTimeout(timer)
  //   }
  // }, [showAvatars, doctorInitializationAllowed])

  // Comment out HeyGen avatar error handler
  // const handleAvatarError = (role: "patient" | "doctor", error: string) => {
  //   // Add context for debugging session data issues
  //   if (error.includes("Missing session data")) {
  //     console.error(`${role} avatar error:`, error, {
  //       context: "Likely missing or malformed session data from HeyGen API"
  //     })
  //   } else if (error.includes("WebRTC")) {
  //     console.error(`${role} avatar error:`, error, {
  //       context: "WebRTC connection issue - may be network or browser related"
  //     })
  //   } else {
  //     console.error(`${role} avatar error:`, error)
  //   }
  //   
  //   setAvatarsReady((prev) => ({
  //     ...prev,
  //     [role]: false,
  //   }))
  //   setPeerConnectionStates((prev) => ({
  //     ...prev,
  //     [role]: "failed",
  //   }))
  //   
  //   // Don't prevent doctor avatar from initializing if patient fails
  //   if (role === "patient") {
  //     console.log("[v0] Patient avatar failed, but allowing doctor avatar to proceed")
  //   }
  // }

  // Comment out HeyGen avatar config save
  // const handleAvatarConfigSave = (config: any) => {
  //   setAvatarConfig(config)
  //   localStorage.setItem("heygen-avatar-config", JSON.stringify(config))

  //   // Enable avatars if all config is present
  //   if (config.apiKey && config.patientAvatarId && config.doctorAvatarId) {
  //     setShowAvatars(true)
  //   }
  // }

  // Create context for AskQuestions component
  const askQuestionsContext: ConversationContext = conversation
    ? {
        caseId: medicalCase.id,
        disease: evaluationMode ? "Unknown Condition" : medicalCase.disease, // Hide disease name in evaluation mode
        diseaseName: medicalCase.diseaseName, // Always pass the hidden disease name
        specialty: medicalCase.specialty,
        isRare: medicalCase.isRare,
        symptoms: medicalCase.symptoms,
        history: medicalCase.history,
        labs: medicalCase.labs,
        patientProfile: medicalCase.patientProfile,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      }
    : {
        caseId: medicalCase.id,
        disease: evaluationMode ? "Unknown Condition" : medicalCase.disease, // Hide disease name in evaluation mode
        diseaseName: medicalCase.diseaseName, // Always pass the hidden disease name
        specialty: medicalCase.specialty,
        isRare: medicalCase.isRare,
        symptoms: medicalCase.symptoms,
        history: medicalCase.history,
        labs: medicalCase.labs,
        patientProfile: medicalCase.patientProfile,
        conversationHistory: [],
      }

  return (
    <div className={cn(APP_PAGE_SHELL, "h-full min-h-0 flex flex-col bg-[radial-gradient(circle_at_0%_0%,rgba(var(--color-primary-500-rgb),0.14)_0%,transparent_40%),radial-gradient(circle_at_100%_100%,rgba(var(--color-primary-600-rgb),0.1)_0%,transparent_35%)] bg-primary-50/50 dark:bg-none")}>
      {/* Global Loading Overlay for Practice Interface Bootstrapping */}
      {isBootstrapping && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-black/50">
          <div className={cn(APP_GLASS_CARD, "rounded-xl px-6 py-5 text-center shadow-2xl")}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-gray-700 font-medium dark:text-slate-200">Preparing practice interface...</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Loading conversation and tools</p>
          </div>
        </div>
      )}
      {sessionBlockedModal ? (
        <MedPrepConversationBlockedModal
          open
          state={sessionBlockedModal}
          onClose={() => setSessionBlockedModal(null)}
        />
      ) : null}
      {/* Enhanced Header */}
      <header className="sticky top-0 z-20 border-b border-primary-100/90 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 py-2">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-primary-200 bg-white text-sm shadow-sm dark:border-white/15 dark:bg-white/10 sm:h-10 sm:text-base"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-xl font-bold leading-snug bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent sm:text-2xl md:text-[1.65rem]">
                  {medicalCase.title}
                </h1>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400 md:text-base">
                  Patient: {medicalCase.patientProfile.name}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "hidden text-sm capitalize md:inline-flex",
                  medCaseDifficultyBadgeClass(medicalCase.difficulty)
                )}
              >
                {medicalCase.difficulty}
              </Badge>

              {/* Audio Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setAudioEnabled(prev => ({ ...prev, studentInput: !prev.studentInput }))}
                  variant="outline"
                  size="sm"
                  className={`border-primary-200/80 bg-white/90 text-sm dark:border-white/15 dark:bg-white/10 sm:text-[15px] ${audioEnabled.studentInput ? 'border-primary-400 text-primary-700 dark:text-primary-300' : 'text-slate-500'}`}
                  title="Toggle voice input for student"
                >
                  {audioEnabled.studentInput ? <Mic className="h-4 w-4 mr-1" /> : <MicOff className="h-4 w-4 mr-1" />}
                  Voice Input
                </Button>
                <Button
                  onClick={() => setAudioEnabled(prev => ({ ...prev, patientResponse: !prev.patientResponse }))}
                  variant="outline"
                  size="sm"
                  className={`border-primary-200/80 bg-white/90 text-sm dark:border-white/15 dark:bg-white/10 sm:text-[15px] ${audioEnabled.patientResponse ? 'border-primary-400 text-primary-700 dark:text-primary-300' : 'text-slate-500'}`}
                  title="Toggle voice output for patient"
                >
                  {audioEnabled.patientResponse ? <Video className="h-4 w-4 mr-1" /> : <VideoOff className="h-4 w-4 mr-1" />}
                  Patient Voice
                </Button>
                <Button
                  onClick={() => setAudioEnabled(prev => ({ ...prev, doctorResponse: !prev.doctorResponse }))}
                  variant="outline"
                  size="sm"
                  className={`border-primary-200/80 bg-white/90 text-sm dark:border-white/15 dark:bg-white/10 sm:text-[15px] ${audioEnabled.doctorResponse ? 'border-primary-400 text-primary-700 dark:text-primary-300' : 'text-slate-500'}`}
                  title="Toggle voice output for doctor"
                >
                  {audioEnabled.doctorResponse ? <Video className="h-4 w-4 mr-1" /> : <VideoOff className="h-4 w-4 mr-1" />}
                  Doctor Voice
                </Button>
                {isSpeaking && (
                  <Button
                    onClick={stopSpeaking}
                    variant="destructive"
                    size="sm"
                    title="Stop speaking"
                  >
                    <MicOff className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                )}
              </div>

              <Button
                onClick={handleCompleteCase} 
                disabled={isCompletingCase}
                className="h-auto min-h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_-12px_rgba(var(--color-primary-700-rgb),0.45)] transition-all hover:brightness-105 disabled:opacity-70 sm:text-base"
              >
                {isCompletingCase ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Case & Diagnose Disease
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Horizontal Layout */}
      <div className="flex-1 min-h-0 p-3 md:p-4">
        {/* Main Container - Audio Conversation Mode */}
        <div className="h-full min-h-0">

          {/* Four-panel layout tuned to FYP proportions */}
          <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[1.35fr_1fr_1fr_0.9fr] gap-3">
            {/* Section 1 - Patient Chat */}
            <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-primary-100 bg-white/90 shadow-[0_16px_40px_-26px_rgba(var(--color-primary-500-rgb),0.45)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]">
            <div className="flex-shrink-0 border-b border-primary-100 bg-white/90 p-4 dark:border-white/10 dark:bg-white/5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 dark:text-slate-100 sm:text-[1.35rem]">
                <UserIcon className="h-5 w-5 text-primary-600 sm:h-6 sm:w-6" />
                Patient Consultation
              </h2>
              <p className="mt-1 text-base text-slate-600 dark:text-slate-400">Interactive conversation with AI patient</p>
            </div>
            
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white via-primary-50/25 to-white p-4 dark:from-transparent dark:via-primary-950/15 dark:to-transparent">
              {messages.length === 0 && (
                <div className="mt-16 text-center text-base text-gray-500 dark:text-slate-400 sm:mt-20">
                  <UserIcon className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-slate-600" />
                  <p className="max-w-xs mx-auto leading-relaxed">Start the consultation by asking the patient a question</p>
                </div>
              )}

              {messages.map((message) => {
                // Don't show the message if it's currently being spoken
                const isCurrentlySpeaking = currentSpeakingText && 
                  currentSpeakingText.role === message.role && 
                  currentSpeakingText.text === message.content
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "student" ? "justify-end" : "justify-start"}`}
                    style={{ display: isCurrentlySpeaking ? "none" : "flex" }}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 ${
                        message.role === "student"
                          ? "bg-gradient-to-br from-primary-500 to-primary-700 text-primary-foreground shadow-[0_10px_26px_-14px_rgba(var(--color-primary-700-rgb),0.5)]"
                          : message.role === "patient"
                            ? "border border-primary-100 bg-white text-slate-800 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                            : "border border-rose-200 bg-rose-50 text-rose-900 shadow-[0_8px_24px_-18px_rgba(244,63,94,0.35)] dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100"
                      }`}
                    >
                      <div className="mb-1 flex items-center">
                        {message.role === "student" && <GraduationCap className="mr-2 h-4 w-4" />}
                        {message.role === "patient" && <UserIcon className="mr-2 h-4 w-4" />}
                        {message.role === "doctor" && <Stethoscope className="mr-2 h-4 w-4" />}
                        <span className="text-sm font-medium capitalize">
                          {message.role === "student" ? "You" : message.role}
                        </span>
                        {message.isIntervention && <AlertTriangle className="ml-2 h-3 w-3 text-red-600 dark:text-red-300" />}
                        {message.role !== "student" && (
                          <Badge variant="outline" className="ml-2 text-sm">
                            {audioEnabled[message.role === "patient" ? "patientResponse" : "doctorResponse"] ? "🔊" : "💬"}
                          </Badge>
                        )}
                      </div>
                      <div className="text-base leading-relaxed text-left">
                        <MarkdownContent
                          variant={
                            message.role === "student"
                              ? "bubbleMine"
                              : message.role === "doctor"
                                ? "bubbleDoctor"
                                : "chatPatient"
                          }
                        >
                          {message.content}
                        </MarkdownContent>
                      </div>
                      <p className="mt-1 text-[13px] opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl border border-primary-100 bg-primary-50/70 p-3 dark:border-primary-500/25 dark:bg-primary-500/10">
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                      <span className="text-base text-gray-700 dark:text-slate-200">
                        Patient is responding...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact speaking status (avoid large transcript block in feed) */}
              {currentSpeakingText && (
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl border border-primary-200 bg-primary-50/80 p-3 dark:border-primary-500/25 dark:bg-primary-500/15">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 animate-pulse rounded-full bg-primary"></div>
                      <span className="text-base font-medium text-primary-800 dark:text-primary-100">
                        {currentSpeakingText.role === "patient" ? "Patient is speaking..." : "Doctor is speaking..."}
                      </span>
                      <Button
                        onClick={stopSpeaking}
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-6 w-6 p-0 text-primary-700 hover:text-primary-900 dark:text-primary-200 dark:hover:text-primary-50"
                        title="Stop speaking"
                      >
                        <MicOff className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input - Fixed at bottom */}
            <div className="flex flex-shrink-0 space-x-3 border-t border-primary-100 bg-white/85 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask the patient a question..."
                disabled={isLoading}
                className="flex-1 rounded-xl border-primary-200 bg-white text-base h-11 min-h-[44px] focus:border-primary focus:ring-primary dark:border-white/15 dark:bg-white/10"
              />
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading || !audioEnabled.studentInput}
                variant={isListening ? "destructive" : "outline"}
                size="default"
                title={audioEnabled.studentInput ? (isListening ? "Stop listening" : "Start voice input") : "Voice input disabled"}
                className={`h-11 min-w-11 shrink-0 rounded-xl border-primary-200 px-3 ${audioEnabled.studentInput ? '' : 'opacity-50'}`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !currentMessage.trim()}
                className="h-11 min-w-11 shrink-0 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 px-4 text-base hover:brightness-105 text-primary-foreground"
                size="default"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>

            {/* Section 2 - AI Assistant & Insights */}
            <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-primary-100 bg-white/90 shadow-[0_16px_40px_-26px_rgba(var(--color-primary-500-rgb),0.4)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
              <TabsList className="m-3 mb-0 grid w-full flex-shrink-0 grid-cols-2 rounded-xl border border-primary-100 bg-primary-50/70 p-1 dark:border-white/10 dark:bg-primary-950/30">
                <TabsTrigger value="conversation" className="rounded-md text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground">
                  <Brain className="h-5 w-5 mr-2 shrink-0" />
                  AI Assistant
                </TabsTrigger>
                <TabsTrigger value="insights" className="rounded-md text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground">
                  <BarChart3 className="h-5 w-5 mr-2 shrink-0" />
                  Insights
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="conversation" className="flex-1 flex flex-col m-3 mt-2 h-full">
                <Card className="flex h-full flex-1 flex-col border border-primary-100 bg-white/95 shadow-none dark:border-white/10 dark:bg-white/[0.04]">
                  <CardHeader className="flex-shrink-0 border-b border-primary-100 bg-white pb-3 dark:border-white/10 dark:bg-white/5">
                    <CardTitle className="flex items-center text-lg">
                      <Brain className="h-5 w-5 mr-2 shrink-0 text-primary-600" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        AI Clinical Assistant
                      </span>
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 md:text-base">Real-time clinical guidance and suggestions</p>
                  </CardHeader>
                  <CardContent className="flex-1 p-3 overflow-y-auto min-h-0">
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-3.5 dark:border-primary-500/25 dark:bg-primary-950/25">
                        <h3 className="mb-2 flex items-center text-sm font-semibold text-primary-900 dark:text-primary-100">
                          <Lightbulb className="mr-2 h-4 w-4 shrink-0" />
                          Clinical Tips
                        </h3>
                        <p className="text-sm leading-relaxed text-primary-800 dark:text-primary-200 md:text-[15px]">
                          Focus on gathering a comprehensive history. Ask about symptom onset, duration, severity, and any associated symptoms.
                        </p>
                      </div>
                      
                      <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-3.5 dark:border-primary-500/25 dark:bg-primary-950/25">
                        <h3 className="mb-2 flex items-center text-sm font-semibold text-primary-900 dark:text-primary-100">
                          <Target className="mr-2 h-4 w-4 shrink-0" />
                          Key Areas to Explore
                        </h3>
                        <ul className="space-y-1.5 text-sm leading-relaxed text-primary-800 dark:text-primary-200 md:text-[15px]">
                          <li>• Symptom characteristics and timing</li>
                          <li>• Associated symptoms and triggers</li>
                          <li>• Medical history and medications</li>
                          <li>• Social and family history</li>
                        </ul>
                      </div>
                      
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-500/25 dark:bg-amber-950/25">
                        <h3 className="mb-2 flex items-center text-sm font-semibold text-amber-900 dark:text-amber-200">
                          <AlertTriangle className="mr-2 h-4 w-4 shrink-0" />
                          Red Flags to Watch For
                        </h3>
                        <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200/90 md:text-[15px]">
                          Be alert for symptoms that suggest serious conditions requiring immediate attention.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="insights" className="flex-1 flex flex-col m-3 mt-2 h-full">
                <Card className="flex h-full flex-1 flex-col border border-primary-100 bg-white/95 shadow-none dark:border-white/10 dark:bg-white/[0.04]">
                  <CardHeader className="flex-shrink-0 border-b border-primary-100 bg-white pb-3 dark:border-white/10 dark:bg-white/5">
                    <CardTitle className="flex items-center text-lg">
                      <BarChart3 className="h-5 w-5 mr-2 shrink-0 text-primary-600" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        Conversation Insights
                      </span>
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 md:text-base">Real-time performance metrics</p>
                  </CardHeader>
                  <CardContent className="flex-1 p-3 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <MetricCard
                        title="Questions Asked"
                        value={conversationStats.questionsAsked}
                        icon={MessageCircle}
                        color="blue"
                        description="Total questions"
                      />
                      <MetricCard
                        title="Time Spent"
                        value={conversationStats.timeSpent}
                        suffix=" min"
                        icon={Timer}
                        color="purple"
                        description="Session duration"
                      />
                      <MetricCard
                        title="Interventions"
                        value={conversationStats.interventions}
                        icon={AlertTriangle}
                        color="yellow"
                        description="Doctor guidance"
                      />
                      <MetricCard
                        title="Efficiency"
                        value={Math.round(conversationStats.efficiency)}
                        suffix="%"
                        icon={Target}
                        color="green"
                        description="Question quality"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-3 dark:border-primary-500/25 dark:bg-primary-950/25">
                        <h3 className="mb-2 flex items-center text-sm font-semibold text-primary-900 dark:text-primary-100">
                          <TrendingUp className="mr-2 h-4 w-4 shrink-0" />
                          Progress Tracking
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-primary-700 dark:text-primary-300">Conversation Progress</span>
                            <span className="font-medium text-primary-900 dark:text-primary-100">{Math.min(100, (conversationStats.questionsAsked / 10) * 100)}%</span>
                          </div>
                          <Progress value={Math.min(100, (conversationStats.questionsAsked / 10) * 100)} className="h-2.5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

            {/* Section 3 - Question Suggestions */}
            <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-primary-100 bg-white/90 shadow-[0_16px_40px_-26px_rgba(var(--color-primary-500-rgb),0.32)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]">
            <Card className="flex h-full flex-1 flex-col border-0 bg-transparent shadow-none">
              <CardHeader className="flex-shrink-0 border-b border-primary-100 bg-white/80 px-4 pb-2 pt-3 dark:border-white/10 dark:bg-white/5">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <div className="relative">
                    <Lightbulb className="mr-2 h-5 w-5 shrink-0 text-primary-600" />
                    <div className="absolute -top-1 -right-1">
                      <Zap className="h-2.5 w-2.5 text-yellow-500 animate-pulse" />
                    </div>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    Smart Suggestions
                  </span>
                </CardTitle>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 md:text-base">AI-powered question recommendations</p>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-y-auto p-3 pt-2">
                <AskQuestions
                  context={askQuestionsContext}
                  onQuestionSelect={handleQuestionSelect}
                  isLoading={isLoading}
                  triggerRefresh={questionRefreshTrigger}
                  sessionId={sessionId}
                  onHintUsed={(category, importance) => {
                    console.log(`Hint used in practice mode: ${category} (${importance})`)
                    // Update hint count for display
                    if (hintSession) {
                      const updatedSession = aiHintTrackingService.getSession(sessionId)
                      if (updatedSession) {
                        setHintSession(updatedSession)
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>


            {/* Section 4 - Case Information & Progress */}
            <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-primary-100 bg-white/90 shadow-[0_16px_40px_-26px_rgba(var(--color-primary-500-rgb),0.4)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]">
            <Card className="flex h-full flex-1 flex-col border-0 bg-transparent shadow-none">
              <CardHeader className="flex-shrink-0 border-b border-primary-100 bg-white/80 px-4 pb-3 dark:border-white/10 dark:bg-white/5">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <div className="relative">
                    <BookOpen className="mr-2 h-5 w-5 shrink-0 text-primary-600 sm:h-6 sm:w-6" />
                    <div className="absolute -top-1 -right-1">
                      <Star className="h-3 w-3 text-yellow-500 animate-pulse sm:h-3.5 sm:w-3.5" />
                    </div>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    Case Information
                  </span>
                </CardTitle>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 md:text-base">Patient details and case progress</p>
              </CardHeader>
              <CardContent className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
                <div className="min-w-0 max-w-full space-y-3">
                  {/* Patient Profile */}
                  <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-3.5 dark:border-primary-500/25 dark:bg-primary-950/25">
                    <h3 className="mb-2 flex items-center text-sm font-semibold text-primary-900 dark:text-primary-100">
                      <UserIcon className="mr-2 h-4 w-4 shrink-0" />
                      Patient Profile
                    </h3>
                    <div className="space-y-1.5 text-sm text-primary-800 dark:text-primary-200 md:text-[15px]">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">Name:</span>
                        <span className="text-right">{medicalCase.patientProfile.name}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">Age:</span>
                        <span>{medicalCase.patientProfile.age}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">Gender:</span>
                        <span>{medicalCase.patientProfile.gender}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="shrink-0 font-medium">Chief Complaint:</span>
                        <span className="max-w-[60%] text-right leading-snug">{medicalCase.symptoms[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Case Details */}
                  <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-3.5 dark:border-primary-500/25 dark:bg-primary-950/25">
                    <h3 className="mb-2 flex items-center text-sm font-semibold text-primary-900 dark:text-primary-100">
                      <Stethoscope className="mr-2 h-4 w-4 shrink-0" />
                      Case Details
                    </h3>
                      <div className="space-y-1.5 text-sm text-primary-800 dark:text-primary-200 md:text-[15px]">
                      {/* Hide disease name in assessment/practice UI */}
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">Condition:</span>
                        <span>Hidden</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">Difficulty:</span>
                        <Badge
                          variant="outline"
                          className={cn("text-sm capitalize", medCaseDifficultyBadgeClass(medicalCase.difficulty))}
                        >
                          {medicalCase.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="shrink-0 font-medium">Symptoms:</span>
                        <span className="max-w-[60%] truncate text-right" title={medicalCase.symptoms.join(", ")}>{medicalCase.symptoms.slice(0, 3).join(", ")}{medicalCase.symptoms.length > 3 ? ", …" : ""}</span>
                      </div>
                    </div>
                  </div>

                  {/* Session Progress */}
                  <div className="rounded-2xl border border-primary-200 bg-white p-3.5 dark:border-white/15 dark:bg-white/[0.06]">
                    <h3 className="mb-2 flex items-center text-sm font-semibold text-primary-900 dark:text-primary-100">
                      <Activity className="mr-2 h-4 w-4 shrink-0" />
                      Session Progress
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm md:text-[15px]">
                        <span className="text-primary-700 dark:text-primary-300">Conversation Quality</span>
                        <span className="font-medium text-primary-900 dark:text-primary-100">{Math.round(conversationStats.efficiency)}%</span>
                      </div>
                      <Progress value={conversationStats.efficiency} className="h-2.5" />
                      
                      <div className="flex justify-between text-sm md:text-[15px]">
                        <span className="text-primary-700 dark:text-primary-300">Questions Asked</span>
                        <span className="font-medium text-primary-900 dark:text-primary-100">{conversationStats.questionsAsked}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm md:text-[15px]">
                        <span className="text-primary-700 dark:text-primary-300">Time Spent</span>
                        <span className="font-medium text-primary-900 dark:text-primary-100">{conversationStats.timeSpent} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="min-w-0 max-w-full rounded-2xl border border-primary-200 bg-primary-50/70 p-3 dark:border-primary-500/25 dark:bg-primary-950/25 sm:p-3.5">
                    <h3 className="mb-2 flex items-center text-sm font-semibold text-primary-900 dark:text-primary-100">
                      <Settings className="mr-2 h-4 w-4 shrink-0" />
                      Quick Actions
                    </h3>
                    <div className="min-w-0 max-w-full">
                      <Button 
                        onClick={handleCompleteCase} 
                        disabled={isCompletingCase}
                        className="h-auto min-h-11 w-full min-w-0 max-w-full whitespace-normal rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 px-3 py-2.5 text-center text-sm font-semibold leading-snug text-primary-foreground shadow-[0_10px_28px_-12px_rgba(var(--color-primary-700-rgb),0.45)] hover:brightness-105 disabled:opacity-70 sm:px-4 sm:text-base [&_svg]:shrink-0 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-2"
                        size="default"
                      >
                        {isCompletingCase ? (
                          <>
                            <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-b-2 border-white" />
                            <span className="min-w-0">Loading...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 shrink-0" />
                            <span className="min-w-0 max-w-full text-balance break-words">
                              Complete Case & Diagnose Disease
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Intervention Alert Overlay */}
      {showIntervention && (
        <div className="fixed inset-0 bg-red-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className={cn(APP_GLASS_CARD, "animate-pulse mx-4 max-w-md rounded-xl border border-red-200/80 p-6 shadow-2xl dark:border-red-500/30")}>
            <div className="mb-4 flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900 dark:text-red-200">Doctor Intervention</h3>
                <p className="text-sm text-red-700 dark:text-red-300">Clinical guidance provided</p>
              </div>
            </div>
            <p className="text-gray-800 dark:text-slate-200">{interventionMessage}</p>
          </div>
        </div>
      )}

      {/* Diagnosis Submission Modal */}
      {showDiagnosisSubmission && conversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <DiagnosisSubmission
              conversationId={conversation.id}
              studentId={student.id}
              caseId={medicalCase.id}
              medicalCase={medicalCase}
              caseMetadata={{
                isRare: medicalCase.isRare,
                specialty: medicalCase.specialty,
                difficulty: medicalCase.difficulty
              }}
              onClose={() => setShowDiagnosisSubmission(false)}
              onContinueToSOAP={async () => {
                try {
                  setIsCompletingCase(true)
                  setIsTransitioningToSoap(true)
                  await databaseConversationService.completeConversation(conversation.id, student.id)
                  const { ensureCaseSnapshotOnSession } = await import(
                    "@/lib/fyp/medprep-persistence-service"
                  )
                  await ensureCaseSnapshotOnSession(
                    conversation.id,
                    student.id,
                    medicalCase,
                  )
                } catch (e) {
                  console.error(e)
                } finally {
                  // Navigate to SOAP note page
                  window.location.href = `/soap/${conversation.id}`
                }
              }}
            />
          </div>
        </div>
      )}

      {isTransitioningToSoap && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/60">
          <div className={cn(APP_GLASS_CARD, "rounded-2xl border border-primary-200/80 px-6 py-5 text-center shadow-xl dark:border-primary-500/25")}>
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
            <p className="font-medium text-slate-800 dark:text-slate-100">Preparing SOAP note...</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Loading case context and your conversation</p>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {sessionGrade && (
        <PracticeGradeModal
          grade={sessionGrade}
          isOpen={showGradeModal}
          onClose={() => setShowGradeModal(false)}
          onRetry={() => {
            setShowGradeModal(false)
            setSessionGrade(null)
            // Reset session for retry
            const newSession = aiHintTrackingService.startSession(medicalCase.id, sessionId)
            setHintSession(newSession)
          }}
        />
      )}
    </div>
  )
}