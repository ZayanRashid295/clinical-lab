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
  ): Promise<CreateResponse<QuestionPaper>> {
    return this.create(questionPaperData);
  }

  /**
   * Update an existing question paper
   */
  async updateQuestionPaper(
    id: string,
    questionPaperData: UpdateQuestionPaperDto
  ): Promise<UpdateResponse<QuestionPaper>> {
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
}

