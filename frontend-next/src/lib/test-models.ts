// Test and Assessment Data Models
// Based on UWorld-style test creation interface

export interface Test {
  id: string;
  title: string;
  description?: string;
  type: "practice" | "assessment" | "exam";
  difficulty: "beginner" | "intermediate" | "advanced";
  timeLimit?: number; // in minutes, null for untimed
  totalQuestions: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  createdByUser?: User;
  testQuestions?: TestQuestion[];
  testSessions?: TestSession[];
}

export interface Question {
  id: string;
  content: string; // The question text
  type: "multiple_choice" | "true_false" | "fill_blank" | "essay";
  difficulty: "beginner" | "intermediate" | "advanced";
  subject: string; // e.g., cardiology, neurology, internal_medicine
  topic?: string; // more specific topic within subject
  explanation?: string; // Detailed explanation of the answer
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  createdByUser?: User;
  answers?: Answer[];
  testQuestions?: TestQuestion[];
  questionStats?: QuestionStats;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string; // The answer option text
  isCorrect: boolean;
  order: number; // Order of answer options
  createdAt: string;

  // Relations
  question?: Question;
}

export interface TestQuestion {
  id: string;
  testId: string;
  questionId: string;
  order: number; // Order within the test

  // Relations
  test?: Test;
  question?: Question;
}

export interface TestSession {
  id: string;
  testId: string;
  userId: string;
  status: "in_progress" | "completed" | "abandoned";
  score?: number; // Final score percentage
  timeSpent?: number; // Time spent in seconds
  startedAt: string;
  completedAt?: string;

  // Relations
  test?: Test;
  user?: User;
  sessionAnswers?: SessionAnswer[];
}

export interface SessionAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  answerId?: string; // For multiple choice questions
  answerText?: string; // For text-based answers
  isCorrect?: boolean;
  timeSpent?: number; // Time spent on this question in seconds
  answeredAt: string;

  // Relations
  session?: TestSession;
  question?: Question;
}

export interface QuestionStats {
  id: string;
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  averageTime?: number; // Average time spent in seconds
  lastUpdated: string;

  // Relations
  question?: Question;
}

// Additional interfaces for UI components
export interface TestCreationConfig {
  title: string;
  description?: string;
  type: "practice" | "assessment" | "exam";
  difficulty: "beginner" | "intermediate" | "advanced";
  timeLimit?: number;
  subjectFilters: string[];
  topicFilters: string[];
  difficultyFilters: string[];
  questionCount: number;
}

export interface QuestionFilter {
  subjects: string[];
  topics: string[];
  difficulties: string[];
  questionTypes: string[];
  searchTerm?: string;
  hasExplanation?: boolean;
  sortBy: "created" | "difficulty" | "subject" | "topic";
  sortOrder: "asc" | "desc";
}

export interface TestSessionState {
  currentQuestionIndex: number;
  answers: Map<string, SessionAnswer>;
  timeRemaining?: number;
  isSubmitted: boolean;
  showReview: boolean;
}

// Medical-specific question categories
export const MEDICAL_SUBJECTS = [
  "internal_medicine",
  "cardiology",
  "neurology",
  "gastroenterology",
  "pulmonology",
  "nephrology",
  "endocrinology",
  "rheumatology",
  "hematology",
  "oncology",
  "surgery",
  "orthopedics",
  "urology",
  "gynecology",
  "obstetrics",
  "pediatrics",
  "psychiatry",
  "dermatology",
  "ophthalmology",
  "otolaryngology",
  "emergency_medicine",
  "anesthesiology",
  "radiology",
  "pathology",
  "pharmacology",
  "public_health",
  "ethics",
  "biostatistics",
] as const;

export const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "fill_blank",
  "essay",
  "matching",
  "ordering",
  "image_based",
] as const;

export const DIFFICULTY_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export const TEST_TYPES = ["practice", "assessment", "exam"] as const;

// Utility types
export type MedicalSubject = (typeof MEDICAL_SUBJECTS)[number];
export type QuestionType = (typeof QUESTION_TYPES)[number];
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
export type TestType = (typeof TEST_TYPES)[number];

// User interface (minimal for this context)
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}
