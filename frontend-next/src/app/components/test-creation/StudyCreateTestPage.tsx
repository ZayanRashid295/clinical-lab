"use client";

import React, { useState } from "react";
import { TestModeSelector } from "./TestModeSelector";
import { QuestionPoolSelector } from "./QuestionPoolSelector";
import { SubjectSelector } from "./SubjectSelector";
import { SystemSelector } from "./SystemSelector";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent } from "@/shared/ui/card";
import { Rocket } from "lucide-react";

export default function StudyCreateTestPage() {
  const [mode, setMode] = useState<"tutor" | "timed">("tutor");
  const [isTimed, setIsTimed] = useState(false);
  const [selectedPool, setSelectedPool] = useState("unused");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId]
    );
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleGenerateTest = async () => {
    setError(null);
    setSuccess(null);

    if (selectedSubjects.length === 0) {
      showError("Please select at least one subject.");
      return;
    }
    if (selectedSystems.length === 0) {
      showError("Please select at least one system.");
      return;
    }
    if (!questionCount || parseInt(questionCount) <= 0 || parseInt(questionCount) > 40) {
      showError("Please enter a valid number of questions (1-40).");
      return;
    }

    setIsLoading(true);

    try {
      const testData = {
        name: `${mode === "tutor" ? "Tutor" : "Timed"} Test - ${new Date().toLocaleDateString()}`,
        mode,
        isTimed,
        questionPool: selectedPool,
        subjects: selectedSubjects,
        systems: selectedSystems,
        questionCount: parseInt(questionCount),
        duration: isTimed ? parseInt(questionCount) * 1.5 : undefined,
        questions: [],
        answers: {},
        markedQuestions: [],
      };

      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch("/api/tests", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(testData),
      // });
      // const data = await response.json();

      // For now, simulate success
      showSuccess(`Successfully created a test with ${questionCount} questions.`);
      
      // Navigate to test session (update route when available)
      // router.push(`/test-session/${data.id}`);
      
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to create test. Please try again.";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="space-y-6" data-testid="page-create-test">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Create Test</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure your custom test parameters
            </p>
          </div>
          <Button variant="outline" size="sm" data-testid="button-launch-tutorial">
            <Rocket className="h-4 w-4 mr-2" />
            Launch Tutorial
          </Button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg">
            <strong>Success:</strong> {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TestModeSelector
              mode={mode}
              isTimed={isTimed}
              onModeChange={setMode}
              onTimedChange={setIsTimed}
            />
            <QuestionPoolSelector
              selectedPool={selectedPool}
              onPoolChange={setSelectedPool}
            />
          </div>

          <div className="space-y-6">
            <SubjectSelector
              selectedSubjects={selectedSubjects}
              onSubjectToggle={handleSubjectToggle}
            />
            <SystemSelector
              selectedSystems={selectedSystems}
              onSystemToggle={handleSystemToggle}
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="question-count" className="text-gray-900 dark:text-gray-200">No. of Questions</Label>
                <Input
                  id="question-count"
                  type="number"
                  placeholder="Enter number of questions"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="mt-2"
                  data-testid="input-question-count"
                  min="1"
                  max="40"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Max allowed per block: 40
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerateTest}
                data-testid="button-generate-test"
                disabled={isLoading}
              >
                {isLoading ? "GENERATING..." : "GENERATE TEST"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

