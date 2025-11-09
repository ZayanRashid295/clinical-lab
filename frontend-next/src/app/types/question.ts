// Question Management Types

export interface Question {
  id: string;
  topicId: string;
  productTagId?: string;
  question: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topic?: {
    id: string;
    name: string;
    chapter?: {
      id: string;
      name: string;
      section?: {
        id: string;
        name: string;
        product?: {
          id: string;
          name: string;
        };
      };
    };
  };
  productTag?: {
    id: string;
    name: string;
    color?: string;
  };
  choices?: QuestionChoice[];
}

export interface QuestionChoice {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  question?: {
    id: string;
    question: string;
    topic?: {
      id: string;
      name: string;
    };
  };
}

// Query Parameters
export interface QuestionQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "question" | "difficulty" | "points" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  difficulty?: "easy" | "medium" | "hard";
  topicId?: string;
  productTagId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface QuestionChoiceQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "order";
  sortOrder?: "asc" | "desc";
  questionId?: string;
  isCorrect?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Create DTOs
export interface CreateQuestionDto {
  topicId: string;
  productTagId?: string;
  question: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  points?: number;
  isActive?: boolean;
}

export interface UpdateQuestionDto {
  topicId?: string;
  productTagId?: string;
  question?: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  points?: number;
  isActive?: boolean;
}

export interface CreateQuestionChoiceDto {
  questionId: string;
  text: string;
  isCorrect: boolean;
  order?: number;
}

export interface UpdateQuestionChoiceDto {
  text?: string;
  isCorrect?: boolean;
  order?: number;
}

// Filter interfaces
export interface QuestionFilters extends QuestionQueryParams {}
export interface QuestionChoiceFilters extends QuestionChoiceQueryParams {}

