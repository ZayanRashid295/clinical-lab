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
      blue: "text-emerald-700 bg-emerald-50/80 border-emerald-200/80",
      green: "text-green-700 bg-green-50/80 border-green-200/80",
      yellow: "text-amber-700 bg-amber-50/80 border-amber-200/80",
      red: "text-rose-700 bg-rose-50/80 border-rose-200/80",
      purple: "text-teal-700 bg-teal-50/80 border-teal-200/80"
    }
    return colors[color] || colors.blue
  }

  return (
    <Card className={`transform transition-all duration-300 hover:-translate-y-0.5 rounded-2xl border ${getColorClasses()} shadow-[0_8px_24px_-18px_rgba(15,118,110,0.45)]`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-slate-600">{title}</CardTitle>
        <Icon className="h-4 w-4 opacity-80" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-800 mb-1">
          <AnimatedCounter value={value} suffix={suffix} duration={1000} />
        </div>
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
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
        if (resumeConversationId) {
          const existingConversation =
            await databaseConversationService.getConversation(resumeConversationId, student.id)
          if (existingConversation) {
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
            medicalCase?.title
          )
          console.log("✅ Created conversation object:", newConversation)
          setConversation(newConversation)
          setMessages(newConversation.messages)
        }

        if (cancelled) return
        const session = aiHintTrackingService.startSession(medicalCase.id, sessionId)
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
          medicalCase?.title
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
          medicalCase?.title
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
    <div className="h-full min-h-0 flex flex-col bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.16)_0%,rgba(246,251,248,0)_40%),radial-gradient(circle_at_100%_100%,rgba(15,118,110,0.1)_0%,rgba(246,251,248,0)_35%)] bg-[#F6FBF8]">
      {/* Global Loading Overlay for Practice Interface Bootstrapping */}
      {isBootstrapping && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl px-6 py-5 border border-gray-200 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-700 font-medium">Preparing practice interface...</p>
            <p className="text-xs text-gray-500 mt-1">Loading conversation and tools</p>
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
      <header className="sticky top-0 z-20 border-b border-emerald-100/90 bg-white/80 backdrop-blur-xl">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 py-2">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-emerald-200 bg-white shadow-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent leading-tight">
                  {medicalCase.title}
                </h1>
                <p className="text-xs text-slate-600">Patient: {medicalCase.patientProfile.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 md:inline-flex">
                {medicalCase.difficulty}
              </Badge>

              {/* Audio Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setAudioEnabled(prev => ({ ...prev, studentInput: !prev.studentInput }))}
                  variant="outline"
                  size="sm"
                  className={`border-emerald-200/80 bg-white/90 ${audioEnabled.studentInput ? 'border-emerald-300 text-emerald-700' : 'text-slate-500'}`}
                  title="Toggle voice input for student"
                >
                  {audioEnabled.studentInput ? <Mic className="h-4 w-4 mr-1" /> : <MicOff className="h-4 w-4 mr-1" />}
                  Voice Input
                </Button>
                <Button
                  onClick={() => setAudioEnabled(prev => ({ ...prev, patientResponse: !prev.patientResponse }))}
                  variant="outline"
                  size="sm"
                  className={`border-emerald-200/80 bg-white/90 ${audioEnabled.patientResponse ? 'border-emerald-300 text-emerald-700' : 'text-slate-500'}`}
                  title="Toggle voice output for patient"
                >
                  {audioEnabled.patientResponse ? <Video className="h-4 w-4 mr-1" /> : <VideoOff className="h-4 w-4 mr-1" />}
                  Patient Voice
                </Button>
                <Button
                  onClick={() => setAudioEnabled(prev => ({ ...prev, doctorResponse: !prev.doctorResponse }))}
                  variant="outline"
                  size="sm"
                  className={`border-emerald-200/80 bg-white/90 ${audioEnabled.doctorResponse ? 'border-teal-300 text-teal-700' : 'text-slate-500'}`}
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
                className="rounded-xl bg-[linear-gradient(135deg,#10B981,#059669)] text-white shadow-[0_10px_28px_-12px_rgba(5,150,105,0.65)] transition-all hover:brightness-105 disabled:opacity-70"
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
            <div className="flex flex-col h-full min-w-0 rounded-3xl border border-[#DCEFE5] bg-white/90 shadow-[0_16px_40px_-26px_rgba(16,185,129,0.5)] overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-emerald-100 bg-white/90 flex-shrink-0">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-emerald-600" />
                Patient Consultation
              </h2>
              <p className="text-sm text-slate-600">Interactive conversation with AI patient</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-gradient-to-b from-white via-emerald-50/20 to-white">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                  <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Start the consultation by asking the patient a question</p>
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
                          ? "bg-[linear-gradient(135deg,#10B981,#059669)] text-white shadow-[0_10px_26px_-14px_rgba(5,150,105,0.75)]"
                          : message.role === "patient"
                            ? "bg-white text-slate-800 border border-emerald-100 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]"
                            : "bg-rose-50 text-rose-900 border border-rose-200 shadow-[0_8px_24px_-18px_rgba(244,63,94,0.35)]"
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {message.role === "student" && <GraduationCap className="h-4 w-4 mr-2" />}
                        {message.role === "patient" && <UserIcon className="h-4 w-4 mr-2" />}
                        {message.role === "doctor" && <Stethoscope className="h-4 w-4 mr-2" />}
                        <span className="text-xs font-medium capitalize">
                          {message.role === "student" ? "You" : message.role}
                        </span>
                        {message.isIntervention && <AlertTriangle className="h-3 w-3 ml-2 text-red-600" />}
                        {message.role !== "student" && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {audioEnabled[message.role === "patient" ? "patientResponse" : "doctorResponse"] ? "🔊" : "💬"}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-left">
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
                      <p className="text-xs opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-emerald-50/70 rounded-2xl p-3 max-w-[90%] border border-emerald-100">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      <span className="text-sm text-gray-600">
                        Patient is responding...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact speaking status (avoid large transcript block in feed) */}
              {currentSpeakingText && (
                <div className="flex justify-start">
                  <div className="bg-teal-50/80 rounded-2xl p-3 max-w-[90%] border border-teal-200">
                    <div className="flex items-center">
                      <div className="animate-pulse rounded-full h-3 w-3 bg-purple-500 mr-2"></div>
                      <span className="text-sm font-medium text-teal-700">
                        {currentSpeakingText.role === "patient" ? "Patient is speaking..." : "Doctor is speaking..."}
                      </span>
                      <Button
                        onClick={stopSpeaking}
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-6 w-6 p-0 text-teal-600 hover:text-teal-800"
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
            <div className="flex space-x-3 p-3 border-t border-emerald-100 bg-white/85 backdrop-blur-sm flex-shrink-0">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask the patient a question..."
                disabled={isLoading}
                className="flex-1 rounded-xl border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
              />
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading || !audioEnabled.studentInput}
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                title={audioEnabled.studentInput ? (isListening ? "Stop listening" : "Start voice input") : "Voice input disabled"}
                className={`rounded-xl border-emerald-200 ${audioEnabled.studentInput ? '' : 'opacity-50'}`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !currentMessage.trim()}
                className="rounded-xl bg-[linear-gradient(135deg,#10B981,#059669)] hover:brightness-105 text-white"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

            {/* Section 2 - AI Assistant & Insights */}
            <div className="flex flex-col bg-white/90 h-full min-w-0 rounded-3xl border border-[#DCEFE5] shadow-[0_16px_40px_-26px_rgba(16,185,129,0.45)] overflow-hidden backdrop-blur-md">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-2 bg-emerald-50/70 border border-emerald-100 rounded-xl p-1 m-3 mb-0 flex-shrink-0">
                <TabsTrigger value="conversation" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Assistant
                </TabsTrigger>
                <TabsTrigger value="insights" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Insights
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="conversation" className="flex-1 flex flex-col m-3 mt-2 h-full">
                <Card className="flex-1 bg-white/95 shadow-none border border-emerald-100 flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-emerald-100 bg-white flex-shrink-0">
                    <CardTitle className="flex items-center text-base">
                      <Brain className="h-4 w-4 mr-2 text-emerald-600" />
                      <span className="font-semibold text-slate-800">
                        AI Clinical Assistant
                      </span>
                    </CardTitle>
                    <p className="text-xs text-slate-600">Real-time clinical guidance and suggestions</p>
                  </CardHeader>
                  <CardContent className="flex-1 p-3 overflow-y-auto min-h-0">
                    <div className="space-y-3">
                      <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-200">
                        <h3 className="font-semibold text-emerald-900 mb-2 flex items-center text-xs">
                          <Lightbulb className="h-3 w-3 mr-2" />
                          Clinical Tips
                        </h3>
                        <p className="text-xs text-emerald-800">
                          Focus on gathering a comprehensive history. Ask about symptom onset, duration, severity, and any associated symptoms.
                        </p>
                      </div>
                      
                      <div className="bg-teal-50/70 rounded-2xl p-3 border border-teal-200">
                        <h3 className="font-semibold text-teal-900 mb-2 flex items-center text-xs">
                          <Target className="h-3 w-3 mr-2" />
                          Key Areas to Explore
                        </h3>
                        <ul className="text-xs text-teal-800 space-y-1">
                          <li>• Symptom characteristics and timing</li>
                          <li>• Associated symptoms and triggers</li>
                          <li>• Medical history and medications</li>
                          <li>• Social and family history</li>
                        </ul>
                      </div>
                      
                      <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-200">
                        <h3 className="font-semibold text-amber-900 mb-2 flex items-center text-xs">
                          <AlertTriangle className="h-3 w-3 mr-2" />
                          Red Flags to Watch For
                        </h3>
                        <p className="text-xs text-amber-800">
                          Be alert for symptoms that suggest serious conditions requiring immediate attention.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="insights" className="flex-1 flex flex-col m-3 mt-2 h-full">
                <Card className="flex-1 bg-white/95 shadow-none border border-emerald-100 flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-emerald-100 bg-white flex-shrink-0">
                    <CardTitle className="flex items-center text-base">
                      <BarChart3 className="h-4 w-4 mr-2 text-emerald-600" />
                      <span className="font-semibold text-slate-800">
                        Conversation Insights
                      </span>
                    </CardTitle>
                    <p className="text-xs text-slate-600">Real-time performance metrics</p>
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
                      <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-200">
                        <h3 className="font-semibold text-emerald-900 mb-2 flex items-center text-xs">
                          <TrendingUp className="h-3 w-3 mr-2" />
                          Progress Tracking
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-emerald-700">Conversation Progress</span>
                            <span className="text-emerald-900 font-medium">{Math.min(100, (conversationStats.questionsAsked / 10) * 100)}%</span>
                          </div>
                          <Progress value={Math.min(100, (conversationStats.questionsAsked / 10) * 100)} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

            {/* Section 3 - Question Suggestions */}
            <div className="flex flex-col h-full min-w-0 rounded-3xl border border-[#DCEFE5] shadow-[0_16px_40px_-26px_rgba(16,185,129,0.35)] overflow-hidden bg-white/90 backdrop-blur-md">
            <Card className="flex-1 bg-transparent shadow-none border-0 flex flex-col h-full">
              <CardHeader className="pb-1 pt-2 border-b border-emerald-100 bg-white/80 flex-shrink-0">
                <CardTitle className="flex items-center text-xs">
                  <div className="relative">
                    <Lightbulb className="h-3 w-3 mr-1 text-emerald-600" />
                    <div className="absolute -top-1 -right-1">
                      <Zap className="h-2 w-2 text-yellow-500 animate-pulse" />
                    </div>
                  </div>
                  <span className="font-semibold text-slate-800">
                    Smart Suggestions
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-600">AI-powered question recommendations</p>
              </CardHeader>
              <CardContent className="flex-1 p-2 pt-1 overflow-y-auto min-h-0">
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
            <div className="flex flex-col h-full min-w-0 rounded-3xl border border-[#DCEFE5] shadow-[0_16px_40px_-26px_rgba(16,185,129,0.45)] overflow-hidden bg-white/90 backdrop-blur-md">
            <Card className="flex-1 bg-transparent shadow-none border-0 flex flex-col h-full">
              <CardHeader className="pb-3 border-b border-emerald-100 bg-white/80 flex-shrink-0">
                <CardTitle className="flex items-center text-base">
                  <div className="relative">
                    <BookOpen className="h-4 w-4 mr-2 text-emerald-600" />
                    <div className="absolute -top-1 -right-1">
                      <Star className="h-3 w-3 text-yellow-500 animate-pulse" />
                    </div>
                  </div>
                  <span className="font-semibold text-slate-800">
                    Case Information
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-600">Patient details and case progress</p>
              </CardHeader>
              <CardContent className="flex-1 p-3 overflow-y-auto min-h-0">
                <div className="space-y-3">
                  {/* Patient Profile */}
                  <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-200">
                    <h3 className="font-semibold text-emerald-900 mb-2 flex items-center text-xs">
                      <UserIcon className="h-3 w-3 mr-2" />
                      Patient Profile
                    </h3>
                    <div className="space-y-1 text-xs text-emerald-800">
                      <div className="flex justify-between">
                        <span className="font-medium">Name:</span>
                        <span>{medicalCase.patientProfile.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Age:</span>
                        <span>{medicalCase.patientProfile.age}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Gender:</span>
                        <span>{medicalCase.patientProfile.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Chief Complaint:</span>
                        <span className="text-right max-w-[60%] text-xs">{medicalCase.symptoms[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Case Details */}
                  <div className="bg-teal-50/70 rounded-2xl p-3 border border-teal-200">
                    <h3 className="font-semibold text-teal-900 mb-2 flex items-center text-xs">
                      <Stethoscope className="h-3 w-3 mr-2" />
                      Case Details
                    </h3>
                      <div className="space-y-1 text-xs text-teal-800">
                      {/* Hide disease name in assessment/practice UI */}
                      <div className="flex justify-between">
                        <span className="font-medium">Condition:</span>
                        <span>Hidden</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Difficulty:</span>
                        <Badge variant="outline" className="text-xs">
                          {medicalCase.difficulty}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="font-medium">Symptoms:</span>
                        <span className="text-right max-w-[60%] truncate" title={medicalCase.symptoms.join(", ")}>{medicalCase.symptoms.slice(0, 3).join(", ")}{medicalCase.symptoms.length > 3 ? ", …" : ""}</span>
                      </div>
                    </div>
                  </div>

                  {/* Session Progress */}
                  <div className="bg-white rounded-2xl p-3 border border-emerald-200">
                    <h3 className="font-semibold text-emerald-900 mb-2 flex items-center text-xs">
                      <Activity className="h-3 w-3 mr-2" />
                      Session Progress
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700">Conversation Quality</span>
                        <span className="text-emerald-900 font-medium">{Math.round(conversationStats.efficiency)}%</span>
                      </div>
                      <Progress value={conversationStats.efficiency} className="h-2" />
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700">Questions Asked</span>
                        <span className="text-emerald-900 font-medium">{conversationStats.questionsAsked}</span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700">Time Spent</span>
                        <span className="text-emerald-900 font-medium">{conversationStats.timeSpent} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-200">
                    <h3 className="font-semibold text-emerald-900 mb-2 flex items-center text-xs">
                      <Settings className="h-3 w-3 mr-2" />
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleCompleteCase} 
                        disabled={isCompletingCase}
                        className="w-full rounded-xl bg-[linear-gradient(135deg,#10B981,#059669)] text-white shadow-[0_10px_28px_-12px_rgba(5,150,105,0.65)] text-xs hover:brightness-105 disabled:opacity-70"
                        size="sm"
                      >
                        {isCompletingCase ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-2" />
                            Complete Case & Diagnose Disease
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
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md mx-4 border border-red-200 animate-pulse">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-red-900">Doctor Intervention</h3>
                <p className="text-sm text-red-700">Clinical guidance provided</p>
              </div>
            </div>
            <p className="text-gray-800">{interventionMessage}</p>
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
              onContinueToSOAP={async () => {
                try {
                  setIsCompletingCase(true)
                  setIsTransitioningToSoap(true)
                  await databaseConversationService.completeConversation(conversation.id, student.id)
                  // Persist selected case snapshot so SOAP page can resolve rich context reliably.
                  localStorage.setItem(`soap_case_${conversation.id}`, JSON.stringify(medicalCase))
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="rounded-2xl border border-emerald-200 bg-white px-6 py-5 text-center shadow-xl">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600" />
            <p className="font-medium text-slate-800">Preparing SOAP note...</p>
            <p className="mt-1 text-xs text-slate-500">Loading case context and your conversation</p>
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