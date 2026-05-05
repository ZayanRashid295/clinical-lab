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

const TILES = [
  {
    href: "/study/question-bank",
    title: "Question Bank",
    description:
      "Practice the live medical question library. Filter by system, topic and difficulty, and bookmark for later.",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
  },
  {
    href: "/study/flashcards",
    title: "Flashcards",
    description:
      "Spaced-repetition decks. Review what's due today and add your own cards for active recall.",
    icon: Layers,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
  },
  {
    href: "/study/notes",
    title: "Notes",
    description:
      "Pin pearls, mnemonics and full write-ups. Tag and search across everything you've captured.",
    icon: StickyNote,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
  },
  {
    href: "/study-planner",
    title: "Study Planner",
    description:
      "Plan tasks day-by-day, track time and stay accountable. Auto-generates a default plan if you don't have one.",
    icon: CalendarDays,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
  },
  {
    href: "/goals",
    title: "Goals",
    description:
      "Set daily, weekly or monthly targets and watch progress update automatically as you study.",
    icon: Target,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
  },
  {
    href: "/achievements",
    title: "Achievements",
    description:
      "Earn badges, build streaks, and level up as you complete questions, decks and goals.",
    icon: Trophy,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
  },
  {
    href: "/ai-tutor",
    title: "AI Tutor",
    description:
      "Ask anything — get clear explanations, quizzes and study plans tailored to you.",
    icon: Sparkles,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10 dark:bg-violet-500/20",
  },
  {
    href: "/mock-exams",
    title: "Mock Exams",
    description:
      "Take full-length, timed exams that mirror the real thing. Auto-grading and detailed history.",
    icon: ClipboardList,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
  },
  {
    href: "/discussions",
    title: "Discussions",
    description:
      "Ask the community, answer questions, and learn from peers and faculty.",
    icon: MessageSquare,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
  },
  {
    href: "/study-groups",
    title: "Study Groups",
    description:
      "Form a private or public study circle, share posts, and stay accountable together.",
    icon: Users,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10 dark:bg-teal-500/20",
  },
] as const;

export default function StudyIndexPage() {
  const router = useRouter();
  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-3">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Study</h1>
        <p className="text-muted-foreground mt-2">
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
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => router.push(t.href)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${t.bg} ${t.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{t.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  {t.description}
                </CardDescription>
                <Button
                  variant="outline"
                  size="sm"
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
