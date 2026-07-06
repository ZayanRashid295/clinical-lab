"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SELECT_EMPTY_VALUE,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Checkbox } from "@/shared/ui/checkbox";
import { Badge } from "@/shared/ui/badge";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Check,
  Clock,
  Target,
  BookOpen,
  Star,
  Bookmark,
  Loader2,
  RefreshCw,
  X,
  Play,
} from "lucide-react";
import { QuestionsService } from "@/app/services/questions/questions.service";
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service";
import { QuestionPaperQuestionsService } from "@/app/services/assessments/question-paper-questions.service";
import { authService } from "@/shared/services/auth.service";
import {
  bookmarksService,
  type Bookmark as BookmarkRow,
} from "@/app/services/student";
import ReportQuestionButton from "@/app/components/Launch/ReportQuestionButton";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";
import {
  STUDY_FEATURE_KEYS,
  useStudyFeatureGate,
} from "@/hooks/useSubscriptionUpgradeModal";
import { APP_GLASS_CARD, APP_PAGE_PADDING, APP_PAGE_SHELL } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";

const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "short_answer",
] as const;

interface ApiQuestionChoice {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface ApiQuestion {
  id: string;
  title?: string | null;
  question: string;
  explanation?: string | null;
  difficulty: string;
  systemId?: string | null;
  topicId?: string | null;
  subtopicId?: string | null;
  createdAt: string;
  updatedAt: string;
  system?: { id: string; name: string } | null;
  topic?: { id: string; name: string } | null;
  subtopic?: { id: string; name: string } | null;
  choices?: ApiQuestionChoice[];
}

const questionsService = new QuestionsService();
const papersService = new QuestionPapersService();
const paperQuestionsService = new QuestionPaperQuestionsService();

export default function QuestionBankPage() {
  const router = useRouter();
  const {
    handleSubscriptionError,
    ensureAccess,
    UpgradeModal,
  } = useStudyFeatureGate(STUDY_FEATURE_KEYS.questionBank, "Question Bank");
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [system, setSystem] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [questionType, setQuestionType] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bookmarksOnly, setBookmarksOnly] = useState(false);

