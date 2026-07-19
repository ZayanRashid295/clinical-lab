"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/hooks/useTheme";
import type {
  LearningSession,
  ChatMessage,
  LearningConversationMessage,
} from "@/lib/medprep-shadow/learning-types";
import { learningService } from "@/lib/medprep-shadow/shadow-learning-client";
import { sampleCases } from "@/lib/fyp/data-models";
import { MedicalReportModal } from "@/app/components/medprep-ai/shadow/medical-report-modal";
import { ReportTypeSelectionModal } from "@/app/components/medprep-ai/shadow/report-type-selection-modal";
import { ReportManagementModal } from "@/app/components/medprep-ai/shadow/report-management-modal";
import { SmartReportPopup } from "@/app/components/medprep-ai/shadow/smart-report-popup";
import { AnimatedReportCards } from "@/app/components/medprep-ai/shadow/animated-report-cards";
import { reportDetectionService, type DetectedTest } from "@/lib/medprep-shadow/services/report-detection.service";
import { parallelReportGenerationService, type ReportGenerationResult, type GenerationProgress } from "@/lib/medprep-shadow/services/parallel-report-generation.service";
import { duplicateTestPreventionService } from "@/lib/medprep-shadow/services/duplicate-test-prevention.service";
import { 
  differentialDiagnosisService,
  type DifferentialDiagnosisItem,
} from "@/lib/medprep-shadow/services/differential-diagnosis.service";
import { useShadowModeStore, type Report, type ReplayState } from "@/lib/medprep-shadow/shadowModeStore";
import {
  conversationTerminationService,
  type TerminationDecision,
} from "@/lib/medprep-shadow/services/conversation-termination.service";
import { safeClientFetch } from "@/lib/api/safe-client-fetch";
import {
  buildManualConversationStatesFromSession,
  buildShadowTurnSnapshotUpToIndex,
  clampSupervisorInterventions,
  dedupeShadowConversationMessages,
  formatSessionDoctorThoughts,
  mergeShadowSupervisorInterventions,
  splitFollowUpMessagesFromAll,
  unionSupervisorInterventions,
  type ShadowSupervisorIntervention,
} from "@/lib/medprep-shadow/shadow-medprep-db-sync";
import { formatClinicalText } from "@/lib/medprep-shadow/shadow-ui/format-clinical-text";
import { ClinicalMarkdown } from "@/lib/medprep-shadow/shadow-ui/clinical-markdown";
import { ClinicalTestReportView } from "@/lib/medprep-shadow/shadow-ui/clinical-test-report-view";
import {
  structuredFromApiPayload,
  type StructuredTestReport,
} from "@/lib/medprep-shadow/shadow-test-report";
import { isDoctorClosingStatement } from "@/lib/medprep-shadow/shadow-consultation-end";
import { soapPlanParserService } from "@/lib/medprep-shadow/services/soap-plan-parser.service";
import { parallelReportGenerationService as soapReportGenerationService } from "@/lib/medprep-shadow/services/parallel-report-generation.service";
import {
  ArrowLeft,
  ChevronLeft,
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
  Pill,
  FlaskConical,
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
  Shield,
  Loader2,
  ClipboardList,
} from "lucide-react";

interface LearningInterfaceProps {
  session: LearningSession;
  onSessionUpdate: (session: LearningSession) => void;
  medicalCase?: any;
  isFullHeight?: boolean;
  onEndCase?: () => void;
  /** Marks the shadow case COMPLETED in MedPrep (follow-up only) before leaving. */
  onFinalizeShadowCase?: () => Promise<void>;
  /** Opens replay UI after states are built (avoids double-click / stale event listener). */
  onShowReplay?: () => void;
}

