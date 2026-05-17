"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle, Play } from "lucide-react";
import { MedicalCase, LearningSession } from "@/lib/medprep-shadow/learning-types";
import { learningService } from "@/lib/medprep-shadow/shadow-learning-client";
import { sampleCases } from "@/lib/fyp/data-models";
import { EnhancedLearningInterface } from "@/app/components/medprep-ai/shadow/enhanced-learning-interface";
import { useShadowMedprepAuth } from "@/lib/medprep-shadow/useShadowMedprepAuth";
import { authService } from "@/shared/services/auth.service";
import { waitForClinicalUserId } from "@/lib/fyp/medprep-user";
import { useShadowModeState } from "@/lib/medprep-shadow/useShadowModeState";
import CaseCompletionPopup from "./case-completion-popup";
import { useShadowModeStore } from "@/lib/medprep-shadow/shadowModeStore";
import {
  appendShadowMedprepConversationMessages,
  createShadowMedprepSession,
  mergeShadowSessionFields,
  patchShadowMedprepConversationProgress,
} from "@/lib/medprep-shadow/shadow-medprep-db-sync";
import { tryResumeShadowPlayFromUrl } from "@/lib/medprep-shadow/shadow-play-resume";
import { mergeSessionConversationId, trimMedprepConversationIdQuery } from "@/lib/fyp/medprep-session-merge";
import ReplayModeInterface from "./replay-mode-interface";

interface ShadowModeContentProps {
  isFullScreen?: boolean;
}

type ViewMode = "landing" | "generate" | "nurse-report" | "selection" | "learning";

