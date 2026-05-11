// QuestionPaperQuestion Types

import type { QuestionHierarchySlice } from "@/app/utils/question-hierarchy-display";

export interface QuestionPaperQuestion {
  id: string;
  questionPaperId: string;
  questionId: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
  markedForReview?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  questionPaper?: {
    id: string;
    name: string;
    type: string;
  };
  question?: QuestionHierarchySlice & {
    id: string;
    text?: string;
    explanation?: string;
    choices?: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
      order: number;
    }>;
  };
}

// Query Parameters
export interface QuestionPaperQuestionQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "order" | "timeSpent";
  sortOrder?: "asc" | "desc";
  questionPaperId?: string;
  questionId?: string;
  hasAnswer?: boolean;
  isCorrect?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Create DTOs
export interface CreateQuestionPaperQuestionDto {
  questionPaperId: string;
  questionId: string;
  order?: number;
  markedForReview?: boolean;
}

export interface UpdateQuestionPaperQuestionDto {
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
  order?: number;
  markedForReview?: boolean;
}

// Filter interfaces
export interface QuestionPaperQuestionFilters
  extends QuestionPaperQuestionQueryParams {}

