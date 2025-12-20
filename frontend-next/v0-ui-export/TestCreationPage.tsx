"use client";

import React, { useState } from "react";
import { TestModeSelector } from "./components/TestModeSelector";
import { QuestionPoolSelector } from "./components/QuestionPoolSelector";
import { SubjectSelector } from "./components/SubjectSelector";
import { SystemSelector } from "./components/SystemSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, AlertCircle } from "lucide-react";

interface ValidationErrors {
  subjects?: string;
  systems?: string;
  questionCount?: string;
}

export default function TestCreationPage() {
  const [isTutor, setIsTutor] = useState(true);
  const [isTimed, setIsTimed] = useState(false);
  const [selectedPool, setSelectedPool] = useState("unused");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [availableQuestionsCount, setAvailableQuestionsCount] = useState<
    number | null
  >(null);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId];

      if (newTags.length > 0) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.subjects;
          return newErrors;
        });
      }

      return newTags;
    });
  };

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems((prev) => {
      const newSystems = prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId];

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

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const validateQuestionCount = (value: string): string | undefined => {
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
  };

  const handleQuestionCountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    if (value === "" || /^\d+$/.test(value)) {
      setQuestionCount(value);
      setTouchedFields((prev) => new Set(prev).add("questionCount"));

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

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (selectedTags.length === 0) {
      errors.subjects = "Please select at least one tag.";
      isValid = false;
    }

    if (selectedSystems.length === 0) {
      errors.systems = "Please select at least one system.";
      isValid = false;
    }

    const questionCountError = validateQuestionCount(questionCount);
    if (questionCountError) {
      errors.questionCount = questionCountError;
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleGenerateTest = async () => {
    setError(null);
    setSuccess(null);

    setTouchedFields(new Set(["subjects", "systems", "questionCount"]));

    if (!validateForm()) {
      const firstErrorField = document.querySelector(
        '[data-validation-error="true"]'
      );
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setSuccess("Test generated successfully!");
  };

  return (
    <div
      className="px-[50px] pb-[50px] pt-[25px] space-y-3"
      data-testid="page-create-test"
    >
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

      <div className="space-y-6">
        <TestModeSelector
          isTutor={isTutor}
          isTimed={isTimed}
          onTutorChange={setIsTutor}
          onTimedChange={setIsTimed}
        />

        <QuestionPoolSelector
          selectedPool={selectedPool}
          onPoolChange={setSelectedPool}
          filters={{
            tagIds: selectedTags.length > 0 ? selectedTags : undefined,
            systemIds: selectedSystems.length > 0 ? selectedSystems : undefined,
            subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
            topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
          }}
        />

        <div data-validation-error={!!validationErrors.subjects}>
          <SubjectSelector
            selectedSubjects={selectedTags}
            onSubjectToggle={handleTagToggle}
            selectedPool={selectedPool}
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
            selectedTags={selectedTags}
            selectedPool={selectedPool}
            selectedSubjects={selectedSubjects}
            selectedTopics={selectedTopics}
            onSubjectToggle={handleSubjectToggle}
            onTopicToggle={handleTopicToggle}
          />
          {validationErrors.systems && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.systems}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label
            htmlFor="question-count"
            className="text-gray-900 dark:text-gray-200"
          >
            No. of Questions
          </Label>
          <Input
            id="question-count"
            type="text"
            inputMode="numeric"
            placeholder="0"
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
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
              <span>Max allowed per block</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                40
              </span>
              {availableQuestionsCount !== null && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {availableQuestionsCount === 999
                    ? "999+"
                    : availableQuestionsCount}
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleGenerateTest}
          data-testid="button-generate-test"
          disabled={
            isLoading ||
            selectedTags.length === 0 ||
            selectedSystems.length === 0 ||
            !questionCount ||
            parseInt(questionCount, 10) <= 0 ||
            parseInt(questionCount, 10) > 40
          }
        >
          {isLoading ? "GENERATING..." : "GENERATE TEST"}
        </Button>
        {(selectedTags.length === 0 ||
          selectedSystems.length === 0 ||
          !questionCount ||
          parseInt(questionCount, 10) <= 0 ||
          parseInt(questionCount, 10) > 40) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Please select subjects, systems, and enter a valid question count
            (1-40)
          </p>
        )}
      </div>
    </div>
  );
}



















































