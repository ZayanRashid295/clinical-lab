"use client";

import React from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  BookOpen,
  Layers,
  StickyNote,
  CalendarDays,
  ChevronRight,
  Target,
  Trophy,
  Sparkles,
  ClipboardList,
  Users,
  MessageSquare,
} from "lucide-react";
import { APP_GLASS_CARD, APP_PAGE_PADDING, APP_PAGE_SHELL } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";

const TILE_ICON = "text-primary-600 dark:text-primary-400";
const TILE_ICON_BG = "bg-primary-500/10 dark:bg-primary-500/15";

const TILES = [
  {
    href: "/study/question-bank",
    title: "Question Bank",
    description:
      "Practice the live medical question library. Filter by system, topic and difficulty, and bookmark for later.",
    icon: BookOpen,
  },
  {
    href: "/study/flashcards",
    title: "Flashcards",
    description:
      "Spaced-repetition decks. Review what's due today and add your own cards for active recall.",
    icon: Layers,
  },
  {
    href: "/study/notes",
    title: "Notes",
    description:
      "Pin pearls, mnemonics and full write-ups. Tag and search across everything you've captured.",
    icon: StickyNote,
  },
  {
    href: "/study-planner",
    title: "Study Planner",
    description:
      "Plan tasks day-by-day, track time and stay accountable. Auto-generates a default plan if you don't have one.",
    icon: CalendarDays,
  },
  {
    href: "/goals",
    title: "Goals",
    description:
      "Set daily, weekly or monthly targets and watch progress update automatically as you study.",
    icon: Target,
  },
  {
    href: "/achievements",
    title: "Achievements",
    description:
      "Earn badges, build streaks, and level up as you complete questions, decks and goals.",
    icon: Trophy,
  },
  {
    href: "/ai-tutor",
    title: "AI Tutor",
    description:
      "Ask anything — get clear explanations, quizzes and study plans tailored to you.",
    icon: Sparkles,
  },
  {
    href: "/mock-exams",
    title: "Mock Exams",
    description:
      "Take full-length, timed exams that mirror the real thing. Auto-grading and detailed history.",
    icon: ClipboardList,
  },
  {
    href: "/discussions",
    title: "Discussions",
    description:
      "Ask the community, answer questions, and learn from peers and faculty.",
    icon: MessageSquare,
  },
  {
    href: "/study-groups",
    title: "Study Groups",
    description:
      "Form a private or public study circle, share posts, and stay accountable together.",
    icon: Users,
  },
] as const;

export default function StudyIndexPage() {
  const router = useRouter();
  return (
    <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING, "space-y-6")}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Study</h1>
        <p className="text-muted-foreground mt-2 dark:text-slate-400">
          Everything you need to study — questions, flashcards, notes and
          materials in one place.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Card
              key={t.href}
              className={cn(
                "cursor-pointer transition hover:shadow-md",
                APP_GLASS_CARD
              )}
              onClick={() => router.push(t.href)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-lg p-3", TILE_ICON_BG, TILE_ICON)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="dark:text-slate-100">{t.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 dark:text-slate-400">
                  {t.description}
                </CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  className="dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(t.href);
                  }}
                >
                  Open <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
