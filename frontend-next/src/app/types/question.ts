// Question Management Types

export interface Question {
  id: string;
  subtopicId: string;
  topicId?: string;
  title?: string;
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
    system?: {
      id: string;
      name: string;
      product?: {
        id: string;
        name: string;
      };
    };
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
  dateFrom?: string;
  dateTo?: string;
  _t?: string | number; // Cache buster parameter
  /** Backend returns all rows (ignores page/limit). */
  listAll?: boolean;
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
  subtopicId: string;
  topicId?: string;
  question: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  points?: number;
  isActive?: boolean;
  explanationBlocks?: Array<{
    type: "TEXT" | "TABLE" | "IMAGES";
    order?: number;
    data: any;
  }>;
  perAnswerExplanations?: Record<
    string,
    Array<{
      type: "TEXT" | "TABLE" | "IMAGES";
      order?: number;
      data: any;
    }>
  >;
  questionStemBlocks?: Array<{
    type: "TEXT" | "IMAGES" | "TABLE";
    order?: number;
    data: any;
  }>;
  choices?: Array<{
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
}
export interface UpdateQuestionDto {
  subtopicId?: string;
  topicId?: string;
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

