"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { TestModeSelector } from "./TestModeSelector";
import { QuestionPoolSelector } from "./QuestionPoolSelector";
import { SubjectSelector } from "./SubjectSelector";
import { SystemSelector } from "./SystemSelector";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent } from "@/shared/ui/card";
import { Rocket, AlertCircle } from "lucide-react";

interface ValidationErrors {
  subjects?: string;
  systems?: string;
  questionCount?: string;
}

export default function StudyCreateTestPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"tutor" | "timed">("tutor");
  const [isTimed, setIsTimed] = useState(false);
  const [selectedPool, setSelectedPool] = useState("unused");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const newSubjects = prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId];

      // Clear validation error when subject is selected
      if (newSubjects.length > 0) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.subjects;
          return newErrors;
        });
      }

      return newSubjects;
    });
  };

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems((prev) => {
      const newSystems = prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId];

      // Clear validation error when system is selected
      if (newSystems.length > 0) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.systems;
          return newErrors;
        });
      }

      return newSystems;
    });
  };

  const validateQuestionCount = useCallback(
    (value: string): string | undefined => {
      if (!value || value.trim() === "") {
        return "Number of questions is required.";
      }

      const num = parseInt(value, 10);

      if (isNaN(num)) {
        return "Please enter a valid number.";
      }

      if (num <= 0) {
        return "Number of questions must be greater than 0.";
      }

      if (num > 40) {
        return "Maximum 40 questions allowed per test.";
      }

      return undefined;
    },
    []
  );

  const handleQuestionCountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setQuestionCount(value);
      setTouchedFields((prev) => new Set(prev).add("questionCount"));

      // Only validate and show error if field has been touched and has invalid data
      if (touchedFields.has("questionCount") || value !== "") {
        const error = validateQuestionCount(value);
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          if (error) {
            newErrors.questionCount = error;
          } else {
            delete newErrors.questionCount;
          }
          return newErrors;
        });
      }
    }
  };

  const handleQuestionCountBlur = () => {
    setTouchedFields((prev) => new Set(prev).add("questionCount"));
    const error = validateQuestionCount(questionCount);
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors.questionCount = error;
      } else {
        delete newErrors.questionCount;
      }
      return newErrors;
    });
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validate subjects
    if (selectedSubjects.length === 0) {
      errors.subjects = "Please select at least one subject.";
      isValid = false;
    }

    // Validate systems
    if (selectedSystems.length === 0) {
      errors.systems = "Please select at least one system.";
      isValid = false;
    }

    // Validate question count
    const questionCountError = validateQuestionCount(questionCount);
    if (questionCountError) {
      errors.questionCount = questionCountError;
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleGenerateTest = async () => {
    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Mark all fields as touched when submitting
    setTouchedFields(new Set(["subjects", "systems", "questionCount"]));

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector(
        '[data-validation-error="true"]'
      );
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const questionCountNum = parseInt(questionCount, 10);

    setIsLoading(true);

    try {
      const testData = {
        name: `${
          mode === "tutor" ? "Tutor" : "Timed"
        } Test - ${new Date().toLocaleDateString()}`,
        mode,
        isTimed,
        questionPool: selectedPool,
        subjects: selectedSubjects,
        systems: selectedSystems,
        questionCount: questionCountNum,
        duration: isTimed ? questionCountNum * 1.5 : undefined,
        questions: [],
        answers: {},
        markedQuestions: [],
      };

      // API call to create test
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      // Read response text once
      const responseText = await response.text();
      const contentType = response.headers.get("content-type");

      // Check if response is HTML (indicates route not found)
      if (contentType && !contentType.includes("application/json")) {
        if (
          responseText.includes("<!DOCTYPE html>") ||
          responseText.includes("<html")
        ) {
          throw new Error(
            "API endpoint not found. Please ensure the API route is properly configured."
          );
        }
        throw new Error(`Unexpected response type: ${contentType}`);
      }

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(
            errorData.error ||
              errorData.message ||
              `Server error: ${response.status}`
          );
        } catch {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }
      }

      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid JSON response from server");
      }

      // Navigate to test session immediately (like uworld-replit)
      if (data.id) {
        router.push(`/test-session/${data.id}`);
      } else {
        // Fallback: Show success message if no ID returned
        showSuccess(
          `Successfully created a test with ${questionCountNum} question${
            questionCountNum !== 1 ? "s" : ""
          }.`
        );

        // Reset form
        setSelectedSubjects([]);
        setSelectedSystems([]);
        setQuestionCount("");
        setMode("tutor");
        setIsTimed(false);
        setSelectedPool("unused");
      }
    } catch (err: any) {
      // Handle network errors
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        showError("Network error. Please check your connection and try again.");
        return;
      }

      // Handle API errors
      const errorMessage =
        err?.message || "Failed to create test. Please try again.";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-3 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="space-y-4" data-testid="page-create-test">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Study Create Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure your custom test parameters
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            data-testid="button-launch-tutorial"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Launch Tutorial
          </Button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Error:</strong> {error}
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg">
            <strong className="font-semibold">Success:</strong> {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
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

          <div className="space-y-4">
            <div data-validation-error={!!validationErrors.subjects}>
              <SubjectSelector
                selectedSubjects={selectedSubjects}
                onSubjectToggle={handleSubjectToggle}
              />
              {validationErrors.subjects && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.subjects}
                </p>
              )}
            </div>
            <div data-validation-error={!!validationErrors.systems}>
              <SystemSelector
                selectedSystems={selectedSystems}
                onSystemToggle={handleSystemToggle}
              />
              {validationErrors.systems && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.systems}
                </p>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="question-count"
                  className="text-gray-900 dark:text-gray-200"
                >
                  No. of Questions <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="question-count"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter number of questions (1-40)"
                  value={questionCount}
                  onChange={handleQuestionCountChange}
                  onBlur={handleQuestionCountBlur}
                  className={`mt-2 ${
                    validationErrors.questionCount
                      ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  data-testid="input-question-count"
                  data-validation-error={!!validationErrors.questionCount}
                  min="1"
                  max="40"
                  disabled={isLoading}
                />
                {validationErrors.questionCount && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.questionCount}
                  </p>
                )}
                {!validationErrors.questionCount && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Max allowed per block: 40
                  </p>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerateTest}
                data-testid="button-generate-test"
                disabled={
                  isLoading ||
                  selectedSubjects.length === 0 ||
                  selectedSystems.length === 0 ||
                  !questionCount ||
                  parseInt(questionCount, 10) <= 0 ||
                  parseInt(questionCount, 10) > 40
                }
              >
                {isLoading ? "GENERATING..." : "GENERATE TEST"}
              </Button>
              {(selectedSubjects.length === 0 ||
                selectedSystems.length === 0 ||
                !questionCount ||
                parseInt(questionCount, 10) <= 0 ||
                parseInt(questionCount, 10) > 40) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Please select subjects, systems, and enter a valid question
                  count (1-40)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
