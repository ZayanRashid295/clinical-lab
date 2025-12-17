"use client";

import React, { useState, useCallback, useEffect } from "react";
import { TestModeSelector } from "./TestModeSelector";
import { QuestionPoolSelector } from "./QuestionPoolSelector";
import { MarkedToggle } from "./MarkedToggle";
import { SubjectSelector } from "./SubjectSelector";
import { SystemSelector } from "./SystemSelector";
import { QuickGuideModal } from "./QuickGuideModal";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { AlertCircle, CheckCircle2, ArrowRight, Hash, Layers, HelpCircle, ChevronRight } from "lucide-react";
import { QuestionsService } from "@/app/services/questions/questions.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { useUIConfigContext } from "@/shared/contexts/UIConfigContext";
import { ThemeService } from "@/app/config/theme.service";

interface ValidationErrors {
  subjects?: string;
  systems?: string;
  questionCount?: string;
}

export default function StudyCreateTestPage() {
  const [isTutor, setIsTutor] = useState(true);
  const [isTimed, setIsTimed] = useState(false);
  const [selectedPool, setSelectedPool] = useState("unused");
  const [isMarked, setIsMarked] = useState(false);
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
  const [availableQuestionsCount, setAvailableQuestionsCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [showInsufficientQuestionsDialog, setShowInsufficientQuestionsDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showQuickGuide, setShowQuickGuide] = useState(false);

  // Get theme config to ensure theme is applied
  const { config: uiConfig } = useUIConfigContext();
  const themeService = ThemeService.getInstance();

  // Apply theme on mount and when theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      themeService.applyTheme(uiConfig);
      // Force a re-render by toggling a state if needed
      const htmlElement = document.documentElement;
      if (uiConfig.theme === 'dark') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
  }, [uiConfig.theme, uiConfig.colorScheme, uiConfig.fontSize, uiConfig.borderRadius, themeService]);

  // Refresh counts when page becomes visible (user returns from test)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to the page, refresh counts
        setRefreshTrigger(prev => prev + 1);
      }
    };

    const handleFocus = () => {
      // Also refresh when window gains focus
      setRefreshTrigger(prev => prev + 1);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId];

      // Clear validation error when tag is selected
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

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const newSubjects = prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId];

      // Clear validation error when subject is selected
      if (newSubjects.length > 0) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.systems;
          return newErrors;
        });
      }

      return newSubjects;
    });
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) => {
      const newTopics = prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId];

      // Clear validation error when topic is selected
      if (newTopics.length > 0) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.systems;
          return newErrors;
        });
      }

      return newTopics;
    });
  };

  // Fetch available questions count based on current filters
  useEffect(() => {
    const fetchAvailableCount = async () => {
      // Only fetch if we have tags selected and at least one of: systems, subjects, or topics
      const hasSelection = selectedSystems.length > 0 || selectedSubjects.length > 0 || selectedTopics.length > 0;
      if (selectedTags.length === 0 || !hasSelection) {
        setAvailableQuestionsCount(null);
        return;
      }

      try {
        setLoadingCount(true);
        const questionsService = new QuestionsService();
        // Fetch with max limit (999) to get the count
        // Note: If there are more than 999 questions, we'll show "999+"
        // Determine pool filter (exclude "marked" as it's now a separate parameter)
        // Note: "unused" is the default, but we should still pass it explicitly if selected
        const poolFilter: "unused" | "incorrect" | "correct" | "omitted" | undefined = 
          selectedPool 
            ? selectedPool as "unused" | "incorrect" | "correct" | "omitted"
            : undefined;

        const questions = await questionsService.getFilteredQuestions({
          tagIds: selectedTags.length > 0 ? selectedTags : undefined,
          systemIds: selectedSystems.length > 0 ? selectedSystems : undefined,
          subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
          topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
          pool: poolFilter,
          marked: isMarked ? true : undefined,
        });
        // If we got exactly 999, there might be more, so show "999+"
        // Otherwise show the actual count
        setAvailableQuestionsCount(questions.length === 999 ? 999 : questions.length);
      } catch (error) {
        console.error("Failed to fetch available questions count:", error);
        setAvailableQuestionsCount(null);
      } finally {
        setLoadingCount(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchAvailableCount();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedTags, selectedSystems, selectedSubjects, selectedTopics, selectedPool, isMarked]);

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

    // Validate tags
    if (selectedTags.length === 0) {
      errors.subjects = "Please select at least one tag.";
      isValid = false;
    }

    // Validate systems/subjects/topics - at least one must be selected
    const hasSystemSelection = selectedSystems.length > 0 || selectedSubjects.length > 0 || selectedTopics.length > 0;
    if (!hasSystemSelection) {
      errors.systems = "Please select at least one system, subject, or topic.";
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

    // Check if enough questions are available
    // If count is not available yet, fetch it first
    const hasSelection = selectedSystems.length > 0 || selectedSubjects.length > 0 || selectedTopics.length > 0;
    if (availableQuestionsCount === null && selectedTags.length > 0 && hasSelection) {
      try {
        setLoadingCount(true);
        const questionsService = new QuestionsService();
        const poolFilter: "unused" | "incorrect" | "correct" | "omitted" | undefined = 
          selectedPool 
            ? selectedPool as "unused" | "incorrect" | "correct" | "omitted"
            : undefined;

        const questions = await questionsService.getFilteredQuestions({
          tagIds: selectedTags.length > 0 ? selectedTags : undefined,
          systemIds: selectedSystems.length > 0 ? selectedSystems : undefined,
          subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
          topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
          pool: poolFilter,
          marked: isMarked ? true : undefined,
        });
        const count = questions.length === 999 ? 999 : questions.length;
        setAvailableQuestionsCount(count);
        
        if (questionCountNum > count) {
          setShowInsufficientQuestionsDialog(true);
          setLoadingCount(false);
          return;
        }
        setLoadingCount(false);
      } catch (error) {
        console.error("Failed to fetch available questions count:", error);
        setLoadingCount(false);
        // Continue with test generation if count fetch fails
      }
    } else if (availableQuestionsCount !== null && questionCountNum > availableQuestionsCount) {
      setShowInsufficientQuestionsDialog(true);
      return;
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (selectedTags.length > 0) {
      params.set("tagIds", selectedTags.join(","));
    }
    if (selectedSystems.length > 0) {
      params.set("systemIds", selectedSystems.join(","));
    }
    if (selectedSubjects.length > 0) {
      params.set("subjectIds", selectedSubjects.join(","));
    }
    if (selectedTopics.length > 0) {
      params.set("topicIds", selectedTopics.join(","));
    }
    if (selectedPool) {
      params.set("pool", selectedPool);
    }
    if (isMarked) {
      params.set("marked", "true");
    }
    params.set("limit", questionCountNum.toString());
    // Determine mode: if tutor is enabled, use "tutor", otherwise use "timed" if timed is enabled
    const mode = isTutor ? "tutor" : (isTimed ? "timed" : "tutor");
    params.set("mode", mode);
    if (isTimed) {
      params.set("timed", "true");
    }
    if (isTutor) {
      params.set("tutor", "true");
    }

    // Navigate to student mode with filters
    window.location.href = `/question-generator/student?${params.toString()}`;
  };

  const isFormValid =
    selectedTags.length > 0 &&
    (selectedSystems.length > 0 || selectedSubjects.length > 0 || selectedTopics.length > 0) &&
    questionCount &&
    parseInt(questionCount, 10) > 0 &&
    parseInt(questionCount, 10) <= 40;

  return (
    <div className="flex h-screen bg-background dark:bg-gray-900 overflow-hidden" data-testid="page-create-test">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border dark:border-gray-700 bg-card/50 dark:bg-gray-800/80 flex items-center justify-between px-6 shrink-0">
        <div>
            <h1 className="text-lg font-semibold text-foreground dark:text-gray-100">Create Test</h1>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Customize your learning path</p>
        </div>
          <div className="flex items-center gap-2">
        <Button
              variant="ghost"
          size="sm"
              className="h-8 text-xs font-medium text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-gray-100"
              onClick={() => setShowQuickGuide(true)}
        >
              <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
              Quick Guide
        </Button>
      </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto scrollbar-thin bg-background dark:bg-gray-900">
          <div className="p-6">
      {/* Error/Success Messages */}
      {error && (
              <div className="bg-destructive/5 dark:bg-destructive/10 border border-destructive/20 dark:border-destructive/30 text-destructive dark:text-destructive px-4 py-3 rounded-lg flex items-start gap-3 mb-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="font-medium">Error:</strong> {error}
          </div>
        </div>
      )}
      {success && (
              <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-lg flex items-start gap-3 mb-4">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm dark:text-gray-100">
                  <strong className="font-medium">Success:</strong> {success}
                </div>
        </div>
      )}

            {/* Settings Row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
          <TestModeSelector
                isTutor={isTutor}
            isTimed={isTimed}
                onTutorChange={setIsTutor}
            onTimedChange={setIsTimed}
          />

              <MarkedToggle
                isMarked={isMarked}
                onMarkedChange={setIsMarked}
                selectedPool={selectedPool}
                refreshTrigger={refreshTrigger}
              />

          <QuestionPoolSelector
            selectedPool={selectedPool}
            onPoolChange={setSelectedPool}
                isMarked={isMarked}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* Subjects & Systems */}
            <div className="bg-card dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 overflow-hidden mb-4">
              <div className="grid grid-cols-[280px_1fr] divide-x divide-border dark:divide-gray-700 min-h-[500px]">
                <div data-validation-error={!!validationErrors.subjects} className="flex flex-col">
            <SubjectSelector
              selectedSubjects={selectedTags}
              onSubjectToggle={handleTagToggle}
            selectedPool={selectedPool}
                    isMarked={isMarked}
                    refreshTrigger={refreshTrigger}
            />
            {validationErrors.subjects && (
                    <div className="px-4 py-2 bg-destructive/5 dark:bg-destructive/10 border-t border-destructive/20">
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                {validationErrors.subjects}
              </p>
                    </div>
            )}
          </div>

                <div className="flex flex-col" data-validation-error={!!validationErrors.systems}>
            <SystemSelector
              selectedSystems={selectedSystems}
              onSystemToggle={handleSystemToggle}
              selectedTags={selectedTags}
            selectedPool={selectedPool}
              selectedSubjects={selectedSubjects}
              selectedTopics={selectedTopics}
                    isMarked={isMarked}
              onSubjectToggle={handleSubjectToggle}
              onTopicToggle={handleTopicToggle}
                    refreshTrigger={refreshTrigger}
            />
            {validationErrors.systems && (
                    <div className="px-4 py-2 bg-destructive/5 dark:bg-destructive/10 border-t border-destructive/20 dark:border-red-500/30">
                      <p className="text-sm text-destructive dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                {validationErrors.systems}
              </p>
                    </div>
            )}
                </div>
        </div>
      </div>

            {/* Question Count */}
            <div className="bg-card dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 dark:border-gray-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <h3 className="text-sm font-medium text-foreground dark:text-gray-100">Question Count</h3>
                  <span className="text-xs text-muted-foreground dark:text-gray-400 ml-auto">max 40</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
              <Input
                id="question-count"
                      type="number"
                      min={1}
                      max={40}
                value={questionCount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d+$/.test(val)) {
                          const num = parseInt(val, 10) || 0;
                          setQuestionCount(Math.min(40, Math.max(0, num)).toString() || "");
                        }
                      }}
                onBlur={handleQuestionCountBlur}
                      className={`w-20 h-9 text-center bg-muted/50 dark:bg-gray-700/30 border-border dark:border-gray-700 ${
                  validationErrors.questionCount
                          ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                data-testid="input-question-count"
                data-validation-error={!!validationErrors.questionCount}
                disabled={isLoading}
              />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted dark:bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary dark:bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${((parseInt(questionCount) || 0) / 40) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground dark:text-gray-400">
                    {parseInt(questionCount) || 0} questions
                  </span>
                </div>
              {validationErrors.questionCount && (
                  <p className="text-sm text-destructive dark:text-red-400 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.questionCount}
                </p>
              )}
              </div>
            </div>
          </div>
        </main>

        <footer className="h-16 border-t border-border dark:border-gray-700 bg-card/80 dark:bg-gray-800/50 backdrop-blur flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground dark:text-gray-400">
                <span className="font-medium text-foreground dark:text-gray-100">{selectedTags.length + selectedSystems.length}</span> selections
              </span>
            </div>
            {selectedTags.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30">
                {selectedTags.length} subjects
              </span>
            )}
            {selectedSystems.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30">
                {selectedSystems.length} systems
              </span>
            )}
              {availableQuestionsCount !== null && (
              <>
                <div className="h-5 w-px bg-border mx-2" />
                <span className="text-sm text-muted-foreground dark:text-gray-400">
                  Available: <span className="font-medium text-foreground dark:text-gray-100">
                    {loadingCount ? "..." : availableQuestionsCount === 999 ? "999+" : availableQuestionsCount.toLocaleString()}
                  </span>
                </span>
              </>
              )}
            </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 bg-transparent" onClick={() => {
              setSelectedTags([]);
              setSelectedSystems([]);
              setSelectedSubjects([]);
              setSelectedTopics([]);
              setQuestionCount("");
              setSelectedPool("unused");
              setIsMarked(false);
            }}>
              Reset All
            </Button>
            <Button
              size="sm"
              className="h-9 px-6"
              onClick={handleGenerateTest}
              data-testid="button-generate-test"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  Generate Test
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>

      {/* Insufficient Questions Dialog */}
      <AlertDialog open={showInsufficientQuestionsDialog} onOpenChange={setShowInsufficientQuestionsDialog}>
        <AlertDialogContent className="bg-card dark:bg-gray-800 border-border dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground dark:text-gray-100">
              <AlertCircle className="h-5 w-5 text-destructive dark:text-red-400" />
              Not Enough Questions Available
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-muted-foreground dark:text-gray-300">
              <p className="mb-2 dark:text-gray-200">
                You requested <strong className="text-foreground dark:text-gray-100">{questionCount}</strong> questions, but only{" "}
                <strong className="text-foreground dark:text-gray-100">{availableQuestionsCount}</strong> {availableQuestionsCount === 1 ? "question is" : "questions are"} available
                for the current filter settings.
              </p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Please adjust your question count or modify your filter selections (subjects, systems, pool type, or marked status)
                to include more questions.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-100">
              Close
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => setShowInsufficientQuestionsDialog(false)}
              className="dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
            >
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Guide Modal */}
      <QuickGuideModal open={showQuickGuide} onOpenChange={setShowQuickGuide} />
    </div>
  );
}
