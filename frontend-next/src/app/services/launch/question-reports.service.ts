import { BaseApiService } from "../base/base-api.service";
import type {
  QuestionReport,
  QuestionReportReason,
  QuestionReportStatus,
} from "./types";

export interface CreateQuestionReportPayload {
  questionId: string;
  reason: QuestionReportReason;
  details?: string;
}

export interface UpdateQuestionReportPayload {
  reason?: QuestionReportReason;
  details?: string;
  status?: QuestionReportStatus;
  resolution?: string;
  questionId?: string;
}

export class QuestionReportsService extends BaseApiService {
  private endpoint = "/question-reports";

  async listMine(): Promise<QuestionReport[]> {
    return this.get(`${this.endpoint}/me`);
  }

  async listAll(opts: { status?: QuestionReportStatus; questionId?: string } = {}): Promise<QuestionReport[]> {
    return this.get(this.endpoint, opts as Record<string, any>);
  }

  async findOne(id: string): Promise<QuestionReport> {
    return this.get(`${this.endpoint}/${id}`);
  }

  async create(payload: CreateQuestionReportPayload): Promise<QuestionReport> {
    return this.post(this.endpoint, payload);
  }

  async update(id: string, payload: UpdateQuestionReportPayload): Promise<QuestionReport> {
    return this.patch(`${this.endpoint}/${id}`, payload);
  }
}

export const questionReportsService = new QuestionReportsService();
