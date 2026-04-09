import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { QuestionPaper } from "../../types/assessment";
import {
  QuestionPaperQueryParams,
  CreateQuestionPaperDto,
  UpdateQuestionPaperDto,
} from "./question-papers.types";

export class QuestionPapersService extends BaseDataService<
  QuestionPaper,
  QuestionPaperQueryParams,
  CreateQuestionPaperDto,
  UpdateQuestionPaperDto
> {
  protected readonly endpoint = "/assessments";

  /**
   * Get question papers with optional filtering and pagination
   */
  async getQuestionPapers(
    params?: QuestionPaperQueryParams
  ): Promise<PaginatedResponse<QuestionPaper> | QuestionPaper[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific question paper by ID
   */
  async getQuestionPaper(id: string): Promise<QuestionPaper> {
    return this.getById(id);
  }

  /**
   * Create a new question paper
   */
  async createQuestionPaper(
    questionPaperData: CreateQuestionPaperDto
  ): Promise<CreateResponse | QuestionPaper> {
    return this.create(questionPaperData);
  }

  /**
   * Update an existing question paper
   */
  async updateQuestionPaper(
    id: string,
    questionPaperData: UpdateQuestionPaperDto
  ): Promise<UpdateResponse | QuestionPaper> {
    return this.update(id, questionPaperData);
  }

  /**
   * Deactivate a question paper (soft delete)
   */
  async deactivateQuestionPaper(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get question paper statistics
   */
  async getQuestionPaperStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }

  /**
   * Get user question pool statistics (unused, incorrect, marked, omitted, correct)
   */
  async getUserQuestionPoolStats(filters?: {
    systemIds?: string[];
    topicIds?: string[];
    subtopicIds?: string[];
    marked?: boolean;
  }): Promise<{
    unused: number;
    incorrect: number;
    marked: number;
    omitted: number;
    correct: number;
    total: number;
  }> {
    const queryParams: Record<string, string> = {};
    
    if (filters?.systemIds && filters.systemIds.length > 0) {
      queryParams.systemIds = filters.systemIds.join(",");
    }
    if (filters?.topicIds && filters.topicIds.length > 0) {
      queryParams.topicIds = filters.topicIds.join(",");
    }
    if (filters?.subtopicIds && filters.subtopicIds.length > 0) {
      queryParams.subtopicIds = filters.subtopicIds.join(",");
    }
    if (filters?.marked !== undefined) {
      queryParams.marked = filters.marked.toString();
    }

    return this.get(`${this.endpoint}/question-pool/stats`, queryParams);
  }

  /**
   * Get assessment results for a question paper
   */
  async getAssessmentResults(id: string): Promise<{
    questionPaper: {
      id: string;
      name: string;
      type: string;
      timeLimit?: number;
    };
    results: {
      totalQuestions: number;
      answeredQuestions: number;
      unansweredQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      score: number;
      percentage: number;
    };
    questions: Array<{
      id: string;
      order: number;
      question: any;
      userAnswer?: string;
      isCorrect?: boolean;
      timeSpent?: number;
      markedForReview: boolean;
    }>;
  }> {
    return this.get(`${this.endpoint}/${id}/results`);
  }
}

