"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SELECT_EMPTY_VALUE,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Plus,
  Loader2,
  RefreshCw,
  Trash2,
  Edit,
  X,
  RotateCcw,
  ChevronRight,
  Layers,
  Clock,
  Trophy,
  Target,
  Save,
} from "lucide-react";
import {
  flashcardsService,
  type Flashcard,
  type FlashcardRating,
  type FlashcardsStats,
  type CreateFlashcardPayload,
} from "@/app/services/student";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";
import {
  STUDY_FEATURE_KEYS,
  useStudyFeatureGate,
} from "@/hooks/useSubscriptionUpgradeModal";
import { useConfirm } from "@/hooks/useConfirm";
import { APP_GLASS_CARD, APP_PAGE_PADDING, APP_PAGE_SHELL } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";

const blankDraft: CreateFlashcardPayload = {
  deck: "General",
  front: "",
  back: "",
  hint: "",
  difficulty: "medium",
};

export default function FlashcardsPage() {
  const { confirm } = useConfirm();
  const {
    handleSubscriptionError,
    ensureAccess,
    UpgradeModal,
  } = useStudyFeatureGate(STUDY_FEATURE_KEYS.flashcards, "Flashcards");
  const [tab, setTab] = useState<"review" | "library">("review");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<FlashcardsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<string>("");
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [draft, setDraft] = useState<CreateFlashcardPayload>(blankDraft);
  const [busy, setBusy] = useState(false);

  // review state
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reveal, setReveal] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        flashcardsService.list(deck ? { deck } : undefined),
        flashcardsService.stats(),
      ]);
      setCards(list);
      setStats(s);
    } catch (e) {
      if (!handleSubscriptionError(e, "Flashcards")) {
        setError(getApiErrorMessage(e, "Failed to load flashcards"));
      }
    } finally {
      setLoading(false);
    }
  }, [deck]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const dueCards = useMemo(
    () => cards.filter((c) => new Date(c.dueAt).getTime() <= Date.now()),
    [cards]
  );

  const reviewQueue = dueCards;
  const current = reviewQueue[reviewIdx] ?? null;

  useEffect(() => {
    setReviewIdx(0);
    setReveal(false);
  }, [tab, deck]);

  const submitReview = async (rating: FlashcardRating) => {
    if (!current) return;
    setBusy(true);
    try {
      await flashcardsService.review(current.id, rating);
      const nextIdx = reviewIdx + 1;
      if (nextIdx >= reviewQueue.length) {
        await loadAll();
        setReviewIdx(0);
      } else {
        setReviewIdx(nextIdx);
      }
      setReveal(false);
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not submit review"));
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    if (!ensureAccess()) return;
    setEditing(null);
    setDraft({ ...blankDraft, deck: deck || "General" });
    setShowEditor(true);
  };
  const openEdit = (c: Flashcard) => {
    setEditing(c);
    setDraft({
      deck: c.deck,
      front: c.front,
      back: c.back,
      hint: c.hint ?? "",
      difficulty: c.difficulty,
    });
    setShowEditor(true);
  };

  const save = async () => {
    if (!draft.front.trim() || !draft.back.trim()) return;
    if (!editing && !ensureAccess()) return;
    setBusy(true);
    try {
      if (editing) {
        await flashcardsService.update(editing.id, draft);
      } else {
        await flashcardsService.create(draft);
      }
      setShowEditor(false);
      await loadAll();
    } catch (e) {
      if (!handleSubscriptionError(e, "Flashcards")) {
        setError(getApiErrorMessage(e, "Could not save card"));
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Flashcard) => {
    const ok = await confirm({
      title: "Delete flashcard?",
      message: "This card will be removed from your library.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await flashcardsService.remove(c.id);
      await loadAll();
    } catch (e) {
      if (!handleSubscriptionError(e, "Flashcards")) {
        setError(getApiErrorMessage(e, "Could not delete"));
      }
    }
  };

  return (
    <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING, "space-y-6")}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Flashcards</h1>
          <p className="text-muted-foreground mt-2">
            Spaced-repetition review for high-yield material
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          <Button variant="outline" size="sm" onClick={loadAll}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> New Card
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          label="Total"
          value={stats?.total ?? cards.length}
          icon={Layers}
          color="text-primary-600 dark:text-primary-400"
        />
        <StatTile
          label="Due now"
          value={stats?.due ?? dueCards.length}
          icon={Clock}
          color="text-primary-600 dark:text-primary-400"
        />
        <StatTile
          label="Mastered"
          value={stats?.mastered ?? 0}
          icon={Trophy}
          color="text-primary-600 dark:text-primary-400"
        />
        <StatTile
          label="Reviewed today"
          value={stats?.reviewedToday ?? 0}
          icon={Target}
          color="text-primary-600 dark:text-primary-400"
        />
      </div>

      <Card className={cn(APP_GLASS_CARD)}>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={tab === "review" ? "default" : "outline"}
              onClick={() => setTab("review")}
            >
              Review
            </Button>
            <Button
              size="sm"
              variant={tab === "library" ? "default" : "outline"}
              onClick={() => setTab("library")}
            >
              Library
            </Button>
          </div>
          <div className="flex-1" />
          <div className="w-56">
            <Select
              value={deck || SELECT_EMPTY_VALUE}
              onValueChange={(value) =>
                setDeck(value === SELECT_EMPTY_VALUE ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All decks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_EMPTY_VALUE}>All decks</SelectItem>
                {(stats?.decks ?? []).map((d) => (
                  <SelectItem key={d.deck} value={d.deck}>
                    {d.deck} · {d._count._all}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {tab === "review" ? (
        <Card className={cn(APP_GLASS_CARD)}>
          <CardContent className="p-6">
            {reviewQueue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="mx-auto h-10 w-10 mb-3 text-emerald-500" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">
                  No cards are due right now. Add new ones or check back later.
                </p>
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" /> Create card
                </Button>
              </div>
            ) : current ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Card {reviewIdx + 1} of {reviewQueue.length}
                  </span>
                  <Badge variant="outline">{current.deck}</Badge>
                </div>
                <Card className="min-h-[180px] border-slate-200/80 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                  <CardContent className="p-6 flex items-center justify-center text-center">
                    <p className="text-xl whitespace-pre-wrap">
                      {current.front}
                    </p>
                  </CardContent>
                </Card>
                {reveal ? (
                  <Card className="min-h-[120px] border-primary-200/80 dark:border-primary-700/50 dark:bg-white/5">
                    <CardContent className="p-6 text-center">
                      <p className="text-lg whitespace-pre-wrap">
                        {current.back}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => setReveal(true)}
                    disabled={busy}
                  >
                    Show answer
                  </Button>
                )}
                {reveal && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(
                      [
                        { r: "AGAIN" as const, label: "Again", color: "bg-red-500 hover:bg-red-600" },
                        { r: "HARD" as const, label: "Hard", color: "bg-orange-500 hover:bg-orange-600" },
                        { r: "GOOD" as const, label: "Good", color: "bg-blue-500 hover:bg-blue-600" },
                        { r: "EASY" as const, label: "Easy", color: "bg-emerald-500 hover:bg-emerald-600" },
                      ] as const
                    ).map((b) => (
                      <Button
                        key={b.r}
                        className={`${b.color} text-white`}
                        onClick={() => submitReview(b.r)}
                        disabled={busy}
                      >
                        {b.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Card key={c.id} className={cn(APP_GLASS_CARD)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {c.deck}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(c)}
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(c)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-foreground line-clamp-3">
                  Q: {c.front}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  A: {c.back}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>Status: {c.status}</span>
                  <span>
                    Due {new Date(c.dueAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && cards.length === 0 && (
            <Card className={cn(APP_GLASS_CARD, "md:col-span-2 lg:col-span-3")}>
              <CardContent className="p-12 text-center">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cards yet</h3>
                <p className="text-muted-foreground mb-4">
                  Build your first deck and start drilling.
                </p>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" /> Create card
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className={cn(APP_GLASS_CARD, "w-full max-w-2xl max-h-[90vh] overflow-y-auto")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editing ? "Edit card" : "New card"}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditor(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Deck (e.g. Cardiology)"
                value={draft.deck ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, deck: e.target.value || "General" }))
                }
              />
              <Textarea
                placeholder="Front (question)"
                value={draft.front}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, front: e.target.value }))
                }
                rows={3}
              />
              <Textarea
                placeholder="Back (answer)"
                value={draft.back}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, back: e.target.value }))
                }
                rows={3}
              />
              <Input
                placeholder="Hint (optional)"
                value={draft.hint ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, hint: e.target.value }))
                }
              />
              <Select
                value={draft.difficulty ?? "medium"}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, difficulty: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditor(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button onClick={save} disabled={busy}>
                  {busy ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {UpgradeModal}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card className={cn(APP_GLASS_CARD)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}
