import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Question, QuestionQueryParams, CreateQuestionDto, UpdateQuestionDto } from "../../types/question";

export class QuestionsService extends BaseDataService<
  Question,
  QuestionQueryParams,
  CreateQuestionDto,
  UpdateQuestionDto
> {
  protected readonly endpoint = "/questions";

  /**
   * Get questions with optional filtering and pagination
   */
  async getQuestions(
    params?: QuestionQueryParams
  ): Promise<PaginatedResponse<Question> | Question[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific question by ID
   */
  async getQuestion(id: string): Promise<Question> {
    return this.getById(id);
  }

  /**
   * Create a new question
   */
  async createQuestion(
    questionData: CreateQuestionDto
  ): Promise<CreateResponse | Question> {
    return this.create(questionData);
  }

  /**
   * Update an existing question
   */
  async updateQuestion(
    id: string,
    questionData: UpdateQuestionDto
  ): Promise<UpdateResponse | Question> {
    return this.update(id, questionData);
  }

  /**
   * Deactivate a question (soft delete)
   */
  async deactivateQuestion(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get question statistics
   */
  async getQuestionStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDifficulty: Record<string, number>;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

