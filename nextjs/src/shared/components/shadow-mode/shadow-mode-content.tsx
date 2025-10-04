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
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Settings,
  Eye,
  EyeOff,
  MessageSquare,
  BookOpen,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
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

  // Legacy state for the original shadow mode demo
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState("02:34");
  const [totalTime, setTotalTime] = React.useState("15:42");
  const [showAnnotations, setShowAnnotations] = React.useState(true);

  const containerClass = isFullScreen
    ? "min-h-screen bg-background p-6"
    : "p-6";

  const maxWidthClass = isFullScreen
    ? "max-w-7xl mx-auto space-y-6"
    : "space-y-6";

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleAnnotationToggle = () => {
    setShowAnnotations(!showAnnotations);
  };

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

  // Default shadow mode demo (legacy)
  return (
    <div className={containerClass}>
      <div className={maxWidthClass}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Shadow Mode</h1>
            <p className="text-muted-foreground mt-2">
              Watch AI doctors conduct patient interviews and learn from expert
              clinical reasoning
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Demo Mode
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video flex items-center justify-center">
                  {/* Placeholder for video */}
                  <div className="text-center text-white">
                    <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      AI Doctor - Patient Interview
                    </p>
                    <p className="text-sm opacity-75">
                      Cardiology Consultation
                    </p>
                  </div>

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePlayPause}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <SkipBack className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-mono">
                          {currentTime} / {totalTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMuteToggle}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Current Session
                </CardTitle>
                <CardDescription>
                  Cardiology consultation with Dr. Sarah Chen (AI)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Patient
                    </p>
                    <p className="text-foreground">John Smith, 45 years old</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Chief Complaint
                    </p>
                    <p className="text-foreground">
                      Chest pain and shortness of breath
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Session Duration
                    </p>
                    <p className="text-foreground">15 minutes 42 seconds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={showAnnotations ? "default" : "outline"}
                  size="sm"
                  onClick={handleAnnotationToggle}
                  className="w-full justify-start"
                >
                  {showAnnotations ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {showAnnotations ? "Hide" : "Show"} Annotations
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask Question
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Notes
                </Button>
              </CardContent>
            </Card>

            {/* Live Annotations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Annotations</CardTitle>
                <CardDescription>
                  Real-time clinical insights and explanations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary">
                      Clinical Reasoning
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dr. Chen is asking about pain characteristics to rule out
                      cardiac causes
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm font-medium text-green-600">
                      Teaching Moment
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Notice how she's using open-ended questions to gather more
                      information
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm font-medium text-blue-600">
                      Key Point
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Always consider differential diagnoses when patient
                      presents with chest pain
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Questions Asked
                    </span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Teaching Moments
                    </span>
                    <span className="text-sm font-medium">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Key Insights
                    </span>
                    <span className="text-sm font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Your Questions
                    </span>
                    <span className="text-sm font-medium">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Shadow Sessions
            </CardTitle>
            <CardDescription>
              Continue learning from previous AI doctor consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Emergency Medicine - Trauma Case",
                  doctor: "Dr. Michael Rodriguez",
                  duration: "22:15",
                  specialty: "Emergency Medicine",
                  status: "Completed",
                },
                {
                  title: "Pediatrics - Fever Workup",
                  doctor: "Dr. Emily Johnson",
                  duration: "18:30",
                  specialty: "Pediatrics",
                  status: "In Progress",
                },
                {
                  title: "Surgery - Pre-op Assessment",
                  doctor: "Dr. David Kim",
                  duration: "25:45",
                  specialty: "General Surgery",
                  status: "Completed",
                },
              ].map((session, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground">
                      {session.title}
                    </h4>
                    <Badge
                      variant={
                        session.status === "Completed" ? "default" : "secondary"
                      }
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {session.doctor}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{session.specialty}</span>
                    <span>{session.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
