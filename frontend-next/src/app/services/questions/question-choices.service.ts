import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import {
  QuestionChoice,
  QuestionChoiceQueryParams,
  CreateQuestionChoiceDto,
  UpdateQuestionChoiceDto,
} from "../../types/question";

export class QuestionChoicesService extends BaseDataService<
  QuestionChoice,
  QuestionChoiceQueryParams,
  CreateQuestionChoiceDto,
  UpdateQuestionChoiceDto
> {
  protected readonly endpoint = "/questions/choices";

  /**
   * Get question choices with optional filtering and pagination
   */
  async getQuestionChoices(
    params?: QuestionChoiceQueryParams
  ): Promise<PaginatedResponse<QuestionChoice> | QuestionChoice[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific question choice by ID
   */
  async getQuestionChoice(id: string): Promise<QuestionChoice> {
    return this.getById(id);
  }

  /**
   * Create a new question choice
   */
  async createQuestionChoice(
    choiceData: CreateQuestionChoiceDto
  ): Promise<CreateResponse<QuestionChoice>> {
    return this.create(choiceData);
  }

  /**
   * Update an existing question choice
   */
  async updateQuestionChoice(
    id: string,
    choiceData: UpdateQuestionChoiceDto
  ): Promise<UpdateResponse<QuestionChoice>> {
    return this.update(id, choiceData);
  }

  /**
   * Delete a question choice
   */
  async deleteQuestionChoice(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get question choice statistics
   */
  async getQuestionChoiceStats(): Promise<{
    total: number;
    correct: number;
    incorrect: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

