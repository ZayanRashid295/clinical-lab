// Shared types for student-facing API responses.

export type BookmarkType =
  | "QUESTION"
  | "NOTE"
  | "FLASHCARD"
  | "TOPIC"
  | "SUBTOPIC"
  | "PRODUCT"
  | "MATERIAL";

export interface Bookmark {
  id: string;
  userId: string;
  resourceType: BookmarkType;
  resourceId: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentNote {
  id: string;
  userId: string;
  title: string;
  body: string;
  color?: string | null;
  pinned: boolean;
  tags?: string[] | null;
  questionId?: string | null;
  topicId?: string | null;
  subtopicId?: string | null;
  systemId?: string | null;
  productId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FlashcardStatus = "NEW" | "LEARNING" | "REVIEW" | "MASTERED";
export type FlashcardRating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface Flashcard {
  id: string;
  userId: string;
  deck: string;
  front: string;
  back: string;
  hint?: string | null;
  tags?: string[] | null;
  difficulty: string;
  status: FlashcardStatus;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StudyTaskType =
  | "READING"
  | "PRACTICE"
  | "REVIEW"
  | "FLASHCARDS"
  | "ASSESSMENT"
  | "GENERAL";

export type StudyTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED";

export interface StudyPlan {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  id: string;
  studyPlanId: string;
  userId: string;
  title: string;
  description?: string | null;
  type: StudyTaskType;
  scheduledFor: string;
  durationMinutes: number;
  status: StudyTaskStatus;
  completedAt?: string | null;
  systemId?: string | null;
  topicId?: string | null;
  subtopicId?: string | null;
  questionPaperId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlanProgress {
  plan: StudyPlan | null;
  total: number;
  completed: number;
  overdue: number;
  incomplete: number;
  percent: number;
  daysRemaining: number;
}

export interface StudentDashboardStats {
  questionScore: { correct: number; attempted: number; percent: number };
  qbankUsage: { used: number; total: number; percent: number };
  tests: {
    total: number;
    completed: number;
    percent: number;
    lastTest: {
      id: string;
      name: string;
      type: string;
      totalQuestions: number;
      answered: number;
      correct: number;
      isCompleted: boolean;
      isInProgress: boolean;
      updatedAt: string;
      createdAt: string;
    } | null;
    inProgress: {
      id: string;
      name: string;
      type: string;
      totalQuestions: number;
      answered: number;
      correct: number;
      isCompleted: boolean;
      isInProgress: boolean;
    } | null;
  };
  bookmarks: number;
  flashcards: { total: number; due: number };
  notes: number;
  plan: { active: StudyPlan | null; progress: StudyPlanProgress };
}
