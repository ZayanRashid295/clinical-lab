"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  LearningSession,
  ChatMessage,
} from "@/shared/types/learning.types";
import { learningService } from "@/shared/services/learning/learning.service";
import { sampleCases } from "@/shared/data/sample-cases";
import {
  differentialDiagnosisService,
  type DifferentialDiagnosisItem,
} from "@/shared/services/learning/differential-diagnosis.service";
import {
  conversationTerminationService,
  type TerminationDecision,
} from "@/shared/services/learning/conversation-termination.service";
import {
  ArrowLeft,
  Play,
  Pause,
  MessageCircle,
  FileText,
  User,
  Users,
  Stethoscope,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Brain,
  Star,
  GraduationCap,
  Heart,
  Activity,
  Target,
  Zap,
  ChevronRight,
  Lightbulb,
  Award,
  TrendingUp,
  Mic,
  Video,
  Settings,
  Share,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Send,
  X,
  Minimize2,
  ChevronDown,
  ChevronUp,
  PauseCircle,
  PlayCircle,
  Sun,
  Moon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface LearningInterfaceProps {
  session: LearningSession;
  onSessionUpdate: (session: LearningSession) => void;
  medicalCase?: any;
}

export function EnhancedLearningInterface({
  session,
  onSessionUpdate,
  medicalCase: propMedicalCase,
}: LearningInterfaceProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [studentQuestion, setStudentQuestion] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentQuestionResponse, setStudentQuestionResponse] = useState("");
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const [justResumed, setJustResumed] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(true);
  const [conversationSpeed, setConversationSpeed] = useState(1);
  const lastResumedSessionId = useRef<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const thoughtsScrollRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  // Enhanced simulation states - using real conversation data
  const [messages, setMessages] = useState<
    Array<{ speaker: string; text: string; time: string }>
  >([]);
  const [isSpeaking, setIsSpeaking] = useState<{
    doctor: boolean;
    patient: boolean;
  }>({ doctor: false, patient: false });
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [speechSynthesis, setSpeechSynthesis] =
    useState<SpeechSynthesis | null>(null);
  const lastSpokenMessageRef = useRef<string | null>(null);
  const speechStartTimeRef = useRef<number | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<{
    role: string;
    content: string;
    isComplete: boolean;
  } | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Enhanced speech and conversation states
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<
    | "idle"
    | "doctor-thinking"
    | "patient-responding"
    | "paused"
    | "diagnosis-ready"
  >("idle");
  const [isDiagnosisReady, setIsDiagnosisReady] = useState(false);
  const [terminationDecision, setTerminationDecision] =
    useState<TerminationDecision | null>(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [currentDuration, setCurrentDuration] = useState<string>("0:00");
  const speechQueueRef = useRef<
    Array<{ text: string; voice: "doctor" | "patient" }>
  >([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingSpeechRef = useRef(false);
  const spokenMessagesRef = useRef<Set<string>>(new Set());

  const [doctorThoughts, setDoctorThoughts] = useState<
    Array<{ time: string; thought: string }>
  >([]);
  const [currentThought, setCurrentThought] = useState<string>("");
  const [isGeneratingThought, setIsGeneratingThought] = useState(false);

  const [differentialDiagnosis, setDifferentialDiagnosis] = useState<
    DifferentialDiagnosisItem[]
  >([
    {
      condition: "Primary Diagnosis",
      probability: 0,
      reason: "Most likely based on presenting symptoms and history",
      category: "primary",
    },
    {
      condition: "Secondary Consideration",
      probability: 0,
      reason: "Alternative diagnosis requiring further evaluation",
      category: "secondary",
    },
    {
      condition: "Rare Condition",
      probability: 0,
      reason: "Less common but important to consider",
      category: "rare",
    },
    {
      condition: "Rule Out",
      probability: 0,
      reason: "Important differential requiring exclusion",
      category: "rule-out",
    },
  ]);

  // Ask Doctor popup state
  const [isDoctorChatOpen, setIsDoctorChatOpen] = useState(false);
  const [isDoctorChatMinimized, setIsDoctorChatMinimized] = useState(false);
  const [studentDoctorChat, setStudentDoctorChat] = useState<
    Array<{ role: string; content: string; timestamp: string }>
  >([]);
  const [isDoctorResponding, setIsDoctorResponding] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<{
    demographics: boolean;
    medicalHistory: boolean;
    socialHistory: boolean;
    familyHistory: boolean;
    chiefComplaint: boolean;
    presentingSymptoms: boolean;
    vitalSigns: boolean;
    clinicalNotes: boolean;
    initialAssessment: boolean;
    learningGuidelines: boolean;
    clinicalTips: boolean;
    keyAreas: boolean;
    redFlags: boolean;
    sessionProgress: boolean;
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
    sessionProgress: false,
  });

  // Tab states for each section
  const [activeTabs, setActiveTabs] = useState<{
    demographics: string;
    medicalHistory: string;
    socialHistory: string;
    familyHistory: string;
    chiefComplaint: string;
    presentingSymptoms: string;
    vitalSigns: string;
    clinicalNotes: string;
    initialAssessment: string;
    learningGuidelines: string;
    clinicalTips: string;
    keyAreas: string;
    redFlags: string;
    sessionProgress: string;
  }>({
    demographics: "overview",
    medicalHistory: "conditions",
    socialHistory: "lifestyle",
    familyHistory: "genetics",
    chiefComplaint: "primary",
    presentingSymptoms: "current",
    vitalSigns: "current",
    clinicalNotes: "nursing",
    initialAssessment: "clinical",
    learningGuidelines: "objectives",
    clinicalTips: "diagnosis",
    keyAreas: "focus",
    redFlags: "urgent",
    sessionProgress: "overview",
  });

  // Conversation handling functions
  const startConversation = async () => {
    if (session.conversation.length > 0) return;

    setIsPlaying(true);
    setIsProcessing(true);

    try {
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: [],
      };

      const response = await fetch(
        "http://localhost:3000/learning/ai/doctor-question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${localStorage.getItem("token")}`, // Temporarily disabled
          },
          body: JSON.stringify({ context, conversation: [] }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate doctor question");
      }

      const { question, explanation } = await response.json();

      const doctorMessage: ChatMessage = {
        id: `doctor-${Date.now()}`,
        role: "doctor",
        content: question,
        explanation,
        timestamp: new Date().toISOString(),
      };

      const updatedSession = {
        ...session,
        conversation: [doctorMessage],
      };

      onSessionUpdate(updatedSession);
    } catch (error) {
      console.error("Error starting conversation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const continueConversation = async () => {
    if (session.isComplete || isDiagnosisReady) return;

    console.log(
      "continueConversation called - conversation length:",
      session.conversation.length,
      "isComplete:",
      session.isComplete
    );
    setIsProcessing(true);

    try {
      // If conversation is empty, start with doctor's first question
      if (session.conversation.length === 0) {
        console.log("Starting conversation with doctor question");
        const context = {
          caseId: session.caseId,
          disease: session.disease,
          symptoms: medicalCase?.symptoms || [],
          patientProfile: session.patientProfile,
          conversationHistory: [],
        };

        const doctorResponse = await fetch(
          "http://localhost:3000/learning/ai/doctor-question",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Authorization: `Bearer ${localStorage.getItem("token")}`, // Temporarily disabled
            },
            body: JSON.stringify({ context, conversation: [] }),
          }
        );

        if (!doctorResponse.ok) {
          throw new Error("Failed to generate doctor question");
        }

        const { question, explanation } = await doctorResponse.json();

        const doctorMessage: ChatMessage = {
          id: `doctor-${Date.now()}`,
          role: "doctor",
          content: question,
          explanation: explanation,
          timestamp: new Date().toISOString(),
        };

        // Calculate timing for doctor question
        const doctorTextLength = question.length;
        const doctorSpeechDuration = Math.max(doctorTextLength * 50, 2000);

        console.log(
          `Initial doctor question length: ${doctorTextLength} chars, estimated speech duration: ${doctorSpeechDuration}ms`
        );

        // Generate initial doctor thought
        generateDoctorThought("Initial patient assessment", []);

        // Update differential diagnosis after initial question
        updateDifferentialDiagnosis([doctorMessage]);

        // Start streaming the doctor question immediately
        streamText(question, "doctor", () => {
          // After streaming completes, add to conversation and start speech
          const updatedSession = {
            ...session,
            conversation: [doctorMessage],
          };
          onSessionUpdate(updatedSession);
          clearStreaming();
        });

        setIsPlaying(false);
        return;
      }

      const lastMessage = session.conversation[session.conversation.length - 1];

      if (lastMessage.role === "doctor") {
        console.log(
          "Generating patient response to doctor question:",
          lastMessage.content.substring(0, 50)
        );
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
        };

        setConversationStatus("patient-responding");

        const patientResponse = await fetch(
          "http://localhost:3000/learning/ai/patient-response",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Authorization: `Bearer ${localStorage.getItem("token")}`, // Temporarily disabled
            },
            body: JSON.stringify({
              question: lastMessage.content,
              context,
              instruction:
                "Keep responses under 2 sentences and conversational. Be natural and realistic.",
            }),
          }
        );

        if (!patientResponse.ok) {
          // Add error message to conversation
          const errorMessage: ChatMessage = {
            id: `patient-error-${Date.now()}`,
            role: "patient",
            content:
              "⚠️ I'm having trouble responding right now. Could you please ask again?",
            timestamp: new Date().toISOString(),
          };

          const updatedSession = {
            ...session,
            conversation: [...session.conversation, errorMessage],
          };
          onSessionUpdate(updatedSession);
          setConversationStatus("idle");
          return;
        }

        let { response: patientResponseText, isComplete } =
          await patientResponse.json();

        // Truncate response if too long (client-side fallback)
        const sentences = patientResponseText.split(/[.!?]+/);
        if (sentences.length > 2) {
          patientResponseText = sentences.slice(0, 2).join(".") + ".";
        }
        console.log(
          "Patient response generated:",
          patientResponseText.substring(0, 50),
          "isComplete:",
          isComplete
        );

        const patientMessage: ChatMessage = {
          id: `patient-${Date.now()}`,
          role: "patient",
          content: patientResponseText,
          timestamp: new Date().toISOString(),
        };

        const updatedConversation = [...session.conversation, patientMessage];

        if (isComplete) {
          const updatedSession = {
            ...session,
            conversation: updatedConversation,
            isComplete: true,
          };
          onSessionUpdate(updatedSession);
          setIsPlaying(false);
          return;
        }

        // Calculate speech duration for patient response
        const patientTextLength = patientResponseText.length;
        const estimatedPatientSpeechDuration = Math.max(
          patientTextLength * 50,
          3000
        ); // 50ms per character, minimum 3 seconds

        console.log(
          `Patient response length: ${patientTextLength} chars, estimated speech duration: ${estimatedPatientSpeechDuration}ms`
        );

        // Generate doctor thought after patient response
        generateDoctorThought(
          "Analyzing patient response",
          session.conversation
        );

        // Update differential diagnosis after patient response
        updateDifferentialDiagnosis(updatedConversation);

        // Start streaming the patient response immediately
        streamText(patientResponseText, "patient", () => {
          // After streaming completes, add to conversation
          const updatedSession = {
            ...session,
            conversation: updatedConversation,
          };
          onSessionUpdate(updatedSession);
          clearStreaming();

          // Wait for speech to complete before checking termination
          waitForSpeechCompletion(() => {
            // Check if conversation should be terminated after patient response
            checkConversationTermination(updatedConversation).then(
              (shouldTerminate) => {
                if (shouldTerminate) {
                  console.log("Conversation terminated - diagnosis ready");
                  setIsDiagnosisReady(true);
                  setShowDiagnosisModal(true);
                  setConversationStatus("diagnosis-ready");
                  return; // Stop the conversation flow
                }

                // Only continue if not terminated
                if (!shouldTerminate) {
                  // Continue with next doctor question generation
                  continueWithNextDoctorQuestion(updatedConversation);
                }
              }
            );
          });
        });

        // Old timeout logic removed - now handled in the callback above
      }
    } catch (error) {
      console.error("Error continuing conversation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Wait for speech completion before proceeding
  const waitForSpeechCompletion = (callback: () => void) => {
    const checkSpeechStatus = () => {
      const isQueueEmpty = speechQueueRef.current.length === 0;
      const isNotPlaying = !isPlayingSpeechRef.current;
      const isNotPaused = !isAudioPaused;

      console.log(
        `Checking speech status - Queue empty: ${isQueueEmpty}, Not playing: ${isNotPlaying}, Not paused: ${isNotPaused}`
      );

      if (isQueueEmpty && isNotPlaying && isNotPaused) {
        console.log("Speech completed, proceeding with diagnosis check");
        callback();
      } else {
        // Check again in 200ms
        setTimeout(checkSpeechStatus, 200);
      }
    };

    // Start checking immediately
    checkSpeechStatus();
  };

  // Calculate real-time case progress metrics
  const calculateCaseProgress = () => {
    // Use current duration if diagnosis is ready (timer stopped)
    let duration = currentDuration;
    if (!isDiagnosisReady) {
      // Calculate duration only if diagnosis is not ready
      const now = new Date();
      const durationMs = now.getTime() - sessionStartTime.getTime();
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    // Count questions asked (doctor messages)
    const questionsAsked = session.conversation.filter(
      (msg) => msg.role === "doctor"
    ).length;

    // Calculate key findings from conversation content
    const keyFindings = calculateKeyFindings();

    return {
      duration,
      questionsAsked,
      keyFindings,
    };
  };

  // Calculate key findings from conversation content
  const calculateKeyFindings = () => {
    const findings = new Set<string>();

    // Extract key medical terms and findings from conversation
    const medicalTerms = [
      "pain",
      "fever",
      "nausea",
      "vomiting",
      "headache",
      "dizziness",
      "fatigue",
      "shortness of breath",
      "chest pain",
      "abdominal pain",
      "back pain",
      "swelling",
      "rash",
      "bleeding",
      "weight loss",
      "weight gain",
      "hypertension",
      "diabetes",
      "allergy",
      "medication",
      "surgery",
      "family history",
      "smoking",
      "alcohol",
      "exercise",
      "diet",
    ];

    session.conversation.forEach((msg) => {
      const content = msg.content.toLowerCase();
      medicalTerms.forEach((term) => {
        if (content.includes(term)) {
          findings.add(term);
        }
      });
    });

    // Also count differential diagnosis items
    findings.add(
      `Differential diagnosis: ${differentialDiagnosis.length} conditions`
    );

    // Count symptoms mentioned
    if (medicalCase?.symptoms) {
      findings.add(`Symptoms: ${medicalCase.symptoms.length} reported`);
    }

    return findings.size;
  };

  const handleSendQuestion = async () => {
    if (!studentQuestion.trim()) return;

    setIsProcessing(true);
    try {
      // Build comprehensive context including patient demographics and case details
      const context = {
        caseId: session.caseId,
        specialty: medicalCase?.specialty || "General Medicine",
        difficulty: medicalCase?.difficulty || "Intermediate",
        chiefComplaint:
          medicalCase?.chiefComplaint ||
          medicalCase?.symptoms?.[0] ||
          "Not specified",
        patientAge:
          medicalCase?.age || session.patientProfile?.age || "Not specified",
        patientGender:
          medicalCase?.gender ||
          session.patientProfile?.gender ||
          "Not specified",
        patientOccupation:
          medicalCase?.occupation ||
          session.patientProfile?.occupation ||
          "Not specified",
        symptoms: medicalCase?.symptoms || [],
        medicalHistory: medicalCase?.history || [],
        vitalSigns: medicalCase?.vitalSigns || null,
        physicalExam: medicalCase?.physicalExam || null,
        labResults: medicalCase?.labs || null,
        disease: session.disease,
        patientProfile: session.patientProfile,
        conversationHistory: session.conversation.map((msg) => ({
          role: msg.role as "student" | "patient" | "doctor",
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      };

      const response = await fetch(
        "http://localhost:3000/learning/ai/ask-doctor",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${localStorage.getItem("token")}`, // Temporarily disabled
          },
          body: JSON.stringify({
            question: studentQuestion,
            context,
            conversation: session.conversation,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get doctor response");
      }

      const { response: doctorResponse } = await response.json();
      setStudentQuestionResponse(doctorResponse);
      setStudentQuestion("");
    } catch (error) {
      console.error("Error asking doctor:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);

      // Ensure voices are loaded
      const loadVoices = () => {
        const voices = synth.getVoices();
        console.log(
          `Speech synthesis initialized with ${voices.length} voices`
        );
        if (voices.length > 0) {
          console.log(
            "Available voices:",
            voices.map((v) => v.name)
          );
        }
      };

      // Load voices immediately if available
      loadVoices();

      // Also listen for voiceschanged event
      synth.addEventListener("voiceschanged", loadVoices);

      // Initialize speech synthesis with a dummy utterance (required by some browsers)
      const initSpeech = () => {
        const testUtterance = new SpeechSynthesisUtterance("");
        testUtterance.volume = 0;
        synth.speak(testUtterance);
        console.log("Speech synthesis initialized with dummy utterance");
      };

      // Initialize on first user interaction
      const handleFirstInteraction = () => {
        initSpeech();
        document.removeEventListener("click", handleFirstInteraction);
        document.removeEventListener("keydown", handleFirstInteraction);
      };

      document.addEventListener("click", handleFirstInteraction);
      document.addEventListener("keydown", handleFirstInteraction);

      return () => {
        synth.removeEventListener("voiceschanged", loadVoices);
        document.removeEventListener("click", handleFirstInteraction);
        document.removeEventListener("keydown", handleFirstInteraction);
      };
    }
  }, []);

  // Enhanced speech queue system with real-time streaming
  const addToSpeechQueue = (text: string, voice: "doctor" | "patient") => {
    console.log(
      `Adding to speech queue: ${voice} - "${text.substring(0, 100)}..."`
    );
    console.log(`Queue length before adding: ${speechQueueRef.current.length}`);
    speechQueueRef.current.push({ text, voice });
    console.log(`Queue length after adding: ${speechQueueRef.current.length}`);
    processNextInQueue();
  };

  const processNextInQueue = () => {
    console.log(
      `Processing queue - isPlaying: ${isPlayingSpeechRef.current}, queueLength: ${speechQueueRef.current.length}, isAudioPaused: ${isAudioPaused}`
    );

    if (
      isPlayingSpeechRef.current ||
      speechQueueRef.current.length === 0 ||
      isAudioPaused
    ) {
      return;
    }

    const nextItem = speechQueueRef.current.shift();
    if (!nextItem || !speechSynthesis) {
      console.log(
        `Cannot process queue - nextItem: ${!!nextItem}, speechSynthesis: ${!!speechSynthesis}`
      );
      return;
    }

    console.log(`Processing speech: ${nextItem.voice} - "${nextItem.text}"`);

    isPlayingSpeechRef.current = true;
    const utterance = new SpeechSynthesisUtterance(nextItem.text);
    currentUtteranceRef.current = utterance;

    // Set voice characteristics based on speaker
    if (nextItem.voice === "doctor") {
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      utterance.volume = 0.9;
      const voices = speechSynthesis.getVoices();
      const maleVoice = voices.find(
        (voice) =>
          voice.name.includes("Male") ||
          voice.name.includes("David") ||
          voice.name.includes("Alex") ||
          voice.name.includes("Daniel")
      );
      if (maleVoice) utterance.voice = maleVoice;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (voice) =>
          voice.name.includes("Female") ||
          voice.name.includes("Samantha") ||
          voice.name.includes("Karen") ||
          voice.name.includes("Victoria")
      );
      if (femaleVoice) utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking((prev) => ({ ...prev, [nextItem.voice]: true }));
      setCurrentSpeaker(nextItem.voice);
      speechStartTimeRef.current = Date.now();
      console.log(
        `${nextItem.voice} started speaking: "${nextItem.text.substring(
          0,
          50
        )}..."`
      );
    };

    utterance.onend = () => {
      const speechDuration = speechStartTimeRef.current
        ? Date.now() - speechStartTimeRef.current
        : 0;
      console.log(
        `${nextItem.voice} finished speaking after ${speechDuration}ms`
      );
      setIsSpeaking((prev) => ({ ...prev, [nextItem.voice]: false }));
      if (currentSpeaker === nextItem.voice) {
        setCurrentSpeaker(null);
      }
      speechStartTimeRef.current = null;
      isPlayingSpeechRef.current = false;
      currentUtteranceRef.current = null;

      // Process next item in queue
      setTimeout(() => processNextInQueue(), 100);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error, event);
      setIsSpeaking((prev) => ({ ...prev, [nextItem.voice]: false }));
      if (currentSpeaker === nextItem.voice) {
        setCurrentSpeaker(null);
      }
      speechStartTimeRef.current = null;
      isPlayingSpeechRef.current = false;
      currentUtteranceRef.current = null;

      // Process next item in queue even on error
      setTimeout(() => processNextInQueue(), 100);
    };

    // Ensure speech synthesis is not paused before speaking
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }

    try {
      speechSynthesis.speak(utterance);
      console.log(`Speech utterance queued for ${nextItem.voice}`);
    } catch (error) {
      console.error("Error speaking utterance:", error);
      isPlayingSpeechRef.current = false;
      currentUtteranceRef.current = null;
    }
  };

  // Enhanced pause/resume functions
  const pauseAudio = () => {
    if (speechSynthesis && currentUtteranceRef.current) {
      speechSynthesis.pause();
      setIsAudioPaused(true);
    }
  };

  const resumeAudio = () => {
    if (speechSynthesis && currentUtteranceRef.current) {
      speechSynthesis.resume();
      setIsAudioPaused(false);
      // Process any queued items
      processNextInQueue();
    }
  };

  // Stop all speech and clear queue
  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking({ doctor: false, patient: false });
      setCurrentSpeaker(null);
      speechQueueRef.current = [];
      isPlayingSpeechRef.current = false;
      currentUtteranceRef.current = null;
      setIsAudioPaused(false);
      // Don't clear spoken messages - they should remain tracked to prevent duplicates
    }
  };

  // Smart auto-scroll function - only scrolls if user is at or near the bottom
  const smartAutoScroll = () => {
    if (!scrollAreaRef.current) return;

    const scrollContainer = scrollAreaRef.current;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

    // Check if user is at the bottom (within 50px threshold)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    // Only auto-scroll if user is at the bottom or hasn't manually scrolled
    if (isAtBottom || !isUserScrollingRef.current) {
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  };

  // Handle user scroll detection
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;

    const scrollContainer = scrollAreaRef.current;
    const currentScrollTop = scrollContainer.scrollTop;

    // Detect if user is manually scrolling (not programmatic)
    if (Math.abs(currentScrollTop - lastScrollTopRef.current) > 5) {
      isUserScrollingRef.current = true;

      // Reset user scrolling flag after a delay
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 2000);
    }

    lastScrollTopRef.current = currentScrollTop;
  };

  // Enhanced text streaming function with continuous speech
  const streamText = (text: string, role: string, onComplete?: () => void) => {
    const words = text.split(" ");
    let currentIndex = 0;
    let currentText = "";
    let speechBuffer = "";
    let hasStartedSpeaking = false;

    setStreamingMessage({ role, content: "", isComplete: false });

    const messageKey = `${role}-${text.substring(0, 50)}`;
    spokenMessagesRef.current.add(messageKey);

    const streamNextWord = () => {
      if (currentIndex < words.length) {
        const word = words[currentIndex];
        currentText += (currentIndex > 0 ? " " : "") + word;
        speechBuffer += (speechBuffer ? " " : "") + word;

        setStreamingMessage({ role, content: currentText, isComplete: false });
        currentIndex++;

        // Start speaking after we have enough words (10-15 words) or if we hit a sentence end
        if (
          !hasStartedSpeaking &&
          (speechBuffer.split(" ").length >= 10 ||
            word.endsWith(".") ||
            word.endsWith("!") ||
            word.endsWith("?") ||
            currentIndex >= words.length)
        ) {
          console.log(`Starting speech for ${role} with: "${speechBuffer}..."`);
          addToSpeechQueue(text, role as "doctor" | "patient"); // Speak the entire text
          hasStartedSpeaking = true;
        }

        // Stream at different speeds based on role
        const streamDelay = role === "doctor" ? 60 : 80; // Faster streaming for real-time feel
        streamingTimeoutRef.current = setTimeout(streamNextWord, streamDelay);
      } else {
        // If we haven't started speaking yet (short message), start now
        if (!hasStartedSpeaking) {
          console.log(
            `Starting speech for ${role} (end of message): "${text}"`
          );
          addToSpeechQueue(text, role as "doctor" | "patient");
        }

        setStreamingMessage({ role, content: currentText, isComplete: true });

        // Smart auto-scroll conversation to bottom
        smartAutoScroll();

        if (onComplete) onComplete();
      }
    };

    streamNextWord();
  };

  // Clear streaming
  const clearStreaming = () => {
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }
    setStreamingMessage(null);
  };

  // Update differential diagnosis based on conversation
  const updateDifferentialDiagnosis = async (conversation: ChatMessage[]) => {
    try {
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: conversation,
        nurseReport: medicalCase?.nurseReport || null,
      };

      const updatedDiagnosis =
        await differentialDiagnosisService.generateDifferentialDiagnosis(
          context
        );
      setDifferentialDiagnosis(updatedDiagnosis);
      console.log("Updated differential diagnosis:", updatedDiagnosis);
    } catch (error) {
      console.error("Error updating differential diagnosis:", error);
    }
  };

  // Continue with next doctor question generation
  const continueWithNextDoctorQuestion = async (
    updatedConversation: ChatMessage[]
  ) => {
    try {
      setConversationStatus("doctor-thinking");
      console.log("Generating next doctor question after patient response");

      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: updatedConversation,
      };

      // Generate next doctor question
      const nextDoctorResponse = await fetch(
        "http://localhost:3000/learning/ai/doctor-question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${localStorage.getItem("token")}`, // Temporarily disabled
          },
          body: JSON.stringify({ context, conversation: updatedConversation }),
        }
      );

      if (!nextDoctorResponse.ok) {
        // Add error message to conversation
        const errorMessage: ChatMessage = {
          id: `doctor-error-${Date.now()}`,
          role: "doctor",
          content: "⚠️ Doctor could not respond. Please retry.",
          timestamp: new Date().toISOString(),
        };

        const errorSession = {
          ...session,
          conversation: [...updatedConversation, errorMessage],
        };
        onSessionUpdate(errorSession);
        setConversationStatus("idle");
        return;
      }

      const { question: nextQuestion, explanation: nextExplanation } =
        await nextDoctorResponse.json();

      const nextDoctorMessage: ChatMessage = {
        id: `doctor-${Date.now()}`,
        role: "doctor",
        content: nextQuestion,
        explanation: nextExplanation,
        timestamp: new Date().toISOString(),
      };

      setConversationStatus("idle");

      // Update differential diagnosis after next doctor question
      updateDifferentialDiagnosis([...updatedConversation, nextDoctorMessage]);

      // Start streaming the next doctor question
      streamText(nextQuestion, "doctor", () => {
        // After streaming completes, add to conversation
        const finalUpdatedSession = {
          ...session,
          conversation: [...updatedConversation, nextDoctorMessage],
        };
        onSessionUpdate(finalUpdatedSession);
        clearStreaming();
      });
    } catch (error) {
      console.error("Error generating next doctor question:", error);
      setConversationStatus("idle");

      // Add error message to conversation
      const errorMessage: ChatMessage = {
        id: `doctor-error-${Date.now()}`,
        role: "doctor",
        content: "⚠️ Doctor could not respond. Please retry.",
        timestamp: new Date().toISOString(),
      };

      const errorSession = {
        ...session,
        conversation: [...updatedConversation, errorMessage],
      };
      onSessionUpdate(errorSession);
    }
  };

  // Check if conversation should be terminated
  const checkConversationTermination = async (conversation: ChatMessage[]) => {
    try {
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: conversation,
        nurseReport: medicalCase?.nurseReport || null,
      };

      const decision =
        await conversationTerminationService.shouldTerminateConversation(
          context
        );
      setTerminationDecision(decision);

      if (
        decision.shouldTerminate &&
        decision.diagnosticClarity === "sufficient"
      ) {
        console.log(
          "Conversation should be terminated - sufficient clinical information gathered"
        );
        setIsDiagnosisReady(true);
        setConversationStatus("diagnosis-ready");

        // Update session to mark as complete
        const updatedSession = {
          ...session,
          conversation: conversation,
          isComplete: true,
        };
        onSessionUpdate(updatedSession);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking conversation termination:", error);
      return false;
    }
  };

  // Generate real-time doctor thoughts
  const generateDoctorThought = async (
    context: string,
    conversationHistory: any[]
  ) => {
    if (isGeneratingThought) return;

    setIsGeneratingThought(true);
    setCurrentThought("");

    try {
      const response = await fetch(
        "http://localhost:3000/learning/ai/doctor-thought",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${localStorage.getItem("token")}`, // Temporarily disabled
          },
          body: JSON.stringify({
            context,
            conversation: conversationHistory,
            currentCase: medicalCase,
            patientInfo: {
              age: medicalCase?.age || "Not specified",
              gender: medicalCase?.gender || "Not specified",
              occupation: medicalCase?.occupation || "Not specified",
            },
            instruction:
              "Generate a concise one-sentence reasoning thought (max 25 words). Focus on immediate clinical observation or next step.",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate doctor thought");
      }

      const { thought } = await response.json();

      // Add thought to history
      const newThought = {
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        thought: thought,
      };

      setDoctorThoughts((prev) => [...prev, newThought]);
      setCurrentThought(thought);
    } catch (error) {
      console.error("Error generating doctor thought:", error);
      setCurrentThought("Analyzing patient presentation...");
    } finally {
      setIsGeneratingThought(false);
    }
  };

  // Update messages when conversation changes
  useEffect(() => {
    const conversationMessages = session.conversation.map((msg, index) => ({
      speaker: msg.role === "doctor" ? "doctor" : "patient",
      text: msg.content,
      time: new Date(msg.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }));
    setMessages(conversationMessages);

    // Smart auto-scroll when new messages are added
    if (conversationMessages.length > 0) {
      setTimeout(() => smartAutoScroll(), 200);
    }
  }, [session.conversation]);

  // Handle speech queue processing when audio is resumed
  useEffect(() => {
    if (!isAudioPaused) {
      processNextInQueue();
    }
  }, [isAudioPaused]);

  // Fallback: Ensure speech happens for complete messages if streaming speech fails
  useEffect(() => {
    if (session.conversation.length > 0 && !isPaused && !streamingMessage) {
      const latestMessage =
        session.conversation[session.conversation.length - 1];
      const messageKey = `${
        latestMessage.role
      }-${latestMessage.content.substring(0, 50)}`;

      // Only speak if this message hasn't been spoken yet and no speech is queued/playing
      if (
        !spokenMessagesRef.current.has(messageKey) &&
        speechQueueRef.current.length === 0 &&
        !isPlayingSpeechRef.current
      ) {
        console.log(
          `Fallback speech for: ${
            latestMessage.role
          } - "${latestMessage.content.substring(0, 50)}..."`
        );
        spokenMessagesRef.current.add(messageKey);
        addToSpeechQueue(
          latestMessage.content,
          latestMessage.role as "doctor" | "patient"
        );
      }
    }
  }, [session.conversation.length, isPaused, streamingMessage]);

  // Handle pause/resume for conversation flow
  useEffect(() => {
    if (isPaused) {
      setConversationStatus("paused");
    } else if (conversationStatus === "paused") {
      setConversationStatus("idle");
    }
  }, [isPaused]);

  // Auto-continue conversation when not paused and not processing
  useEffect(() => {
    if (
      !isPaused &&
      !isProcessing &&
      !session.isComplete &&
      session.conversation.length > 0
    ) {
      const lastMessage = session.conversation[session.conversation.length - 1];

      // Auto-continue after doctor questions to generate patient response
      if (lastMessage.role === "doctor") {
        // Calculate delay based on doctor question length
        const textLength = lastMessage.content.length;
        const estimatedSpeechDuration = Math.max(textLength * 50, 2000); // 50ms per character, minimum 2 seconds
        const speechDelay = estimatedSpeechDuration + 2000; // Add 2 seconds buffer for speech completion

        console.log(
          `Doctor question length: ${textLength} chars, estimated speech duration: ${estimatedSpeechDuration}ms, delay: ${speechDelay}ms`
        );

        const autoContinueTimer = setTimeout(() => {
          if (!isPaused && !isProcessing && !session.isComplete) {
            console.log(
              "Auto-continuing after doctor question to generate patient response"
            );
            continueConversation();
          }
        }, speechDelay);

        return () => clearTimeout(autoContinueTimer);
      }

      // Note: Patient responses now handle their own next doctor question generation
      // No auto-continue needed after patient responses
    }
  }, [isPaused, isProcessing, session.isComplete, session.conversation.length]);

  // Cleanup streaming timeout on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to latest thought when new thoughts are added
  useEffect(() => {
    if (
      thoughtsScrollRef.current &&
      (doctorThoughts.length > 0 || currentThought)
    ) {
      const scrollContainer = thoughtsScrollRef.current;
      // Smooth scroll to bottom with a small delay to ensure content is rendered
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [doctorThoughts.length, currentThought]);

  // Update duration in real-time (stops when diagnosis is ready)
  useEffect(() => {
    // Don't update timer if diagnosis is ready
    if (isDiagnosisReady) {
      return;
    }

    const interval = setInterval(() => {
      const progress = calculateCaseProgress();
      setCurrentDuration(progress.duration);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [
    sessionStartTime,
    session.conversation.length,
    differentialDiagnosis.length,
    isDiagnosisReady,
  ]);

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const setActiveTabForSection = (
    section: keyof typeof activeTabs,
    tab: string
  ) => {
    setActiveTabs((prev) => ({
      ...prev,
      [section]: tab,
    }));
  };

  // Get medical case data
  const medicalCase =
    propMedicalCase || sampleCases.find((c) => c.id === session.caseId);

  if (!medicalCase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Case Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The requested learning case could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b px-8 py-4 flex justify-between items-center transition-colors duration-300 ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center gap-6">
          <h1
            className={`text-2xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Medical Training Simulator
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-3 py-1 bg-emerald-600 text-white rounded-full font-semibold">
              Learning Mode
            </span>
            <span
              className={`px-3 py-1 rounded-full ${
                isDarkMode
                  ? "bg-slate-700 text-gray-300"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {medicalCase.difficulty || "Intermediate"}
            </span>
            <span
              className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Case #{medicalCase.id}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isDarkMode
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-slate-600 hover:bg-slate-700 text-white"
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun size={14} />
                Light
              </>
            ) : (
              <>
                <Moon size={14} />
                Dark
              </>
            )}
          </button>

          {/* Enhanced Controls */}
          <div className="flex items-center gap-3">
            {/* Conversation Status Badge */}
            {conversationStatus !== "idle" && (
              <>
                {conversationStatus === "diagnosis-ready" ? (
                  <button
                    onClick={() => setShowDiagnosisModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    Diagnosis Ready!
                  </button>
                ) : (
                  <Badge
                    className={`${
                      conversationStatus === "doctor-thinking"
                        ? "bg-blue-600"
                        : conversationStatus === "patient-responding"
                        ? "bg-green-600"
                        : "bg-amber-600"
                    } text-white`}
                  >
                    {conversationStatus === "doctor-thinking" &&
                      "Doctor Thinking..."}
                    {conversationStatus === "patient-responding" &&
                      "Patient Responding..."}
                    {conversationStatus === "paused" && "Paused"}
                  </Badge>
                )}
              </>
            )}

            {/* Conversation Controls */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isPaused
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {isPaused ? (
                <>
                  <PlayCircle size={14} />
                  Resume Conversation
                </>
              ) : (
                <>
                  <PauseCircle size={14} />
                  Pause Conversation
                </>
              )}
            </button>

            {/* Audio Controls */}
            <button
              onClick={isAudioPaused ? resumeAudio : pauseAudio}
              disabled={!currentUtteranceRef.current}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAudioPaused ? (
                <>
                  <Play size={14} />
                  Resume Audio
                </>
              ) : (
                <>
                  <Pause size={14} />
                  Pause Audio
                </>
              )}
            </button>

            <button
              onClick={stopSpeaking}
              disabled={!isSpeaking.doctor && !isSpeaking.patient}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white"
            >
              <X size={14} />
              Stop Audio
            </button>

            {/* Speaking Indicator */}
            {(isSpeaking.doctor || isSpeaking.patient) && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>
                  {currentSpeaker === "doctor"
                    ? "Doctor Speaking"
                    : "Patient Speaking"}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className={`${
              isDarkMode
                ? "text-gray-300 border-gray-600 hover:bg-slate-700"
                : "text-gray-600 border-gray-300 hover:bg-gray-100"
            }`}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Video Call & Conversation */}
        <div
          className={`flex-1 flex flex-col border-r transition-colors duration-300 ${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200"
          }`}
        >
          {/* Video Call Section */}
          <div
            className={`h-1/2 p-6 border-b transition-colors duration-300 ${
              isDarkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <div className="h-full grid grid-cols-2 gap-4">
              {/* Doctor Video */}
              <div
                className={`relative rounded-xl overflow-hidden border-2 flex items-center justify-center transition-all duration-300 ${
                  isDarkMode ? "bg-slate-800" : "bg-gray-200"
                } ${
                  isSpeaking.doctor
                    ? "border-blue-400 shadow-lg shadow-blue-400/50"
                    : isDarkMode
                    ? "border-slate-600"
                    : "border-gray-300"
                }`}
              >
                <div className="absolute top-4 left-4 px-3 py-1 bg-black bg-opacity-70 text-white text-sm rounded-full font-semibold flex items-center gap-2">
                  AI Doctor
                  {isSpeaking.doctor && (
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                      <div
                        className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div
                    className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                      isSpeaking.doctor
                        ? "bg-blue-600 border-blue-300 shadow-lg shadow-blue-400/50"
                        : "bg-slate-700 border-white"
                    }`}
                  >
                    <div
                      className={`text-7xl transition-all duration-300 ${
                        isSpeaking.doctor ? "animate-pulse" : ""
                      }`}
                    >
                      👨‍⚕️
                    </div>
                  </div>
                  <div
                    className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white transition-all duration-300 ${
                      isSpeaking.doctor
                        ? "bg-blue-400 animate-pulse"
                        : "bg-green-500"
                    }`}
                  ></div>
                </div>
              </div>

              {/* Patient Video */}
              <div
                className={`relative rounded-xl overflow-hidden border-2 flex items-center justify-center transition-all duration-300 ${
                  isDarkMode ? "bg-slate-800" : "bg-gray-200"
                } ${
                  isSpeaking.patient
                    ? "border-green-400 shadow-lg shadow-green-400/50"
                    : isDarkMode
                    ? "border-slate-600"
                    : "border-gray-300"
                }`}
              >
                <div className="absolute top-4 left-4 px-3 py-1 bg-black bg-opacity-70 text-white text-sm rounded-full font-semibold flex items-center gap-2">
                  AI Patient
                  {isSpeaking.patient && (
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <div
                        className="w-1 h-1 bg-green-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-green-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div
                    className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                      isSpeaking.patient
                        ? "bg-green-600 border-green-300 shadow-lg shadow-green-400/50"
                        : "bg-slate-700 border-white"
                    }`}
                  >
                    <div
                      className={`text-7xl transition-all duration-300 ${
                        isSpeaking.patient ? "animate-pulse" : ""
                      }`}
                    >
                      🧑
                    </div>
                  </div>
                  <div
                    className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white transition-all duration-300 ${
                      isSpeaking.patient
                        ? "bg-green-400 animate-pulse"
                        : "bg-green-500"
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Transcript */}
          <div
            className={`h-1/2 flex flex-col transition-colors duration-300 ${
              isDarkMode ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div
              className={`px-6 py-3 border-b flex justify-between items-center transition-colors duration-300 ${
                isDarkMode ? "border-slate-700" : "border-gray-200"
              }`}
            >
              <h2
                className={`text-lg font-bold flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <MessageCircle size={20} />
                Live Conversation
              </h2>
              {session.conversation.length === 0 ? (
                <Button
                  onClick={startConversation}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-1.5 px-3 h-auto"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play size={14} className="mr-1.5" />
                      Start Simulation
                    </>
                  )}
                </Button>
              ) : !session.isComplete ? (
                <div className="flex items-center gap-2">
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400 mr-2"></div>
                      <span className="text-emerald-400">Processing...</span>
                    </>
                  ) : (
                    <Badge className="bg-emerald-600 text-white">
                      Auto-Continuing
                    </Badge>
                  )}
                </div>
              ) : (
                <Badge className="bg-green-600 text-white">Complete</Badge>
              )}
            </div>
            <div
              ref={scrollAreaRef}
              onScroll={handleScroll}
              className="h-[calc(50vh-120px)] overflow-y-auto px-6 py-4 space-y-3 scroll-smooth conversation-scroll"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle
                    size={48}
                    className="mx-auto mb-4 opacity-50"
                  />
                  <p>Click "Start Simulation" to begin the conversation</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.speaker === "patient"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] ${
                          msg.speaker === "patient" ? "order-2" : ""
                        }`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 transition-all duration-300 ${
                            msg.speaker === "doctor"
                              ? "bg-blue-600 text-white"
                              : "bg-green-600 text-white"
                          } ${
                            (msg.speaker === "doctor" && isSpeaking.doctor) ||
                            (msg.speaker === "patient" && isSpeaking.patient)
                              ? "ring-2 ring-opacity-50 animate-pulse"
                              : ""
                          }`}
                        >
                          <div className="font-semibold text-xs mb-1 opacity-90 flex items-center gap-2">
                            {msg.speaker === "doctor"
                              ? "AI Doctor"
                              : "AI Patient"}
                            {((msg.speaker === "doctor" && isSpeaking.doctor) ||
                              (msg.speaker === "patient" &&
                                isSpeaking.patient)) && (
                              <div className="flex gap-1">
                                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                <div
                                  className="w-1 h-1 bg-white rounded-full animate-pulse"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                                <div
                                  className="w-1 h-1 bg-white rounded-full animate-pulse"
                                  style={{ animationDelay: "0.4s" }}
                                ></div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm">{msg.text}</p>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block px-2">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Streaming message */}
                  {streamingMessage && (
                    <div
                      className={`flex gap-3 ${
                        streamingMessage.role === "patient"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] ${
                          streamingMessage.role === "patient" ? "order-2" : ""
                        }`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 transition-all duration-300 ${
                            streamingMessage.role === "doctor"
                              ? "bg-blue-600 text-white"
                              : "bg-green-600 text-white"
                          } ${
                            !streamingMessage.isComplete
                              ? "ring-2 ring-opacity-50 animate-pulse"
                              : ""
                          }`}
                        >
                          <div className="font-semibold text-xs mb-1 opacity-90 flex items-center gap-2">
                            {streamingMessage.role === "doctor"
                              ? "AI Doctor"
                              : "AI Patient"}
                            {!streamingMessage.isComplete && (
                              <div className="flex gap-1">
                                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                <div
                                  className="w-1 h-1 bg-white rounded-full animate-pulse"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                                <div
                                  className="w-1 h-1 bg-white rounded-full animate-pulse"
                                  style={{ animationDelay: "0.4s" }}
                                ></div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm">
                            {streamingMessage.content}
                            {!streamingMessage.isComplete && (
                              <span className="animate-pulse ml-1">|</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block px-2">
                          {new Date().toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column - Doctor's Thoughts & Student Input */}
        <div
          className={`w-[35%] flex flex-col transition-colors duration-300 ${
            isDarkMode ? "bg-slate-850" : "bg-gray-50"
          }`}
        >
          {/* Doctor's Thought Process */}
          <div
            className={`h-[400px] border-r flex flex-col transition-colors duration-300 ${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`px-6 py-4 border-b transition-colors duration-300 ${
                isDarkMode ? "border-slate-700" : "border-gray-200"
              }`}
            >
              <h2
                className={`text-lg font-bold flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <Brain size={20} className="text-purple-400" />
                Doctor's Thought Process
              </h2>
            </div>
            <div
              ref={thoughtsScrollRef}
              className="h-[320px] overflow-y-auto px-6 py-4 space-y-3 scroll-smooth doctor-thoughts-scroll"
            >
              {doctorThoughts.map((thought, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 border-purple-500 p-4 rounded-r-lg transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-purple-900 bg-opacity-30"
                      : "bg-purple-50 border-purple-300"
                  }`}
                >
                  <span className="text-xs text-purple-400 font-semibold">
                    {thought.time}
                  </span>
                  <p
                    className={`text-sm mt-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {thought.thought}
                  </p>
                </div>
              ))}

              {/* Current real-time thought */}
              {currentThought && (
                <div
                  className={`border-l-4 border-purple-400 p-4 rounded-r-lg animate-pulse transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-purple-900 bg-opacity-50"
                      : "bg-purple-100 border-purple-300"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-purple-400 font-semibold flex items-center gap-2">
                      Current Analysis
                      {isGeneratingThought && (
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                          <div
                            className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      )}
                    </span>
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {new Date().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {currentThought}
                    {isGeneratingThought && (
                      <span className="animate-pulse ml-1">|</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Student Question Box */}
          <div
            className={`h-[200px] border-t border-r px-6 py-4 transition-colors duration-300 ${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            }`}
          >
            <label
              className={`block text-sm font-semibold mb-3 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Ask a Question{" "}
              {!isPaused && (
                <span className="text-amber-500">(Pause to enable)</span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={studentQuestion}
                onChange={(e) => setStudentQuestion(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendQuestion()}
                placeholder="Type your question here..."
                disabled={!isPaused || isProcessing}
                className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:cursor-not-allowed text-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 disabled:bg-slate-900 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-300 disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
                }`}
              />
              <button
                onClick={handleSendQuestion}
                disabled={!isPaused || !studentQuestion.trim() || isProcessing}
                className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-sm"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
            {studentQuestionResponse && (
              <div
                className={`mt-3 p-3 rounded-lg transition-colors duration-300 h-32 ${
                  isDarkMode ? "bg-slate-700" : "bg-gray-100"
                }`}
              >
                <div className="h-full overflow-y-auto doctor-response-scroll">
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <strong>Doctor's Response:</strong>{" "}
                    {studentQuestionResponse}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Patient Demographics & Nurse Report */}
        <div
          className={`w-[30%] flex flex-col transition-colors duration-300 ${
            isDarkMode ? "bg-slate-800" : "bg-white"
          }`}
        >
          <div
            className={`px-6 py-4 border-b transition-colors duration-300 ${
              isDarkMode ? "border-slate-700" : "border-gray-200"
            }`}
          >
            <h2
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Patient Information
            </h2>
          </div>
          <div className="h-[calc(100vh-200px)] overflow-y-auto px-6 py-4 space-y-4 scroll-smooth patient-info-scroll">
            {/* Patient Demographics */}
            <div
              className={`border rounded-lg p-4 transition-colors duration-300 ${
                isDarkMode
                  ? "bg-slate-700 border-slate-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <h3
                className={`font-semibold text-sm mb-3 flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <User size={16} />
                Demographics
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                  >
                    Name:
                  </span>
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {medicalCase.patientProfile?.name || "Patient"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                  >
                    Age:
                  </span>
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {medicalCase.patientProfile?.age || "Unknown"} years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                  >
                    Gender:
                  </span>
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {medicalCase.patientProfile?.gender || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                  >
                    Occupation:
                  </span>
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {medicalCase.patientProfile?.occupation || "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* Chief Complaint */}
            <div
              className={`border rounded-lg p-4 transition-colors duration-300 ${
                isDarkMode
                  ? "bg-slate-700 border-slate-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <h3
                className={`font-semibold text-sm mb-3 flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <AlertCircle size={16} />
                Chief Complaint
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {medicalCase.symptoms?.[0] ||
                  "Patient presents with symptoms requiring evaluation"}
              </p>
            </div>

            {/* Vital Signs */}
            {medicalCase.vitalSigns && (
              <div
                className={`border rounded-lg p-4 transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <h3
                  className={`font-semibold text-sm mb-3 flex items-center gap-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  <Activity size={16} />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span
                      className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                    >
                      BP:
                    </span>
                    <span
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {medicalCase.vitalSigns.bloodPressure}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                    >
                      HR:
                    </span>
                    <span
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {medicalCase.vitalSigns.heartRate} bpm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                    >
                      Temp:
                    </span>
                    <span
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {medicalCase.vitalSigns.temperature}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                    >
                      RR:
                    </span>
                    <span
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {medicalCase.vitalSigns.respiratoryRate} /min
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Differential Diagnosis */}
            <div
              className={`border rounded-lg p-4 transition-colors duration-300 ${
                isDarkMode
                  ? "bg-slate-700 border-slate-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <h3
                className={`font-semibold text-sm mb-3 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Differential Diagnosis
              </h3>
              <div className="space-y-3">
                {differentialDiagnosis.map((diagnosis, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 transition-colors duration-300 ${
                      isDarkMode
                        ? "bg-slate-600 border-slate-500"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4
                        className={`font-semibold text-xs ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {diagnosis.condition}
                      </h4>
                      <span className="text-lg font-bold text-emerald-400">
                        {diagnosis.probability}%
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-full h-1.5 mb-2 ${
                        isDarkMode ? "bg-slate-900" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${diagnosis.probability}%` }}
                      />
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {diagnosis.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Footer */}
          <div
            className={`px-6 py-4 border-t transition-colors duration-300 ${
              isDarkMode
                ? "border-slate-700 bg-slate-850"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <h3
              className={`font-semibold mb-3 text-sm ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Case Progress
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span
                  className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                >
                  Duration:
                </span>
                <span
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {currentDuration}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span
                  className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                >
                  Questions Asked:
                </span>
                <span
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {
                    session.conversation.filter((msg) => msg.role === "doctor")
                      .length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnosis Ready Modal */}
      {showDiagnosisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred Background */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDiagnosisModal(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Diagnosis Ready!</h2>
                    <p className="text-emerald-100">
                      Sufficient clinical information gathered
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDiagnosisModal(false)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Patient Summary */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Patient Summary
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Name
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {medicalCase?.name || "Patient"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Age
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {medicalCase?.age ||
                        session.patientProfile?.age ||
                        "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gender
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {medicalCase?.gender ||
                        session.patientProfile?.gender ||
                        "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Occupation
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {medicalCase?.occupation ||
                        session.patientProfile?.occupation ||
                        "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chief Complaint & Presentation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chief Complaint & Presentation
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Primary Complaint
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {medicalCase?.chiefComplaint ||
                        medicalCase?.symptoms?.[0] ||
                        "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Key Symptoms
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(medicalCase?.symptoms || []).map(
                        (symptom: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                          >
                            {symptom}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Findings from Conversation */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Key Clinical Findings
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Conversation Highlights
                    </p>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <div className="space-y-2">
                        {session.conversation.slice(-3).map((msg, index) => (
                          <div
                            key={index}
                            className={`text-sm ${
                              msg.role === "doctor"
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-green-700 dark:text-green-300"
                            }`}
                          >
                            <span className="font-medium">
                              {msg.role === "doctor" ? "Doctor:" : "Patient:"}
                            </span>{" "}
                            {msg.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Differential Diagnosis */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Differential Diagnosis
                  </h3>
                </div>
                <div className="space-y-3">
                  {differentialDiagnosis.map((diagnosis, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-800 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {diagnosis.condition}
                        </h4>
                        <span className="text-lg font-bold text-emerald-600">
                          {diagnosis.probability}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${diagnosis.probability}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {diagnosis.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Statistics */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Case Statistics
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {currentDuration}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Duration
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {
                        session.conversation.filter(
                          (msg) => msg.role === "doctor"
                        ).length
                      }
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Questions Asked
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recommended Next Steps
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">
                        1
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Order appropriate diagnostic tests based on differential
                      diagnosis
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">
                        2
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Consider immediate interventions if red flags are present
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">
                        3
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Refer to appropriate specialist if needed
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowDiagnosisModal(false);
                    // Navigate to main learning mode page
                    window.location.href = "/learning-mode";
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Complete Case
                </button>
                <button
                  onClick={() => setShowDiagnosisModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Study Case More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
