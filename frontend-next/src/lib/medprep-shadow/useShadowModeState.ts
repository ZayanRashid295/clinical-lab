"use client";

import { useState, useCallback } from "react";
import { MedicalCase, LearningSession } from "@/lib/medprep-shadow/learning-types";

type ViewMode = "landing" | "generate" | "nurse-report" | "selection" | "learning";

interface ShadowModeState {
  viewMode: ViewMode;
  selectedCase: MedicalCase | null;
  currentSession: LearningSession | null;
  setViewMode: (mode: ViewMode) => void;
  setSelectedCase: (medicalCase: MedicalCase | null) => void;
  setCurrentSession: (session: LearningSession | null) => void;
  clearState: () => void;
  resetToLanding: () => void;
  clearCompletedSessions: () => void;
  isCaseCompleted: (caseId: string) => boolean;
  markCaseAsCompleted: (caseId: string) => void;
  hasIncompleteCase: () => boolean;
  getIncompleteCase: () => { case: MedicalCase | null; session: LearningSession | null };
  setInitializationFlag: () => void;
}

/**
 * Shadow navigation state is in-memory only. Clinical data (messages, SOAP, reports)
 * persists via `shadow-medprep-db-sync` → `medprep_conversations` + related tables.
 */
export function useShadowModeState(): ShadowModeState {
  const [viewMode, setViewModeState] = useState<ViewMode>("landing");
  const [selectedCase, setSelectedCaseState] = useState<MedicalCase | null>(null);
  const [currentSession, setCurrentSessionState] = useState<LearningSession | null>(null);
  const [completedCaseIds, setCompletedCaseIds] = useState<string[]>([]);
  const [allowAutoRestore, setAllowAutoRestore] = useState(false);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const setSelectedCase = useCallback((medicalCase: MedicalCase | null) => {
    setSelectedCaseState(medicalCase);
  }, []);

  const setCurrentSession = useCallback((session: LearningSession | null) => {
    setCurrentSessionState(session);
  }, []);

  const clearState = () => {
    setViewModeState("landing");
    setSelectedCaseState(null);
    setCurrentSessionState(null);
    setAllowAutoRestore(false);
  };

  const setInitializationFlag = () => {
    setAllowAutoRestore(true);
  };

  const resetToLanding = () => {
    setViewModeState("landing");
  };

  const clearCompletedSessions = () => {
    if (currentSession?.isComplete) {
      setCurrentSessionState(null);
      setSelectedCaseState(null);
    }
  };

  const isCaseCompleted = useCallback(
    (caseId: string): boolean => completedCaseIds.includes(caseId),
    [completedCaseIds],
  );

  const markCaseAsCompleted = (caseId: string) => {
    setCompletedCaseIds((prev) => (prev.includes(caseId) ? prev : [...prev, caseId]));
  };

  const hasIncompleteCase = useCallback((): boolean => {
    if (!allowAutoRestore) return false;
    if (!selectedCase || !currentSession) return false;
    return !isCaseCompleted(selectedCase.id) && !currentSession.isComplete;
  }, [allowAutoRestore, selectedCase, currentSession, isCaseCompleted]);

  const getIncompleteCase = useCallback((): {
    case: MedicalCase | null;
    session: LearningSession | null;
  } => {
    if (hasIncompleteCase()) {
      return { case: selectedCase, session: currentSession };
    }
    return { case: null, session: null };
  }, [hasIncompleteCase, selectedCase, currentSession]);

  return {
    viewMode,
    selectedCase,
    currentSession,
    setViewMode,
    setSelectedCase,
    setCurrentSession,
    clearState,
    resetToLanding,
    clearCompletedSessions,
    isCaseCompleted,
    markCaseAsCompleted,
    hasIncompleteCase,
    getIncompleteCase,
    setInitializationFlag,
  };
}
