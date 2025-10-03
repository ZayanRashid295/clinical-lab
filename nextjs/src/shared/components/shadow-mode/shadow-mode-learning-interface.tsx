"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  MessageSquare,
  Brain,
  User,
  Stethoscope,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { LearningInterfaceProps } from "@/shared/types/learning.types";
import { useLearningSession } from "@/shared/hooks/useLearningSession";

export default function ShadowModeLearningInterface({
  session,
  onSessionUpdate,
  medicalCase,
  isFullScreen = false,
}: LearningInterfaceProps) {
  const {
    uiState,
    isLoading,
    error,
    generateDoctorQuestion,
    generatePatientResponse,
    generateDoctorThought,
    submitStudentQuestion,
    togglePlay,
    togglePause,
    setStudentQuestion,
    toggleDoctorChat,
    toggleSection,
    setActiveTab,
    speakMessage,
    stopSpeaking,
  } = useLearningSession({
    caseId: session.caseId,
    medicalCase,
  });

  const [currentQuestion, setCurrentQuestion] = useState<string>("");

  // Auto-generate doctor question when session starts
  useEffect(() => {
    if (session && uiState.messages.length === 0 && !isLoading) {
      generateDoctorQuestion();
    }
  }, [session, uiState.messages.length, isLoading, generateDoctorQuestion]);

  const handlePlayConversation = () => {
    if (uiState.isPlaying) {
      togglePause();
    } else {
      togglePlay();
      // Start playing from the beginning
      playConversationFromStart();
    }
  };

  const playConversationFromStart = () => {
    let currentIndex = 0;

    const playNextMessage = () => {
      if (currentIndex < uiState.messages.length && uiState.isPlaying) {
        const message = uiState.messages[currentIndex];
        speakMessage(message);
        currentIndex++;

        // Wait for speech to complete before next message
        setTimeout(playNextMessage, message.content.length * 50 + 1000);
      }
    };

    playNextMessage();
  };

  const handlePatientResponse = async () => {
    if (currentQuestion.trim()) {
      await generatePatientResponse(currentQuestion);
      setCurrentQuestion("");
    }
  };

  const handleStudentQuestion = async () => {
    await submitStudentQuestion();
  };

  const handleDoctorThought = () => {
    const context = `Current conversation has ${
      uiState.messages.length
    } messages. Last message: ${
      uiState.messages[uiState.messages.length - 1]?.content ||
      "No messages yet"
    }`;
    generateDoctorThought(context);
  };

  const renderMessage = (message: any, index: number) => (
    <div
      key={message.id || index}
      className={`flex items-start space-x-3 p-3 rounded-lg ${
        message.role === "doctor"
          ? "bg-blue-50 dark:bg-blue-900/20"
          : message.role === "patient"
          ? "bg-green-50 dark:bg-green-900/20"
          : "bg-yellow-50 dark:bg-yellow-900/20"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
          message.role === "doctor"
            ? "bg-blue-500"
            : message.role === "patient"
            ? "bg-green-500"
            : "bg-yellow-500"
        }`}
      >
        {message.role === "doctor" ? (
          <Stethoscope className="w-4 h-4" />
        ) : message.role === "patient" ? (
          <User className="w-4 h-4" />
        ) : (
          <MessageSquare className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-sm capitalize">{message.role}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-foreground">{message.content}</p>
        {message.explanation && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            {message.explanation}
          </p>
        )}
      </div>
    </div>
  );

  const renderPatientInfo = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Name</Label>
            <p className="text-sm text-muted-foreground">
              {medicalCase.patientProfile.name}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Age</Label>
            <p className="text-sm text-muted-foreground">
              {medicalCase.patientProfile.age} years
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Gender</Label>
            <p className="text-sm text-muted-foreground">
              {medicalCase.patientProfile.gender}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Occupation</Label>
            <p className="text-sm text-muted-foreground">
              {medicalCase.patientProfile.occupation}
            </p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Chief Complaint</Label>
          <p className="text-sm text-muted-foreground">
            {medicalCase.symptoms.join(", ")}
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium">Medical History</Label>
          <p className="text-sm text-muted-foreground">
            {medicalCase.history.join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderVitalSigns = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Vital Signs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {medicalCase.vitalSigns ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Blood Pressure</Label>
              <p className="text-sm text-muted-foreground">
                {medicalCase.vitalSigns.bloodPressure}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Heart Rate</Label>
              <p className="text-sm text-muted-foreground">
                {medicalCase.vitalSigns.heartRate} bpm
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Temperature</Label>
              <p className="text-sm text-muted-foreground">
                {medicalCase.vitalSigns.temperature}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Respiratory Rate</Label>
              <p className="text-sm text-muted-foreground">
                {medicalCase.vitalSigns.respiratoryRate} /min
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Oxygen Saturation</Label>
              <p className="text-sm text-muted-foreground">
                {medicalCase.vitalSigns.oxygenSaturation}%
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No vital signs available
          </p>
        )}
      </CardContent>
    </Card>
  );

  const renderPhysicalExam = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="w-5 h-5" />
          Physical Examination
        </CardTitle>
      </CardHeader>
      <CardContent>
        {medicalCase.physicalExam ? (
          <div className="space-y-3">
            {Object.entries(medicalCase.physicalExam).map(([key, value]) => (
              <div key={key}>
                <Label className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </Label>
                <p className="text-sm text-muted-foreground">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No physical exam data available
          </p>
        )}
      </CardContent>
    </Card>
  );

  const containerClass = isFullScreen
    ? "min-h-screen bg-background p-6"
    : "p-6";

  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading learning session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Error loading session</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {medicalCase.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{medicalCase.difficulty}</Badge>
              <Badge variant="outline">{medicalCase.specialty}</Badge>
              <Badge variant="outline">{medicalCase.disease}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayConversation}
              disabled={uiState.messages.length === 0}
            >
              {uiState.isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={stopSpeaking}
              disabled={!uiState.isSpeaking}
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={toggleDoctorChat}>
              <Brain className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Information */}
          <div className="space-y-4">
            {renderPatientInfo()}
            {renderVitalSigns()}
            {renderPhysicalExam()}
          </div>

          {/* Center Column - Conversation */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Doctor-Patient Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uiState.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Conversation will start when you begin the interview...
                    </p>
                  ) : (
                    uiState.messages.map((message, index) =>
                      renderMessage(message, index)
                    )
                  )}
                </div>

                {/* Doctor Question Input */}
                <div className="mt-4 space-y-2">
                  <Label htmlFor="doctor-question">Doctor's Question</Label>
                  <div className="flex gap-2">
                    <Input
                      id="doctor-question"
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      placeholder="Enter your question for the patient..."
                      onKeyPress={(e) =>
                        e.key === "Enter" && handlePatientResponse()
                      }
                    />
                    <Button
                      onClick={handlePatientResponse}
                      disabled={!currentQuestion.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={generateDoctorQuestion}
                    disabled={uiState.isProcessing}
                    size="sm"
                  >
                    {uiState.isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Stethoscope className="w-4 h-4" />
                    )}
                    Ask Question
                  </Button>
                  <Button
                    onClick={handleDoctorThought}
                    variant="outline"
                    size="sm"
                  >
                    <Brain className="w-4 h-4" />
                    Doctor's Thought
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Student Question */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Ask the Doctor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="student-question">Your Question</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="student-question"
                      value={uiState.studentQuestion}
                      onChange={(e) => setStudentQuestion(e.target.value)}
                      placeholder="Ask the AI doctor about the case..."
                      rows={2}
                    />
                    <Button
                      onClick={handleStudentQuestion}
                      disabled={
                        !uiState.studentQuestion.trim() || uiState.isProcessing
                      }
                      size="sm"
                    >
                      {uiState.isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Doctor's Thoughts */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Doctor's Thoughts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uiState.doctorThoughts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Doctor's thoughts will appear here...
                    </p>
                  ) : (
                    uiState.doctorThoughts.map((thought, index) => (
                      <div
                        key={thought.id || index}
                        className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(thought.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {thought.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Session Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Badge
                      variant={session.isComplete ? "default" : "secondary"}
                    >
                      {session.isComplete ? "Complete" : "In Progress"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Messages
                    </span>
                    <span className="text-sm font-medium">
                      {uiState.messages.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Started
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
