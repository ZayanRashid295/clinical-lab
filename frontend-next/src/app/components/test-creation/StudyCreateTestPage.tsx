"use client";

import React, { useState, useCallback, useEffect } from "react";
import { TestModeSelector } from "./TestModeSelector";
import { QuestionPoolSelector } from "./QuestionPoolSelector";
import { MarkedToggle } from "./MarkedToggle";
import { SystemSelector } from "./SystemSelector";
import { TopicSelector } from "./TopicSelector";
import { QuickGuideModal } from "./QuickGuideModal";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { AlertCircle, CheckCircle2, Hash, HelpCircle, ChevronRight } from "lucide-react";
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
import {
  STUDY_FEATURE_KEYS,
  useStudyFeatureGate,
} from "@/hooks/useSubscriptionUpgradeModal";

interface ValidationErrors {
  systems?: string;
  questionCount?: string;
}

export default function StudyCreateTestPage() {
  const [isTutor, setIsTutor] = useState(true);
  const [isTimed, setIsTimed] = useState(false);
  const [selectedPool, setSelectedPool] = useState("unused");
  const [isMarked, setIsMarked] = useState(false);
  /** Curriculum: System → Topic → Subtopic */
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [availableQuestionsCount, setAvailableQuestionsCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [showInsufficientQuestionsDialog, setShowInsufficientQuestionsDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const {
    ensureAccess,
    UpgradeModal: SubscriptionUpgradeModal,
  } = useStudyFeatureGate(STUDY_FEATURE_KEYS.createTest, "Create Test");

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setRefreshTrigger((prev) => prev + 1);
      }
    };
    const handleFocus = () => setRefreshTrigger((prev) => prev + 1);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystemIds((prev) => {
      const next = prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId];
      if (next.length > 0) {
        setValidationErrors((e) => {
          const copy = { ...e };
          delete copy.systems;
          return copy;
        });
      }
      return next;
    });
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSubtopicToggle = (subtopicId: string) => {
    setSelectedSubtopicIds((prev) =>
      prev.includes(subtopicId)
        ? prev.filter((id) => id !== subtopicId)
        : [...prev, subtopicId]
    );
  };

  useEffect(() => {
    const fetchAvailableCount = async () => {
      if (selectedSystemIds.length === 0) {
        setAvailableQuestionsCount(null);
        return;
      }

      try {
        setLoadingCount(true);
        const questionsService = new QuestionsService();
        const poolFilter: "unused" | "incorrect" | "correct" | "omitted" | undefined =
          selectedPool
            ? (selectedPool as "unused" | "incorrect" | "correct" | "omitted")
            : undefined;

        const questions = await questionsService.getFilteredQuestions({
          systemIds: selectedSystemIds,
          topicIds: selectedTopicIds.length > 0 ? selectedTopicIds : undefined,
          subtopicIds: selectedSubtopicIds.length > 0 ? selectedSubtopicIds : undefined,
          pool: poolFilter,
          marked: isMarked ? true : undefined,
          limit: 1000,
        });
        setAvailableQuestionsCount(questions.length === 1000 ? 1000 : questions.length);
      } catch (err) {
        console.error("Failed to fetch available questions count:", err);
        setAvailableQuestionsCount(null);
      } finally {
        setLoadingCount(false);
      }
    };

    const timeoutId = setTimeout(fetchAvailableCount, 300);
    return () => clearTimeout(timeoutId);
  }, [
    selectedSystemIds,
    selectedTopicIds,
    selectedSubtopicIds,
    selectedPool,
    isMarked,
    refreshTrigger,
  ]);

  const validateQuestionCount = useCallback((value: string): string | undefined => {
    if (!value || value.trim() === "") {
      return "Number of questions is required.";
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) return "Please enter a valid number.";
    if (num <= 0) return "Number of questions must be greater than 0.";
    if (num > 40) return "Maximum 40 questions allowed per test.";
    return undefined;
  }, []);

  const handleQuestionCountBlur = () => {
    setTouchedFields((prev) => new Set(prev).add("questionCount"));
    const countError = validateQuestionCount(questionCount);
    setValidationErrors((prev) => {
      const next = { ...prev };
      if (countError) next.questionCount = countError;
      else delete next.questionCount;
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (selectedSystemIds.length === 0) {
      errors.systems = "Select at least one system (e.g. Cardiovascular, Hematology).";
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
    if (!ensureAccess({ requireSubscription: true })) return;

    setError(null);
    setSuccess(null);
    setTouchedFields(new Set(["systems", "questionCount"]));

    if (!validateForm()) {
      const firstErrorField = document.querySelector('[data-validation-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const questionCountNum = parseInt(questionCount, 10);

    if (availableQuestionsCount === null && selectedSystemIds.length > 0) {
      try {
        setLoadingCount(true);
        const questionsService = new QuestionsService();
        const poolFilter: "unused" | "incorrect" | "correct" | "omitted" | undefined =
          selectedPool
            ? (selectedPool as "unused" | "incorrect" | "correct" | "omitted")
            : undefined;

        const questions = await questionsService.getFilteredQuestions({
          systemIds: selectedSystemIds,
          topicIds: selectedTopicIds.length > 0 ? selectedTopicIds : undefined,
          subtopicIds: selectedSubtopicIds.length > 0 ? selectedSubtopicIds : undefined,
          pool: poolFilter,
          marked: isMarked ? true : undefined,
          limit: 1000,
        });
        const count = questions.length === 1000 ? 1000 : questions.length;
        setAvailableQuestionsCount(count);

        if (questionCountNum > count) {
          setShowInsufficientQuestionsDialog(true);
          setLoadingCount(false);
          return;
        }
        setLoadingCount(false);
      } catch (err) {
        console.error("Failed to fetch available questions count:", err);
        setLoadingCount(false);
      }
    } else if (availableQuestionsCount !== null && questionCountNum > availableQuestionsCount) {
      setShowInsufficientQuestionsDialog(true);
      return;
    }

    const params = new URLSearchParams();
    params.set("systemIds", selectedSystemIds.join(","));
    if (selectedTopicIds.length > 0) {
      params.set("topicIds", selectedTopicIds.join(","));
    }
    if (selectedSubtopicIds.length > 0) {
      params.set("subtopicIds", selectedSubtopicIds.join(","));
    }
    if (selectedPool) params.set("pool", selectedPool);
    if (isMarked) params.set("marked", "true");
    params.set("limit", questionCountNum.toString());
    const mode = isTutor ? "tutor" : isTimed ? "timed" : "tutor";
    params.set("mode", mode);
    if (isTimed) params.set("timed", "true");
    if (isTutor) params.set("tutor", "true");
    params.set("from", "create-test");

    window.location.href = `/question-generator/student?${params.toString()}`;
  };

  const isFormValid =
    selectedSystemIds.length > 0 &&
    questionCount &&
    parseInt(questionCount, 10) > 0 &&
    parseInt(questionCount, 10) <= 40;

  const filterSummaryParts: string[] = [];
  if (selectedSystemIds.length > 0) {
    filterSummaryParts.push(
      `${selectedSystemIds.length} system${selectedSystemIds.length === 1 ? "" : "s"}`
    );
  }
  if (selectedTopicIds.length > 0) {
    filterSummaryParts.push(
      `${selectedTopicIds.length} topic${selectedTopicIds.length === 1 ? "" : "s"}`
    );
  }
  if (selectedSubtopicIds.length > 0) {
    filterSummaryParts.push(
      `${selectedSubtopicIds.length} subtopic${selectedSubtopicIds.length === 1 ? "" : "s"}`
    );
  }

  return (
    <div
      className="flex h-screen min-h-0 w-full overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
      data-testid="page-create-test"
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Create Test</h1>
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              Pick systems, then narrow by topic or subtopic
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
            onClick={() => setShowQuickGuide(true)}
          >
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
            Quick Guide
          </Button>
        </header>

        <main className="flex-1 overflow-auto scrollbar-thin">
          <div className="p-6">
            {error && (
              <div className="bg-destructive/5 dark:bg-destructive/10 border border-destructive/20 dark:border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="font-medium">Error:</strong> {error}
                </div>
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-lg flex items-start gap-3 mb-4">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="font-medium">Success:</strong> {success}
                </div>
              </div>
            )}

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
                filters={{
                  systemIds: selectedSystemIds,
                  topicIds: selectedTopicIds,
                  subtopicIds: selectedSubtopicIds,
                }}
              />
            </div>

            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div className="grid min-h-[500px] grid-cols-[280px_1fr] divide-x divide-slate-200/80 dark:divide-white/10">
                <div
                  data-validation-error={!!validationErrors.systems}
                  className="flex flex-col"
                >
                  <SystemSelector
                    selectedSystems={selectedSystemIds}
                    onSystemToggle={handleSystemToggle}
                    selectedPool={selectedPool}
                    isMarked={isMarked}
                  />
                  {validationErrors.systems && (
                    <div className="px-4 py-2 bg-destructive/5 border-t border-destructive/20">
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        {validationErrors.systems}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <TopicSelector
                    selectedSystems={selectedSystemIds}
                    onSystemToggle={handleSystemToggle}
                    selectedPool={selectedPool}
                    selectedTopics={selectedTopicIds}
                    selectedSubtopics={selectedSubtopicIds}
                    isMarked={isMarked}
                    onTopicToggle={handleTopicToggle}
                    onSubtopicToggle={handleSubtopicToggle}
                  />
                </div>
              </div>
            </div>

            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    Question Count
                  </h3>
                  <span className="ml-auto text-xs text-muted-foreground">max 40</span>
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
                          setQuestionCount(
                            Math.min(40, Math.max(0, num)).toString() || ""
                          );
                        }
                      }}
                      onBlur={handleQuestionCountBlur}
                      className={`h-9 w-20 border-slate-200/90 bg-slate-50 text-center dark:border-white/10 dark:bg-white/10 ${
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
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-primary-600 transition-all duration-300 dark:bg-primary-500"
                        style={{
                          width: `${((parseInt(questionCount) || 0) / 40) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {parseInt(questionCount) || 0} in test
                  </span>
                </div>
                {validationErrors.questionCount && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.questionCount}
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="flex h-16 shrink-0 items-center justify-between border-t border-slate-200/80 bg-white/80 px-6 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {filterSummaryParts.length > 0 ? (
              <span className="text-sm text-muted-foreground dark:text-slate-400">
                Filter:{" "}
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  {filterSummaryParts.join(" · ")}
                </span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">No systems selected</span>
            )}
            {selectedSystemIds.length > 0 && (
              <>
                <div className="hidden sm:block h-5 w-px bg-border dark:bg-white/10" />
                <span className="text-sm text-muted-foreground dark:text-slate-400">
                  Matching pool:{" "}
                  <span className="font-medium text-gray-900 dark:text-slate-100">
                    {loadingCount
                      ? "…"
                      : availableQuestionsCount === null
                        ? "—"
                        : availableQuestionsCount === 1000
                          ? "1000+"
                          : availableQuestionsCount.toLocaleString()}
                  </span>{" "}
                  questions
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-transparent"
              onClick={() => {
                setSelectedSystemIds([]);
                setSelectedTopicIds([]);
                setSelectedSubtopicIds([]);
                setQuestionCount("");
                setSelectedPool("unused");
                setIsMarked(false);
                setAvailableQuestionsCount(null);
              }}
            >
              Reset All
            </Button>
            <Button
              size="sm"
              className="h-9 px-6"
              onClick={handleGenerateTest}
              data-testid="button-generate-test"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Generating…" : (
                <>
                  Generate Test
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>

      <AlertDialog
        open={showInsufficientQuestionsDialog}
        onOpenChange={setShowInsufficientQuestionsDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Not Enough Questions Available
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              <p className="mb-2">
                You requested <strong>{questionCount}</strong> questions, but only{" "}
                <strong>{availableQuestionsCount}</strong> match your current filters.
              </p>
              <p className="text-sm text-muted-foreground">
                Add more systems, broaden topic selection, change the question pool, or
                lower the question count.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowInsufficientQuestionsDialog(false)}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickGuideModal open={showQuickGuide} onOpenChange={setShowQuickGuide} />
      {SubscriptionUpgradeModal}
    </div>
  );
}