  // Preview modal state
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewQ, setPreviewQ] = useState<ApiQuestion | null>(null);
  const [previewPicked, setPreviewPicked] = useState<string | null>(null);

  // Practice creation state
  const [launching, setLaunching] = useState(false);

  const bookmarkedIds = useMemo(
    () =>
      new Set(
        bookmarks
          .filter((b) => b.resourceType === "QUESTION")
          .map((b) => b.resourceId)
      ),
    [bookmarks]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, bRes] = await Promise.all([
        questionsService.getQuestions({ limit: 100 } as any),
        bookmarksService.list("QUESTION").catch(() => []),
      ]);
      const list: ApiQuestion[] = Array.isArray(qRes)
        ? (qRes as any)
        : ((qRes as any)?.data ?? []);
      setQuestions(list);
      setBookmarks(bRes);
    } catch (e: any) {
      if (!handleSubscriptionError(e, "Question Bank")) {
        setError(getApiErrorMessage(e, "Failed to load questions"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Honor optional ?systemId / ?bookmarks=true coming from other pages
  useEffect(() => {
    if (!router.isReady) return;
    const sid = router.query?.systemId;
    if (typeof sid === "string" && sid) setSystem(sid);
    if (router.query?.bookmarks === "true") setBookmarksOnly(true);
  }, [router.isReady, router.query]);

  const systemNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) {
      if (q.system) map.set(q.system.id, q.system.name);
    }
    return Array.from(map.entries());
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        if (bookmarksOnly && !bookmarkedIds.has(q.id)) return false;
        if (
          searchTerm &&
          !q.question.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(q.title || "").toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        if (system && q.systemId !== system) return false;
        if (difficulty && q.difficulty !== difficulty) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "difficulty") {
          return a.difficulty.localeCompare(b.difficulty);
        }
        if (sortBy === "system") {
          return (a.system?.name || "").localeCompare(b.system?.name || "");
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [
    questions,
    searchTerm,
    system,
    difficulty,
    sortBy,
    bookmarksOnly,
    bookmarkedIds,
  ]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleBookmark = async (id: string) => {
    try {
      await bookmarksService.toggle({
        resourceType: "QUESTION",
        resourceId: id,
      });
      const refreshed = await bookmarksService.list("QUESTION");
      setBookmarks(refreshed);
    } catch (e) {
      console.error("Bookmark toggle failed", e);
    }
  };

  const openPreview = async (q: ApiQuestion) => {
    setPreviewId(q.id);
    setPreviewQ(null);
    setPreviewPicked(null);
    setPreviewLoading(true);
    try {
      const full = (await questionsService.getQuestion(q.id)) as any;
      setPreviewQ({ ...q, ...full });
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Could not load question detail"));
      setPreviewId(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewId(null);
    setPreviewQ(null);
    setPreviewPicked(null);
  };

  const launchPractice = async (questionIds: string[]) => {
    if (questionIds.length === 0) return;
    if (!ensureAccess()) return;
    const user = authService.getCurrentUser();
    if (!user?.id) {
      setError("Please sign in to start a practice session");
      return;
    }
    setLaunching(true);
    try {
      const selectedQuestions = questions.filter((q) => questionIds.includes(q.id));
      const stem =
        questions.find((q) => q.id === questionIds[0])?.question ?? "Practice";
      const name =
        questionIds.length === 1
          ? `Quick Practice — ${stem.slice(0, 40)}${stem.length > 40 ? "…" : ""}`
          : `Practice Set (${questionIds.length} questions)`;

      const paper = (await papersService.createQuestionPaper({
        userId: user.id,
        name,
        type: "practice",
        totalQuestions: questionIds.length,
        isActive: true,
      })) as any;

      const paperId = paper?.id ?? paper?.data?.id;
      if (!paperId) throw new Error("Could not create practice session");

      await Promise.all(
        questionIds.map((qid, idx) =>
          paperQuestionsService.createQuestionPaperQuestion({
            questionPaperId: paperId,
            questionId: qid,
            order: idx + 1,
          })
        )
      );

      // Keep "Practice" consistent with the existing Create Test -> Question Generator flow.
      const params = new URLSearchParams();
      const systemIds = Array.from(
        new Set(selectedQuestions.map((q) => q.systemId).filter(Boolean))
      ) as string[];
      const topicIds = Array.from(
        new Set(selectedQuestions.map((q) => q.topicId).filter(Boolean))
      ) as string[];
      const subtopicIds = Array.from(
        new Set(selectedQuestions.map((q) => q.subtopicId).filter(Boolean))
      ) as string[];

      if (systemIds.length > 0) params.set("systemIds", systemIds.join(","));
      if (topicIds.length > 0) params.set("topicIds", topicIds.join(","));
      if (subtopicIds.length > 0) params.set("subtopicIds", subtopicIds.join(","));
      params.set("pool", "unused");
      params.set("limit", String(questionIds.length));
      params.set("mode", "tutor");
      params.set("tutor", "true");
      params.set("questionPaperId", paperId);
      params.set("from", "question-bank");

      window.location.href = `/question-generator/student?${params.toString()}`;
    } catch (e: any) {
      if (!handleSubscriptionError(e, "Question Bank")) {
        setError(getApiErrorMessage(e, "Could not start practice"));
      }
    } finally {
      setLaunching(false);
    }
  };

  const addSelectedToTest = () => {
    if (selected.size === 0) return;
    try {
      const ids = Array.from(selected);
      sessionStorage.setItem("test_creation_seed_questions", JSON.stringify(ids));
    } catch {}
    router.push(
      `/test-creation/study-create?seed=${encodeURIComponent(
        Array.from(selected).join(",")
      )}`
    );
  };

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case "easy":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING, "space-y-6")}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Question Bank</h1>
          <p className="text-muted-foreground mt-2">
            Browse and practice from the live medical question database
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(loading || launching) && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={bookmarksOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setBookmarksOnly((v) => !v)}
          >
            <Bookmark className="h-4 w-4 mr-2" />
            {bookmarksOnly ? "Showing Bookmarks" : "My Bookmarks"} (
            {bookmarkedIds.size})
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <Card className={cn(APP_GLASS_CARD)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" /> Search & Filter
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search questions by content, title, or keywords…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>System</Label>
                <Select
                  value={system || SELECT_EMPTY_VALUE}
                  onValueChange={(value) =>
                    setSystem(value === SELECT_EMPTY_VALUE ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All systems" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_EMPTY_VALUE}>
                      All systems
                    </SelectItem>
                    {systemNames.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={difficulty || SELECT_EMPTY_VALUE}
                  onValueChange={(value) =>
                    setDifficulty(value === SELECT_EMPTY_VALUE ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_EMPTY_VALUE}>
                      All levels
                    </SelectItem>
                    {DIFFICULTY_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l[0].toUpperCase() + l.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={questionType || SELECT_EMPTY_VALUE}
                  onValueChange={(value) =>
                    setQuestionType(value === SELECT_EMPTY_VALUE ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_EMPTY_VALUE}>
                      All types
                    </SelectItem>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="difficulty">Difficulty</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn(APP_GLASS_CARD)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn(APP_GLASS_CARD)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filtered</p>
                <p className="text-2xl font-bold">{filteredQuestions.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn(APP_GLASS_CARD)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold">{selected.size}</p>
              </div>
              <Check className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn(APP_GLASS_CARD)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookmarked</p>
                <p className="text-2xl font-bold">{bookmarkedIds.size}</p>
              </div>
              <Bookmark className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredQuestions.map((q) => (
          <Card
            key={q.id}
            className={cn(
              APP_GLASS_CARD,
              "transition-all duration-200",
              selected.has(q.id)
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:shadow-md"
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.has(q.id)}
                    onCheckedChange={() => toggleSelect(q.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBookmark(q.id)}
                    aria-label="Toggle bookmark"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        bookmarkedIds.has(q.id)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  </Button>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {q.title && (
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {q.title}
                        </p>
                      )}
                      <p className="text-base leading-relaxed text-foreground">
                        {q.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ReportQuestionButton questionId={q.id} variant="outline" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreview(q)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => launchPractice([q.id])}
                        disabled={launching}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Practice
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {q.system?.name && (
                      <Badge variant="outline" className="text-xs">
                        {q.system.name}
                      </Badge>
                    )}
                    {q.topic?.name && (
                      <Badge variant="secondary" className="text-xs">
                        {q.topic.name}
                      </Badge>
                    )}
                    <Badge
                      className={`text-xs ${getDifficultyColor(q.difficulty)}`}
                    >
                      {q.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Added {new Date(q.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && filteredQuestions.length === 0 && (
          <Card className={cn(APP_GLASS_CARD)}>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No questions found</h3>
              <p className="text-muted-foreground mb-4">
                Try clearing your filters or refresh to fetch the latest
                questions from your library.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSystem("");
                    setDifficulty("");
                    setQuestionType("");
                    setBookmarksOnly(false);
                  }}
                >
                  Clear filters
                </Button>
                <Button onClick={load}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh library
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selected.size > 0 && (
        <Card className={cn(APP_GLASS_CARD, "sticky bottom-4")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selected.size} questions selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSelectedToTest}
                >
                  Add to Test Builder
                </Button>
                <Button
                  size="sm"
                  onClick={() => launchPractice(Array.from(selected))}
                  disabled={launching}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Practice Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {previewId && (
        <PreviewModal
          loading={previewLoading}
          question={previewQ}
          picked={previewPicked}
          onPick={setPreviewPicked}
          onClose={closePreview}
          onPractice={() => {
            const id = previewId;
            closePreview();
            if (id) launchPractice([id]);
          }}
        />
      )}
      {UpgradeModal}
    </div>
  );
}

function PreviewModal({
  loading,
  question,
  picked,
  onPick,
  onClose,
  onPractice,
}: {
  loading: boolean;
  question: ApiQuestion | null;
  picked: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
  onPractice: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className={cn(APP_GLASS_CARD, "w-full max-w-3xl max-h-[90vh] overflow-y-auto")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Question Preview</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading || !question ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading question…
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                {question.system?.name && (
                  <Badge variant="outline">{question.system.name}</Badge>
                )}
                {question.topic?.name && (
                  <Badge variant="secondary">{question.topic.name}</Badge>
                )}
                <Badge>{question.difficulty}</Badge>
              </div>

              {question.title && (
                <h3 className="text-lg font-semibold">{question.title}</h3>
              )}
              <p className="text-base whitespace-pre-wrap leading-relaxed">
                {question.question}
              </p>

              {question.choices && question.choices.length > 0 ? (
                <div className="space-y-2">
                  {[...question.choices]
                    .sort((a, b) => a.order - b.order)
                    .map((c, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isPicked = picked === c.id;
                      const reveal = !!picked;
                      const correct = c.isCorrect;
                      const tone = reveal
                        ? correct
                          ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                          : isPicked
                          ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-200"
                        : isPicked
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40";
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onPick(c.id)}
                          className={`w-full text-left flex items-start gap-3 p-3 rounded-md border transition ${tone}`}
                        >
                          <span className="font-semibold w-6 shrink-0">
                            {letter}.
                          </span>
                          <span className="flex-1 text-sm">{c.text}</span>
                          {reveal && correct && (
                            <Check className="h-4 w-4 text-emerald-600" />
                          )}
                        </button>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No answer choices stored on this question yet.
                </p>
              )}

              {picked && question.explanation && (
                <div className="rounded-md border bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Explanation
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {question.explanation}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <p className="text-xs text-muted-foreground">
                  {picked
                    ? "Answer revealed. Start a real practice run for full timing & history."
                    : "Tap an answer to check it instantly."}
                </p>
                <div className="flex items-center gap-2">
                  {question?.id && (
                    <ReportQuestionButton
                      questionId={question.id}
                      variant="outline"
                    />
                  )}
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={onPractice}>
                    <Play className="h-4 w-4 mr-2" />
                    Practice this question
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
