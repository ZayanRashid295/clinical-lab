"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { MedicalCase } from "@/shared/types/learning.types";
import { learningService } from "@/shared/services/learning/learning.service";

interface LearningContextType {
  cases: MedicalCase[];
  isLoading: boolean;
  error: string | null;
  loadCases: () => Promise<void>;
  isLoaded: boolean;
}

const LearningContext = createContext<LearningContextType | undefined>(
  undefined
);

interface LearningProviderProps {
  children: ReactNode;
}

export function LearningProvider({ children }: LearningProviderProps) {
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadedRef = useRef(false);

  const loadCases = async () => {
    if (isLoadedRef.current) {
      return; // Already loaded
    }

    setIsLoading(true);
    setError(null);

    try {
      const loadedCases = await learningService.getAllCases();
      setCases(loadedCases);
      isLoadedRef.current = true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load cases";
      setError(errorMessage);
      console.error("LearningContext: Failed to load cases:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load cases on provider mount
  useEffect(() => {
    loadCases();
  }, []);

  const value: LearningContextType = {
    cases,
    isLoading,
    error,
    loadCases,
    isLoaded: isLoadedRef.current,
  };

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearningContext() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error(
      "useLearningContext must be used within a LearningProvider"
    );
  }
  return context;
}
