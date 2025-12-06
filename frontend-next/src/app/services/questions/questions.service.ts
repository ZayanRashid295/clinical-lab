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

  /**
   * Upload an image for question content
   */
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const url = `${API_BASE_URL}${this.endpoint}/upload-image`;

    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    const response = await fetch(url, {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to upload image: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get hierarchical data for test creation (tags, systems, subjects, topics with question counts)
   */
  async getTestCreationData(params?: {
    pool?: "unused" | "marked" | "incorrect" | "correct" | "omitted";
    marked?: boolean;
  }): Promise<{
    tags: Array<{
      id: string;
      name: string;
      description?: string;
      color?: string;
      count: number;
    }>;
    systems: Array<{
      id: string;
      name: string;
      description?: string;
      order: number;
      count: number;
      countsByTag: Record<string, number>;
      subjects: Array<{
        id: string;
        name: string;
        description?: string;
        order: number;
        count: number;
        countsByTag: Record<string, number>;
        topics: Array<{
          id: string;
          name: string;
          description?: string;
          order: number;
          count: number;
          countsByTag: Record<string, number>;
        }>;
      }>;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.pool) {
      queryParams.pool = params.pool;
    }
    if (params?.marked !== undefined) {
      queryParams.marked = params.marked.toString();
    }
    console.log(`📊 QuestionsService.getTestCreationData - queryParams:`, queryParams);
    return this.get(`${this.endpoint}/test-creation-data`, queryParams);
  }

  /**
   * Get filtered questions for test taking based on tags, systems, subjects, topics, and question pool
   */
  async getFilteredQuestions(params: {
    tagIds?: string[];
    systemIds?: string[];
    subjectIds?: string[];
    topicIds?: string[];
    pool?: "unused" | "incorrect" | "correct" | "omitted";
    marked?: boolean;
    limit?: number;
  }): Promise<Question[]> {
    const queryParams: Record<string, any> = {};
    
    if (params.tagIds && params.tagIds.length > 0) {
      queryParams.tagIds = params.tagIds.join(",");
    }
    if (params.systemIds && params.systemIds.length > 0) {
      queryParams.systemIds = params.systemIds.join(",");
    }
    if (params.subjectIds && params.subjectIds.length > 0) {
      queryParams.subjectIds = params.subjectIds.join(",");
    }
    if (params.topicIds && params.topicIds.length > 0) {
      queryParams.topicIds = params.topicIds.join(",");
    }
    if (params.pool) {
      queryParams.pool = params.pool;
    }
    if (params.marked !== undefined) {
      queryParams.marked = params.marked.toString();
    }
    if (params.limit) {
      queryParams.limit = params.limit;
    }

    return this.get(`${this.endpoint}/filtered`, queryParams);
  }
}

