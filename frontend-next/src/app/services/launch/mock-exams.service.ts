import { BaseApiService } from "../base/base-api.service";
import type { MockExam, MockExamAttempt } from "./types";

export interface CreateMockExamPayload {
  title: string;
  description?: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty?: string;
  productId?: string;
  systemIds?: string[];
  topicIds?: string[];
  isPublished?: boolean;
}

export interface SubmitMockExamPayload {
  answers: Array<{
    questionPaperQuestionId: string;
    userAnswer: string;
    timeSpent?: number;
    markedForReview?: boolean;
  }>;
}

export class MockExamsService extends BaseApiService {
  private endpoint = "/mock-exams";

  async list(includeUnpublished = false): Promise<MockExam[]> {
    return this.get(this.endpoint, { includeUnpublished: includeUnpublished ? "true" : undefined });
  }

  async findOne(id: string): Promise<MockExam> {
    return this.get(`${this.endpoint}/${id}`);
  }

  async create(payload: CreateMockExamPayload): Promise<MockExam> {
    return this.post(this.endpoint, payload);
  }

  async update(id: string, payload: Partial<CreateMockExamPayload>) {
    return this.patch(`${this.endpoint}/${id}`, payload);
  }

  async remove(id: string) {
    return this.delete(`${this.endpoint}/${id}`);
  }

  async start(id: string): Promise<{ attempt: MockExamAttempt; questionPaperId: string }> {
    return this.post(`${this.endpoint}/${id}/start`, {});
  }

  async submit(attemptId: string, payload: SubmitMockExamPayload): Promise<MockExamAttempt> {
    return this.post(`${this.endpoint}/attempts/${attemptId}/submit`, payload);
  }

  async myAttempts(): Promise<MockExamAttempt[]> {
    return this.get(`${this.endpoint}/my-attempts`);
  }
}

export const mockExamsService = new MockExamsService();
