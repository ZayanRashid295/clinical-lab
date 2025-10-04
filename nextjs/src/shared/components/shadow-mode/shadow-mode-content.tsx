"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { MedicalCase, LearningSession } from "@/shared/types/learning.types";
import { learningService } from "@/shared/services/learning/learning.service";
import CaseSelection from "./case-selection";
import { EnhancedLearningInterface } from "./enhanced-learning-interface";

interface ShadowModeContentProps {
  isFullScreen?: boolean;
}

type ViewMode = "selection" | "learning";

export default function ShadowModeContent({
  isFullScreen = false,
}: ShadowModeContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("selection");
  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state management for Shadow Mode context
  const [allCases, setAllCases] = useState<MedicalCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState<string | null>(null);
  const casesLoadedRef = useRef(false);
  const loadingStartedRef = useRef(false);

  const containerClass = isFullScreen
    ? "min-h-screen bg-background p-6"
    : "p-6";

  const maxWidthClass = isFullScreen
    ? "max-w-7xl mx-auto space-y-6"
    : "space-y-6";

  // New learning mode handlers
  const handleCaseSelect = async (caseId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const medicalCase = await learningService.getCaseById(caseId);
      setSelectedCase(medicalCase);

      // Create a new learning session
      const newSession: LearningSession = {
        id: `session-${Date.now()}`,
        caseId: caseId,
        disease: medicalCase.disease,
        patientProfile: medicalCase.patientProfile,
        conversation: [],
        isComplete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCurrentSession(newSession);
      setViewMode("learning");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setViewMode("selection");
    setSelectedCase(null);
    setCurrentSession(null);
  };

  const handleSessionUpdate = (session: LearningSession) => {
    setCurrentSession(session);
  };

  // Case loading logic to maintain Shadow Mode context
  useEffect(() => {
    const loadCases = async () => {
      // Check if cases are already loaded or loading has started
      if (casesLoadedRef.current || loadingStartedRef.current) {
        return; // Cases already loaded or loading started
      }

      // Set loading flags immediately to prevent duplicate calls
      loadingStartedRef.current = true;
      setCasesLoading(true);
      setCasesError(null);

      try {
        const cases = await learningService.getAllCases();
        setAllCases(cases);
        casesLoadedRef.current = true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load cases";
        setCasesError(errorMessage);
        console.error("Failed to load cases:", err);
      } finally {
        setCasesLoading(false);
      }
    };

    loadCases();
  }, []); // Empty dependency array to run only once

  // Render learning interface if case is selected
  if (viewMode === "learning" && selectedCase && currentSession) {
    return (
      <EnhancedLearningInterface
        session={currentSession}
        onSessionUpdate={handleSessionUpdate}
        medicalCase={selectedCase}
      />
    );
  }

  // Render case selection
  if (viewMode === "selection") {
    return (
      <CaseSelection
        onCaseSelect={handleCaseSelect}
        isFullScreen={isFullScreen}
        cases={allCases}
        isLoading={casesLoading}
        error={casesError}
      />
    );
  }

  // Loading state
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

  // This should not be reached in normal operation
  // If we get here, it means there's an issue with the component state
  return (
    <div className={containerClass}>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-2">Unexpected state</p>
          <p className="text-sm text-muted-foreground mb-4">
            The component is in an unexpected state. Please refresh the page.
          </p>
          <Button onClick={handleBackToSelection} variant="outline">
            Back to Case Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