export default function ShadowModeContent({
  isFullScreen = false,
}: ShadowModeContentProps) {
  const router = useRouter();
  const containerClass = isFullScreen
    ? "min-h-screen bg-background p-6"
    : "p-6"

  const maxWidthClass = isFullScreen
    ? "max-w-7xl mx-auto space-y-6"
    : "space-y-6"

  const { isAuthenticated, user } = useShadowMedprepAuth();
  
  // Use custom hook for persistent state management
  const shadowModeState = useShadowModeState();
  
  // Check if the hook is properly initialized
  if (!shadowModeState) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Initializing shadow mode...</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    viewMode,
    selectedCase,
    currentSession,
    setViewMode,
    setSelectedCase,
    setCurrentSession,
    clearState: clearShadowModeState,
    hasIncompleteCase,
    getIncompleteCase,
    setInitializationFlag,
    markCaseAsCompleted,
  } = shadowModeState;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nurseReportData, setNurseReportData] = useState<any>(null);
  const [isGeneratingNurseReport, setIsGeneratingNurseReport] = useState(false);
  
  // Replay mode state
  const [showReplayMode, setShowReplayMode] = useState(false);
  const [isStartingSimulation, setIsStartingSimulation] = useState(false);
  const [replayModeEnabled, setReplayModeEnabled] = useState(false);
  
  // Popup state for incomplete case handling
  const [showIncompleteCasePopup, setShowIncompleteCasePopup] = useState(false);
  const [incompleteCaseData, setIncompleteCaseData] = useState<{ case: MedicalCase | null; session: LearningSession | null }>({ case: null, session: null });
  
  // Shadow mode store for replay functionality
  const { 
    startReplayMode, 
    exitReplayMode, 
    addReplayState, 
    isReplayMode,
    replayStates 
  } = useShadowModeStore();

  const bootstrapCaseIdRef = useRef<string | null>(null);
  /** Tracks prior `user?.id` from the shadow auth hook (empty string = hook not synced yet). */
  const shadowHookUserIdForBootstrapRef = useRef<string | undefined>(undefined);
  const shadowMedprepSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSessionForMedprepSyncRef = useRef<LearningSession | null>(null);
  const shadowMedprepSyncLockRef = useRef(false);
  const shadowMedprepSyncAgainRef = useRef(false);
  const shadowMedprepPersistRef = useRef<() => void>(() => {});

  const conversationIdFromRoute = router.isReady
    ? trimMedprepConversationIdQuery(router.query.conversationId)
    : "";

  shadowMedprepPersistRef.current = () => {
    void (async () => {
      if (shadowMedprepSyncLockRef.current) {
        shadowMedprepSyncAgainRef.current = true;
        return;
      }
      shadowMedprepSyncLockRef.current = true;
      shadowMedprepSyncAgainRef.current = false;
      try {
        for (let pass = 0; pass < 12; pass++) {
          const latest = latestSessionForMedprepSyncRef.current;
          if (!latest?.conversationId) break;
          const uid = await waitForClinicalUserId(() => authService.getCurrentUser(), {
            maxMs: 5000,
            stepMs: 50,
          });
          if (!uid || uid === "anonymous") break;
          await appendShadowMedprepConversationMessages({
            conversationId: latest.conversationId,
            userId: uid,
            session: latest,
          });
          const shadowStore = useShadowModeStore.getState();
          await patchShadowMedprepConversationProgress({
            conversationId: latest.conversationId,
            userId: uid,
            session: latest,
            shadowProgressExtras: {
              sessionPhase:
                shadowStore.sessionPhase ?? latest.shadowPhase ?? "initial",
              initialSessionSnapshot:
                latest.shadowInitialSnapshot ??
                shadowStore.initialSessionData ??
                undefined,
              initialMessageCount: latest.shadowInitialMessageCount,
              soapNote: latest.shadowSoapNote,
              prescription: latest.shadowPrescription,
            },
          });
          if (!shadowMedprepSyncAgainRef.current) break;
        }
      } catch {
        // Network / dev-server restart — session stays in memory; next sync will retry
      } finally {
        shadowMedprepSyncLockRef.current = false;
        if (shadowMedprepSyncAgainRef.current) {
          shadowMedprepSyncAgainRef.current = false;
          queueMicrotask(() => {
            shadowMedprepPersistRef.current();
          });
        }
      }
    })();
  };

  const scheduleShadowMedprepPersist = useCallback(() => {
    if (shadowMedprepSyncTimerRef.current) clearTimeout(shadowMedprepSyncTimerRef.current);
    shadowMedprepSyncTimerRef.current = setTimeout(() => {
      shadowMedprepSyncTimerRef.current = null;
      shadowMedprepPersistRef.current();
    }, 350);
  }, []);

  const persistShadowSessionNow = useCallback(async (session: LearningSession) => {
    if (!session.conversationId) return;
    const uid = await waitForClinicalUserId(() => authService.getCurrentUser(), {
      maxMs: 8000,
      stepMs: 50,
    });
    if (!uid || uid === "anonymous") return;

    const working = { ...session };
    await appendShadowMedprepConversationMessages({
      conversationId: working.conversationId,
      userId: uid,
      session: working,
    });
    const shadowStore = useShadowModeStore.getState();
    await patchShadowMedprepConversationProgress({
      conversationId: working.conversationId,
      userId: uid,
      session: working,
      shadowProgressExtras: {
        sessionPhase:
          shadowStore.sessionPhase ?? working.shadowPhase ?? "initial",
        initialSessionSnapshot:
          working.shadowInitialSnapshot ??
          shadowStore.initialSessionData ??
          undefined,
        initialMessageCount: working.shadowInitialMessageCount,
        soapNote: working.shadowSoapNote,
        prescription: working.shadowPrescription,
      },
    });
  }, []);

  /** Follow-up finished: mark COMPLETED in MedPrep so the case leaves “Resume a session”. */
  const handleFinalizeShadowCase = useCallback(async () => {
    const latest = latestSessionForMedprepSyncRef.current ?? currentSession;
    if (!latest?.conversationId) return;

    const shadowStore = useShadowModeStore.getState();
    const phase = shadowStore.sessionPhase ?? latest.shadowPhase ?? "initial";
    if (phase !== "follow-up") {
      console.warn("[Shadow] Finalize skipped — not in follow-up phase");
      return;
    }

    if (shadowMedprepSyncTimerRef.current) {
      clearTimeout(shadowMedprepSyncTimerRef.current);
      shadowMedprepSyncTimerRef.current = null;
    }

    const completed = mergeShadowSessionFields(
      { ...latest, isComplete: true, shadowPhase: "follow-up" },
      latest,
    );
    setCurrentSession(completed);
    latestSessionForMedprepSyncRef.current = completed;
    markCaseAsCompleted(latest.caseId);

    await persistShadowSessionNow(completed);

    if (typeof window !== "undefined") {
      localStorage.removeItem("shadow-mode-current-session");
      localStorage.removeItem("shadow-mode-selected-case");
    }
  }, [
    currentSession,
    setCurrentSession,
    markCaseAsCompleted,
    persistShadowSessionNow,
  ]);

  const handleSessionUpdate = useCallback(
    (session: LearningSession) => {
      const prev = latestSessionForMedprepSyncRef.current;
      const withId = mergeSessionConversationId(
        session,
        prev,
        conversationIdFromRoute,
      );
      const merged = mergeShadowSessionFields(withId, prev ?? undefined);

      setCurrentSession(merged);
      latestSessionForMedprepSyncRef.current = merged;

      if (!merged.conversationId) return;

      if (merged.isComplete) {
        if (shadowMedprepSyncTimerRef.current) {
          clearTimeout(shadowMedprepSyncTimerRef.current);
          shadowMedprepSyncTimerRef.current = null;
        }
        shadowMedprepPersistRef.current();
        return;
      }

      const prevIv = prev?.supervisorInterventions?.length ?? 0;
      const nextIv = merged.supervisorInterventions?.length ?? 0;
      if (nextIv > prevIv) {
        if (shadowMedprepSyncTimerRef.current) {
          clearTimeout(shadowMedprepSyncTimerRef.current);
          shadowMedprepSyncTimerRef.current = null;
        }
        shadowMedprepPersistRef.current();
        return;
      }

      if (merged.diagnosisReady === true && prev?.diagnosisReady !== true) {
        if (shadowMedprepSyncTimerRef.current) {
          clearTimeout(shadowMedprepSyncTimerRef.current);
          shadowMedprepSyncTimerRef.current = null;
        }
        shadowMedprepPersistRef.current();
        return;
      }

      scheduleShadowMedprepPersist();
    },
    [conversationIdFromRoute, scheduleShadowMedprepPersist, setCurrentSession],
  );

  useEffect(() => {
    return () => {
      if (shadowMedprepSyncTimerRef.current) {
        clearTimeout(shadowMedprepSyncTimerRef.current);
        shadowMedprepSyncTimerRef.current = null;
      }
      const latest = latestSessionForMedprepSyncRef.current;
      if (!latest) return;
      const conversationId = latest.conversationId;
      if (!conversationId) return;
      void (async () => {
        const uid = await waitForClinicalUserId(() => authService.getCurrentUser(), {
          maxMs: 4000,
          stepMs: 50,
        });
        if (!uid || uid === "anonymous") return;
        await appendShadowMedprepConversationMessages({
          conversationId,
          userId: uid,
          session: latest,
        });
        const shadowStore = useShadowModeStore.getState();
        await patchShadowMedprepConversationProgress({
          conversationId,
          userId: uid,
          session: latest,
          shadowProgressExtras: {
            sessionPhase:
              shadowStore.sessionPhase ?? latest.shadowPhase ?? "initial",
            initialSessionSnapshot:
              latest.shadowInitialSnapshot ??
              shadowStore.initialSessionData ??
              undefined,
            initialMessageCount: latest.shadowInitialMessageCount,
            soapNote: latest.shadowSoapNote,
            prescription: latest.shadowPrescription,
          },
        });
      })();
    };
  }, []);

  // If the user logs in after the deep-link bootstrap ran without a hook user id, allow one more bootstrap
  // so `/api/conversations` can create the SHADOW row for resume.
  useEffect(() => {
    const cur = user?.id ?? "";
    const prev = shadowHookUserIdForBootstrapRef.current;
    shadowHookUserIdForBootstrapRef.current = cur;
    if (prev !== "" || !cur) return;
    const caseId = typeof router.query.caseId === "string" ? router.query.caseId : undefined;
    if (caseId) bootstrapCaseIdRef.current = null;
  }, [user?.id, router.query.caseId]);

  // Local state management for Shadow Mode context

  // New learning mode handlers
  const handleCaseSelect = async (caseId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear all shadow mode store data when starting a new case
      const { reset } = useShadowModeStore.getState();
      reset();
      
      // No need to clear localStorage - reports are managed by shadow mode store
      
      let medicalCase: MedicalCase;
      
      if (isAuthenticated && user) {
        // Try to get case from API if authenticated
        try {
          const loaded = await learningService.getCaseById(caseId)
          medicalCase =
            loaded ??
            sampleCases.find((c) => c.id === caseId) ??
            sampleCases[0]
        } catch {
          // Fallback to sample case
          medicalCase = sampleCases.find(c => c.id === caseId) || sampleCases[0];
        }
      } else {
        // Use sample case if not authenticated
        medicalCase = sampleCases.find(c => c.id === caseId) || sampleCases[0];
      }
      
      setSelectedCase(medicalCase);

      const caseIdNorm = String(caseId).trim()

      // Create a new learning session
      const newSession: LearningSession = {
        id: `session-${Date.now()}`,
        caseId: caseIdNorm,
        disease: medicalCase.disease,
        patientProfile: medicalCase.patientProfile,
        conversation: [],
        isComplete: false,
        lastSyncedMessageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const uid = await waitForClinicalUserId(() => authService.getCurrentUser());
      if (uid && uid !== "anonymous") {
        const created = await createShadowMedprepSession({
          userId: uid,
          caseId: caseIdNorm,
          medicalCase: {
            id: medicalCase.id,
            disease: medicalCase.disease,
            title: (medicalCase as { title?: string }).title,
            specialty: (medicalCase as { specialty?: string }).specialty,
          },
        });
        if (created.ok) {
          newSession.conversationId = created.conversationId;
        } else {
          console.warn(
            "[Shadow] Register MedPrep session failed:",
            created.status,
            created.message,
          );
          setError(
            created.status === 403
              ? "Your plan does not allow saving this Shadow session, or MedPrep access was denied."
              : `Could not save session to the server: ${created.message}`,
          );
        }
      }

      setCurrentSession(newSession);
      setViewMode("learning");

      if (newSession.conversationId && router.isReady) {
        void router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query, caseId: caseIdNorm, conversationId: newSession.conversationId },
          },
          undefined,
          { shallow: true },
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSelection = () => {
    void router.push("/medprep-ai/shadow-cases");
  };

  const handleStartSimulation = async () => {
    if (!selectedCase || !currentSession) return;
    
    setIsStartingSimulation(true);
    try {
      // Start replay mode
      startReplayMode();
      
      // Generate the first state (Doctor Question)
      await generateReplayStates(selectedCase, currentSession);
      
      setShowReplayMode(true);
    } catch (error) {
      console.error("Error starting simulation:", error);
      setError("Failed to start simulation");
    } finally {
      setIsStartingSimulation(false);
    }
  };

  // Generate replay states function
  const generateReplayStates = async (caseData: MedicalCase, session: LearningSession) => {
    try {
      // State 1: Doctor Question + Doctor Thought + Differential Diagnosis
      const { question: doctorQuestion } = await fetch("/api/learning/doctor-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          currentCase: caseData, 
          patientInfo: session.patientProfile,
          reports: []
        })
      }).then(res => res.json());

      const { thought: doctorThought } = await fetch("/api/learning/doctor-thought", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCase: caseData,
          patientInfo: session.patientProfile,
          conversation: [],
          instruction: "Generate exactly 2 lines of focused clinical reasoning that synthesizes all available patient data.",
          reports: []
        })
      }).then(res => res.json());

      const { diagnosis: doctorDifferentialDiagnosis } = await fetch("/api/learning/differential-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCase: caseData,
          doctorQuestion,
          doctorThought,
          reports: []
        })
      }).then(res => res.json());

      // Add State 1
      const state1 = {
        id: `state-1-${Date.now()}`,
        stateNumber: 1,
        timestamp: new Date().toISOString(),
        type: 'doctor-turn' as const,
        doctorQuestion,
        doctorThought,
        doctorDifferentialDiagnosis,
        reports: [],
        canGoBack: false,
        canGoForward: true
      };
      addReplayState(state1);

      // State 2: Patient Response + Post-Response Differential Diagnosis
      const { response: patientResponse } = await fetch("/api/learning/patient-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: doctorQuestion,
          context: {
            disease: caseData.disease,
            symptoms: caseData.symptoms || [],
            patientProfile: caseData.patientProfile || {}
          },
          currentCase: caseData
        })
      }).then(res => res.json());

      const { diagnosis: postResponseDifferentialDiagnosis } = await fetch("/api/learning/differential-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCase: caseData,
          doctorQuestion,
          doctorThought,
          patientResponse,
          reports: []
        })
      }).then(res => res.json());

      // Add State 2
      const state2 = {
        id: `state-2-${Date.now()}`,
        stateNumber: 2,
        timestamp: new Date().toISOString(),
        type: 'patient-turn' as const,
        patientResponse,
        postResponseDifferentialDiagnosis,
        reports: [],
        canGoBack: true,
        canGoForward: true
      };
      addReplayState(state2);

      // Continue with more states as needed...
      // For now, we'll generate a few more states to demonstrate the flow
      
    } catch (error) {
      console.error("Error generating replay states:", error);
      throw error;
    }
  };

  // Handle continuing with previous incomplete case
  const handleContinuePreviousCase = () => {
    if (incompleteCaseData.case && incompleteCaseData.session) {
      setSelectedCase(incompleteCaseData.case);
      setCurrentSession(incompleteCaseData.session);
      setViewMode("learning");
      // Set initialization flag to allow future auto-restoration
      setInitializationFlag();
    }
    setShowIncompleteCasePopup(false);
  };

  // Handle starting a new case
  const handleStartNewCase = () => {
    // Clear any existing incomplete case data
    clearShadowModeState();
    
    // Also clear shadow mode store data
    const { reset } = useShadowModeStore.getState();
    reset();
    
    setShowIncompleteCasePopup(false);
    void router.push("/medprep-ai/shadow-cases");
  };
  const generateNurseReport = async (medicalCase: any) => {
    setIsGeneratingNurseReport(true);
    try {
      const response = await fetch("/api/learning/nurse-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicalCase,
          mode: "learning"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate nurse report");
      }

      const reportData = await response.json();
      setNurseReportData(reportData);
    } catch (error) {
      console.error("Error generating nurse report:", error);
      setError(error instanceof Error ? error.message : "Failed to generate nurse report");
    } finally {
      setIsGeneratingNurseReport(false);
    }
  };

  // Handle proceeding to learning interface
  const handleProceedToLearning = async () => {
    if (!selectedCase) return;

    setIsLoading(true);
    try {
      // Generate nurse report if not already generated
      if (!nurseReportData) {
        await generateNurseReport(selectedCase);
      }

      // Create a new learning session with proper patient profile
      const caseIdNorm = String(selectedCase.id).trim()
      const newSession: LearningSession = {
        id: `session-${Date.now()}`,
        caseId: caseIdNorm,
        disease: selectedCase.disease,
        patientProfile: {
          name: selectedCase.patientProfile?.name || 'Patient',
          age: selectedCase.patientProfile?.age ?? 45,
          gender: selectedCase.patientProfile?.gender ?? "Unknown",
          occupation: selectedCase.patientProfile?.occupation ?? "Unknown",
        },
        conversation: [],
        isComplete: false,
        lastSyncedMessageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const uid = await waitForClinicalUserId(() => authService.getCurrentUser());
      const existingConvId = router.isReady
        ? trimMedprepConversationIdQuery(router.query.conversationId)
        : "";

      if (existingConvId) {
        newSession.conversationId = existingConvId;
      } else if (uid && uid !== "anonymous") {
        const created = await createShadowMedprepSession({
          userId: uid,
          caseId: caseIdNorm,
          medicalCase: {
            id: selectedCase.id,
            disease: selectedCase.disease,
            title: (selectedCase as { title?: string }).title,
            specialty: (selectedCase as { specialty?: string }).specialty,
          },
          isGeneratedCase: router.query.generated === "true",
        });
        if (created.ok) {
          newSession.conversationId = created.conversationId;
        } else {
          console.warn(
            "[Shadow] Register MedPrep session failed:",
            created.status,
            created.message,
          );
          setError(
            created.status === 403
              ? "Your plan does not allow saving this Shadow session, or MedPrep access was denied."
              : `Could not save session to the server: ${created.message}`,
          );
        }
      }

      setCurrentSession(newSession);
      setViewMode("learning");

      if (newSession.conversationId && router.isReady) {
        void router.replace(
          {
            pathname: router.pathname,
            query: {
              ...router.query,
              caseId: caseIdNorm,
              conversationId: newSession.conversationId,
            },
          },
          undefined,
          { shallow: true },
        );
      }
    } catch (error) {
      console.error("Error proceeding to learning:", error);
      setError(error instanceof Error ? error.message : "Failed to proceed to learning");
    } finally {
      setIsLoading(false);
    }
  };

  // Deep-link: /shadow-play?caseId=… (and optional generated=true)
  useEffect(() => {
    if (!router.isReady) return;
    const caseId = typeof router.query.caseId === "string" ? router.query.caseId : undefined;
    if (!caseId) {
      bootstrapCaseIdRef.current = null;
      return;
    }
    const generated = router.query.generated === "true";
    const bootKey = `${caseId}|${generated ? "g" : "n"}`;
    if (bootstrapCaseIdRef.current === bootKey) return;

    const run = async () => {
      setNurseReportData(null);
      setError(null);

      const resumeConv = trimMedprepConversationIdQuery(router.query.conversationId)
      if (resumeConv && caseId) {
        const uid = await waitForClinicalUserId(() => authService.getCurrentUser());
        if (uid && uid !== "anonymous") {
          const resolved = await tryResumeShadowPlayFromUrl({
            userId: uid,
            caseId,
            resumeConversationId: resumeConv,
            resolveMedicalCase: async (id) => {
              if (isAuthenticated && user) {
                try {
                  const loaded = await learningService.getCaseById(id);
                  return (
                    loaded ??
                    sampleCases.find((c) => c.id === id) ??
                    sampleCases[0]
                  );
                } catch {
                  return sampleCases.find((c) => c.id === id) || sampleCases[0];
                }
              }
              return sampleCases.find((c) => c.id === id) || sampleCases[0];
            },
          });
          if (resolved) {
            latestSessionForMedprepSyncRef.current = resolved.session;
            setSelectedCase(resolved.medicalCase);
            setCurrentSession(resolved.session);
            setViewMode("learning");
            bootstrapCaseIdRef.current = bootKey;
            return;
          }
        }
      }

      const { reset } = useShadowModeStore.getState();
      reset();

      if (generated && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("generatedCase");
          const parsed = raw ? (JSON.parse(raw) as MedicalCase) : null;
          if (parsed && String(parsed.id) === String(caseId)) {
            setSelectedCase(parsed);
            setViewMode("nurse-report");
            const uid = await waitForClinicalUserId(() => authService.getCurrentUser());
            if (uid && uid !== "anonymous") {
              const created = await createShadowMedprepSession({
                userId: uid,
                caseId,
                medicalCase: {
                  id: parsed.id,
                  disease: parsed.disease,
                  title: parsed.title,
                  specialty: parsed.specialty,
                },
                isGeneratedCase: true,
              });
              if (created.ok && router.isReady) {
                void router.replace(
                  {
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      caseId,
                      conversationId: created.conversationId,
                      generated: "true",
                    },
                  },
                  undefined,
                  { shallow: true },
                );
              } else if (!created.ok) {
                console.warn(
                  "[Shadow] MedPrep session create (nurse step) failed:",
                  created.status,
                  created.message,
                );
                setError(
                  created.status === 403
                    ? "Your plan does not allow saving this Shadow session, or MedPrep access was denied."
                    : `Could not save session to the server: ${created.message}`,
                );
              }
            }
            bootstrapCaseIdRef.current = bootKey;
            return;
          }
        } catch {
          // fall through to selected-case path
        }
      }
      await handleCaseSelect(caseId);
      bootstrapCaseIdRef.current = bootKey;
    };

    void run();
    // handleCaseSelect is intentionally omitted from deps (stable enough for one-shot deep link).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap keyed by caseId + generated flag + auth hook
  }, [
    router.isReady,
    router.query.caseId,
    router.query.conversationId,
    router.query.generated,
    setSelectedCase,
    setViewMode,
    user?.id ?? "",
  ]);

  // No case in URL: send users to shared case hub unless they need the incomplete-case prompt
  useEffect(() => {
    if (!router.isReady) return;
    if (viewMode !== "landing") return;
    const caseId = typeof router.query.caseId === "string" ? router.query.caseId : undefined;
    if (caseId) return;
    if (hasIncompleteCase()) return;
    void router.replace("/medprep-ai/shadow-cases");
  }, [router, router.isReady, router.query.caseId, viewMode, hasIncompleteCase]);

  // Check for incomplete cases on component mount AND auto-restore if coming from learning interface
  useEffect(() => {
    const checkAndRestoreSession = () => {
      // Check if there's a session to restore (from "Study Case More" button)
      if (typeof window !== "undefined") {
        const storedCase = localStorage.getItem("shadow-mode-selected-case");
        const storedSession = localStorage.getItem("shadow-mode-current-session");
        
        // If we're on landing page but have stored case/session data, auto-restore it
        if (viewMode === "landing" && storedCase && storedSession && !selectedCase && !currentSession) {
          try {
            const caseData = JSON.parse(storedCase);
            const sessionData = JSON.parse(storedSession);
            
            setSelectedCase(caseData);
            setCurrentSession(sessionData);
            setViewMode("learning");
            return; // Exit early, don't show incomplete case popup
          } catch (error) {
            console.error("❌ [SHADOW MODE] Error restoring session:", error);
          }
        }
      }
      
      // Otherwise, check for incomplete cases and show popup
      if (hasIncompleteCase() && viewMode === "landing") {
        const incompleteData = getIncompleteCase();
        setIncompleteCaseData(incompleteData);
        setShowIncompleteCasePopup(true);
      }
    };

    // Run check when component mounts or viewMode changes to landing
    if (viewMode === "landing" || (!selectedCase && !currentSession)) {
      checkAndRestoreSession();
    }
  }, [viewMode, hasIncompleteCase, getIncompleteCase, selectedCase, currentSession, setSelectedCase, setCurrentSession, setViewMode]);

  useEffect(() => {
    const handleShowReplayMode = () => {
      setShowReplayMode(true);
    };

    window.addEventListener("showReplayMode", handleShowReplayMode);

    return () => {
      window.removeEventListener("showReplayMode", handleShowReplayMode);
    };
  }, []);

  // Render replay mode if active
  if (showReplayMode && isReplayMode) {
    return (
      <ReplayModeInterface 
        onExitReplay={() => {
          setShowReplayMode(false);
          exitReplayMode();
        }}
      />
    );
  }

  // Loading state (e.g. deep-linked case load) — before landing so we never flash the hub redirect UI
  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading case...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render learning interface if case is selected
  if (viewMode === "learning" && selectedCase && currentSession) {
    return (
      <>
        <EnhancedLearningInterface
          key={currentSession.conversationId ?? currentSession.caseId}
          session={currentSession}
          onSessionUpdate={handleSessionUpdate}
          onFinalizeShadowCase={handleFinalizeShadowCase}
          medicalCase={selectedCase}
          onShowReplay={() => setShowReplayMode(true)}
        />
        {/* Incomplete Case Popup */}
        <CaseCompletionPopup
          isOpen={showIncompleteCasePopup}
          onClose={() => setShowIncompleteCasePopup(false)}
          onContinueCase={handleContinuePreviousCase}
          onStartNew={handleStartNewCase}
          incompleteCase={incompleteCaseData.case}
          incompleteSession={incompleteCaseData.session}
        />
      </>
    );
  }


  // Landing only when an incomplete local session needs a decision; otherwise we redirect to /shadow-cases
  if (viewMode === "landing") {
    return (
      <div className={containerClass}>
        <div
          className={`${maxWidthClass} flex min-h-[40vh] flex-col items-center justify-center space-y-6 text-center`}
        >
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="max-w-md text-muted-foreground">
            {hasIncompleteCase()
              ? "You have a case in progress. Continue where you left off or start a new case from the hub."
              : "Opening case selection…"}
          </p>
          <CaseCompletionPopup
            isOpen={showIncompleteCasePopup}
            onClose={() => setShowIncompleteCasePopup(false)}
            onContinueCase={handleContinuePreviousCase}
            onStartNew={handleStartNewCase}
            incompleteCase={incompleteCaseData.case}
            incompleteSession={incompleteCaseData.session}
          />
        </div>
      </div>
    );
  }

  // Render nurse report
  if (viewMode === "nurse-report" && selectedCase) {
    return (
      <div className={containerClass}>
        <div className={maxWidthClass}>
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <button
              type="button"
              onClick={() => void router.push("/medprep-ai/shadow-cases")}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              ← Back to Options
            </button>
            <h1 className="text-3xl font-bold text-foreground">Nurse Report</h1>
            <p className="text-muted-foreground">
              Review the nursing assessment before beginning your learning session.
            </p>
          </div>

          {/* Nurse Report Content */}
          <div className="max-w-4xl mx-auto">
            {isGeneratingNurseReport ? (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Nurse Report</h3>
                <p className="text-gray-600">Please wait while we prepare the nursing assessment...</p>
              </div>
            ) : nurseReportData ? (
              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
                {/* Patient Information */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{selectedCase.patientProfile?.name || 'Patient'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Age:</span>
                      <span className="ml-2 font-medium">{selectedCase.patientProfile?.age || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Gender:</span>
                      <span className="ml-2 font-medium">{selectedCase.patientProfile?.gender || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Chief Complaint:</span>
                      <span className="ml-2 font-medium">{selectedCase.symptoms?.[0] || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Vital Signs */}
                {nurseReportData.vitalSigns && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Vital Signs</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Blood Pressure:</span>
                        <span className="ml-2 font-medium">{nurseReportData.vitalSigns.bloodPressure}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Heart Rate:</span>
                        <span className="ml-2 font-medium">{nurseReportData.vitalSigns.heartRate} bpm</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Temperature:</span>
                        <span className="ml-2 font-medium">{nurseReportData.vitalSigns.temperature}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Respiratory Rate:</span>
                        <span className="ml-2 font-medium">{nurseReportData.vitalSigns.respiratoryRate} /min</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clinical Notes */}
                {nurseReportData.clinicalNotes && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Clinical Notes</h3>
                    <p className="text-gray-700 leading-relaxed">{nurseReportData.clinicalNotes}</p>
                  </div>
                )}

                {/* Initial Assessment */}
                {nurseReportData.initialAssessment && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Initial Assessment</h3>
                    <p className="text-gray-700 leading-relaxed">{nurseReportData.initialAssessment}</p>
                  </div>
                )}

                {/* Practice Guidelines */}
                {nurseReportData.practiceGuidelines && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Guidelines</h3>
                    <p className="text-gray-700 leading-relaxed">{nurseReportData.practiceGuidelines}</p>
                  </div>
                )}

                {/* Proceed Button */}
                <div className="pt-6">
                  <button
                    onClick={handleProceedToLearning}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Starting Learning Session...
                      </>
                    ) : (
                      "Start Learning Session"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate Report</h3>
                <p className="text-gray-600 mb-4">Click the button below to generate the nursing assessment.</p>
                <button
                  onClick={() => generateNurseReport(selectedCase)}
                  disabled={isGeneratingNurseReport}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Generate Nurse Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Error loading case</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleBackToSelection} variant="outline">
              Back to Case Selection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Transitional state (e.g. legacy viewMode values) while routing settles
  return (
    <div className={containerClass}>
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Preparing Shadow Mode…</p>
      </div>
    </div>
  );
}
