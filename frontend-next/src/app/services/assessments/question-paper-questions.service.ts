import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { QuestionPaperQuestion } from "../../types/question-paper-question";
import {
  QuestionPaperQuestionQueryParams,
  CreateQuestionPaperQuestionDto,
  UpdateQuestionPaperQuestionDto,
} from "../../types/question-paper-question";

export class QuestionPaperQuestionsService extends BaseDataService<
  QuestionPaperQuestion,
  QuestionPaperQuestionQueryParams,
  CreateQuestionPaperQuestionDto,
  UpdateQuestionPaperQuestionDto
> {
  protected readonly endpoint = "/assessments/questions";

  /**
   * Get question paper questions with optional filtering and pagination
   */
  async getQuestionPaperQuestions(
    params?: QuestionPaperQuestionQueryParams
  ): Promise<
    PaginatedResponse<QuestionPaperQuestion> | QuestionPaperQuestion[]
  > {
    return this.getAll(params);
  }

  /**
   * Get a specific question paper question by ID
   */
  async getQuestionPaperQuestion(
    id: string
  ): Promise<QuestionPaperQuestion> {
    return this.getById(id);
  }

  /**
   * Create a new question paper question
   */
  async createQuestionPaperQuestion(
    questionPaperQuestionData: CreateQuestionPaperQuestionDto
  ): Promise<CreateResponse<QuestionPaperQuestion>> {
    return this.create(questionPaperQuestionData);
  }

  /**
   * Update an existing question paper question
   */
  async updateQuestionPaperQuestion(
    id: string,
    questionPaperQuestionData: UpdateQuestionPaperQuestionDto
  ): Promise<UpdateResponse<QuestionPaperQuestion>> {
    return this.update(id, questionPaperQuestionData);
  }

  /**
   * Delete a question paper question
   */
  async deleteQuestionPaperQuestion(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get question paper question statistics
   */
  async getQuestionPaperQuestionStats(): Promise<{
    total: number;
    answered: number;
    unanswered: number;
    correct: number;
    incorrect: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

