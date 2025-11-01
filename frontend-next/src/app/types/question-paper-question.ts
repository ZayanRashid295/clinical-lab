// QuestionPaperQuestion Types

export interface QuestionPaperQuestion {
  id: string;
  questionPaperId: string;
  questionId: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  questionPaper?: {
    id: string;
    name: string;
    type: string;
  };
  question?: {
    id: string;
    text: string;
    explanation?: string;
    choices?: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
      order: number;
    }>;
    productTag?: {
      id: string;
      name: string;
      color?: string;
    };
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
}

export interface UpdateQuestionPaperQuestionDto {
  userAnswer?: string;
  timeSpent?: number;
  order?: number;
}

// Filter interfaces
export interface QuestionPaperQuestionFilters
  extends QuestionPaperQuestionQueryParams {}