export function EnhancedLearningInterface({
  session,
  onSessionUpdate,
  medicalCase: propMedicalCase,
  isFullHeight = true,
  onEndCase,
  onFinalizeShadowCase,
  onShowReplay,
}: LearningInterfaceProps) {
  const { config } = useTheme();

  /** Latest `session` for async/closed-over callbacks so merges never drop `conversationId`. */
  const sessionRef = useRef(session);
  sessionRef.current = session;

  /** Keep JSON POST bodies under Next's default body limit; huge fullReport strings cause "Failed to fetch". */
  const REPORT_SUMMARY_MAX = 4000
  const REPORT_BODY_MAX = 12000

  // Helper: normalize reports for prompts
  const mapReportsForPrompt = (reports: Report[]): Array<{ type: string; summary: string; fullReport: string }> => {
    return (reports || []).map((r: Report) => {
      const rawFull = (r.fullReport || (r as any).reportContent || r.summary || "") as string
      const summary = String(r.summary || "").slice(0, REPORT_SUMMARY_MAX)
      return {
        type: r.type,
        summary,
        fullReport: String(rawFull).slice(0, REPORT_BODY_MAX),
      }
    })
  }

  const getStructuredTestReport = (
    report: Report,
  ): StructuredTestReport | null => report.structured ?? null

  /** Trim conversation copies sent to /api/learning/* to avoid oversized bodies. */
  const sanitizeConversationForApi = <T extends { role: string; content: string; timestamp?: string; explanation?: string }>(
    msgs: T[],
    maxMessages = 32,
    maxContentLen = 4000,
  ): T[] => {
    return msgs.slice(-maxMessages).map((m) => ({
      ...m,
      content: String(m.content || "").slice(0, maxContentLen),
      ...(m.explanation !== undefined
        ? { explanation: String(m.explanation || "").slice(0, 1500) }
        : {}),
    })) as T[]
  }

  // Helper: robust source of reports for follow-up
  const getReportsForPrompt = (): Report[] => {
    const available = (getAllReports() as Report[]) || [];
    if (available.length > 0) return available;
    const initial = getInitialSessionData ? (getInitialSessionData()?.reports as Report[] | undefined) : undefined;
    return initial && initial.length > 0 ? initial : [];
  };

  // Helper: merged conversation for prompts (initial + current in follow-up)
  const getConversationForPrompt = (): ChatMessage[] => {
    const currentConv = (session?.conversation || []) as ChatMessage[];
    if (getCurrentSessionPhase() === 'follow-up') {
      const initialConv = (getInitialSessionData?.() as any)?.conversation || [];
      const merged = [...initialConv, ...currentConv];
      return merged;
    }
    return currentConv;
  };
  
  // Utility function to handle dark mode classes consistently
  const getDarkModeClasses = (lightClass: string, darkClass: string) => {
    return `${lightClass} dark:${darkClass}`;
  };
  
  // Hydration state to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const thoughtsScrollRef = useRef<HTMLDivElement>(null);

  // AI Supervisor state
  const [aiSupervisorEnabled, setAiSupervisorEnabled] = useState<boolean>(true);
  const [supervisorInterventions, setSupervisorInterventions] = useState<
    ShadowSupervisorIntervention[]
  >(() => clampSupervisorInterventions(session.supervisorInterventions));

  const findInterventionForMessage = (
    interventions: ShadowSupervisorIntervention[],
    message: { id?: string; content?: string; role?: string },
    speaker: string,
  ) => {
    const role =
      speaker === "student" ? "student" : speaker === "patient" ? "patient" : "doctor";
    return interventions.find(
      (int) =>
        (int.messageId && message.id && int.messageId === message.id) ||
        (int.question === message.content && int.role === role),
    );
  };

  const recordSupervisorIntervention = useCallback(
    (input: {
      role: ShadowSupervisorIntervention["role"]
      question: string
      messageId?: string
      reason?: string
      content: string
    }): ShadowSupervisorIntervention => {
      const intervention: ShadowSupervisorIntervention = {
        id: `intervention-${Date.now()}`,
        timestamp: new Date().toISOString(),
        role: input.role,
        question: input.question,
        ...(input.messageId ? { messageId: input.messageId } : {}),
        reason: input.reason || "Supervisor flag",
        content: input.content,
      }
      const base = sessionRef.current
      const next = mergeShadowSupervisorInterventions(
        base.supervisorInterventions,
        intervention,
      )
      setSupervisorInterventions(next)
      onSessionUpdate({
        ...base,
        supervisorInterventions: next,
        updatedAt: new Date().toISOString(),
      })
      return intervention
    },
    [onSessionUpdate],
  )

  useEffect(() => {
    if (!session.conversationId) return
    const stored = clampSupervisorInterventions(session.supervisorInterventions)
    if (!stored.length) return
    setSupervisorInterventions((prev) => {
      const merged = unionSupervisorInterventions(prev, stored)
      if (
        merged.length === prev.length &&
        merged.every((item, i) => item.id === prev[i]?.id)
      ) {
        return prev
      }
      return merged
    })
  }, [session.conversationId, session.supervisorInterventions])

  // Nurse Report state
  const [nurseReportData, setNurseReportData] = useState<any>(null);
  const [isLoadingNurseReport, setIsLoadingNurseReport] = useState(false);
  
  // Patient Information Modal state
  const [showPatientInfoModal, setShowPatientInfoModal] = useState(false);
  
  // Medical Report state
  const [showMedicalReportModal, setShowMedicalReportModal] = useState(false);
  const [showReportTypeSelection, setShowReportTypeSelection] = useState(false);
  const [showReportManagement, setShowReportManagement] = useState(false);
  const [medicalReport, setMedicalReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [conversationPaused, setConversationPaused] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  
  // Intelligent Report Generation state
  const [showSmartReportPopup, setShowSmartReportPopup] = useState(false);
  const [detectedTests, setDetectedTests] = useState<DetectedTest[]>([]);
  const [currentDoctorThought, setCurrentDoctorThought] = useState<string>('');
  const [isGeneratingMultipleReports, setIsGeneratingMultipleReports] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    completed: 0,
    total: 0,
    current: "",
    percentage: 0,
  });
  const [showGeneratedReports, setShowGeneratedReports] = useState(false);
  
  // Track report states during live conversation - now using shadow mode store
  // const [liveReportStates, setLiveReportStates] = useState<Array<{
  //   id: string;
  //   timestamp: string;
  //   reports: any[];
  //   doctorThoughtId: string;
  //   conversationIndex: number;
  // }>>([]);

  // Shadow mode store for reports and replay
  const shadowStore = useShadowModeStore() as any;
  const { 
    getAllReports, 
    addReportToCache, 
    addReportState,
    startReplayMode, 
    exitReplayMode, 
    addReplayState, 
    isReplayMode,
    replayStates,
    currentReplayStep,
    nextReplayState,
    prevReplayState,
    getCurrentReplayState,
    getCurrentStateReports,
  } = shadowStore;
  // Session phase management (from store - use fallback defaults)
  // Helper function to always get current session phase from store (not stale)
  const getCurrentSessionPhase = useCallback((): 'initial' | 'follow-up' => {
    const currentPhase = shadowStore.getSessionPhase ? shadowStore.getSessionPhase() : (shadowStore.sessionPhase || 'initial');
    return currentPhase;
  }, [shadowStore]);
  
  const sessionPhase: 'initial' | 'follow-up' = getCurrentSessionPhase();
  const moveToFollowUp = shadowStore.moveToFollowUp;
  const getInitialSessionData = shadowStore.getInitialSessionData || (() => shadowStore.initialSessionData || null);
  const getFollowUpSessionData = shadowStore.getFollowUpSessionData || (() => shadowStore.followUpSessionData || null);

  // Debug: Monitor state changes (reduced logging)
  useEffect(() => {

  }, [showSmartReportPopup]);

  // Generate replay states from conversation history
  // Helper function to get current active mode
  const getCurrentMode = (): string => {
    if (studentQuestionMode) return 'student';
    return 'normal';
  };

  const generateReplayStatesFromConversation = async () => {
    try {
      // Clear existing replay states and start fresh
      const { replayStates, ...rest } = useShadowModeStore.getState();
      useShadowModeStore.setState({
        ...rest,
        isReplayMode: true,
        replayMode: true,
        currentReplayStep: 0,
        replayStates: []
      });
      
      const conversation = session.conversation || [];
      const allReports = getAllReports();
      const currentMode = getCurrentMode();
      const replaySession = sessionRef.current;
      const fallbackThoughts = formatSessionDoctorThoughts(replaySession.doctorThoughts);
      const fallbackDiagnosis = (replaySession.differentialDiagnosis ??
        []) as DifferentialDiagnosisItem[];
      const turnMap = replaySession.shadowTurnsByDoctorIndex;

      
      let stateNumber = 1;
      
      // Process conversation messages in order
      for (let i = 0; i < conversation.length; i++) {
        const message = conversation[i];
        
        if (message.role === 'doctor') {
          const doctorIdx =
            conversation
              .slice(0, i + 1)
              .filter((m) => m.role === "doctor").length - 1;
          const currentQuestionIndex = Math.max(0, doctorIdx);

          const { thoughts } = buildShadowTurnSnapshotUpToIndex(
            conversation,
            i,
            turnMap,
            fallbackThoughts,
            fallbackDiagnosis,
          );
          const diagnosis = getReplayDiagnosisAtMessageIndex(
            conversation,
            i,
            turnMap,
            fallbackThoughts,
            fallbackDiagnosis,
          );
          const doctorThoughtText =
            thoughts[thoughts.length - 1]?.thought ||
            "Clinical reasoning completed";

          // Find intervention for this doctor question if any
          const intervention = findInterventionForMessage(
            supervisorInterventions,
            message,
            message.role === "student" ? "student" : message.role === "patient" ? "patient" : "doctor",
          );
          
          // State: Doctor Question + Thought + Differential Diagnosis (all together)
          const doctorTurnState = {
            id: `state-${stateNumber}-${Date.now()}`,
            stateNumber,
            timestamp: message.timestamp || new Date().toISOString(),
            type: 'doctor-turn' as const,
            mode: currentMode,
            doctorQuestion: message.content,
            doctorThought: doctorThoughtText,
            doctorDifferentialDiagnosis: diagnosis,
            intervention: intervention || undefined,
            reports: [],
            canGoBack: stateNumber > 1,
            canGoForward: true
          };
          addReplayState(doctorTurnState, { advanceStep: false });
          stateNumber++;
          
          // Group reports by questionIndex - get all reports generated for this specific doctor question
          const reportsForThisQuestion = (allReports as Report[]).filter((report: Report) => 
            report.questionIndex === currentQuestionIndex
          );
          
          if (reportsForThisQuestion.length > 0) {
            const reportReplayState = {
              id: `state-${stateNumber}-${Date.now()}`,
              stateNumber,
              timestamp: new Date().toISOString(),
              type: 'reports-generated' as const,
              mode: currentMode,
              reports: reportsForThisQuestion,
              canGoBack: stateNumber > 1,
              canGoForward: true
            } as any;
            addReplayState(reportReplayState, { advanceStep: false });
            stateNumber++;
          }
          
        } else if (message.role === 'patient') {
          const postDiagnosis = getReplayDiagnosisAtMessageIndex(
            conversation,
            i,
            turnMap,
            fallbackThoughts,
            fallbackDiagnosis,
          );
          // State: Patient Response + Post-Response Differential Diagnosis (all together)
          const patientTurnState = {
            id: `state-${stateNumber}-${Date.now()}`,
            stateNumber,
            timestamp: message.timestamp || new Date().toISOString(),
            type: 'patient-turn' as const,
            mode: currentMode,
            patientResponse: message.content,
            postResponseDifferentialDiagnosis: postDiagnosis,
            reports: [],
            canGoBack: stateNumber > 1,
            canGoForward: true
          };
          addReplayState(patientTurnState, { advanceStep: false });
          stateNumber++;
          
          // No reports after patient responses - they're distributed after doctor questions
        }
      }
      
      // Add SOAP Note state if available
      if (soapNote) {
        const soapState = {
          id: `state-${stateNumber}-${Date.now()}`,
          stateNumber,
          timestamp: new Date().toISOString(),
          type: 'soap-note' as const,
          mode: currentMode,
          soapNote: soapNote,
          reports: [],
          canGoBack: stateNumber > 1,
          canGoForward: true
        };
        addReplayState(soapState, { advanceStep: false });
        stateNumber++;
      }
      
      // Add Prescription state if available
      if (prescription) {
        const prescriptionState = {
          id: `state-${stateNumber}-${Date.now()}`,
          stateNumber,
          timestamp: new Date().toISOString(),
          type: 'prescription' as const,
          mode: currentMode,
          prescription: prescription,
          reports: [],
          canGoBack: stateNumber > 1,
          canGoForward: true
        };
        addReplayState(prescriptionState, { advanceStep: false });
        stateNumber++;
      }
      
      // Add individual report states for final reports
      if (finalReports && finalReports.length > 0) {
        for (const report of finalReports) {
          const reportState = {
            id: `state-${stateNumber}-${Date.now()}`,
            stateNumber,
            timestamp: report.timestamp || new Date().toISOString(),
            type: 'report' as const,
            mode: currentMode,
            reportType: report.type,
            reportContent: report.fullReport || report.summary,
            reports: [report],
            canGoBack: stateNumber > 1,
            canGoForward: true
          };
          addReplayState(reportState, { advanceStep: false });
          stateNumber++;
        }
      }
      
      
      // Debug: Check the actual replay states array
      const finalReplayStates = useShadowModeStore.getState().replayStates;
      
      // Additional debug: Verify the store state
      const storeState = useShadowModeStore.getState();
      
      // Update the last state to not have canGoForward
      if (finalReplayStates.length > 0) {
        const lastState = finalReplayStates[finalReplayStates.length - 1];
        lastState.canGoForward = false;
      }
      
      // Start replay mode at step 0 (states were appended without advancing step)
      startReplayMode(getCurrentMode());

      onShowReplay?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("showReplayMode"));
      }
      
    } catch (error) {
      console.error("Error generating replay states:", error);
    }
  };

  useEffect(() => {
  }, [detectedTests]);

  useEffect(() => {
  }, [currentDoctorThought]);
  
  // Focus management for accessibility
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState<string>("");

  // Ensure hydration is complete before rendering theme-dependent content
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  const isDarkMode = isHydrated && config.theme === "dark";

  // Fetch nurse report data
  const fetchNurseReport = async () => {
    if (!propMedicalCase || nurseReportData) return;
    
    setIsLoadingNurseReport(true);
    try {
      const response = await fetch('/api/learning/nurse-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicalCase: propMedicalCase,
          mode: 'learning'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNurseReportData(data);
      } else {
        console.error('Failed to fetch nurse report:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching nurse report:', error);
    } finally {
      setIsLoadingNurseReport(false);
    }
  };

  // Generate medical report - go directly to report type selection
  const generateMedicalReport = async () => {
    if (!session || !propMedicalCase) return;
    
    // Pause conversation for report generation (but don't interrupt current speech)
    setConversationPaused(true);
    
    // Show report type selection directly
    setShowReportTypeSelection(true);
  };

  // Handle generating new report from report management modal
  const handleGenerateNewReport = async (reportType: string) => {
    setSelectedReportType(reportType);
    setShowReportManagement(false);
    setShowReportTypeSelection(true);
  };

  // Handle report type selection
  const handleReportTypeSelected = async (reportType: string) => {
    setSelectedReportType(reportType);
    setShowReportTypeSelection(false);
    setIsGeneratingReport(true);
    setConversationPaused(true);
    
    try {
      const response = await fetch("/api/learning/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestedReports: [reportType],
          currentCase: {
            chiefComplaint: propMedicalCase.chiefComplaint || 'Not specified',
            symptoms: propMedicalCase.symptoms || [],
            disease: propMedicalCase.disease || 'Unknown'
          },
          patientInfo: {
            name: propMedicalCase.patientProfile?.name || propMedicalCase?.patientProfile?.name || 'Patient',
            age: propMedicalCase.patientProfile?.age || propMedicalCase?.age || 45,
            gender: propMedicalCase.patientProfile?.gender || propMedicalCase?.gender || 'Unknown'
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate medical report");
      }

      const data = await response.json();
      if (data.success && data.reports && data.reports.length > 0) {
        const r = data.reports[0] as Record<string, unknown>
        const structured = structuredFromApiPayload(r, String(r.type ?? reportType))

        const currentQuestionIndex = Math.floor(session.conversation.length / 2)
        const reportWithMetadata = {
          type: structured.type,
          summary: structured.summary,
          fullReport: structured.fullReportMarkdown,
          reportContent: structured.fullReportMarkdown,
          findings: structured.findings,
          impression: structured.impression,
          recommendations: structured.recommendations,
          structured,
          reportCategory: structured.category,
          questionIndex: currentQuestionIndex,
          conversationLength: session.conversation.length,
          timestamp: new Date().toISOString(),
        }

        addReportToCache(reportWithMetadata)

        const header = structured.header
        setMedicalReport({
          report_type: structured.type,
          patient_name: header.patientName,
          age: header.age,
          gender: header.sex ?? header.gender,
          findings: structured.findings,
          impression: structured.impression,
          recommendations: structured.recommendations,
          generated_at: reportWithMetadata.timestamp,
          raw_content: structured.fullReportMarkdown,
          structured,
        })
        setShowMedicalReportModal(true);
      } else {
        throw new Error(data.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating medical report:", error);
      // Reset pause state on error
      setConversationPaused(false);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Resume conversation after report
  const resumeConversation = async () => {
    // Reports are now managed by shadow mode store - no need for localStorage
    
    setConversationPaused(false);
    setShowMedicalReportModal(false);
    setMedicalReport(null);
    setSelectedReportType('');
    
    // The useEffect will handle the actual continuation
    // No need to call continueConversation here to avoid double execution
  };

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Fetch nurse report on component mount
  useEffect(() => {
    if (propMedicalCase && !nurseReportData) {
      fetchNurseReport();
    }
  }, [propMedicalCase]);

  // Student Question Toggle state
  const [studentQuestionMode, setStudentQuestionMode] = useState<boolean>(false);
  const [studentQuestionInput, setStudentQuestionInput] = useState<string>("");
  
  // Ask Doctor Popup state
  const [showAskDoctorPopup, setShowAskDoctorPopup] = useState<boolean>(false);
  const [askDoctorQuestion, setAskDoctorQuestion] = useState<string>("");
  const [askDoctorResponse, setAskDoctorResponse] = useState<string>("");

  // Doctor question explanations state
  const [questionExplanations, setQuestionExplanations] = useState<Map<string, string>>(new Map());
  const [loadingExplanations, setLoadingExplanations] = useState<Set<string>>(new Set());

  const [conversationMode, setConversationMode] = useState<"auto" | "manual">("manual");


  // Record and playback state
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(0);
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);
  
  // State navigation for manual mode (Back/Next functionality)
  interface ConversationState {
    messages: ChatMessage[];
    thoughts: Array<{ time: string; thought: string; apiTime?: number; loading?: boolean }>;
    diagnosis: DifferentialDiagnosisItem[];
    timestamp: string;
  }
  
  // Use refs for immediate, synchronous state management
  const conversationStatesRef = useRef<ConversationState[]>([]);
  const [conversationStates, setConversationStates] = useState<ConversationState[]>([]);
  const [currentStateIndex, setCurrentStateIndex] = useState<number>(-1);
  const currentStateIndexRef = useRef<number>(-1);
  const isNavigatingRef = useRef(false);
  /** Blocks auto next-question once termination / conclusion has started. */
  const conversationEndingRef = useRef(false);
  const isDiagnosisReadyRef = useRef(false);
  /** Bumped when consultation is ending so stale in-flight turn APIs are ignored. */
  const conversationTurnEpochRef = useRef(0);
  const terminationCheckPromiseRef = useRef<Promise<boolean> | null>(null);

  const isConsultationEnding = () => {
    if (getCurrentSessionPhase() === "follow-up") {
      return (
        conversationEndingRef.current ||
        sessionRef.current.isComplete === true
      )
    }
    return (
      conversationEndingRef.current ||
      isDiagnosisReadyRef.current ||
      sessionRef.current.isComplete ||
      sessionRef.current.diagnosisReady === true
    )
  };

  const captureTurnEpoch = () => conversationTurnEpochRef.current;

  const isTurnEpochStale = (epoch: number) =>
    epoch !== conversationTurnEpochRef.current;

  const markConversationEnding = () => {
    if (conversationEndingRef.current) return;
    conversationEndingRef.current = true;
    conversationTurnEpochRef.current += 1;
    if (autoContinueTimeoutRef.current) {
      clearTimeout(autoContinueTimeoutRef.current);
      autoContinueTimeoutRef.current = null;
    }
    clearStreaming();
    stopSpeaking();
    setIsProcessing(false);
  };

  /** Live TTS only at the latest step — not while stepping through Back/Next history. */
  const shouldAllowSpeech = () => {
    if (isNavigatingRef.current) return false
    const states = conversationStatesRef.current
    if (states.length > 0 && currentStateIndexRef.current < states.length - 1) {
      return false
    }
    return true
  }

  const manualStatesRebuiltForRef = useRef<string | null>(null);
  const [simulationEverStarted, setSimulationEverStarted] = useState(
    () =>
      (session.conversation?.length ?? 0) > 0 ||
      Boolean(
        session.conversationId && (session.lastSyncedMessageCount ?? 0) > 0,
      ),
  );

  // Refs to track latest values for state saving
  const latestDifferentialDiagnosisRef = useRef<DifferentialDiagnosisItem[]>([]);
  /** Per message-index DD snapshots for accurate replay (live session). */
  const ddSnapshotByMessageIndexRef = useRef<
    Record<number, DifferentialDiagnosisItem[]>
  >({});
  const doctorThoughtsRef = useRef<
    Array<{ time: string; thought: string; apiTime?: number; loading?: boolean }>
  >([]);

  const getReplayDiagnosisAtMessageIndex = useCallback(
    (
      conv: LearningConversationMessage[],
      endIdx: number,
      turnMap?: LearningSession["shadowTurnsByDoctorIndex"],
      fallbackThoughts: ReturnType<typeof formatSessionDoctorThoughts> = [],
      fallbackDiagnosis: DifferentialDiagnosisItem[] = [],
    ): DifferentialDiagnosisItem[] => {
      const snaps = ddSnapshotByMessageIndexRef.current;
      for (let j = endIdx; j >= 0; j--) {
        const snap = snaps[j];
        if (snap?.length && snap[0]?.category !== ("loading" as const)) {
          return snap.map((d) => ({ ...d }));
        }
      }

      const states = conversationStatesRef.current;
      const msgAt = conv[endIdx];
      if (msgAt) {
        for (let s = states.length - 1; s >= 0; s--) {
          const st = states[s];
          const last = st.messages[st.messages.length - 1];
          if (
            last &&
            last.role === msgAt.role &&
            String(last.content ?? "").trim() ===
              String(msgAt.content ?? "").trim() &&
            st.diagnosis?.length
          ) {
            return st.diagnosis.map((d) => ({ ...d }));
          }
        }
      }

      return buildShadowTurnSnapshotUpToIndex(
        conv,
        endIdx,
        turnMap,
        fallbackThoughts,
        fallbackDiagnosis,
      ).diagnosis;
    },
    [],
  );

  const recordDdSnapshotForConversation = useCallback(
    (conv: LearningConversationMessage[], dd: DifferentialDiagnosisItem[]) => {
      if (!dd.length || dd[0]?.category === ("loading" as any)) return;
      const idx = Math.max(0, conv.length - 1);
      ddSnapshotByMessageIndexRef.current = {
        ...ddSnapshotByMessageIndexRef.current,
        [idx]: dd.map((d) => ({ ...d })),
      };

      const doctorTurnIdx =
        conv.filter((m) => m.role === "doctor").length -
        (conv[conv.length - 1]?.role === "doctor" ? 1 : 0);
      if (doctorTurnIdx < 0) return;

      const thoughts = doctorThoughtsRef.current;
      const thought =
        thoughts[doctorTurnIdx]?.thought ??
        thoughts[thoughts.length - 1]?.thought;
      const map = {
        ...(sessionRef.current.shadowTurnsByDoctorIndex ?? {}),
      };
      map[String(doctorTurnIdx)] = {
        ...map[String(doctorTurnIdx)],
        ...(thought ? { doctorThought: thought } : {}),
        differentialDiagnosis: dd.map((d) => ({ ...d })),
      };
      onSessionUpdate({
        ...sessionRef.current,
        shadowTurnsByDoctorIndex: map,
        differentialDiagnosis: dd,
      });
    },
    [onSessionUpdate],
  );

  // Keep refs in sync with state
  useEffect(() => {
    conversationStatesRef.current = conversationStates;
    currentStateIndexRef.current = currentStateIndex;
  }, [conversationStates, currentStateIndex]);

  // Resume: Back/Next use in-memory `conversationStates` — rebuild from DB transcript once.
  useEffect(() => {
    if (conversationMode !== "manual") return;
    const cid = session.conversationId;
    if (!cid) return;
    const convLen = session.conversation?.length ?? 0;
    if (convLen < 2) return;
    if (conversationStatesRef.current.length > 0) return;
    if (manualStatesRebuiltForRef.current === cid) return;

    const built = buildManualConversationStatesFromSession(sessionRef.current, {
      skipEmptyInitialState: true,
    });
    if (built.length < 1) return;

    setSimulationEverStarted(true);
    conversationStatesRef.current = built;
    currentStateIndexRef.current = built.length - 1;
    setConversationStates(built);
    setCurrentStateIndex(built.length - 1);
    manualStatesRebuiltForRef.current = cid;

    const last = built[built.length - 1];
    applyConversationNavState(last);

  }, [conversationMode, session.conversationId, session.conversation?.length]);

  useEffect(() => {
    if ((session.conversation?.length ?? 0) > 0) {
      setSimulationEverStarted(true);
    }
  }, [session.conversation?.length]);

  // Historical thoughts and diagnosis for replay
  const [historicalThoughts, setHistoricalThoughts] = useState<Map<string, any[]>>(new Map());
  const [historicalDiagnosis, setHistoricalDiagnosis] = useState<Map<string, any[]>>(new Map());
  
  // Helper function to find the current exchange
  const findCurrentExchange = (playbackIndex: number) => {
    // Count complete doctor-patient exchanges up to the current index
    let exchangeCount = 0;
    for (let i = 0; i < playbackIndex; i++) {
      if (i < conversationHistory.length - 1) {
        const currentMessage = conversationHistory[i];
        const nextMessage = conversationHistory[i + 1];
        if (currentMessage.role === "doctor" && nextMessage.role === "patient") {
          exchangeCount++;
        }
      }
    }
    return exchangeCount;
  };
  
  // Helper function to find the next complete exchange
  const findNextExchange = (currentIndex: number) => {
    // First, check if we're at a doctor question and the next message is a patient response
    if (currentIndex < conversationHistory.length - 1) {
      const currentMessage = conversationHistory[currentIndex];
      const nextMessage = conversationHistory[currentIndex + 1];
      if (currentMessage.role === "doctor" && nextMessage.role === "patient") {
        return currentIndex + 1; // Return the patient response
      }
    }
    
    // If not, look for the next complete exchange
    for (let i = currentIndex + 1; i < conversationHistory.length - 1; i++) {
      const currentMessage = conversationHistory[i];
      const nextMessage = conversationHistory[i + 1];
      if (currentMessage.role === "doctor" && nextMessage.role === "patient") {
        return i + 1; // Return index of the patient response
      }
    }
    return conversationHistory.length - 1; // Return last message if no complete exchange found
  };
  
  // Helper function to find the previous complete exchange
  const findPreviousExchange = (currentIndex: number) => {
    // First, check if we're at a patient response and the previous message is a doctor question
    if (currentIndex > 0) {
      const currentMessage = conversationHistory[currentIndex];
      const prevMessage = conversationHistory[currentIndex - 1];
      if (currentMessage.role === "patient" && prevMessage.role === "doctor") {
        return currentIndex - 1; // Return the doctor question
      }
    }
    
    // If not, look for the previous complete exchange
    for (let i = currentIndex - 1; i > 0; i--) {
      const currentMessage = conversationHistory[i];
      const prevMessage = conversationHistory[i - 1];
      if (currentMessage.role === "patient" && prevMessage.role === "doctor") {
        return i - 1; // Return index of the doctor question
      }
    }
    return 0; // Return first message if no complete exchange found
  };
  

  // Handle student mode toggle
  const handleStudentModeToggle = () => {
    const newMode = !studentQuestionMode;
    setStudentQuestionMode(newMode);
    
    if (!newMode && !session.isComplete && !isDiagnosisReady) {
      setStudentQuestionInput("");
      setIsProcessing(false);
      setConversationStatus("idle");
      
      setTimeout(() => {
        continueConversation();
      }, 200);
    }
  };

  // Playback control functions
  const startPlayback = async () => {
    if (session.conversation.length === 0) return;
    
    // Generate replay states and trigger full replay interface
    await generateReplayStatesFromConversation();
  };

  // Start replay for INITIAL session (review mode)
  const startInitialPlayback = async () => {
    const initialData = getInitialSessionData();
    if (!initialData || !initialData.conversation || initialData.conversation.length === 0) return;
    
    const currentMode = getCurrentMode();
    
    // Reset replay and seed states from the initial session data
    const { replayStates: _old, ...rest } = useShadowModeStore.getState() as any;
    useShadowModeStore.setState({
      ...rest,
      isReplayMode: true,
      replayMode: true,
      currentReplayStep: 0,
      replayStates: [],
      currentReplayMode: currentMode
    });
    
    const conv = initialData.conversation as LearningConversationMessage[];
    const fallbackThoughts = formatSessionDoctorThoughts(
      initialData.doctorThoughts as LearningSession["doctorThoughts"],
    );
    const fallbackDiagnosis = (initialData.differentialDiagnosis ??
      []) as DifferentialDiagnosisItem[];

    let stateNumber = 1;
    for (let i = 0; i < conv.length; i++) {
      const m = conv[i];
      if (m.role === "doctor") {
        const { thoughts } = buildShadowTurnSnapshotUpToIndex(
          conv,
          i,
          undefined,
          fallbackThoughts,
          fallbackDiagnosis,
        );
        const diagnosis = getReplayDiagnosisAtMessageIndex(
          conv,
          i,
          undefined,
          fallbackThoughts,
          fallbackDiagnosis,
        );
        const intervention = findInterventionForMessage(
          supervisorInterventions,
          m,
          "doctor",
        );

        addReplayState(
          {
            id: `state-${stateNumber}-${Date.now()}`,
            stateNumber,
            timestamp: m.timestamp || new Date().toISOString(),
            type: "doctor-turn",
            mode: currentMode,
            doctorQuestion: m.content,
            doctorThought:
              thoughts[thoughts.length - 1]?.thought || "",
            doctorDifferentialDiagnosis: diagnosis,
            intervention: intervention || undefined,
            reports: [],
            canGoBack: stateNumber > 1,
            canGoForward: true,
          } as ReplayState,
          { advanceStep: false },
        );
        stateNumber++;
      } else if (m.role === "patient") {
        const postDiagnosis = getReplayDiagnosisAtMessageIndex(
          conv,
          i,
          undefined,
          fallbackThoughts,
          fallbackDiagnosis,
        );
        addReplayState(
          {
            id: `state-${stateNumber}-${Date.now()}`,
            stateNumber,
            timestamp: m.timestamp || new Date().toISOString(),
            type: "patient-turn",
            mode: currentMode,
            patientResponse: m.content,
            postResponseDifferentialDiagnosis: postDiagnosis,
            reports: [],
            canGoBack: stateNumber > 1,
            canGoForward: true,
          } as ReplayState,
          { advanceStep: false },
        );
        stateNumber++;
      }
    }
    
    // Mark last as no-forward
    const finalReplayStates = (useShadowModeStore.getState() as any).replayStates;
    if (finalReplayStates.length > 0) {
      finalReplayStates[finalReplayStates.length - 1].canGoForward = false;
    }
    
    // trigger UI
    startReplayMode(getCurrentMode());
    onShowReplay?.();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("showReplayMode"));
    }
  };


  const stopPlayback = () => {
    setIsPlaybackMode(false);
    setIsAutoPlaying(false);
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
  };

  const goToNext = () => {
    if (currentPlaybackIndex < conversationHistory.length - 1) {
      const nextIndex = findNextExchange(currentPlaybackIndex);
      setCurrentPlaybackIndex(nextIndex);
      setAnnouncement(`Moved to conversation ${nextIndex + 1} of ${conversationHistory.length}`);
    }
  };

  const goToPrevious = () => {
    if (currentPlaybackIndex > 0) {
      const prevIndex = findPreviousExchange(currentPlaybackIndex);
      setCurrentPlaybackIndex(prevIndex);
      setAnnouncement(`Moved to conversation ${prevIndex + 1} of ${conversationHistory.length}`);
    }
  };

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (playbackInterval) {
        clearInterval(playbackInterval);
        setPlaybackInterval(null);
      }
    } else {
      setIsAutoPlaying(true);
      const interval = setInterval(() => {
        setCurrentPlaybackIndex(prev => {
          if (prev >= conversationHistory.length - 1) {
            setIsAutoPlaying(false);
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 2000 / playbackSpeed);
      setPlaybackInterval(interval);
    }
  };

  // Handle ask doctor popup
  const handleAskDoctorPopup = () => {
    setShowAskDoctorPopup(true);
    setAskDoctorQuestion("");
    setAskDoctorResponse("");
  };

  // Fetch explanation for a doctor question
  const fetchQuestionExplanation = async (questionId: string, question: string) => {
    if (questionExplanations.has(questionId) || loadingExplanations.has(questionId)) {
      return;
    }

    setLoadingExplanations(prev => new Set(prev).add(questionId));

    try {
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: session.conversation,
      };

      const response = await fetch("/api/learning/doctor-question-explanation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          context,
          conversation: getConversationForPrompt(),
        }),
      });

      if (response.ok) {
        const { explanation } = await response.json();
        setQuestionExplanations(prev => new Map(prev).set(questionId, explanation));
      }
    } catch (error) {
      console.error("Error fetching question explanation:", error);
    } finally {
      setLoadingExplanations(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const handleAskDoctorSubmit = async () => {
    if (!askDoctorQuestion.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const context = {
        caseId: session.caseId,
        specialty: medicalCase?.specialty || "General Medicine",
        difficulty: medicalCase?.difficulty || "Intermediate",
        chiefComplaint: medicalCase?.chiefComplaint || medicalCase?.symptoms?.[0] || "Not specified",
        patientAge: medicalCase?.age || session.patientProfile?.age || "Not specified",
        patientGender: medicalCase?.gender || session.patientProfile?.gender || "Not specified",
        patientOccupation: medicalCase?.occupation || session.patientProfile?.occupation || "Not specified",
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

      const response = await fetch("/api/learning/ask-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: askDoctorQuestion,
          context,
          conversation: getConversationForPrompt(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get doctor response");
      }

      const { response: doctorResponse } = await response.json();
      setAskDoctorResponse(doctorResponse);
    } catch (error) {
      console.error("Error asking doctor:", error);
      setAskDoctorResponse("Sorry, I couldn't process your question. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseAskDoctorPopup = () => {
    setShowAskDoctorPopup(false);
    setAskDoctorQuestion("");
    setAskDoctorResponse("");
  };

  // Helper function to pause conversation
  const pauseConversation = () => {
    setConversationStatus("idle");
    setIsProcessing(false);
  };

  const handleConversationModeToggle = () => {
    const newMode = conversationMode === "auto" ? "manual" : "auto";
    setConversationMode(newMode);
    
    // If switching to auto mode and the last message is from a patient, continue the conversation
    if (newMode === "auto" && session.conversation.length > 0) {
      const lastMessage = session.conversation[session.conversation.length - 1];
      if (lastMessage.role === "patient" && !isProcessing && !session.isComplete) {
        setTimeout(() => {
          continueWithNextDoctorQuestion(session.conversation);
        }, 100);
      }
    }
    
    // If switching to manual mode, ensure conversation is paused
    if (newMode === "manual") {
      setIsProcessing(false);
      setConversationStatus("idle");
      
      // Cancel any pending auto timeout
      if (autoContinueTimeoutRef.current) {
        clearTimeout(autoContinueTimeoutRef.current);
        autoContinueTimeoutRef.current = null;
      }
    }
  };

  const handleContinueConversation = () => {
    // Block continuation while viewing initial session (read-only)
    if (activeSessionView === 'initial') {
      return;
    }
    
    if (session.conversation.length === 0) {
      return;
    }
    if (studentQuestionMode) {
      return;
    }

    if (isConsultationEnding()) {
      return;
    }

    if (conversationMode === "manual" && restoreLatestConversationState()) {
      return;
    }

    // Reset navigation flag
    isNavigatingRef.current = false;
    
    const lastMessage = sessionRef.current.conversation[
      sessionRef.current.conversation.length - 1
    ];

    if (
      lastMessage.role === "doctor" &&
      (isDoctorClosingStatement(lastMessage.content) || sessionRef.current.diagnosisReady)
    ) {
      if (getCurrentSessionPhase() === "follow-up") {
        return;
      }
      activateDiagnosisReadyUi();
      return;
    }
    
    // In manual mode, if the last message is from a patient, generate next doctor question
    if (conversationMode === "manual" && lastMessage.role === "patient") {
      if (autoContinueTimeoutRef.current) {
        clearTimeout(autoContinueTimeoutRef.current);
        autoContinueTimeoutRef.current = null;
      }
      void proceedAfterPatientTurn(sessionRef.current.conversation, {
        forceNextDoctor: true,
      });
      return;
    }
    
    continueConversation();
  };

  // NEW CLEAN STATE MANAGEMENT - NO DELAYS, NO RACE CONDITIONS
  const addConversationState = (messages: ChatMessage[], thoughts: any[], diagnosis: any[]) => {
    if (isNavigatingRef.current) {
      return;
    }

    const newState: ConversationState = {
      messages: [...messages],
      thoughts: [...thoughts],
      diagnosis: [...diagnosis],
      timestamp: new Date().toISOString(),
    };

    // Get current states from ref for accuracy
    const currentStates = conversationStatesRef.current;
    const currentIdx = currentStateIndexRef.current;

    // Remove future states if we're in the middle and adding new content
    const newStates = currentIdx < currentStates.length - 1
      ? [...currentStates.slice(0, currentIdx + 1), newState]
      : [...currentStates, newState];

    const newIndex = newStates.length - 1;

    // Update refs immediately (synchronous)
    conversationStatesRef.current = newStates;
    currentStateIndexRef.current = newIndex;
    
    // Update React state for UI
    setConversationStates(newStates);
    setCurrentStateIndex(newIndex);

  };

  const applyConversationNavState = (state: ConversationState) => {
    const thoughts = [...state.thoughts]
    const diagnosis = [...state.diagnosis]
    setDoctorThoughts(thoughts)
    setDifferentialDiagnosis(diagnosis)
    latestDifferentialDiagnosisRef.current = diagnosis
    const lastThought = thoughts[thoughts.length - 1]
    setCurrentThought(lastThought?.thought ?? "")
    lastSyncedThoughtsRef.current = JSON.stringify(thoughts)
    lastSyncedDiagnosisRef.current = JSON.stringify(diagnosis)
  }

  /** When browsing history with Back/Next, Continue restores the latest step instead of advancing from the past. */
  const restoreLatestConversationState = (): boolean => {
    const states = conversationStatesRef.current
    if (!states.length) return false
    const latestIndex = states.length - 1
    if (currentStateIndexRef.current >= latestIndex) return false

    const state = states[latestIndex]
    currentStateIndexRef.current = latestIndex
    setCurrentStateIndex(latestIndex)
    onSessionUpdate({
      ...sessionRef.current,
      conversation: [...state.messages],
    })
    applyConversationNavState(state)
    isNavigatingRef.current = false
    return true
  }

  const handleBackState = () => {
    const minIndex = simulationEverStarted ? 1 : 0;
    if (currentStateIndexRef.current <= minIndex) return;

    stopSpeaking();
    isNavigatingRef.current = true;
    const newIndex = currentStateIndexRef.current - 1;
    const state = conversationStatesRef.current[newIndex];
    if (simulationEverStarted && state.messages.length === 0) {
      isNavigatingRef.current = false;
      return;
    }

    currentStateIndexRef.current = newIndex;
    setCurrentStateIndex(newIndex);
    
    onSessionUpdate({ ...sessionRef.current, conversation: [...state.messages] });
    applyConversationNavState(state);

    setTimeout(() => { isNavigatingRef.current = false; }, 500);
  };

  const handleNextState = () => {
    if (currentStateIndexRef.current >= conversationStatesRef.current.length - 1) return;

    stopSpeaking();
    isNavigatingRef.current = true;
    const newIndex = currentStateIndexRef.current + 1;
    const state = conversationStatesRef.current[newIndex];

    currentStateIndexRef.current = newIndex;
    setCurrentStateIndex(newIndex);
    
    onSessionUpdate({ ...sessionRef.current, conversation: [...state.messages] });
    applyConversationNavState(state);

    setTimeout(() => { isNavigatingRef.current = false; }, 500);
  };

  // Enhanced API call wrapper with timing
  const makeAPICall = async (
    url: string,
    options: RequestInit,
    messageId: string | undefined,
    apiName: string,
  ) => {
    const startTime = performance.now();
    try {
      const response = await fetch(url, options);
      const endTime = performance.now();
      const apiTime = Math.round(endTime - startTime);

      return { response, apiTime };
    } catch (error) {
      const endTime = performance.now();
      const apiTime = Math.round(endTime - startTime);
      console.error(`📊 ${apiName} API Error after ${apiTime}ms:`, error);
      throw error;
    }
  };

  
  // Enhanced simulation states - using real conversation data
  const [messages, setMessages] = useState<
    Array<{ speaker: string; text: string; time: string; id: string }>
  >([]);

  // Cleanup playback interval on unmount
  useEffect(() => {
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [playbackInterval]);
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
  
  // Enhanced speech and conversation states
  const [isAudioPaused, setIsAudioPaused] = useState(false);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPlaybackMode) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            if (currentPlaybackIndex > 0) {
              goToPrevious();
            }
            break;
          case 'ArrowRight':
            event.preventDefault();
            if (currentPlaybackIndex < conversationHistory.length - 1) {
              goToNext();
            }
            break;
          case ' ':
            event.preventDefault();
            toggleAutoPlay();
            break;
          case 'Escape':
            event.preventDefault();
            stopPlayback();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaybackMode, currentPlaybackIndex, conversationHistory.length]);
  const [conversationStatus, setConversationStatus] = useState<
    | "idle"
    | "doctor-thinking"
    | "patient-responding"
    | "paused"
    | "diagnosis-ready"
  >("idle");
  const [isDiagnosisReady, setIsDiagnosisReady] = useState(false);
  useEffect(() => {
    isDiagnosisReadyRef.current = isDiagnosisReady;
  }, [isDiagnosisReady]);
  const [terminationDecision, setTerminationDecision] =
    useState<TerminationDecision | null>(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showConsultationCompleteModal, setShowConsultationCompleteModal] = useState(false);
  const [showConsultationCompletedModal, setShowConsultationCompletedModal] = useState(false);
  const [isFinalizingShadowCase, setIsFinalizingShadowCase] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [currentDuration, setCurrentDuration] = useState<string>("0:00");
  
  // SOAP Note and Prescription states
  const [soapNote, setSoapNote] = useState<string>('');
  const [prescription, setPrescription] = useState<string>('');
  /** Stable copies for clinical docs modal (avoids blank UI on tab/layout remount). */
  const soapNoteRef = useRef<string>("");
  const prescriptionRef = useRef<string>("");
  const [finalReports, setFinalReports] = useState<Report[]>([]);
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);
  const [isGeneratingFinalReports, setIsGeneratingFinalReports] = useState(false);
  const [showConcludeButton, setShowConcludeButton] = useState(false);
  const [showSOAPModal, setShowSOAPModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [extractedTestNames, setExtractedTestNames] = useState<string[]>([]);
  const [viewingDocumentType, setViewingDocumentType] = useState<'soap' | 'prescription' | 'report' | null>(null);
  const [viewingReportIndex, setViewingReportIndex] = useState(0);
  const [isViewingIndividualReport, setIsViewingIndividualReport] = useState(false);
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<string>('');
  /** SOAP, Rx, prior dx, and initial snapshot for follow-up LLM routes. */
  const getShadowFollowUpApiExtras = useCallback(() => {
    const initialData =
      (getInitialSessionData ? getInitialSessionData() : null) ??
      session.shadowInitialSnapshot ??
      null;
    return {
      soapNote: soapNote || session.shadowSoapNote || "",
      prescription: prescription || session.shadowPrescription || "",
      previousDiagnosis: primaryDiagnosis || "",
      initialSessionSnapshot: initialData,
    };
  }, [
    soapNote,
    prescription,
    primaryDiagnosis,
    session.shadowSoapNote,
    session.shadowPrescription,
    session.shadowInitialSnapshot,
    getInitialSessionData,
  ]);
  // Integrated session view toggle (initial vs current)
  const [activeSessionView, setActiveSessionView] = useState<'current' | 'initial'>('current');
  const speechQueueRef = useRef<
    Array<{ text: string; voice: "doctor" | "patient"; messageId?: string; speechStartTime?: number }>
  >([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingSpeechRef = useRef(false);
  const spokenMessagesRef = useRef<Set<string>>(new Set());
  const autoContinueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [doctorThoughts, setDoctorThoughts] = useState<
    Array<{ time: string; thought: string; apiTime?: number; loading?: boolean }>
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

  useEffect(() => {
    doctorThoughtsRef.current = doctorThoughts;
  }, [doctorThoughts]);

  // Debug differential diagnosis state changes
  useEffect(() => {
    // Also update the ref for state saving
    latestDifferentialDiagnosisRef.current = differentialDiagnosis;
  }, [differentialDiagnosis]);

  // Track if we're syncing to prevent loops
  const isSyncingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const wasInReplayModeRef = useRef(isReplayMode);
  
  // Keep track of last synced values to prevent infinite loops
  const lastSyncedThoughtsRef = useRef<string>('');
  const lastSyncedDiagnosisRef = useRef<string>('');

  const resetFollowUpConsultationUi = useCallback(() => {
    conversationEndingRef.current = false
    isDiagnosisReadyRef.current = false
    setIsDiagnosisReady(false)
    setShowConcludeButton(false)
    setConversationStatus("idle")
    setTerminationDecision(null)
  }, [])

  const activateDiagnosisReadyUi = useCallback(
    (opts?: { persistSession?: boolean }) => {
      if (getCurrentSessionPhase() === "follow-up") {
        return
      }
      if (soapNote) return
      conversationEndingRef.current = true
      isDiagnosisReadyRef.current = true
      setIsDiagnosisReady(true)
      setConversationStatus("diagnosis-ready")
      setShowConcludeButton(true)
      pauseConversation()

      if (opts?.persistSession !== false) {
        const cur = sessionRef.current
        if (!cur.diagnosisReady) {
          onSessionUpdate({
            ...cur,
            diagnosisReady: true,
            isComplete: false,
          })
        }
      }
    },
    [soapNote, onSessionUpdate, getCurrentSessionPhase],
  )

  const restoreDiagnosisReadyUiFromSession = useCallback(
    (source: LearningSession) => {
      const phase =
        source.shadowPhase ?? getCurrentSessionPhase()
      const conv = source.conversation ?? []
      const last = conv[conv.length - 1]
      const closingDoctor =
        last?.role === "doctor" &&
        isDoctorClosingStatement(String(last.content ?? ""))

      if (phase === "follow-up") {
        resetFollowUpConsultationUi()
        return
      }

      if (!source.diagnosisReady && !closingDoctor) return
      if (soapNote) return
      activateDiagnosisReadyUi({ persistSession: !source.diagnosisReady })
    },
    [
      soapNote,
      activateDiagnosisReadyUi,
      getCurrentSessionPhase,
      resetFollowUpConsultationUi,
    ],
  )

  useEffect(() => {
    restoreDiagnosisReadyUiFromSession(session)
  }, [
    session.diagnosisReady,
    session.conversationId,
    session.conversation?.length,
    session.conversation?.[session.conversation.length - 1]?.content,
    restoreDiagnosisReadyUiFromSession,
  ])

  /** Show Conclude only on the latest history step when diagnosis-ready (initial session only). */
  useEffect(() => {
    if (sessionPhase === "follow-up") {
      setShowConcludeButton(false)
      return
    }
    if (!isDiagnosisReady && !session.diagnosisReady) {
      return
    }
    const states = conversationStatesRef.current
    const atLatest =
      states.length === 0 ||
      currentStateIndexRef.current >= states.length - 1
    setShowConcludeButton(atLatest)
  }, [sessionPhase, isDiagnosisReady, session.diagnosisReady, currentStateIndex])

  // Initialize doctor thoughts and differential diagnosis from session on mount
  useEffect(() => {
    if (!hasInitializedRef.current && session) {
      restoreDiagnosisReadyUiFromSession(session)

      // Restore doctor thoughts from session if available
      if (session.doctorThoughts && session.doctorThoughts.length > 0) {
        const formattedThoughts = session.doctorThoughts.map((thought: any) => ({
          time: thought.timestamp || thought.createdAt || new Date().toISOString(),
          thought: thought.content || thought.thought || "",
          apiTime: thought.apiTime
        }));
        setDoctorThoughts(formattedThoughts);
        // Update last synced ref to prevent immediate re-sync
        lastSyncedThoughtsRef.current = JSON.stringify(formattedThoughts);
      }

      // Restore differential diagnosis from session if available
      if (session.differentialDiagnosis && session.differentialDiagnosis.length > 0) {
        setDifferentialDiagnosis(session.differentialDiagnosis);
        // Update last synced ref to prevent immediate re-sync
        lastSyncedDiagnosisRef.current = JSON.stringify(session.differentialDiagnosis);
      }
      
      hasInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Restore follow-up phase from DB resume (shadowProgress metadata)
  useEffect(() => {
    if (!isHydrated) return
    if (session.shadowPhase !== "follow-up" && sessionPhase !== "follow-up") return

    resetFollowUpConsultationUi()

    const snap =
      session.shadowInitialSnapshot ??
      (getInitialSessionData ? getInitialSessionData() : null)
    const storePhase = shadowStore.getSessionPhase?.() ?? shadowStore.sessionPhase
    if (snap && storePhase !== "follow-up" && typeof moveToFollowUp === "function") {
      moveToFollowUp(snap as Parameters<NonNullable<typeof moveToFollowUp>>[0])
    }
  }, [
    isHydrated,
    session.shadowPhase,
    session.shadowInitialSnapshot,
    session.conversationId,
    sessionPhase,
    getInitialSessionData,
    moveToFollowUp,
    resetFollowUpConsultationUi,
  ])

  /** After refresh, DB transcript may still include initial visit — keep follow-up thread only. */
  useEffect(() => {
    if (!isHydrated) return
    if (session.shadowPhase !== "follow-up" && sessionPhase !== "follow-up") return

    const snap =
      session.shadowInitialSnapshot ??
      (getInitialSessionData ? getInitialSessionData() : null)
    const initialCount = session.shadowInitialMessageCount
    if (!snap && (initialCount == null || initialCount <= 0)) return

    const current = session.conversation ?? []
    const sliced = splitFollowUpMessagesFromAll(current, {
      sessionPhase: "follow-up",
      initialMessageCount: initialCount ?? snap?.conversation?.length,
      initialSessionSnapshot: snap ?? undefined,
    })
    if (sliced.length >= current.length) return

    onSessionUpdate({
      ...sessionRef.current,
      conversation: sliced,
      shadowPhase: "follow-up",
      shadowInitialMessageCount: initialCount ?? snap?.conversation?.length,
      shadowInitialSnapshot: snap ?? session.shadowInitialSnapshot,
      lastSyncedMessageCount: sliced.length,
    })
  }, [
    isHydrated,
    session.shadowPhase,
    session.conversationId,
    session.conversation?.length,
    session.shadowInitialMessageCount,
    session.shadowInitialSnapshot,
    sessionPhase,
    getInitialSessionData,
    onSessionUpdate,
  ])

  // Restore SOAP note and prescription from initial session data when in follow-up mode
  useEffect(() => {
    if (
      !isHydrated ||
      (sessionPhase !== "follow-up" && session.shadowPhase !== "follow-up")
    ) {
      return
    }
    const initialData =
      getInitialSessionData?.() ?? session.shadowInitialSnapshot ?? null
    if (initialData) {
        // Restore SOAP note if available and not already set
        const soapSrc =
          session.shadowSoapNote ?? initialData.soapNote
        if (soapSrc && !soapNote) {
          soapNoteRef.current = soapSrc;
          setSoapNote(soapSrc);
        }
        // Restore prescription if available and not already set
        const rxSrc =
          session.shadowPrescription ?? initialData.prescription
        if (rxSrc && !prescription) {
          prescriptionRef.current = rxSrc
          setPrescription(rxSrc);
        }
        // Restore final reports if available
        if (initialData.reports && initialData.reports.length > 0 && finalReports.length === 0) {
          setFinalReports(initialData.reports);
        }
    }
  }, [
    isHydrated,
    sessionPhase,
    session.shadowPhase,
    session.shadowSoapNote,
    session.shadowPrescription,
    session.shadowInitialSnapshot,
    getInitialSessionData,
    soapNote,
    prescription,
    finalReports.length,
  ]);


  // Restore state when exiting replay mode
  useEffect(() => {
    // Detect when we exit replay mode (transition from true to false)
    if (wasInReplayModeRef.current && !isReplayMode && session) {
      
      // Restore from session
      if (session.doctorThoughts && session.doctorThoughts.length > 0) {
        const formattedThoughts = session.doctorThoughts.map((thought: any) => ({
          time: thought.timestamp || thought.createdAt || new Date().toISOString(),
          thought: thought.content || thought.thought || "",
          apiTime: thought.apiTime
        }));
        setDoctorThoughts(formattedThoughts);
        // Update last synced ref to prevent immediate re-sync
        lastSyncedThoughtsRef.current = JSON.stringify(formattedThoughts);
      }

      if (session.differentialDiagnosis && session.differentialDiagnosis.length > 0) {
        setDifferentialDiagnosis(session.differentialDiagnosis);
        // Update last synced ref to prevent immediate re-sync
        lastSyncedDiagnosisRef.current = JSON.stringify(session.differentialDiagnosis);
      }
    }
    
    wasInReplayModeRef.current = isReplayMode;
  }, [isReplayMode, session]);

  // Sync doctor thoughts and differential diagnosis to session whenever they change
  useEffect(() => {
    if (session && !isReplayMode && !isSyncingRef.current && hasInitializedRef.current) {
      // Serialize current state to compare with last sync
      const currentThoughtsStr = JSON.stringify(doctorThoughts);
      const currentDiagnosisStr = JSON.stringify(differentialDiagnosis);
      
      // Only update if data actually changed since last sync
      const thoughtsChanged = currentThoughtsStr !== lastSyncedThoughtsRef.current && doctorThoughts.length > 0;
      const diagnosisChanged = currentDiagnosisStr !== lastSyncedDiagnosisRef.current && 
        differentialDiagnosis.length > 0 && 
        !differentialDiagnosis.every(d => d.probability === 0);

      if (thoughtsChanged || diagnosisChanged) {
        isSyncingRef.current = true;
        
        const updatedSession = {
          ...sessionRef.current,
          doctorThoughts: doctorThoughts.map(t => ({
            id: `thought-${t.time}`,
            content: t.thought,
            timestamp: t.time,
            context: "Live session",
            apiTime: t.apiTime
          })),
          differentialDiagnosis: differentialDiagnosis
        };
        
        // Update last synced values
        lastSyncedThoughtsRef.current = currentThoughtsStr;
        lastSyncedDiagnosisRef.current = currentDiagnosisStr;
        
        onSessionUpdate(updatedSession);
        isSyncingRef.current = false;
      }
    }
  }, [doctorThoughts, differentialDiagnosis, isReplayMode]); // Removed session and onSessionUpdate from dependencies to prevent loop

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

    if (studentQuestionMode) return;

    // Save initial empty state BEFORE starting conversation (only in manual mode)
    if (conversationMode === "manual") {
      if (conversationStatesRef.current.length === 0) {
        addConversationState([], [], differentialDiagnosis);
      }
    }

    // Report states are managed by shadow mode store, no need to clear local state

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

      const doctorMessage: ChatMessage = {
        id: `doctor-${Date.now()}`,
        role: "doctor",
        content: "",
        explanation: "",
        timestamp: new Date().toISOString(),
      };

      const { response, apiTime } = await makeAPICall(
        "/api/learning/doctor-question",
        {
        method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({ 
          currentCase: {
            chiefComplaint: medicalCase?.chiefComplaint || 'Not specified',
            symptoms: medicalCase?.symptoms || [],
            disease: medicalCase?.disease || session.disease
          },
          patientInfo: {
            name: session.patientProfile?.name || 'Patient',
            age: session.patientProfile?.age || 'Unknown',
            gender: session.patientProfile?.gender || 'Unknown'
          },
          reports: mapReportsForPrompt(getCurrentSessionPhase() === 'follow-up' ? (getReportsForPrompt() as Report[]) : []),
          conversation: getConversationForPrompt(),
          mode: getCurrentSessionPhase(), // Always pass mode
          isFollowUp: getCurrentSessionPhase() === 'follow-up', // Always pass isFollowUp
          ...(getCurrentSessionPhase() === 'follow-up' ? getShadowFollowUpApiExtras() : {}),
        }),
        },
        doctorMessage.id,
        "Doctor Question"
      );

      if (!response.ok) {
        throw new Error("Failed to generate doctor question");
      }

      const { question } = await response.json();

      // Update the message with the actual content
      doctorMessage.content = question;
      doctorMessage.explanation = "";

      // Start streaming the doctor question immediately
        streamText(question, "doctor", () => {
        // After streaming completes, add to conversation
      const updatedSession = {
        ...sessionRef.current,
        conversation: [doctorMessage],
        };
        onSessionUpdate(updatedSession);
        clearStreaming();

        // Generate doctor thought immediately after doctor question
        generateDoctorThought("Doctor asked question", [doctorMessage]).then(async (updatedThoughts) => {
          // Trigger parallel API calls after initial doctor question (now without doctor thought)
          // Pass the updated conversation that includes the doctor message
          const updatedDiagnosis = await handleParallelAPICalls(doctorMessage, [doctorMessage]);
          
          // Save state AFTER both doctor thought and parallel API calls complete
          // Use returned thoughts and diagnosis directly (no refs, no delays!)
          if (conversationMode === "manual") {
            addConversationState([doctorMessage], updatedThoughts, updatedDiagnosis);
          }
        }).catch((err) => {
          console.error("[Shadow] Doctor thought → parallel APIs pipeline failed:", err);
        });
      }, doctorMessage.id);
    } catch (error) {
      console.error("Error starting conversation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const continueConversation = async () => {
    
    if (isConsultationEnding()) {
      return;
    }

    // Check if conversation is paused - block new conversation flow
    if (conversationPaused || isPaused) {
      return;
    }

    if (studentQuestionMode) {
      setIsProcessing(false);
      return;
    }


    setIsProcessing(true);

    try {
      // If conversation is empty, start with doctor's first question
      if (session.conversation.length === 0) {
        
        // Save initial empty state BEFORE starting (only in manual mode)
        if (conversationMode === "manual") {
          if (conversationStatesRef.current.length === 0) {
            addConversationState([], [], differentialDiagnosis);
          }
        }
        
        const context = {
          caseId: session.caseId,
          disease: session.disease,
          symptoms: medicalCase?.symptoms || [],
          patientProfile: session.patientProfile,
          conversationHistory: [],
        };

        const doctorResponse = await fetch("/api/learning/doctor-question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            currentCase: {
              chiefComplaint: medicalCase?.chiefComplaint || 'Not specified',
              symptoms: medicalCase?.symptoms || [],
              disease: medicalCase?.disease || session.disease
            },
            patientInfo: {
              name: session.patientProfile?.name || 'Patient',
              age: session.patientProfile?.age || 'Unknown',
              gender: session.patientProfile?.gender || 'Unknown'
            },
            // follow-up should include reports; initial should not
            reports: mapReportsForPrompt(getCurrentSessionPhase() === 'follow-up' ? (getReportsForPrompt() as Report[]) : []),
            conversation: getConversationForPrompt(),
            mode: getCurrentSessionPhase(), // Always pass mode
            isFollowUp: getCurrentSessionPhase() === 'follow-up', // Always pass isFollowUp
            ...(getCurrentSessionPhase() === 'follow-up' ? getShadowFollowUpApiExtras() : {}),
          }),
        });

        if (!doctorResponse.ok) {
          throw new Error("Failed to generate doctor question");
        }

        const { question } = await doctorResponse.json();

        const doctorMessage: ChatMessage = {
          id: `doctor-${Date.now()}`,
          role: "doctor",
          content: question,
          explanation: "",
          timestamp: new Date().toISOString(),
        };

        // Calculate timing for doctor question
        const doctorTextLength = question.length;
        const doctorSpeechDuration = Math.max(doctorTextLength * 50, 2000);

        
        // Start streaming the doctor question immediately
        streamText(question, "doctor", () => {
          // After streaming completes, add to conversation and start speech
          const updatedSession = {
            ...sessionRef.current,
            conversation: [doctorMessage],
          };
          onSessionUpdate(updatedSession);
          clearStreaming();
          
          // Generate doctor thought immediately after doctor question
          generateDoctorThought("Doctor asked question", [doctorMessage]).then(async (updatedThoughts) => {
            // Trigger parallel API calls after doctor question (now without doctor thought)
            // Pass the updated conversation that includes the doctor message
            const updatedDiagnosis = await handleParallelAPICalls(doctorMessage, [doctorMessage]);
            
            // Save state AFTER both doctor thought and parallel API calls complete
            if (conversationMode === "manual") {
              addConversationState([doctorMessage], updatedThoughts, updatedDiagnosis);
            }
          }).catch((err) => {
            console.error("[Shadow] Doctor thought → parallel APIs pipeline failed:", err);
          });
        }, doctorMessage.id);

        setIsPlaying(false);
        return;
      }

      const lastMessage = session.conversation[session.conversation.length - 1];

      if (lastMessage.role === "doctor") {
        // Check if conversation is paused for report generation - block new patient responses
        if (conversationPaused) {
          return;
        }

        // Use merged conversation for follow-up sessions
        const conversationForContext = getConversationForPrompt();
        const context = {
          caseId: session.caseId,
          disease: session.disease,
          symptoms: medicalCase?.symptoms || [],
          patientProfile: session.patientProfile,
          conversationHistory: conversationForContext.map((msg) => ({
            role: msg.role as "student" | "patient" | "doctor",
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        };

        setConversationStatus("patient-responding");
        const turnEpoch = captureTurnEpoch();

        const patientMessage: ChatMessage = {
          id: `patient-${Date.now()}`,
          role: "patient",
          content: "",
          timestamp: new Date().toISOString(),
        };

        // Use consistent patient ID across all API calls
        const consistentPatientId = session?.caseId || medicalCase?.id || `patient-${Date.now()}`;
        
        
        
        const { response: patientResponse, apiTime } = await makeAPICall(
          "/api/learning/patient-response",
          {
          method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          body: JSON.stringify({ 
            question: lastMessage.content, 
            context: {
              ...context,
              reports: mapReportsForPrompt(getReportsForPrompt() as Report[]),
              isFollowUp: getCurrentSessionPhase() === 'follow-up',
              previousDiagnosis: getCurrentSessionPhase() === 'follow-up' ? primaryDiagnosis : undefined,
              ...(getCurrentSessionPhase() === 'follow-up' ? getShadowFollowUpApiExtras() : {}),
            },
            mode: getCurrentSessionPhase(), // Always pass mode
            isFollowUp: getCurrentSessionPhase() === 'follow-up', // Always pass isFollowUp
            patientId: consistentPatientId
          }),
          },
          patientMessage.id,
          "Patient Response"
        );
        

        if (isConsultationEnding() || isTurnEpochStale(turnEpoch)) {
          setConversationStatus("idle");
          setIsProcessing(false);
          return;
        }

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
            ...sessionRef.current,
            conversation: [...sessionRef.current.conversation, errorMessage],
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

        // Update the message with the actual content
        patientMessage.content = patientResponseText;

        const updatedConversation = [...sessionRef.current.conversation, patientMessage];

        if (isComplete) {
          const updatedSession = {
            ...sessionRef.current,
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


        // Note: Doctor thought and differential diagnosis are now handled in parallel API calls
        
        // Start streaming the patient response immediately
        streamText(patientResponseText, "patient", () => {
          if (isConsultationEnding() || isTurnEpochStale(turnEpoch)) {
            clearStreaming();
            return;
          }
          // After streaming completes, add to conversation
          const updatedSession = {
            ...sessionRef.current,
            conversation: updatedConversation,
          };
          onSessionUpdate(updatedSession);
          clearStreaming();
          
          // Update differential diagnosis after patient response
          void updateDifferentialDiagnosis(updatedConversation)
            .then((updatedDiagnosis) => {
              if (conversationMode === "manual") {
                addConversationState(updatedConversation, doctorThoughts, updatedDiagnosis);
              }
            })
            .catch(() => undefined);
          
          // Note: Parallel API calls are only triggered after doctor questions, not patient responses
          
          // Wait for speech to complete before checking termination
          waitForSpeechCompletion(() => {
            setTimeout(() => {
              void proceedAfterPatientTurn(updatedConversation);
            }, 500);
          });
        }, patientMessage.id);
        
        // Old timeout logic removed - now handled in the callback above
      } else {
        // Last message is from patient — run termination check before any new doctor question
        pauseConversation();

        if (conversationMode === "auto") {
          const delayBeforeNextTurn = 3000;

          if (autoContinueTimeoutRef.current) {
            clearTimeout(autoContinueTimeoutRef.current);
          }

          autoContinueTimeoutRef.current = setTimeout(() => {
            autoContinueTimeoutRef.current = null;
            if (
              conversationEndingRef.current ||
              isDiagnosisReadyRef.current ||
              sessionRef.current.isComplete
            ) {
              return;
            }
            void proceedAfterPatientTurn(sessionRef.current.conversation);
          }, delayBeforeNextTurn);
        }
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


      // If audio is paused but there are items in queue, try to resume
      if (!isQueueEmpty && isAudioPaused && !isPlayingSpeechRef.current) {
        resumeAudio();
      }

      // If audio is playing but marked as paused, fix the state
      if (isPlayingSpeechRef.current && isAudioPaused) {
        setIsAudioPaused(false);
      }
      
      if (isQueueEmpty && isNotPlaying && isNotPaused) {
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
      `Differential diagnosis: ${differentialDiagnosis?.length || 0} conditions`
    );
    
    // Count symptoms mentioned
    if (medicalCase?.symptoms) {
      findings.add(`Symptoms: ${medicalCase.symptoms.length} reported`);
    }

    return findings.size;
  };


  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      
      // Ensure voices are loaded
      const loadVoices = () => {
        const voices = synth.getVoices();

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

  // Enhanced speech queue system with real-time streaming and timing
  const addToSpeechQueue = (text: string, voice: "doctor" | "patient", messageId?: string) => {
    if (!shouldAllowSpeech()) return

    const speechStartTime = performance.now();
    speechQueueRef.current.push({ 
      text, 
      voice, 
      messageId,
      speechStartTime 
    });
    processNextInQueue();
  };

  const processNextInQueue = () => {

    if (isPlayingSpeechRef.current || speechQueueRef.current.length === 0) {
      return;
    }

    // If audio is paused, try to resume it
    if (isAudioPaused) {
      resumeAudio();
      return;
    }

    // If audio is playing but marked as paused, fix the state
    if (isPlayingSpeechRef.current && isAudioPaused) {
      setIsAudioPaused(false);
    }

    const nextItem = speechQueueRef.current.shift();
    if (!nextItem || !speechSynthesis) {
      return;
    }


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
    };

    utterance.onend = () => {
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


  // Smart auto-scroll function - scrolls to bottom to show latest message
  const smartAutoScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const scrollContainer = scrollAreaRef.current;
    
    // Force scroll to bottom after a short delay to ensure DOM is updated
    setTimeout(() => {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
    
    // Also force scroll immediately (fallback for instant updates)
    requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    });
  };


  // Enhanced text streaming function with continuous speech
  const streamText = (text: string, role: string, onComplete?: () => void, messageId?: string) => {
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
          addToSpeechQueue(text, role as "doctor" | "patient", messageId); // Speak the entire text
          hasStartedSpeaking = true;
        }
        
        // Stream at different speeds based on role
        const streamDelay = role === "doctor" ? 60 : 80; // Faster streaming for real-time feel
        streamingTimeoutRef.current = setTimeout(streamNextWord, streamDelay);
      } else {
        // If we haven't started speaking yet (short message), start now
        if (!hasStartedSpeaking) {
          addToSpeechQueue(text, role as "doctor" | "patient", messageId);
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

  const getPriorDifferentialDiagnosis = (): DifferentialDiagnosisItem[] => {
    const fromRef = latestDifferentialDiagnosisRef.current.filter(
      (d) => d.category !== ("loading" as DifferentialDiagnosisItem["category"]),
    );
    if (fromRef.length > 0) return fromRef;
    return differentialDiagnosis.filter(
      (d) => d.category !== ("loading" as DifferentialDiagnosisItem["category"]),
    );
  };

  const applyDifferentialDiagnosisFailure = (): DifferentialDiagnosisItem[] => {
    const prior = getPriorDifferentialDiagnosis();
    if (prior.length > 0) {
      setDifferentialDiagnosis(prior);
      return prior;
    }
    setDifferentialDiagnosis([]);
    return [];
  };

  // Update differential diagnosis based on conversation
  const updateDifferentialDiagnosis = async (conversation: ChatMessage[]): Promise<DifferentialDiagnosisItem[]> => {
    // Check if conversation is paused for report generation
    if (conversationPaused) {
      return differentialDiagnosis;
    }

    try {
      
      // Add loading state immediately
      setDifferentialDiagnosis([{
        condition: "Analyzing...",
        probability: 0,
        reason: "Generating differential diagnosis",
        category: "loading" as any
      }]);
      
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: conversation,
        nurseReport: medicalCase?.nurseReport || null,
      };

      // Use consistent patient ID across all API calls
      const consistentPatientId = session?.caseId || medicalCase?.id || `patient-${Date.now()}`;
      

      const startTime = Date.now();
      const ddFetch = await safeClientFetch("/api/learning/differential-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        timeoutMs: 90_000,
        body: JSON.stringify({
          currentCase: {
            chiefComplaint: medicalCase?.chiefComplaint || "Not specified",
            symptoms: medicalCase?.symptoms || [],
            disease: medicalCase?.disease || session.disease,
          },
          patientInfo: {
            name: session.patientProfile?.name || "Patient",
            age: session.patientProfile?.age || "Unknown",
            gender: session.patientProfile?.gender || "Unknown",
          },
          doctorQuestion:
            conversation.filter((msg) => msg.role === "doctor").slice(-1)[0]?.content || "",
          doctorThought:
            doctorThoughts.length > 0 ? doctorThoughts[doctorThoughts.length - 1].thought : "",
          patientResponse:
            conversation.filter((msg) => msg.role === "patient").slice(-1)[0]?.content || "",
          reports: mapReportsForPrompt(
            getCurrentSessionPhase() === "follow-up" ? (getReportsForPrompt() as Report[]) : [],
          ),
          conversation: getConversationForPrompt(),
          mode: getCurrentSessionPhase(),
          isFollowUp: getCurrentSessionPhase() === "follow-up",
        }),
      });
      const responseTime = Date.now() - startTime;

      if (!ddFetch.ok) {
        console.warn(
          `⚠️ [DIFFERENTIAL DIAGNOSIS] Unavailable (${ddFetch.error}) — keeping prior list`,
        );
        return applyDifferentialDiagnosisFailure();
      }

      const response = ddFetch.response;
      if (!response.ok) {
        console.warn(
          `⚠️ [DIFFERENTIAL DIAGNOSIS] HTTP ${response.status} — keeping prior list`,
        );
        return applyDifferentialDiagnosisFailure();
      }

      const { diagnosis, degraded } = await response.json();
      if (degraded === true) {
        console.warn(
          "⚠️ [DIFFERENTIAL DIAGNOSIS] Server degraded response — keeping prior list",
        );
        return applyDifferentialDiagnosisFailure();
      }
      
      // Ensure diagnosis is an array before mapping
      if (Array.isArray(diagnosis)) {
        // Add API timing to each diagnosis item
        const diagnosisWithTiming = diagnosis.map((item: any) => ({
          ...item,
          apiTime: responseTime
        }));
        setDifferentialDiagnosis(diagnosisWithTiming);
        recordDdSnapshotForConversation(conversation, diagnosisWithTiming);
        return diagnosisWithTiming; // Return for immediate use
      } else {
        console.error("❌ [DIFFERENTIAL DIAGNOSIS] Diagnosis is not an array:", diagnosis);
        // Set a default diagnosis if the response is invalid
        setDifferentialDiagnosis([]);
        return [];
      }
    } catch (error) {
      console.error("Error updating differential diagnosis:", error);
      const prior = applyDifferentialDiagnosisFailure();
      if (prior.length > 0) return prior;
      const defaultDiagnosis: DifferentialDiagnosisItem[] = [
        {
          condition: "Primary Diagnosis",
          probability: 0,
          reason: "Most likely based on presenting symptoms and history",
          category: "primary" as const,
        },
        {
          condition: "Secondary Consideration",
          probability: 0,
          reason: "Alternative diagnosis requiring further evaluation",
          category: "secondary" as const,
        },
        {
          condition: "Rare Condition",
          probability: 0,
          reason: "Less common but important to consider",
          category: "rare" as const,
        },
        {
          condition: "Rule Out",
          probability: 0,
          reason: "Important differential requiring exclusion",
          category: "rule-out" as const,
        },
      ];
      setDifferentialDiagnosis(defaultDiagnosis);
      return defaultDiagnosis;
    }
  };

  // Continue with next doctor question generation
  const continueWithNextDoctorQuestion = async (updatedConversation: LearningConversationMessage[]) => {
    try {
      if (
        conversationEndingRef.current ||
        isDiagnosisReadyRef.current ||
        sessionRef.current.isComplete
      ) {
        return;
      }

      // Check if conversation is paused - block new doctor questions
      if (conversationPaused || isPaused) {
        return;
      }

      if (studentQuestionMode) {
        pauseConversation();
        return;
      }
      
      setConversationStatus("doctor-thinking");
      const turnEpoch = captureTurnEpoch();

      // Use merged conversation for follow-up sessions
      const conversationForContext = getConversationForPrompt();
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: conversationForContext.length > 0 ? conversationForContext : updatedConversation,
      };
      
      // Generate next doctor question
      const nextDoctorMessage: ChatMessage = {
        id: `doctor-${Date.now()}`,
        role: "doctor",
        content: "",
        explanation: "",
        timestamp: new Date().toISOString(),
      };

      const { response: nextDoctorResponse, apiTime } = await makeAPICall(
        "/api/learning/doctor-question",
        {
        method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({ 
          currentCase: {
            chiefComplaint: medicalCase?.chiefComplaint || 'Not specified',
            symptoms: medicalCase?.symptoms || [],
            disease: medicalCase?.disease || session.disease
          },
          patientInfo: {
            name: session.patientProfile?.name || 'Patient',
            age: session.patientProfile?.age || 'Unknown',
            gender: session.patientProfile?.gender || 'Unknown'
          },
          reports: mapReportsForPrompt(getCurrentSessionPhase() === 'follow-up' ? (getReportsForPrompt() as Report[]) : []),
          conversation: getConversationForPrompt(), // Use merged conversation (initial + follow-up)
          mode: getCurrentSessionPhase(), // Always pass mode
          isFollowUp: getCurrentSessionPhase() === 'follow-up', // Flag for follow-up consultation
          ...(getCurrentSessionPhase() === 'follow-up' ? getShadowFollowUpApiExtras() : {}),
        }),
        },
        nextDoctorMessage.id,
        "Doctor Question"
      );

      if (isConsultationEnding() || isTurnEpochStale(turnEpoch)) {
        setConversationStatus("idle");
        return;
      }

      if (!nextDoctorResponse.ok) {
        // Add error message to conversation
        const errorMessage: ChatMessage = {
          id: `doctor-error-${Date.now()}`,
          role: "doctor",
          content: "⚠️ Doctor could not respond. Please retry.",
          timestamp: new Date().toISOString(),
        };
        
        const errorSession = {
          ...sessionRef.current,
          conversation: [...updatedConversation, errorMessage],
        };
        onSessionUpdate(errorSession);
        setConversationStatus("idle");
        return;
      }

      const { question: nextQuestion } = await nextDoctorResponse.json();

      // Update the message with the actual content
      nextDoctorMessage.content = nextQuestion;
      nextDoctorMessage.explanation = "";

      setConversationStatus("idle");

      // Update differential diagnosis after next doctor question
      void updateDifferentialDiagnosis([...updatedConversation, nextDoctorMessage]).catch(
        () => undefined,
      );

      // Start streaming the next doctor question
      streamText(nextQuestion, "doctor", () => {
        if (isConsultationEnding() || isTurnEpochStale(turnEpoch)) {
          clearStreaming();
          return;
        }
        // After streaming completes, add to conversation
        const finalUpdatedSession = {
          ...sessionRef.current,
          conversation: [...updatedConversation, nextDoctorMessage],
        };
        onSessionUpdate(finalUpdatedSession);
        clearStreaming();

        if (isDoctorClosingStatement(nextDoctorMessage.content)) {
          activateDiagnosisReadyUi();
          if (conversationMode === "manual") {
            addConversationState(
              [...updatedConversation, nextDoctorMessage],
              doctorThoughts,
              latestDifferentialDiagnosisRef.current,
            );
          }
          return;
        }
        
        // Generate doctor thought immediately after doctor question
        generateDoctorThought("Doctor asked question", [nextDoctorMessage]).then(async (updatedThoughts) => {
          if (isConsultationEnding()) return updatedThoughts;
          // Trigger parallel API calls after doctor question (now without doctor thought)
          const updatedDiagnosis = await handleParallelAPICalls(nextDoctorMessage, [...updatedConversation, nextDoctorMessage]);
          
          // Save state AFTER both doctor thought and parallel API calls complete
          if (conversationMode === "manual") {
            addConversationState([...updatedConversation, nextDoctorMessage], updatedThoughts, updatedDiagnosis);
          }
        }).catch((err) => {
          console.error("[Shadow] Doctor thought → parallel APIs pipeline failed:", err);
        });
      }, nextDoctorMessage.id);
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
        ...sessionRef.current,
        conversation: [...updatedConversation, errorMessage],
      };
      onSessionUpdate(errorSession);
      }
  };

  // Generate SOAP Note and Prescription (triggered by Conclude button)
  const handleConcludeConversation = async () => {
    try {
      setShowConcludeButton(false);
      onSessionUpdate({
        ...sessionRef.current,
        diagnosisReady: false,
      });
      
      // Step 1: Generate SOAP Note
      setIsGeneratingSOAP(true);
      
      // Extract vitals from various possible locations
      let vitalsData = {};
      if (medicalCase?.nurseReport?.vitals && Object.keys(medicalCase.nurseReport.vitals).length > 0) {
        vitalsData = medicalCase.nurseReport.vitals;
      } else if (medicalCase?.vitals && Object.keys(medicalCase.vitals).length > 0) {
        vitalsData = medicalCase.vitals;
      } else if (medicalCase?.vitalSigns && Object.keys(medicalCase.vitalSigns).length > 0) {
        vitalsData = medicalCase.vitalSigns;
      }
      
      
      const soapResponse = await fetch('/api/learning/generate-soap-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientInfo: {
            name: medicalCase?.patientProfile?.name || 'Patient',
            age: medicalCase?.patientProfile?.age || medicalCase?.age || 'Unknown',
            gender: medicalCase?.patientProfile?.gender || medicalCase?.gender || 'Unknown',
            occupation: medicalCase?.patientProfile?.occupation || medicalCase?.occupation || 'Not specified',
            chiefComplaint: medicalCase?.chiefComplaint || medicalCase?.patientProfile?.chiefComplaint || 'Not specified',
            symptoms: medicalCase?.symptoms || medicalCase?.patientProfile?.symptoms || [],
            vitals: vitalsData,
            allergies: medicalCase?.patientProfile?.allergies || 'NKDA',
            medicalHistory: medicalCase?.patientProfile?.medicalHistory || medicalCase?.medicalHistory || 'Not specified'
          },
          conversation: getConversationForPrompt(),
          doctorThoughts: doctorThoughts,
          differentialDiagnosis: differentialDiagnosis,
          currentCase: medicalCase,
          reports: getAllReports()
        })
      });

      if (!soapResponse.ok) {
        throw new Error('Failed to generate SOAP note');
      }

      const soapData = await soapResponse.json();
      const generatedSOAP = String(soapData.soapNote ?? "").trim();

      if (!generatedSOAP) {
        throw new Error("SOAP note generation returned empty content");
      }


      soapNoteRef.current = generatedSOAP;
      setSoapNote(generatedSOAP);
      setIsGeneratingSOAP(false);

      // Step 2: Extract primary diagnosis from SOAP note
      const diagnosisMatch = generatedSOAP.match(
        /Primary diagnosis:\s*(.+?)(?:\n\n|\n-|\n\*\*|$)/i,
      );
      const extractedDiagnosis = diagnosisMatch
        ? diagnosisMatch[1].trim()
        : "Clinical diagnosis based on assessment";
      setPrimaryDiagnosis(extractedDiagnosis); // Store for follow-up session

      // Step 3: Generate Prescription
      setIsGeneratingPrescription(true);
      const prescriptionResponse = await fetch('/api/learning/generate-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientInfo: {
            name: medicalCase?.patientProfile?.name || 'Patient',
            age: medicalCase?.patientProfile?.age || medicalCase?.age || 'Unknown',
            gender: medicalCase?.patientProfile?.gender || medicalCase?.gender || 'Unknown',
            weight: medicalCase?.patientProfile?.weight || 'Not specified',
            allergies: medicalCase?.patientProfile?.allergies || 'NKDA'
          },
          soapNote: soapData.soapNote,
          diagnosis: extractedDiagnosis,
          currentCase: medicalCase,
          reports: getAllReports(),
        })
      });

      if (!prescriptionResponse.ok) {
        throw new Error('Failed to generate prescription');
      }

      const prescriptionData = await prescriptionResponse.json();
      const generatedRx = String(prescriptionData.prescription ?? "").trim();
      prescriptionRef.current = generatedRx;
      setPrescription(generatedRx);
      setIsGeneratingPrescription(false);


      // Step 4: Parse Plan section and extract test names (but don't generate reports yet)
      const testNames = soapPlanParserService.parseTestsFromPlan(generatedSOAP);
      setExtractedTestNames(testNames);

      // Open modal only once both documents exist (prevents tab layout swap with empty body)
      setViewingDocumentType(null);
      setShowSOAPModal(true);


    } catch (error) {
      console.error('❌ [CONCLUDE] Error:', error);
      setIsGeneratingSOAP(false);
      setIsGeneratingPrescription(false);
      setIsGeneratingFinalReports(false);
      setShowConcludeButton(true); // Re-show button on error
    }
  };
  
  // Generate medical test reports (triggered by button in SOAP modal)
  const handleGenerateReports = async () => {
    try {
      
      if (extractedTestNames.length === 0) {
        // Still show prescription modal
        setShowSOAPModal(false);
        setShowPrescriptionModal(true);
        return;
      }

      setIsGeneratingFinalReports(true);
      
      const reportResults = await soapReportGenerationService.generateReportsFromTests(
        extractedTestNames,
        {
          name: medicalCase?.patientProfile?.name || 'Patient',
          age: medicalCase?.patientProfile?.age || medicalCase?.age || 'Unknown',
          gender: medicalCase?.patientProfile?.gender || medicalCase?.gender || 'Unknown',
          occupation: medicalCase?.patientProfile?.occupation || medicalCase?.occupation || 'Not specified'
        },
        session.conversation,
        doctorThoughts,
        differentialDiagnosis,
        soapNote,
        medicalCase,
        (progress) => {
        }
      );

      // Convert successful reports to the Report format
      const generatedReports: Report[] = reportResults
        .filter((result) => result.success && result.report)
        .map((result) => {
          const r = result.report as Record<string, unknown>
          const structured = structuredFromApiPayload(r, result.testType)
          return {
            type: structured.type,
            summary: structured.summary,
            fullReport: structured.fullReportMarkdown,
            reportContent: structured.fullReportMarkdown,
            findings: structured.findings,
            impression: structured.impression,
            recommendations: structured.recommendations,
            structured,
            reportCategory: structured.category,
            timestamp: new Date().toISOString(),
          }
        })

      setFinalReports(generatedReports);
      setIsGeneratingFinalReports(false);
      
      
      // Close SOAP modal and show reports sequentially
      setShowSOAPModal(false);
      setIsViewingIndividualReport(false); // Sequential viewing mode
      if (generatedReports.length > 0) {
        setCurrentReportIndex(0); // Start showing first report
      }

    } catch (error) {
      console.error('❌ [GENERATE REPORTS] Error generating reports:', error);
      setIsGeneratingFinalReports(false);
      // Close modal even on error
      setShowSOAPModal(false);
    }
  };
  
  // Handle next action after SOAP modal (without generating reports - deprecated)
  const handleSOAPNext = () => {
    setShowSOAPModal(false);
    setShowPrescriptionModal(true);
  };
  
  // Handle next action after Prescription modal
  const handlePrescriptionNext = () => {
    setShowPrescriptionModal(false);
    if (finalReports.length > 0) {
      setCurrentReportIndex(0);
    }
  };
  
  // Handle next report
  const handleNextReport = () => {
    if (currentReportIndex < finalReports.length - 1) {
      setCurrentReportIndex(currentReportIndex + 1);
    } else {
      // All reports viewed, show consultation complete modal
      setCurrentReportIndex(-1);
      setShowConsultationCompleteModal(true);
    }
  };
  
  // Handle previous report
  const handlePreviousReport = () => {
    if (currentReportIndex > 0) {
      setCurrentReportIndex(currentReportIndex - 1);
    }
  };

  // Generate final AI conclusion message when conversation should terminate
  // Handle moving to follow-up consultation session
  const handleMoveToFollowUpSession = async () => {
    try {
      
      // Step 1: Preserve initial session data
      const initialData = {
        conversation: [...sessionRef.current.conversation],
        soapNote: soapNote || '',
        prescription: prescription || '',
        reports: finalReports || [],
        differentialDiagnosis: [...differentialDiagnosis],
        doctorThoughts: [...doctorThoughts],
        timestamp: new Date().toISOString()
      };
      
      
      // Count at end of initial visit (DB keeps full transcript; metadata uses this to split on resume).
      const initialMessageCount = initialData.conversation.length

      const shadowFollowUpFields = {
        shadowPhase: "follow-up" as const,
        shadowInitialMessageCount: initialMessageCount,
        shadowInitialSnapshot: initialData,
        shadowSoapNote: initialData.soapNote,
        shadowPrescription: initialData.prescription,
        diagnosisReady: false,
        isComplete: false,
        lastSyncedMessageCount: 0,
      }

      resetFollowUpConsultationUi()
      isDiagnosisReadyRef.current = false
      onSessionUpdate({
        ...sessionRef.current,
        ...shadowFollowUpFields,
      })

      // Step 2: Move to follow-up phase in store
      if (typeof moveToFollowUp === 'function') {
        moveToFollowUp(initialData);
      } else {
        // Fallback: directly set state if action not available (older store shape)
        useShadowModeStore.setState({
          sessionPhase: 'follow-up',
          initialSessionData: initialData,
        } as any);
      }
      
      // Step 3: Close the consultation complete modal
      setShowConsultationCompleteModal(false);
      
      // Step 4: Generate follow-up greeting from AI
      const greetingResponse = await fetch('/api/learning/follow-up-greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientInfo: {
            name: medicalCase?.patientProfile?.name || 'Patient',
            age: medicalCase?.patientProfile?.age || medicalCase?.age || 'Unknown',
            gender: medicalCase?.patientProfile?.gender || medicalCase?.gender || 'Unknown'
          },
          soapNote: initialData.soapNote,
          prescription: initialData.prescription,
          reports: initialData.reports,
          previousDiagnosis: primaryDiagnosis || 'Clinical assessment completed',
          daysSinceLastVisit: 7
        })
      });
      
      if (!greetingResponse.ok) {
        throw new Error('Failed to generate follow-up greeting');
      }
      
      const { greeting } = await greetingResponse.json();
      
      // Clear initial-session messages from the live thread before the follow-up greeting
      onSessionUpdate({
        ...sessionRef.current,
        ...shadowFollowUpFields,
        conversation: [],
        isFollowUp: true,
      });

      // Stream greeting first, then persist (avoids duplicate bubble + saved message)
      const greetingId = `follow-up-greeting-${Date.now()}`;
      const greetingMessage: ChatMessage = {
        id: greetingId,
        role: "doctor",
        content: greeting,
        timestamp: new Date().toISOString(),
        isFollowUp: true,
      };

      streamText(greeting, "doctor", () => {
        onSessionUpdate({
          ...sessionRef.current,
          ...shadowFollowUpFields,
          conversation: [greetingMessage],
          isFollowUp: true,
        });
        clearStreaming();

        if (conversationMode === "manual") {
          addConversationState([greetingMessage], [], []);
        }
      }, greetingId);
      
      // Step 8: Restore SOAP/Prescription from initial session data (keep them visible in follow-up)
      // These should remain available from the initial consultation
      if (initialData.soapNote) {
        soapNoteRef.current = initialData.soapNote;
        setSoapNote(initialData.soapNote);
      }
      if (initialData.prescription) {
        prescriptionRef.current = initialData.prescription;
        setPrescription(initialData.prescription);
      }
      // Keep final reports from initial session as well
      if (initialData.reports && initialData.reports.length > 0) {
        setFinalReports(initialData.reports);
      }
      setExtractedTestNames([]);
      resetFollowUpConsultationUi();
      
      // Step 9: Reset conversation controls
      setConversationStatus('idle');
      setIsProcessing(false);
      setIsPaused(false);
      setConversationPaused(false);
      
      // Step 10: Clear differential diagnosis and doctor thoughts for fresh follow-up
      setDifferentialDiagnosis([]);
      setDoctorThoughts([]);
      
      // Step 11: Reset conversation states tracking
      if (conversationStatesRef.current) {
        conversationStatesRef.current = [];
        setCurrentStateIndex(0);
      }
      
      
      // Step 13: Auto-trigger continuation after a brief delay (if in auto mode)
      if (conversationMode === 'auto') {
        setTimeout(() => {
          continueConversation();
        }, 2000); // Wait 2 seconds after greeting
      }
      
    } catch (error) {
      console.error('❌ [FOLLOW-UP] Error transitioning to follow-up:', error);
      alert('Failed to start follow-up consultation. Please try again.');
    }
  };
  
  const generateFinalDoctorConclusion = async (conversation: ChatMessage[]) => {
    if (isDiagnosisReadyRef.current) {
      setShowConcludeButton(true);
      return;
    }
    markConversationEnding();

    try {
      const isFollowUpSession = getCurrentSessionPhase() === "follow-up";

      const response = await fetch('/api/learning/doctor-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: session.caseId,
          currentCase: medicalCase,
          patientInfo: medicalCase?.patientProfile || session.patientProfile,
          conversation: isFollowUpSession ? getConversationForPrompt() : conversation,
          reports: mapReportsForPrompt(
            isFollowUpSession ? (getReportsForPrompt() as Report[]) : [],
          ),
          disease: session.disease,
          mode: getCurrentSessionPhase(),
          isFollowUp: isFollowUpSession,
          isConclusion: true,
          ...(isFollowUpSession ? getShadowFollowUpApiExtras() : {}),
          ...(isFollowUpSession
            ? {}
            : {
                instruction: `Based on the comprehensive conversation history, you have gathered sufficient clinical information to make a diagnosis. Generate a brief, professional conclusion statement indicating that you have enough information and will now formulate your assessment. The statement should:
- Acknowledge the information gathered
- Be empathetic and professional
- Indicate readiness to conclude the consultation
- Be 2-3 sentences maximum
Do NOT ask any more questions. This is a conclusion statement only.`,
              }),
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate conclusion');
      }

      const data = await response.json();
      const conclusionText = data.question || data.nextQuestion || "I believe I have gathered enough information to make a comprehensive assessment of your condition. Let me conclude our consultation.";
      

      // Add the AI-generated conclusion to conversation
      const finalDoctorMessage: ChatMessage = {
        id: `msg-final-${Date.now()}`,
        role: "doctor",
        content: conclusionText,
        timestamp: new Date().toISOString(),
      };
      
      const updatedConversation = [...conversation, finalDoctorMessage];
      

      if (isFollowUpSession) {
        onSessionUpdate({
          ...sessionRef.current,
          conversation: updatedConversation,
        });
        setConversationStatus("idle");
        return;
      }

      activateDiagnosisReadyUi({ persistSession: false });
      onSessionUpdate({
        ...sessionRef.current,
        conversation: updatedConversation,
        diagnosisReady: true,
        isComplete: false,
      });
      
      
    } catch (error) {
      console.error('❌ [FINAL CONCLUSION] Error generating conclusion:', error);
      const isFollowUpSession = getCurrentSessionPhase() === "follow-up";
      
      // Fallback to hardcoded message if API fails
      const fallbackMessage: ChatMessage = {
        id: `msg-final-${Date.now()}`,
        role: "doctor",
        content: isFollowUpSession
          ? "Thank you for coming back to review your results with me. We've covered the key findings and next steps — please reach out if anything changes before your next appointment."
          : "I believe I have gathered enough information to make a comprehensive assessment of your condition. Let me conclude our consultation.",
        timestamp: new Date().toISOString(),
      };
      
      const updatedConversation = [...conversation, fallbackMessage];

      if (isFollowUpSession) {
        onSessionUpdate({
          ...sessionRef.current,
          conversation: updatedConversation,
        });
        return;
      }
      
      activateDiagnosisReadyUi({ persistSession: false });
      onSessionUpdate({
        ...sessionRef.current,
        conversation: updatedConversation,
        diagnosisReady: true,
        isComplete: false,
      });
    }
  };

  // Check if conversation should be terminated (deduped; conclusion wins over in-flight turn APIs)
  const checkConversationTermination = async (
    conversation: ChatMessage[],
  ): Promise<boolean> => {
    if (isConsultationEnding()) return true;

    if (terminationCheckPromiseRef.current) {
      return terminationCheckPromiseRef.current;
    }

    const runCheck = async (): Promise<boolean> => {
      try {
        if (isConsultationEnding()) return true;

        const currentPhase = getCurrentSessionPhase();
        const isFollowUpSession = currentPhase === "follow-up";
        const doctorMessages = conversation.filter(
          (msg) => msg.role === "doctor",
        ).length;
        const patientMessages = conversation.filter(
          (msg) => msg.role === "patient",
        ).length;
        const exchanges = Math.min(doctorMessages, patientMessages);

        if (!isFollowUpSession && exchanges < 2) {
          return false;
        }
        if (isFollowUpSession && (conversation.length < 4 || exchanges < 2)) {
          return false;
        }

        const context = {
          caseId: session.caseId,
          disease: session.disease,
          symptoms: medicalCase?.symptoms || [],
          patientProfile: session.patientProfile,
          conversationHistory: conversation,
          nurseReport: medicalCase?.nurseReport || null,
          mode: currentPhase,
          isFollowUp: isFollowUpSession,
          ...(isFollowUpSession
            ? {
                reports: mapReportsForPrompt(getReportsForPrompt() as Report[]),
                ...getShadowFollowUpApiExtras(),
              }
            : {}),
        };

        const decision =
          await conversationTerminationService.shouldTerminateConversation(
            context,
          );

        setTerminationDecision(decision);

        if (!decision.shouldTerminate) return false;

        markConversationEnding();
        await generateFinalDoctorConclusion(conversation);
        return true;
      } catch (error) {
        console.error("Error checking conversation termination:", error);
        return false;
      }
    };

    const promise = runCheck();
    terminationCheckPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      if (terminationCheckPromiseRef.current === promise) {
        terminationCheckPromiseRef.current = null;
      }
    }
  };

  /** After a patient reply: terminate with conclusion or ask the next doctor question. */
  const proceedAfterPatientTurn = async (
    conversation: ChatMessage[],
    opts?: { forceNextDoctor?: boolean },
  ) => {
    if (isConsultationEnding()) return;

    const ended = await checkConversationTermination(conversation);
    if (ended || isConsultationEnding()) return;

    if (studentQuestionMode || conversationPaused || isPaused) {
      pauseConversation();
      return;
    }

    const askNext =
      opts?.forceNextDoctor === true || conversationMode === "auto";

    if (askNext) {
      await continueWithNextDoctorQuestion(conversation);
    } else {
      pauseConversation();
    }
  };


  // Intelligent Report Detection and Handling (legacy - for pattern matching)
  const detectAndHandleReportRecommendations = async (
    doctorThought: string,
    conversationHistory: any[]
  ) => {
    try {
      
      // Analyze doctor's thought for test recommendations
      const detectionResult = reportDetectionService.analyzeDoctorThought(doctorThought, false);
      
      
      if (detectionResult.hasRecommendations && detectionResult.detectedTests.length > 0) {
        
        // Get patient ID for duplicate checking
        const patientId = session?.caseId || medicalCase?.id || `patient-${Date.now()}`;
        
        // Check for duplicates and filter out already available tests
        const filteredTests: DetectedTest[] = [];
        const duplicateNotes: string[] = [];
        
        for (const test of detectionResult.detectedTests) {
          try {
            const duplicateCheck = await duplicateTestPreventionService.checkForDuplicate({
              testType: test.type,
              patientId,
              specificTestName: test.type
            });
            
            if (duplicateCheck.isDuplicate) {
              duplicateNotes.push(duplicateCheck.systemNote || `[SYSTEM NOTE: ${test.type} report already available in patient records.]`);
              
              // Note: System note added to duplicate prevention (no longer using context manager)
            } else {
              filteredTests.push(test);
            }
          } catch (error) {
            console.error(`❌ [DUPLICATE PREVENTION] Error checking ${test.type}:`, error);
            // If duplicate check fails, allow the test to proceed
            filteredTests.push(test);
          }
        }
        
        // Show duplicate notes if any

        
        // Only proceed if there are tests that can be generated
        if (filteredTests.length > 0) {
          
          // Store filtered detection results
          setDetectedTests(filteredTests);
          setCurrentDoctorThought(doctorThought);
          
          
          // Show smart popup for user selection
          setShowSmartReportPopup(true);
          setConversationPaused(true);
        }
      }
    } catch (error) {
      console.error("❌ [REPORT DETECTION] Error in report detection:", error);
    }
  };

  // Handle generating selected reports
  const handleGenerateSelectedReports = async (selectedTests: DetectedTest[]) => {
    if (selectedTests.length === 0) return;
    
    setIsGeneratingMultipleReports(true);
    setShowSmartReportPopup(false);
    setShowGeneratedReports(true);
    
    try {
      // Build comprehensive patient info for report generation
      const patientInfo = {
        // Basic demographics
        name: propMedicalCase?.patientProfile?.name || 'Patient',
        age: propMedicalCase?.patientProfile?.age || 45,
        gender: propMedicalCase?.patientProfile?.gender || 'Unknown',
        
        // Current presentation
        chiefComplaint: propMedicalCase?.chiefComplaint || propMedicalCase?.patientProfile?.chiefComplaint || 'Not specified',
        symptoms: propMedicalCase?.symptoms || [],
        disease: propMedicalCase?.diseaseName || propMedicalCase?.disease || 'Under investigation',
        
        // Medical history
        medicalHistory: Array.isArray(propMedicalCase?.history) 
          ? propMedicalCase.history.join(', ') 
          : (propMedicalCase?.history || 'Not specified'),
        pastMedicalHistory: propMedicalCase?.patientProfile?.pastMedicalHistory || 'Not specified',
        familyHistory: propMedicalCase?.patientProfile?.familyHistory || 'Not specified',
        socialHistory: propMedicalCase?.patientProfile?.socialHistory || 'Not specified',
        medications: propMedicalCase?.patientProfile?.medications || 'Not specified',
        allergies: propMedicalCase?.patientProfile?.allergies || 'None known',
        
        // Clinical data
        vitals: propMedicalCase?.vitalSigns || {},
        physicalExam: propMedicalCase?.physicalExam || 'Not performed',
        
        // Additional context
        occupation: propMedicalCase?.patientProfile?.occupation || 'Not specified'
      };
      
      const results = await parallelReportGenerationService.generateReports(
        selectedTests,
        patientInfo,
        session.conversation || [],
        currentDoctorThought,
        session?.caseId || propMedicalCase?.id || `patient-${Date.now()}`,
        (progress) => {
          setGenerationProgress(progress);
        }
      );
      
      // Process successful results
      const successfulReports = results
        .filter(result => result.success && result.report)
        .map(result => ({
          id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          reportType: result.testType,
          reportContent: result.report,
          patientInfo: {
            name: propMedicalCase?.patientProfile?.name || 'Patient',
            age: propMedicalCase?.patientProfile?.age || 45,
            gender: propMedicalCase?.patientProfile?.gender || 'Unknown'
          },
          timestamp: new Date().toISOString(),
          doctorThoughtContext: currentDoctorThought
        }));
      
      // Convert to shadow mode report format with new structured content
      // Calculate questionIndex - count doctor messages in conversation (conversation alternates doctor/patient)
      const currentQuestionIndex = Math.floor(session.conversation.length / 2);
      const shadowModeReports = successfulReports.map((report) => {
        const raw = report.reportContent as Record<string, unknown>
        const structured = structuredFromApiPayload(raw, report.reportType)
        return {
          type: structured.type,
          summary: structured.summary,
          fullReport: structured.fullReportMarkdown,
          reportContent: structured.fullReportMarkdown,
          findings: structured.findings,
          impression: structured.impression,
          structured,
          reportCategory: structured.category,
          timestamp: report.timestamp,
          questionIndex: currentQuestionIndex,
          conversationLength: session.conversation.length,
        }
      })

      // Add reports to cache
      shadowModeReports.forEach(report => {
        addReportToCache(report);
      });
      
      // Verify reports were added
      const allReportsAfter = getAllReports();

      // Insert report state into timeline
      addReportState(shadowModeReports, currentDoctorThought);
      
      // Report states are now automatically available through shadow mode store
      
      
    } catch (error) {
      console.error("Error generating reports:", error);
    } finally {
      setIsGeneratingMultipleReports(false);
    }
  };

  // Handle continue conversation after reports
  const handleContinueAfterReports = () => {
    setShowGeneratedReports(false);
    setConversationPaused(false);
  };

  const handleGoToDashboardAfterFollowUp = async () => {
    if (getCurrentSessionPhase() !== "follow-up") return;
    if (isFinalizingShadowCase) return;
    setIsFinalizingShadowCase(true);
    try {
      if (onFinalizeShadowCase) {
        await onFinalizeShadowCase();
      }
      setShowConsultationCompleteModal(false);
      setShowConsultationCompletedModal(false);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("[Shadow] Failed to finalize case before dashboard:", error);
      setIsFinalizingShadowCase(false);
    }
  };

  // Generate real-time doctor thoughts
  const generateDoctorThought = async (
    context: string,
    conversationHistory: any[]
  ): Promise<any[]> => {
    if (isGeneratingThought) return doctorThoughts;

    // Check if conversation is paused for report generation
    if (conversationPaused) {
      return doctorThoughts;
    }

    setIsGeneratingThought(true);
    setCurrentThought("");
    
    // Use consistent patient ID across all API calls
    const consistentPatientId = session?.caseId || medicalCase?.id || `patient-${Date.now()}`;
    
    
    try {
      const response = await fetch("/api/learning/doctor-thought", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          context, 
          conversation: getConversationForPrompt(), // Use merged conversation (initial + follow-up)
          currentCase: medicalCase,
          patientInfo: {
            age: medicalCase?.age || "Not specified",
            gender: medicalCase?.gender || "Not specified",
            name: medicalCase?.patientProfile?.name || "Patient",
            occupation: medicalCase?.occupation || "Not specified",
            },
            instruction:
              "Generate exactly 2 lines of focused clinical reasoning that synthesizes all available patient data (conversation history, patient info, reports). Be concise but comprehensive - think like a senior attending physician making a quick but thorough assessment.",
            medicalReport: medicalReport || null,
            reports: mapReportsForPrompt(getCurrentSessionPhase() === 'follow-up' ? (getReportsForPrompt() as Report[]) : []),
            mode: getCurrentSessionPhase(), // Always pass mode
            isFollowUp: getCurrentSessionPhase() === 'follow-up', // Always pass isFollowUp
            patientId: consistentPatientId
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate doctor thought");
      }

      const { thought, redFlags, fullResponse } = await response.json();
      
      
      // Add thought to history
      const newThought = {
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        thought: thought,
      };

      const updatedThoughts = [...doctorThoughts, newThought];
      setDoctorThoughts(updatedThoughts);
      setCurrentThought(thought);
      
      // Store thought with the current conversation length as key
      const conversationKey = session.conversation.length.toString();
      setHistoricalThoughts(prev => {
        const newMap = new Map(prev);
        // Store only the thoughts for this specific conversation point
        const existingThoughts = newMap.get(conversationKey) || [];
        newMap.set(conversationKey, [...existingThoughts, newThought]);
        return newMap;
      });
      
      setIsGeneratingThought(false);
      return updatedThoughts;
    } catch (error) {
      console.error("Error generating doctor thought:", error);
      setCurrentThought("Analyzing patient presentation...");
      setIsGeneratingThought(false);
      return doctorThoughts;
    }
  };

  const evaluateWithAISupervisor = async (question: string, role: "doctor" | "student") => {
    if (!aiSupervisorEnabled) return null;

    // Check if conversation is paused for report generation
    if (conversationPaused) {
      return null;
    }

    const startTime = Date.now();
    setIsEvaluating(true);
    try {
      const context = {
        disease: medicalCase?.disease || session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: medicalCase?.patientProfile || session.patientProfile,
        conversationHistory: session.conversation || [],
      };

      const response = await fetch("/api/learning/ai-supervisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          role,
          context,
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error("Failed to evaluate with AI supervisor");
      }

      const { evaluation } = await response.json();
      
      if (evaluation.shouldIntervene) {
        const speakerRole: ShadowSupervisorIntervention["role"] =
          role === "student" ? "student" : role === "patient" ? "patient" : "doctor"
        return recordSupervisorIntervention({
          role: speakerRole,
          question,
          reason: evaluation.interventionReason,
          content: evaluation.content,
        })
      }
      
      return null;
    } catch (error) {
      console.error("Error evaluating with AI supervisor:", error);
      return null;
    } finally {
      setIsEvaluating(false);
    }
  };

  // Test API connectivity (simplified - no doctor thought call)
  const testAPIConnectivity = async () => {
    try {
      // Simple connectivity test without making actual API calls
      return true; // Assume API is available
    } catch (error) {
      console.error("🔍 API Connectivity Test - Error:", error);
      return false;
    }
  };

  // Track last message that triggered API calls to prevent duplicates
  const lastAPITriggerRef = useRef<string | null>(null);
  const studentQuestionSubmitRef = useRef(false);

  // Parallel API calls after doctor question or patient response
  const handleParallelAPICalls = async (
    message: LearningConversationMessage,
    conversationHistory: LearningConversationMessage[],
  ): Promise<DifferentialDiagnosisItem[]> => {
    const startTime = Date.now();

    // Prevent duplicate API calls for the same message
    const messageKey = `${message.id ?? message.timestamp}-${message.role}`;
    if (lastAPITriggerRef.current === messageKey) {
      return differentialDiagnosis;
    }
    lastAPITriggerRef.current = messageKey;

    // Check if conversation is paused - block API calls
    if (isPaused || conversationPaused) {
      return differentialDiagnosis;
    }

    // Check network connectivity
    if (!navigator.onLine) {
      console.warn("⚠️ Network is offline - skipping API calls");
      return differentialDiagnosis;
    }

    // Test API connectivity first
    const isAPIAvailable = await testAPIConnectivity();
    if (!isAPIAvailable) {
      console.warn("⚠️ API is not available - skipping API calls");
      return differentialDiagnosis;
    }

    // Prepare context for all API calls
    const safeConversation = sanitizeConversationForApi(conversationHistory)

    const context = {
      caseId: session.caseId,
      disease: session.disease,
      symptoms: medicalCase?.symptoms || [],
      patientProfile: session.patientProfile,
      conversationHistory: safeConversation,
    };

    // Variable to capture the latest diagnosis from API
    let latestDiagnosis = differentialDiagnosis;

    // Create all API calls as promises
    const apiCalls = [];

    // 1. AI Supervisor Evaluation
    if (aiSupervisorEnabled) {
      apiCalls.push(
        (async () => {
          const startTime = Date.now();
          try {
            const response = await fetch("/api/learning/ai-supervisor", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question: message.content,
                role: message.role,
                context: {
                  disease: medicalCase?.disease || session.disease,
                  symptoms: medicalCase?.symptoms || [],
                  patientProfile: medicalCase?.patientProfile || session.patientProfile,
                  conversationHistory: safeConversation,
                },
              }),
            });
            const responseTime = Date.now() - startTime;

            if (response.ok) {
              const { evaluation } = await response.json();
              if (evaluation.shouldIntervene) {
                const speakerRole: ShadowSupervisorIntervention["role"] =
                  message.role === "student"
                    ? "student"
                    : message.role === "patient"
                      ? "patient"
                      : "doctor"
                recordSupervisorIntervention({
                  role: speakerRole,
                  question: message.content,
                  messageId: message.id,
                  reason: evaluation.interventionReason,
                  content: evaluation.content,
                })
              }
            } else {
              console.warn("AI Supervisor API returned non-ok status:", response.status);
            }
          } catch (error) {
            console.error("AI Supervisor API Error:", error);
            // Don't throw - let other API calls continue
          }
        })()
      );
    }

    // Doctor Thought is now handled separately in the main conversation flow
    // This ensures the correct sequence: doctor question -> doctor thought -> differential diagnosis -> patient response

    // 2. Differential Diagnosis Update (Optimized)
    apiCalls.push(
      (async () => {
        const startTime = Date.now();
        
        // Add loading state immediately
        setDifferentialDiagnosis([{
          condition: "Analyzing...",
          probability: 0,
          reason: "Generating differential diagnosis",
          category: "loading" as any
        }]);
        
        // Optimize: Only send recent context (last 3 exchanges)
        const recentConversation = sanitizeConversationForApi(conversationHistory.slice(-6), 8, 3500)
        const optimizedContext = {
          ...context,
          conversationHistory: recentConversation,
        }
        
        const requestBody = {
          context: optimizedContext,
          conversation: recentConversation,
          currentCase: medicalCase
            ? {
                id: medicalCase.id,
                disease: medicalCase.disease,
                chiefComplaint: medicalCase.chiefComplaint,
                symptoms: medicalCase.symptoms || [],
                specialty: (medicalCase as { specialty?: string }).specialty,
                patientProfile: medicalCase.patientProfile,
              }
            : null,
          medicalReport: null,
        }
        
        try {
          
          // Use regular API for consistency
          const response = await fetch("/api/learning/differential-diagnosis", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...requestBody,
              // Ensure follow-up sends reports; initial can omit
              reports: mapReportsForPrompt(getCurrentSessionPhase() === 'follow-up' ? (getReportsForPrompt() as Report[]) : []),
              mode: getCurrentSessionPhase(), // Always pass mode
              isFollowUp: getCurrentSessionPhase() === 'follow-up' // Always pass isFollowUp
            }),
          });

          if (!response.ok) {
            console.warn(
              `⚠️ [DIFFERENTIAL DIAGNOSIS] HTTP ${response.status} — keeping prior list`,
            );
            const prior = getPriorDifferentialDiagnosis();
            if (prior.length > 0) {
              setDifferentialDiagnosis(prior);
              latestDiagnosis = prior;
            }
            return;
          }

          const { diagnosis, degraded } = await response.json();
          const responseTime = Date.now() - startTime;

          if (degraded === true) {
            console.warn(
              "⚠️ [DIFFERENTIAL DIAGNOSIS] Degraded — keeping prior list",
            );
            const prior = getPriorDifferentialDiagnosis();
            if (prior.length > 0) {
              setDifferentialDiagnosis(prior);
              latestDiagnosis = prior;
            }
            return;
          }
                
                if (Array.isArray(diagnosis) && diagnosis.length > 0) {
                  setDifferentialDiagnosis(diagnosis);
                  latestDiagnosis = diagnosis; // Capture for immediate return
                  
                  // Store diagnosis with the current conversation length as key
                  const conversationKey = session.conversation.length.toString();
                  setHistoricalDiagnosis(prev => {
                    const newMap = new Map(prev);
                    newMap.set(conversationKey, diagnosis);
                    return newMap;
                  });
                  
                } else {
            console.error("❌ Diagnosis is not an array:", diagnosis);
            setDifferentialDiagnosis([]);
            latestDiagnosis = [];
                }
              } catch (error) {
          console.error("Differential Diagnosis API Error:", error);
          const prior = getPriorDifferentialDiagnosis();
          if (prior.length > 0) {
            setDifferentialDiagnosis(prior);
            latestDiagnosis = prior;
          } else {
            setDifferentialDiagnosis([]);
            latestDiagnosis = [];
          }
        }
      })()
    );

    // Note: Patient Response Generation is handled separately in the main conversation flow
    // This parallel API call is only for doctor questions, not patient responses

    // Execute all API calls in parallel with extended timeout for streaming
    try {
      await Promise.race([
        Promise.allSettled(apiCalls),
        new Promise<void>((resolve) => setTimeout(resolve, 60_000)),
      ]);
      
      const totalTime = Date.now() - startTime;
      
      // Return the captured diagnosis from API for immediate use
      return latestDiagnosis;
    } catch (error) {
      console.error("Error in optimized parallel API calls:", error);
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
      // Don't throw - let the conversation continue
      return latestDiagnosis;
    }
  };

  const handleStudentQuestion = async () => {
    const trimmed = studentQuestionInput.trim();
    if (!trimmed || isProcessing || studentQuestionSubmitRef.current) return;

    // Check if conversation is paused for report generation
    if (conversationPaused) {
      return;
    }

    if (isConsultationEnding()) return;

    studentQuestionSubmitRef.current = true;
    setIsProcessing(true);
    setStudentQuestionInput("");
    const turnEpoch = captureTurnEpoch();
    try {
      const conv = sessionRef.current.conversation ?? [];
      const last = conv[conv.length - 1];
      if (
        last?.role === "student" &&
        String(last.content ?? "").trim() === trimmed
      ) {
        return;
      }

      // Create student message
      const studentMessage: ChatMessage = {
        id: `student-${Date.now()}`,
        role: "student",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      // Add student message to conversation
      const updatedConversation = dedupeShadowConversationMessages([
        ...(sessionRef.current.conversation ?? []),
        studentMessage,
      ]);
      onSessionUpdate({
        ...sessionRef.current,
        conversation: updatedConversation,
      });

      // Trigger parallel API calls for student question
      const startTime = Date.now();

      const apiCalls = [];

      // 1. AI Supervisor Evaluation
      if (aiSupervisorEnabled) {
        apiCalls.push(
          (async () => {
            const startTime = Date.now();
            try {
              const response = await fetch("/api/learning/ai-supervisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  question: trimmed,
                  role: "student",
                  context: {
                    disease: medicalCase?.disease || session.disease,
                    symptoms: medicalCase?.symptoms || [],
                    patientProfile: medicalCase?.patientProfile || session.patientProfile,
                    conversationHistory: updatedConversation,
                  },
                }),
              });
              const responseTime = Date.now() - startTime;
              
              if (response.ok) {
                const { evaluation } = await response.json();
                if (evaluation.shouldIntervene) {
                  recordSupervisorIntervention({
                    role: "student",
                    question: trimmed,
                    messageId: studentMessage.id,
                    reason: evaluation.interventionReason,
                    content: evaluation.content,
                  })
                }
              }
            } catch (error) {
              console.error("AI Supervisor API Error:", error);
            }
          })()
        );
      }

      // 2. Patient Response Generation
      apiCalls.push(
        (async () => {
          const startTime = Date.now();
          try {
            const context = {
              caseId: session.caseId,
              disease: session.disease,
              symptoms: medicalCase?.symptoms || [],
              patientProfile: session.patientProfile,
              conversationHistory: updatedConversation,
            };

            // Use consistent patient ID across all API calls
            const consistentPatientId = session?.caseId || medicalCase?.id || `patient-${Date.now()}`;
            
            
            const response = await fetch("/api/learning/patient-response", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                context,
                conversation: updatedConversation,
                question: trimmed,
                patientId: consistentPatientId
              }),
            });
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
              const { response: patientText } = await response.json();
              if (isConsultationEnding() || isTurnEpochStale(turnEpoch)) {
                return;
              }
              const patientMessage: ChatMessage = {
                id: `patient-${Date.now()}`,
                role: "patient",
                content: patientText,
                timestamp: new Date().toISOString(),
              };
              
              // Update conversation with patient response (use latest session so supervisor flags are not dropped)
              const finalConversation = dedupeShadowConversationMessages([
                ...(sessionRef.current.conversation ?? updatedConversation),
                patientMessage,
              ]);
              onSessionUpdate({
                ...sessionRef.current,
                conversation: finalConversation,
              });
              
              void updateDifferentialDiagnosis(finalConversation).catch(() => undefined);
            }
          } catch (error) {
            console.error("Patient Response API Error:", error);
          }
        })()
      );

      // Execute all API calls in parallel
      try {
        await Promise.all(apiCalls);
        const totalTime = Date.now() - startTime;
      } catch (error) {
        console.error("Error in parallel API calls:", error);
      }

    } catch (error) {
      console.error("Error handling student question:", error);
    } finally {
      studentQuestionSubmitRef.current = false;
      setIsProcessing(false);
    }
  };

  // Update messages when conversation changes
  useEffect(() => {
    const dedupedConversation = dedupeShadowConversationMessages(
      session.conversation as Parameters<typeof dedupeShadowConversationMessages>[0],
    ) as ChatMessage[];
    const conversationMessages = dedupedConversation.map((msg, index) => {
      return {
        speaker: msg.role === "doctor" ? "doctor" : msg.role === "student" ? "student" : "patient",
      text: msg.content,
        time: new Date(msg.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        id: msg.id ?? `conv-${index}`,
      };
    });
    setMessages(conversationMessages);
    
    // Smart auto-scroll when new messages are added - use multiple timeouts to ensure scroll happens
    if (conversationMessages.length > 0) {
      // Immediate scroll attempt
      setTimeout(() => smartAutoScroll(), 100);
      // Second attempt after DOM fully updates
      setTimeout(() => smartAutoScroll(), 300);
      // Third attempt for longer content like interventions
      setTimeout(() => smartAutoScroll(), 500);
    }
  }, [session.conversation]);

  // Handle speech queue processing when audio is resumed
  useEffect(() => {
    if (!isAudioPaused) {
      processNextInQueue();
    }
  }, [isAudioPaused]);

  // Scroll when supervisor interventions are added (they can be long)
  useEffect(() => {
    if (supervisorInterventions.length > 0) {
      setTimeout(() => smartAutoScroll(), 200);
      setTimeout(() => smartAutoScroll(), 500);
      setTimeout(() => smartAutoScroll(), 800);
    }
  }, [supervisorInterventions.length]);

  // Scroll when streaming message completes
  useEffect(() => {
    if (streamingMessage?.isComplete) {
      setTimeout(() => smartAutoScroll(), 200);
      setTimeout(() => smartAutoScroll(), 500);
    }
  }, [streamingMessage?.isComplete]);

  // Fallback: Ensure speech happens for complete messages if streaming speech fails
  useEffect(() => {
    if (
      session.conversation.length > 0 &&
      !isPaused &&
      !streamingMessage &&
      shouldAllowSpeech()
    ) {
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
      !isDiagnosisReady &&
      !conversationEndingRef.current &&
      session.conversation.length > 0 &&
      !studentQuestionMode
    ) {
      const lastMessage = session.conversation[session.conversation.length - 1];
      
      // Auto-continue after doctor questions to generate patient response (only in auto mode)
      if (lastMessage.role === "doctor" && conversationMode === "auto" && !conversationPaused) {
        // Calculate delay based on doctor question length
        const textLength = lastMessage.content.length;
        const estimatedSpeechDuration = Math.max(textLength * 50, 2000); // 50ms per character, minimum 2 seconds
        const speechDelay = estimatedSpeechDuration + 2000; // Add 2 seconds buffer for speech completion

        
        const autoContinueTimer = setTimeout(() => {
          if (
            !isPaused &&
            !isProcessing &&
            !session.isComplete &&
            !isDiagnosisReadyRef.current &&
            !conversationEndingRef.current &&
            !conversationPaused
          ) {
            continueConversation();
          } else if (conversationPaused) {
          }
        }, speechDelay);

        return () => clearTimeout(autoContinueTimer);
      }
      
      // Note: Patient responses now handle their own next doctor question generation
      // No auto-continue needed after patient responses
    }
  }, [isPaused, isProcessing, session.isComplete, session.conversation.length, studentQuestionMode, conversationMode, conversationPaused]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      if (autoContinueTimeoutRef.current) {
        clearTimeout(autoContinueTimeoutRef.current);
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
    differentialDiagnosis?.length || 0,
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

  // Show loading state until hydration is complete
  if (!isHydrated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mainContentRef}
      className={`${isFullHeight ? 'h-screen' : 'h-full'} w-full overflow-hidden flex flex-col transition-colors duration-300 ${
      isDarkMode 
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      }`}
      role="main"
      aria-label="Enhanced Learning Interface"
    >
      {/* Header */}
      <div
        className={`border-b px-8 py-4 flex justify-between items-center transition-colors duration-300 ${
        isDarkMode 
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Left Section - Title */}
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Shadow Mode
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Supervised clinical interview simulation
          </p>
        </div>
        
        {/* Center Section - Case Information */}
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-emerald-600 dark:bg-emerald-700 text-white dark:text-gray-100 rounded-full font-semibold text-sm">
            {medicalCase.title || `Case #${medicalCase.id}`}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
            isDarkMode 
                ? "bg-slate-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {medicalCase.difficulty || "Intermediate"}
          </span>
        </div>
        
        {/* Right Section - Controls */}
        <div className="flex items-center gap-4 ml-8">
          {/* Enhanced Controls */}
          <div className="flex items-center gap-3">
            {/* Diagnosis Ready Badge */}
            {conversationStatus === "diagnosis-ready" && (
                  <button
                    onClick={() => setShowDiagnosisModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle size={14} />
                    Diagnosis Ready!
                  </button>
            )}
            
            {/* Student Question Toggle */}
            <button
              onClick={handleStudentModeToggle}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                studentQuestionMode
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              }`}
            >
              <GraduationCap size={14} />
              Student Mode
            </button>

            {/* Patient Information Button */}
            <button
              onClick={() => setShowPatientInfoModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all bg-purple-600 hover:bg-purple-700 text-white"
            >
              <User size={14} />
              Patient Info
            </button>

            {/* Reports Button */}
            {getAllReports().length > 0 && (
              <button
                onClick={() => {
                  setShowGeneratedReports(true);
                  setIsViewingIndividualReport(false); // Show all reports first
                  setCurrentReportIndex(-1); // Reset to show list
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer"
              >
                <FlaskConical size={14} />
                Reports ({getAllReports().length})
              </button>
            )}

            {/* SOAP Note Button */}
            {soapNote && (
              <button
                onClick={() => {
                  setViewingDocumentType('soap');
                  setShowSOAPModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer"
              >
                <ClipboardList size={14} />
                SOAP Note
              </button>
            )}

            {/* Prescription Button */}
            {prescription && (
              <button
                onClick={() => {
                  setViewingDocumentType('prescription');
                  setShowPrescriptionModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-pink-600 hover:bg-pink-700 text-white transition-colors cursor-pointer"
              >
                <Pill size={14} />
                Prescription
              </button>
            )}

            {/* AI Supervisor Status */}
            {isEvaluating && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating...
              </div>
            )}

            
            {/* Speaking Indicator */}
            {(isSpeaking.doctor || isSpeaking.patient) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>
                  {currentSpeaker === "doctor"
                    ? "Doctor Speaking"
                    : "Patient Speaking"}
                </span>
              </div>
            )}
   
          </div>
          {/* Professional Timer - Top Right */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors duration-300 ${
            isDarkMode 
              ? "bg-slate-900 border-slate-600 text-slate-200"
              : "bg-white border-gray-300 text-gray-800 shadow-sm"
          }`}>
            <Clock size={14} className="text-gray-500 dark:text-slate-400" />
            <span className="font-mono text-sm font-medium tracking-wider">
              {currentDuration}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/dashboard"}
              className={`${
                isDarkMode 
                  ? "text-gray-300 border-gray-600 hover:bg-slate-700"
                  : "text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            
            {/* Consultation Page Button - shows when consultation is complete */}
            {finalReports.length > 0 && !showConsultationCompleteModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowConsultationCompleteModal(true);
                }}
                className={`${
                  isDarkMode 
                    ? "text-emerald-300 border-emerald-600 hover:bg-emerald-900/20"
                    : "text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <CheckCircle size={16} className="mr-2" />
                Consultation Page
              </Button>
            )}
            
            {onEndCase && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Report states are managed by shadow mode store
                  onEndCase();
                }}
                className={`${
                  isDarkMode 
                    ? "text-red-300 border-red-600 hover:bg-red-900/20"
                    : "text-red-600 border-red-300 hover:bg-red-50"
                }`}
              >
                <X size={16} className="mr-2" />
                End Case
              </Button>
            )}
          </div>
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
            className={`p-6 border-b transition-colors duration-300 ${
            isDarkMode 
                ? "bg-slate-900 border-slate-700"
                : "bg-gray-100 border-gray-200"
            }`}
            style={{ minHeight: '200px' }}
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
                <div className="absolute top-4 left-4 px-3 py-1 bg-black bg-opacity-70 text-gray-100 text-sm rounded-full font-semibold flex items-center gap-2 z-10">
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
                <div className="relative z-0">
                  <div
                    className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    isSpeaking.doctor 
                        ? "bg-blue-600 border-blue-300 shadow-lg shadow-blue-400/50"
                        : "bg-slate-700 border-white"
                    }`}
                  >
                    <div
                      className={`text-4xl transition-all duration-300 ${
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
                <div className="absolute top-4 left-4 px-3 py-1 bg-black bg-opacity-70 text-gray-100 text-sm rounded-full font-semibold flex items-center gap-2 z-10">
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
                <div className="relative z-0">
                  <div
                    className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    isSpeaking.patient 
                        ? "bg-green-600 border-green-300 shadow-lg shadow-green-400/50"
                        : "bg-slate-700 border-white"
                    }`}
                  >
                    <div
                      className={`text-4xl transition-all duration-300 ${
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
        <div className="flex-1 flex flex-col transition-colors duration-300 bg-white dark:bg-slate-800">
            {/* Session Phase Indicator Banner */}
            {sessionPhase === 'follow-up' && activeSessionView === 'current' && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-l-4 border-emerald-500 dark:border-emerald-600 px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-emerald-500 dark:bg-emerald-600 rounded-full">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                      Follow-Up Consultation
                      <Badge className="bg-emerald-600 dark:bg-emerald-700 text-white text-xs">
                        Session 2
                      </Badge>
                    </h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Patient has returned with test results from initial visit. All previous reports are available for review.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveSessionView('initial');
                    }}
                    className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-800"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    View Initial Session
                  </Button>
                </div>
              </div>
            )}

            {/* Initial Session View Banner */}
            {sessionPhase === 'follow-up' && activeSessionView === 'initial' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 dark:border-blue-600 px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      Initial Consultation (Review Mode)
                      <Badge className="bg-blue-600 dark:bg-blue-700 text-white text-xs">
                        Session 1
                      </Badge>
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Reviewing the conversation and diagnosis from the first visit
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveSessionView('current');
                    }}
                    className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800"
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Go to Current Session
                  </Button>
                </div>
              </div>
            )}
            
            <div className="px-6 py-3 border-b flex justify-between items-center transition-colors duration-300 border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <MessageCircle size={20} />
                {sessionPhase === 'follow-up' ? 'Follow-Up Conversation' : 'Live Conversation'}
                {sessionPhase === 'initial' && (
                  <Badge variant="secondary" className="text-xs">
                    Initial Consultation
                  </Badge>
                )}
              </h2>
              {session.conversation.length === 0 && !simulationEverStarted ? (
                sessionPhase === 'follow-up' && activeSessionView === 'initial' ? (
                  <Button
                    onClick={startInitialPlayback}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white dark:text-gray-100 text-sm py-1.5 px-3 h-auto"
                  >
                    <Play size={14} className="mr-1.5" />
                    Replay
                  </Button>
                ) : (
                  <Button
                    onClick={startConversation}
                    disabled={isProcessing}
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white dark:text-gray-100 text-sm py-1.5 px-3 h-auto"
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
                )
              ) : session.isComplete && !isPlaybackMode ? (
                <div className="flex items-center gap-2">
                  {sessionPhase === 'follow-up' && activeSessionView === 'initial' ? (
                    <Button
                      onClick={startInitialPlayback}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white dark:text-gray-100 text-sm py-1.5 px-3 h-auto"
                    >
                      <Play size={14} className="mr-1.5" />
                      Replay
                    </Button>
                  ) : (
                    <Button
                      onClick={startPlayback}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white dark:text-gray-100 text-sm py-1.5 px-3 h-auto"
                    >
                      <Play size={14} className="mr-1.5" />
                      Replay
                    </Button>
                  )}
                  
                </div>
              ) : isPlaybackMode ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={goToPrevious}
                    disabled={currentPlaybackIndex === 0}
                    aria-label="Go to previous conversation"
                    className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-1.5 px-2 h-auto"
                  >
                    <ChevronRight size={14} className="mr-1 rotate-180" />
                    Back
                  </Button>
                  <Button
                    onClick={toggleAutoPlay}
                    className={`text-sm py-1.5 px-2 h-auto ${
                      isAutoPlaying 
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isAutoPlaying ? (
                      <>
                        <Pause size={14} className="mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={14} className="mr-1" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={goToNext}
                    disabled={currentPlaybackIndex === conversationHistory.length - 1}
                    aria-label="Go to next conversation"
                    className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-1.5 px-2 h-auto"
                  >
                    Next
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                  <Button
                    onClick={stopPlayback}
                    className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-1.5 px-2 h-auto"
                  >
                    <X size={14} className="mr-1" />
                    Exit
                  </Button>
                  <div className="text-xs text-gray-500">
                    {currentPlaybackIndex + 1} / {conversationHistory.length}
                  </div>
                </div>
              ) : !session.isComplete ? (
                <div className="flex items-center gap-2">
                  {/* Status Indicators */}
                  {conversationStatus === "doctor-thinking" && (
                    <Badge className="bg-blue-600 dark:bg-blue-700 text-white dark:text-gray-100">
                      Doctor Thinking...
                    </Badge>
                  )}
                  {conversationStatus === "patient-responding" && (
                    <Badge className="bg-green-600 dark:bg-green-700 text-white dark:text-gray-100">
                      Patient Responding...
                    </Badge>
                  )}
                  {conversationStatus === "paused" && (
                    <Badge className="bg-amber-600 dark:bg-amber-700 text-white dark:text-gray-100">
                      Paused
                    </Badge>
                  )}
                  
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400 mr-2"></div>
                      <span className="text-emerald-400">Processing...</span>
                    </>
                  ) : conversationMode === "manual" ? (
                    <div className="flex items-center gap-2">
                      {/* Back Button */}
                      <button
                        onClick={handleBackState}
                        disabled={
                          currentStateIndex <= (simulationEverStarted ? 1 : 0) ||
                          isProcessing
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
                        title={`Back to previous state (${currentStateIndex} of ${conversationStates.length})`}
                      >
                        <ChevronLeft className="w-3 h-3" />
                        Back
                      </button>
                      
                      {/* Continue Button */}
                      <button
                        onClick={handleContinueConversation}
                        disabled={
                          isProcessing ||
                          (sessionPhase !== "follow-up" &&
                            (isDiagnosisReady || showConcludeButton))
                        }
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                        </>
                      ) : (
                            <>
                              <PlayCircle className="w-3 h-3" />
                              Continue
                            </>
                          )}
                      </button>
                      
                      {/* Next Button */}
                      <button
                        onClick={handleNextState}
                        disabled={currentStateIndex >= conversationStates.length - 1 || isProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
                        title={`Next state (${currentStateIndex + 2} of ${conversationStates.length})`}
                      >
                        Next
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      
                      {/* State indicator */}
                      {conversationStates.length > 0 && (
                        <div className="text-xs text-gray-400 ml-1">
                          {currentStateIndex + 1} / {conversationStates.length}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white">
                        Auto-Continuing
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <Badge className="bg-green-600 text-white">Complete</Badge>
              )}
            </div>
            <div 
              ref={scrollAreaRef}
              className="h-[calc(70vh-120px)] overflow-y-auto px-6 py-4 pb-8 space-y-3 scroll-smooth conversation-scroll"
            >
              {(() => {
                const initialData = getInitialSessionData();
                const showingInitial = sessionPhase === 'follow-up' && activeSessionView === 'initial' && initialData;
                const convList = isPlaybackMode 
                  ? conversationHistory.slice(0, currentPlaybackIndex + 1)
                  : (showingInitial ? initialData!.conversation : messages);
                if (convList.length === 0) {
                return (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle
                    size={48}
                    className="mx-auto mb-4 opacity-50"
                  />
                  {simulationEverStarted ? (
                    <p>Use <strong>Next</strong> to return to your saved conversation.</p>
                  ) : (
                    <p>Click &quot;Start Simulation&quot; to begin the conversation</p>
                  )}
                </div>
                );
                }
                return (<>
                  {convList.map((msg: any, idx: number) => {
                    // Normalize message to display format
                    let displayMsg: any;
                    const raw = msg as any;
                    if (isPlaybackMode) {
                      displayMsg = {
                        speaker: raw.role === "doctor" ? "doctor" : raw.role === "patient" ? "patient" : "student",
                        text: raw.content,
                        time: new Date(raw.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
                        id: raw.id,
                      };
                    } else {
                      // If already in display shape, keep as is; otherwise map from ChatMessage
                      if (raw && typeof raw === 'object' && 'speaker' in raw && 'text' in raw) {
                        displayMsg = raw;
                      } else {
                        displayMsg = {
                          speaker: raw.role === "doctor" ? "doctor" : raw.role === "patient" ? "patient" : "student",
                          text: raw.content,
                          time: new Date(raw.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
                          id: raw.id,
                        };
                      }
                    }
                    
                    // Check if there's an intervention for this message
                    const intervention = findInterventionForMessage(
                      supervisorInterventions,
                      {
                        id: (displayMsg as any).id,
                        content: (displayMsg as any).text,
                      },
                      (displayMsg as any).speaker,
                    );

                    return (
                      <div key={idx} className="space-y-2">
                        <div
                          className={`flex gap-3 ${
                            (displayMsg as any).speaker === "patient"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] ${
                              (displayMsg as any).speaker === "patient" ? "order-2" : ""
                            }`}
                          >
                            <div
                              className={`rounded-lg px-4 py-2 transition-all duration-300 ${
                                (displayMsg as any).speaker === "doctor"
                                  ? "bg-blue-600 dark:bg-blue-700 text-white dark:text-gray-100"
                                  : (displayMsg as any).speaker === "student"
                                  ? "bg-purple-600 dark:bg-purple-700 text-white dark:text-gray-100"
                                  : "bg-green-600 dark:bg-green-700 text-white dark:text-gray-100"
                              } ${
                                ((displayMsg as any).speaker === "doctor" && isSpeaking.doctor) ||
                                ((displayMsg as any).speaker === "patient" && isSpeaking.patient)
                                  ? "ring-2 ring-opacity-50 animate-pulse"
                                  : ""
                              }`}
                            >
                        <div className="font-semibold text-xs mb-1 opacity-90 flex items-center gap-2">
                                {(displayMsg as any).speaker === "doctor"
                                  ? "AI Doctor"
                                  : (displayMsg as any).speaker === "student"
                                  ? "Student"
                                  : "AI Patient"}
                                {(((displayMsg as any).speaker === "doctor" && isSpeaking.doctor) ||
                                  ((displayMsg as any).speaker === "patient" &&
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
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {formatClinicalText((displayMsg as any).text)}
                          </p>
                        </div>
                            
                            {/* Doctor Question Explanation Button */}
                            {(displayMsg as any).speaker === "doctor" && (
                              <div className="mt-2 px-2">
                                <button
                                  onClick={() => fetchQuestionExplanation((displayMsg as any).id, (displayMsg as any).text)}
                                  disabled={loadingExplanations.has((displayMsg as any).id)}
                                  className={`
                                    text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 
                                    flex items-center gap-1.5 shadow-sm border
                                    ${loadingExplanations.has((displayMsg as any).id) 
                                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' 
                                      : questionExplanations.has((displayMsg as any).id)
                                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                      : 'bg-gray-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                                    }
                                  `}
                                >
                                  {loadingExplanations.has((displayMsg as any).id) ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                      <span>Loading explanation...</span>
                                    </>
                                  ) : questionExplanations.has((displayMsg as any).id) ? (
                                    <>
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      <span>Explanation loaded</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>Why did doctor ask this?</span>
                                    </>
                                  )}
                                </button>
                                
                                {/* Show explanation if available */}
                                {questionExplanations.has((displayMsg as any).id) && (
                                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                                    <strong>Why this question:</strong> {questionExplanations.get((displayMsg as any).id)}
                      </div>
                                )}
                    </div>
                            )}
                            
                            <span className="text-xs text-gray-500 mt-1 block px-2">
                              {(displayMsg as any).time}
                            </span>
                      </div>
                    </div>
                        
                        {/* AI Supervisor Intervention */}
                        {intervention && (
                          <div className="ml-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded-r-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Shield className="w-4 h-4 text-red-500" />
                              <span className="font-medium text-sm text-red-700 dark:text-red-300">
                                AI Supervisor Intervention
                              </span>
                              <span className="text-xs text-red-600 dark:text-red-400">
                                {new Date(intervention.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                              <strong>Issue:</strong> {formatClinicalText(intervention.reason)}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">
                              <strong>Recommendation:</strong>{" "}
                              {formatClinicalText(intervention.content)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Streaming message — hide when same as last saved line (e.g. follow-up greeting) */}
                  {streamingMessage &&
                    !(
                      convList.length > 0 &&
                      (() => {
                        const last = convList[convList.length - 1] as {
                          role?: string;
                          content?: string;
                          speaker?: string;
                          text?: string;
                        };
                        const lastRole = last.role ?? last.speaker;
                        const lastText = String(
                          last.content ?? last.text ?? "",
                        ).trim();
                        return (
                          streamingMessage.role === lastRole &&
                          streamingMessage.content.trim() === lastText
                        );
                      })()
                    ) && (
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
                              ? "bg-blue-600 dark:bg-blue-700 text-white dark:text-gray-100"
                              : "bg-green-600 dark:bg-green-700 text-white dark:text-gray-100"
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
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {formatClinicalText(streamingMessage.content)}
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
                </>);
              })()}
            </div>
            
          </div>
        </div>

        {/* Middle Column - Doctor's Thoughts & Student Input */}
          <div className="w-[30%] lg:w-[30%] md:w-[35%] sm:w-[40%] flex flex-col transition-colors duration-300 bg-gray-50 dark:bg-slate-850">
          {/* Doctor's Thought Process */}
          <div
            className={`h-[300px] border-r flex flex-col transition-colors duration-300 ${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`px-4 py-3 border-b transition-colors duration-300 ${
                isDarkMode ? "border-slate-700" : "border-gray-200"
              }`}
            >
              <h2
                  className={`text-lg font-bold flex items-center gap-2 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                <Brain size={20} className="text-purple-400" />
                Doctor's Thought Process
              </h2>
            </div>
            <div 
              ref={thoughtsScrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth doctor-thoughts-scroll"
            >
              {(isPlaybackMode ? 
                // During replay, show thoughts that were generated up to the current conversation point
                (() => {
                  // Get all thoughts that were generated up to the current conversation point
                  const allThoughts = [];
                  for (let i = 1; i <= currentPlaybackIndex + 1; i++) {
                    const thoughtsForPoint = historicalThoughts.get(i.toString()) || [];
                    allThoughts.push(...thoughtsForPoint);
                  }
                  
                  // If no historical thoughts, show all current thoughts as fallback
                  if (allThoughts.length === 0) {
                    const initialData = getInitialSessionData();
                    return (sessionPhase === 'follow-up' && activeSessionView === 'initial' && initialData)
                      ? (initialData.doctorThoughts || [])
                      : doctorThoughts;
                  }
                  
                  return allThoughts;
                })() : 
                // Normal mode - show all thoughts (or initial if viewing initial)
                (() => {
                  const initialData = getInitialSessionData();
                  return (sessionPhase === 'follow-up' && activeSessionView === 'initial' && initialData)
                    ? (initialData.doctorThoughts || [])
                    : doctorThoughts;
                })()
              ).map((thought: any, idx: number) => (
                <div
                  key={idx}
                  className={`border-l-4 border-purple-500 p-4 rounded-r-lg transition-colors duration-300 ${
                  isDarkMode 
                      ? "bg-purple-900 bg-opacity-30"
                      : "bg-purple-50 border-purple-300"
                  } ${(thought as any).loading ? 'animate-pulse' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-purple-400 font-semibold">
                      {thought.time}
                    </span>
                    {(thought as any).loading && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400"></div>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {thought.thought}
                  </p>
                </div>
              ))}

            </div>
          </div>

          {/* AI Supervisor Panel */}
          <div
            className={`flex-1 border-r flex flex-col transition-colors duration-300 ${
                  isDarkMode 
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`px-4 py-3 border-b transition-colors duration-300 ${
                isDarkMode ? "border-slate-700" : "border-gray-200"
              }`}
            >
              <h2
                  className={`text-lg font-bold flex items-center gap-2 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                <Shield size={20} className="text-green-400" />
                AI Supervisor
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    aiSupervisorEnabled
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {aiSupervisorEnabled ? "Active" : "Inactive"}
                </span>
              </h2>
            </div>
            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
                  <div className="flex justify-between items-center mb-2">
                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Interventions: {supervisorInterventions.length}
                </span>
              <button
                  onClick={() => setAiSupervisorEnabled(!aiSupervisorEnabled)}
                  className={`px-2 py-1 text-xs rounded ${
                    aiSupervisorEnabled
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {aiSupervisorEnabled ? "Disable" : "Enable"}
              </button>
                        </div>
              
              {studentQuestionMode && (
                <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <GraduationCap className="w-3 h-3 text-purple-500" />
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      Student Mode Active
                    </span>
                  </div>
                  <p className="text-purple-600 dark:text-purple-400 mb-2">
                    Students can ask questions directly to the patient
                  </p>
                  
                  {/* Student Question Input */}
                  <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                        value={studentQuestionInput}
                        onChange={(e) => setStudentQuestionInput(e.target.value)}
                        placeholder="Ask the patient a question..."
                        className="flex-1 px-2 py-1 text-xs border border-purple-200 dark:border-purple-700 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && !isProcessing) {
                            e.preventDefault();
                            void handleStudentQuestion();
                          }
                        }}
                        disabled={isProcessing}
              />
              <button
                        onClick={handleStudentQuestion}
                        disabled={!studentQuestionInput.trim() || isProcessing}
                        className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                {isProcessing ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                          <Send className="w-3 h-3" />
                )}
              </button>
            </div>
                  </div>
                </div>
              )}
              
              {!studentQuestionMode && !session.isComplete && !isDiagnosisReady && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <Stethoscope className="w-3 h-3 text-blue-500" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      AI Doctor Active
                    </span>
                  </div>
                  <p className="text-blue-600 dark:text-blue-400">
                    AI doctor will continue the conversation automatically
                  </p>
                </div>
              )}

              
              {supervisorInterventions.length > 0 && (
                <div className="space-y-2">
                  {supervisorInterventions.slice(-3).map((intervention, index) => (
                    <div
                      key={intervention.id}
                      className={`p-2 rounded text-xs ${
                isDarkMode 
                          ? "bg-red-900/20 border border-red-800"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span className="font-medium text-red-700 dark:text-red-300">
                          {intervention.role}
                        </span>
                      </div>
                      <p className="text-red-600 dark:text-red-400 break-words">
                        {intervention.reason}
                  </p>
                </div>
                  ))}
              </div>
            )}
              
              {supervisorInterventions.length === 0 && (
                <p className={`text-sm text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No interventions yet
                </p>
            )}
          </div>
          </div>

        </div>

        {/* Right Column - Differential Diagnosis */}
        <div
          className="w-[40%] lg:w-[40%] md:w-[35%] sm:w-[60%] flex flex-col transition-colors duration-300 bg-white dark:bg-slate-800"
          style={{ maxWidth: '500px' }}
        >
          <div className="px-6 py-4 border-b transition-colors duration-300 border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Differential Diagnosis
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">
            {/* Differential Diagnosis */}
            <div
              className={`border rounded-lg p-4 transition-colors duration-300 ${
              isDarkMode 
                  ? "bg-slate-700 border-slate-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <h3
                className={`font-semibold text-sm mb-3 flex items-center justify-between ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <span>Differential Diagnosis</span>
              </h3>
              <div className="space-y-3">
                {(isPlaybackMode ? 
                  // During replay, show diagnosis that was generated up to the current conversation point
                  (() => {
                    // Get the latest diagnosis that was generated up to the current conversation point
                    let latestDiagnosis = [];
                    for (let i = 1; i <= currentPlaybackIndex + 1; i++) {
                      const diagnosisForPoint = historicalDiagnosis.get(i.toString()) || [];
                      if (diagnosisForPoint.length > 0) {
                        latestDiagnosis = diagnosisForPoint;
                      }
                    }
                    
                    // If no historical diagnosis, show current diagnosis as fallback
                    if (latestDiagnosis.length === 0) {
                      const initialData = getInitialSessionData();
                      return (sessionPhase === 'follow-up' && activeSessionView === 'initial' && initialData)
                        ? (initialData.differentialDiagnosis || [])
                        : (differentialDiagnosis || []);
                    }
                    
                    return latestDiagnosis;
                  })() :
                  // Normal mode - show current diagnosis (or initial)
                  (() => {
                    const initialData = getInitialSessionData();
                    return (sessionPhase === 'follow-up' && activeSessionView === 'initial' && initialData)
                      ? (initialData.differentialDiagnosis || [])
                      : (differentialDiagnosis || []);
                  })()
                ).length > 0 ? (
                  (isPlaybackMode ? 
                    // During replay, show diagnosis that was generated up to the current conversation point
                    (() => {
                      // Get the latest diagnosis that was generated up to the current conversation point
                      let latestDiagnosis = [];
                      for (let i = 1; i <= currentPlaybackIndex + 1; i++) {
                        const diagnosisForPoint = historicalDiagnosis.get(i.toString()) || [];
                        if (diagnosisForPoint.length > 0) {
                          latestDiagnosis = diagnosisForPoint;
                        }
                      }
                      
                      // If no historical diagnosis, show current diagnosis as fallback
                      if (latestDiagnosis.length === 0) {
                        const initialData = getInitialSessionData();
                        return (sessionPhase === 'follow-up' && activeSessionView === 'initial' && initialData)
                          ? (initialData.differentialDiagnosis || [])
                          : (differentialDiagnosis || []);
                      }
                      
                      return latestDiagnosis;
                    })() :
                    (() => {
                      const initialData = getInitialSessionData();
                      return (sessionPhase === 'follow-up' && activeSessionView === 'initial' && initialData)
                        ? (initialData.differentialDiagnosis || [])
                        : (differentialDiagnosis || []);
                    })()
                  ).map((diagnosis: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 transition-colors duration-300 ${
                    isDarkMode 
                        ? "bg-slate-600 border-slate-500"
                        : "bg-white border-gray-300"
                    } ${(diagnosis.category as any) === 'loading' ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-semibold text-xs ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {diagnosis.condition}
                        </h4>
                        {(diagnosis.category as any) === 'loading' && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-400"></div>
                        )}
                    </div>
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
                  ))
                ) : (
                  <div className={`text-center py-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <p className="text-sm">No differential diagnosis available yet</p>
                    <p className="text-xs mt-1">Continue the conversation to generate diagnosis</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Screen Reader Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Patient Information Modal */}
      {showPatientInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPatientInfoModal(false)}
          />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Patient Information</h2>
                    <p className="text-purple-100">
                      Complete patient details and clinical data
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPatientInfoModal(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Demographics */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Demographics
            </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {medicalCase.patientProfile?.name || "Patient"}
                </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Age:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {medicalCase.patientProfile?.age || "Unknown"} years
                </span>
              </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {medicalCase.patientProfile?.gender || "Unknown"}
                </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Occupation:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {medicalCase.patientProfile?.occupation || "Unknown"}
                </span>
              </div>
            </div>
              </div>

              {/* Chief Complaint */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chief Complaint
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {nurseReportData?.chiefComplaint || 
                   medicalCase.symptoms?.[0] ||
                   "Patient presents with symptoms requiring evaluation"}
                </p>
              </div>

              {/* Symptoms */}
              {medicalCase.symptoms && medicalCase.symptoms.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Symptoms
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicalCase.symptoms.map((symptom: string, index: number) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-orange-500 text-xs">•</span>
                        <span>{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Vitals */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Vitals
                  </h3>
            </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {(() => {
                    const vitals = nurseReportData?.vitalSigns || medicalCase.vitalSigns;
                    return (
                      <>
                        {vitals?.bloodPressure && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">BP:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {vitals.bloodPressure}
                            </span>
          </div>
                        )}
                        {vitals?.heartRate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">HR:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {vitals.heartRate} bpm
                            </span>
        </div>
                        )}
                        {vitals?.temperature && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Temp:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {vitals.temperature}
                            </span>
      </div>
                        )}
                        {vitals?.respiratoryRate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">RR:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {vitals.respiratoryRate} /min
                            </span>
                          </div>
                        )}
                        {vitals?.oxygenSaturation && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">SpO₂:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {vitals.oxygenSaturation}%
                            </span>
                          </div>
                        )}
                        {!vitals && (
                          <div className="col-span-2 text-center py-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {isLoadingNurseReport ? "Loading vitals..." : "Vitals not available"}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Generated Reports Section */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Generated Reports
                  </h3>
                </div>
                <div className="space-y-3">
                  {(() => {
                    // Get reports from shadow mode store
                    const reports = getAllReports();
                    
                    if (reports.length === 0) {
                      return (
                        <div className="text-center py-4">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No reports generated yet</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Generate your first report to get started</p>
                        </div>
                      );
                    }
                    
                    return reports.map((report: any, index: number) => (
                      <div
                        key={report.id || `${report.type}-${index}`}
                        className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {report.type} Report
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(report.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <p className="line-clamp-2">
                            {report.summary ? (
                              <>
                                <strong>Summary:</strong> {report.summary}...
                              </>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  {differentialDiagnosis?.map((diagnosis, index) => (
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
                    // Navigate to dashboard
                    window.location.href = "/dashboard";
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Complete Case
                </button>
                <button
                  onClick={() => {
                    
                    // Exit replay mode if active (to return to normal learning interface)
                    if (isReplayMode) {
                      exitReplayMode();
                    }
                    
                    // Simply close the diagnosis modal and stay in the learning interface
                    setShowDiagnosisModal(false);
                    
                  }}
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

      {/* Ask Doctor Popup Modal */}
      {showAskDoctorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ask Doctor a Question
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get educational insights from the AI doctor
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAskDoctorPopup}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Question Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Question
                </label>
                <textarea
                  value={askDoctorQuestion}
                  onChange={(e) => setAskDoctorQuestion(e.target.value)}
                  placeholder="Ask the AI doctor about this case, medical concepts, or clinical reasoning..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm transition-colors bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={4}
                  disabled={isProcessing}
                />
              </div>

              {/* Response Display */}
              {askDoctorResponse && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      Doctor's Response:
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">{children}</h3>,
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">{children}</blockquote>,
                      }}
                    >
                      {askDoctorResponse}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={handleCloseAskDoctorPopup}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAskDoctorSubmit}
                disabled={!askDoctorQuestion.trim() || isProcessing}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Asking...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Ask Doctor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Type Selection Modal */}
      <ReportTypeSelectionModal
        isOpen={showReportTypeSelection}
        onClose={() => {
          setShowReportTypeSelection(false);
          // Resume conversation if user closes without selecting
          setConversationPaused(false);
        }}
        onSelectReportType={handleReportTypeSelected}
        isGenerating={isGeneratingReport}
      />

      {/* Report Management Modal */}
      <ReportManagementModal
        isOpen={showReportManagement}
        onClose={() => {
          setShowReportManagement(false);
          // Resume conversation if user closes without generating
          setConversationPaused(false);
        }}
        onGenerateNew={handleGenerateNewReport}
        medicalReport={medicalReport}
        isGeneratingReport={isGeneratingReport}
        patientInfo={session?.patientProfile}
        caseId={session?.caseId}
      />

      {/* Medical Report Modal */}
      <MedicalReportModal
        isOpen={showMedicalReportModal}
        onClose={() => setShowMedicalReportModal(false)}
        report={medicalReport}
        onResumeConversation={resumeConversation}
        reportType={selectedReportType}
      />


      {/* Smart Report Popup - Only render when needed */}
      {showSmartReportPopup && (
        <SmartReportPopup
          isOpen={showSmartReportPopup}
          onClose={() => {
            setShowSmartReportPopup(false);
            setConversationPaused(false);
          }}
          onGenerateReports={handleGenerateSelectedReports}
          detectedTests={detectedTests}
          isGenerating={isGeneratingMultipleReports}
          doctorThought={currentDoctorThought}
        />
      )}

      {/* Generated Reports Display */}
      {showGeneratedReports && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-100" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Generated Reports
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Based on doctor's clinical recommendations
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGeneratedReports(false)}
                  className="w-8 h-8 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <AnimatedReportCards
                reports={(getAllReports() as Report[]).map((report: Report) => ({
                  id: report.type + '-' + report.timestamp,
                  reportType: report.type,
                  structured: report.structured,
                  reportContent: {
                    reportContent: report.reportContent || report.fullReport,
                    type: report.type,
                    summary: report.summary,
                    fullReport: report.fullReport,
                    timestamp: report.timestamp,
                    structured: report.structured,
                  },
                  patientInfo: session?.patientProfile || { name: 'Unknown', age: 'Unknown', gender: 'Unknown' },
                  timestamp: report.timestamp
                }))}
                onContinueConversation={handleContinueAfterReports}
                onReportClick={(reportIndex) => {
                  // Find the report in finalReports array
                  const allReports = getAllReports() as Report[];
                  const clickedReport = allReports[reportIndex];
                  const finalReportIndex = finalReports.findIndex(r => 
                    r.type === clickedReport.type && r.timestamp === clickedReport.timestamp
                  );
                  
                  if (finalReportIndex >= 0) {
                    setCurrentReportIndex(finalReportIndex);
                    setIsViewingIndividualReport(true);
                    setShowGeneratedReports(false); // Close the reports modal
                  }
                }}
                isGenerating={isGeneratingMultipleReports}
                generationProgress={generationProgress}
              />
            </div>
          </div>
        </div>
      )}

      {/* Conclude Button (initial session only — follow-up uses Complete Consultation) */}
      {showConcludeButton && sessionPhase !== "follow-up" && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            <Button
              onClick={handleConcludeConversation}
              disabled={isGeneratingSOAP || isGeneratingPrescription || isGeneratingFinalReports}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-6 rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-3 text-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Conclude Consultation
            </Button>
          </motion.div>
        </div>
      )}

      {/* Complete Consultation Button (for follow-up sessions with no tests suggested) */}
      {getCurrentSessionPhase() === 'follow-up' && 
       soapNote && 
       prescription && 
       extractedTestNames.length === 0 && 
       finalReports.length === 0 && 
       !showConsultationCompletedModal && 
       !showSOAPModal && 
       !showPrescriptionModal && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            <Button
              onClick={() => {
                setShowConsultationCompletedModal(true);
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-6 rounded-xl shadow-2xl hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-3 text-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Complete Consultation
            </Button>
          </motion.div>
        </div>
      )}

      {/* Loading Overlay for Documentation Generation */}
      <AnimatePresence>
        {(isGeneratingSOAP || isGeneratingPrescription) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 rounded-full animate-pulse"></div>
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isGeneratingSOAP && !isGeneratingPrescription && "Generating SOAP Note..."}
                    {isGeneratingPrescription && !isGeneratingSOAP && "Generating Prescription..."}
                    {isGeneratingSOAP && isGeneratingPrescription && "Generating Clinical Documentation..."}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please wait while AI creates your clinical documentation
                  </p>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ width: "0%" }}
                    animate={{ width: isGeneratingSOAP && !isGeneratingPrescription ? "50%" : "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    {isGeneratingSOAP ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    <span>SOAP Note</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGeneratingPrescription ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    ) : !isGeneratingSOAP ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    <span>Prescription</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOAP Note Modal */}
      {showSOAPModal && (soapNoteRef.current || soapNote) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">
                    {viewingDocumentType === 'soap' ? 'SOAP Note' : 'Clinical Documentation'}
                  </h2>
                  <p className="text-purple-100 text-sm">
                    {viewingDocumentType === 'soap' ? 'Clinical Documentation' : 'SOAP Note & Prescription'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Show tabs only when both SOAP Note and Prescription are available and not viewing from completion */}
            {prescription && viewingDocumentType !== 'soap' ? (
              <Tabs defaultValue="soap" className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <TabsList className="w-full shrink-0 grid grid-cols-2 rounded-none border-b">
                  <TabsTrigger value="soap" className="gap-2">
                    <ClipboardList className="w-4 h-4" />
                    SOAP Note
                  </TabsTrigger>
                  <TabsTrigger value="prescription" className="gap-2">
                    <Pill className="w-4 h-4" />
                    Prescription
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent
                  value="soap"
                  className="mt-0 min-h-[min(58vh,calc(90vh-13rem))] flex-1 overflow-y-auto p-6 focus-visible:outline-none data-[state=inactive]:hidden"
                >
                  <ClinicalMarkdown>{soapNoteRef.current || soapNote}</ClinicalMarkdown>
                </TabsContent>
                <TabsContent
                  value="prescription"
                  className="mt-0 min-h-[min(58vh,calc(90vh-13rem))] flex-1 overflow-y-auto p-6 focus-visible:outline-none data-[state=inactive]:hidden"
                >
                  <ClinicalMarkdown>{prescriptionRef.current || prescription}</ClinicalMarkdown>
                </TabsContent>
              </Tabs>
            ) : (
              /* Show only SOAP Note content when opened later */
              <div className="min-h-[min(58vh,calc(90vh-10rem))] flex-1 overflow-y-auto p-6">
                <ClinicalMarkdown>{soapNoteRef.current || soapNote}</ClinicalMarkdown>
              </div>
            )}
            
            <div className="shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white p-4 flex justify-between items-center dark:bg-slate-800">
              {/* Only show test count when not viewing from completion */}
              {viewingDocumentType !== 'soap' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {extractedTestNames.length > 0 ? (
                    <span>📋 {extractedTestNames.length} diagnostic test(s) identified in plan</span>
                  ) : (
                    <span>No diagnostic tests in plan</span>
                  )}
                </div>
              )}
              <div className={`flex gap-3 ${viewingDocumentType === 'soap' ? 'ml-auto' : ''}`}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSOAPModal(false);
                    // If viewed from completion screen, show completion modal again
                    if (viewingDocumentType === 'soap' && finalReports.length > 0) {
                      setShowConsultationCompleteModal(true);
                      setViewingDocumentType(null);
                    }
                  }}
                  className="px-6"
                  disabled={isGeneratingFinalReports}
                >
                  Close
                </Button>
                {/* Show Generate Reports button if tests are suggested and reports haven't been generated yet (only on initial view) */}
                {viewingDocumentType !== 'soap' && finalReports.length === 0 && extractedTestNames.length > 0 && (
                  <Button
                    onClick={handleGenerateReports}
                    disabled={isGeneratingFinalReports}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 flex items-center gap-2"
                  >
                    {isGeneratingFinalReports ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Reports...
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-4 h-4" />
                        Generate Reports & Continue
                      </>
                    )}
                  </Button>
                )}
                {/* Show Complete Consultation button if NO tests suggested (in follow-up session, only on initial view) */}
                {viewingDocumentType !== 'soap' && finalReports.length === 0 && extractedTestNames.length === 0 && getCurrentSessionPhase() === 'follow-up' && (
                  <Button
                    onClick={() => {
                      setShowSOAPModal(false);
                      setShowConsultationCompletedModal(true);
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete Consultation
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && prescription && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="shrink-0 bg-gradient-to-r from-pink-600 to-rose-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <Pill className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Patient Prescription</h2>
                  <p className="text-pink-100 text-sm">Medications and Treatment Plan</p>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{prescription}</ReactMarkdown>
              </div>
            </div>
            <div className="shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white p-4 flex justify-end gap-3 dark:bg-slate-800">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPrescriptionModal(false);
                  // If viewed from completion screen, show completion modal again
                  if (viewingDocumentType === 'prescription' && finalReports.length > 0) {
                    setShowConsultationCompleteModal(true);
                    setViewingDocumentType(null);
                  }
                }}
                className="px-6"
              >
                Close
              </Button>
              {/* Only show Next button in sequential flow, not when viewing from completion */}
              {!(currentReportIndex === -1 && finalReports.length > 0) && (
                <Button
                  onClick={handlePrescriptionNext}
                  className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6"
                  disabled={finalReports.length === 0}
                >
                  {finalReports.length > 0 ? 'Next: View Reports' : 'No Reports Generated'}
                  {finalReports.length > 0 && <ChevronRight className="w-4 h-4 ml-2" />}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Reports Modal */}
      {currentReportIndex >= 0 && finalReports[currentReportIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
          <motion.div
            key={currentReportIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="shrink-0 bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">{finalReports[currentReportIndex].type}</h2>
                    <p className="text-indigo-100 text-sm">
                      Report {currentReportIndex + 1} of {finalReports.length}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  Test Report
                </Badge>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-blue-950 sm:p-6">
                {(() => {
                  const structured = getStructuredTestReport(
                    finalReports[currentReportIndex],
                  )
                  return structured ? (
                    <ClinicalTestReportView report={structured} />
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      This report has no structured data. Regenerate the report
                      to view the formatted layout.
                    </p>
                  )
                })()}
              </div>
            </div>
            {/* Conditional Footer: Show navigation for sequential viewing, close button for individual viewing */}
            {!isViewingIndividualReport ? (
              <div className="shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white p-4 flex justify-between items-center dark:bg-slate-800">
                <Button
                  variant="outline"
                  onClick={handlePreviousReport}
                  disabled={currentReportIndex === 0}
                  className="px-6"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {currentReportIndex + 1} / {finalReports.length}
                </div>
                <Button
                  onClick={handleNextReport}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6"
                >
                  {currentReportIndex < finalReports.length - 1 ? 'Next Report' : 'Complete'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="border-t border-gray-200 dark:border-slate-700 p-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentReportIndex(-1);
                    setIsViewingIndividualReport(false);
                    // If viewed from completion screen, show completion modal again
                    if (finalReports.length > 0) {
                      setShowConsultationCompleteModal(true);
                    }
                  }}
                  className="px-8"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Completion Message */}
      {showConsultationCompleteModal && finalReports.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowConsultationCompleteModal(false);
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Consultation Complete!</h2>
              <p className="text-gray-600 dark:text-gray-400">
                You have reviewed the SOAP note, prescription, and all {finalReports.length} diagnostic report{finalReports.length !== 1 ? 's' : ''}.
              </p>
            </div>

            {/* Clinical Documentation Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                Clinical Documentation
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingDocumentType('soap');
                    setShowConsultationCompleteModal(false);
                    setShowSOAPModal(true);
                  }}
                  className="flex items-center gap-2 justify-start h-auto py-4"
                >
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold">SOAP Note</div>
                    <div className="text-xs text-gray-500">View clinical note</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingDocumentType('prescription');
                    setShowConsultationCompleteModal(false);
                    setShowPrescriptionModal(true);
                  }}
                  className="flex items-center gap-2 justify-start h-auto py-4"
                >
                  <Pill className="w-5 h-5 text-pink-600" />
                  <div className="text-left">
                    <div className="font-semibold">Prescription</div>
                    <div className="text-xs text-gray-500">View medications</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Test Reports Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-blue-600" />
                Diagnostic Reports ({finalReports.length})
              </h3>
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {finalReports.map((report, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => {
                      setViewingReportIndex(index);
                      setCurrentReportIndex(index);
                      setIsViewingIndividualReport(true); // Flag to show only this report
                      setShowConsultationCompleteModal(false);
                    }}
                    className="flex items-center gap-2 justify-start h-auto py-4"
                  >
                    <FlaskConical className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-semibold text-sm">{report.type}</div>
                      <div className="text-xs text-gray-500">Report {index + 1}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  
                  // Exit replay mode if active (to return to normal learning interface)
                  if (isReplayMode) {
                    exitReplayMode();
                  }
                  
                  // Close the consultation complete modal
                  setShowConsultationCompleteModal(false);
                  
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 flex items-center justify-center gap-2"
              >
                <Brain className="w-5 h-5" />
                Study Case More
              </Button>
              
              {sessionPhase === 'follow-up' ? (
                <Button
                  onClick={() => void handleGoToDashboardAfterFollowUp()}
                  disabled={isFinalizingShadowCase}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 flex items-center justify-center gap-2"
                >
                  {isFinalizingShadowCase ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  {isFinalizingShadowCase ? "Saving…" : "Dashboard"}
                </Button>
              ) : (
                <Button
                  onClick={handleMoveToFollowUpSession}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  Move to Follow-Up Session
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Initial Session Modal removed - using integrated view */}

      {/* Consultation Completed Modal (for follow-up sessions with no tests) */}
      {showConsultationCompletedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowConsultationCompletedModal(false);
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Consultation Completed!</h2>
              <p className="text-gray-600 dark:text-gray-400">
                The follow-up consultation has been completed successfully. All clinical documentation has been reviewed and no additional tests are required at this time.
              </p>
            </div>

            {/* Clinical Documentation Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                Clinical Documentation
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingDocumentType('soap');
                    setShowConsultationCompletedModal(false);
                    setShowSOAPModal(true);
                  }}
                  className="flex items-center gap-2 justify-start h-auto py-4"
                >
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold">SOAP Note</div>
                    <div className="text-xs text-gray-500">View clinical note</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingDocumentType('prescription');
                    setShowConsultationCompletedModal(false);
                    setShowPrescriptionModal(true);
                  }}
                  className="flex items-center gap-2 justify-start h-auto py-4"
                >
                  <Pill className="w-5 h-5 text-pink-600" />
                  <div className="text-left">
                    <div className="font-semibold">Prescription</div>
                    <div className="text-xs text-gray-500">View medications</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  
                  // Exit replay mode if active (to return to normal learning interface)
                  if (isReplayMode) {
                    exitReplayMode();
                  }
                  
                  // Close the consultation completed modal
                  setShowConsultationCompletedModal(false);
                  
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 flex items-center justify-center gap-2"
              >
                <Brain className="w-5 h-5" />
                Study Case More
              </Button>
              
              {sessionPhase === 'follow-up' && (
                <Button
                  onClick={() => void handleGoToDashboardAfterFollowUp()}
                  disabled={isFinalizingShadowCase}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 flex items-center justify-center gap-2"
                >
                  {isFinalizingShadowCase ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  {isFinalizingShadowCase ? "Saving…" : "Dashboard"}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Ask Doctor — bottom-right, nudged down & slightly left of corner */}
      <button
        onClick={handleAskDoctorPopup}
        className="fixed bottom-20 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 px-4 py-3 z-50 group"
        title="Ask Doctor a Question"
      >
        <div className="relative">
          {/* Sparkle icons */}
          <div className="absolute -top-1 -right-1 w-3 h-3 text-white opacity-80 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2L12 17.6l-6 4.8 2.4-7.2L2 9.2h7.6L12 2z"/>
            </svg>
          </div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 text-white opacity-60 group-hover:opacity-80 transition-opacity">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2l1.5 4.5h4.5l-3.5 2.5 1.5 4.5L12 13l-3.5 2.5 1.5-4.5L6 6.5h4.5L12 2z"/>
            </svg>
          </div>
          {/* Main icon */}
          <MessageCircle className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium">Ask Doctor</span>
      </button>
    </div>
  );
}
