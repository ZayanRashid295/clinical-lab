// Assessment Management Types (Question Papers)

export interface QuestionPaper {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: "practice" | "mock" | "assessment";
  totalQuestions: number;
  timeLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    questionPaperQuestions: number;
  };
}

// Query Parameters
export interface QuestionPaperQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "type" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  type?: "practice" | "mock" | "assessment";
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Create DTOs
export interface CreateQuestionPaperDto {
  userId: string;
  name: string;
  description?: string;
  type?: "practice" | "mock" | "assessment";
  totalQuestions?: number;
  timeLimit?: number;
  isActive?: boolean;
}

export interface UpdateQuestionPaperDto {
  userId?: string;
  name?: string;
  description?: string;
  type?: "practice" | "mock" | "assessment";
  totalQuestions?: number;
  timeLimit?: number;
  isActive?: boolean;
}

// Filter interfaces
export interface QuestionPaperFilters extends QuestionPaperQueryParams {}

