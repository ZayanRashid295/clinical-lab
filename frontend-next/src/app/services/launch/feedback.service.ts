import { BaseApiService } from "../base/base-api.service";
import type {
  FeedbackCategory,
  FeedbackPriority,
  FeedbackReply,
  FeedbackStatus,
  FeedbackTicket,
  FeedbackTicketDetail,
} from "./types";

export interface CreateFeedbackPayload {
  subject: string;
  body: string;
  category?: FeedbackCategory;
  priority?: FeedbackPriority;
  attachmentUrl?: string;
}

export interface UpdateFeedbackPayload extends Partial<CreateFeedbackPayload> {
  status?: FeedbackStatus;
  assigneeId?: string;
}

export class FeedbackService extends BaseApiService {
  private endpoint = "/feedback";

  async listMine(): Promise<FeedbackTicket[]> {
    return this.get(`${this.endpoint}/me`);
  }

  async listAll(status?: FeedbackStatus): Promise<FeedbackTicket[]> {
    return this.get(this.endpoint, { status });
  }

  async findOne(id: string): Promise<FeedbackTicketDetail> {
    return this.get(`${this.endpoint}/${id}`);
  }

  async create(payload: CreateFeedbackPayload): Promise<FeedbackTicket> {
    return this.post(this.endpoint, payload);
  }

  async update(id: string, payload: UpdateFeedbackPayload): Promise<FeedbackTicket> {
    return this.patch(`${this.endpoint}/${id}`, payload);
  }

  async reply(id: string, body: string, attachmentUrl?: string): Promise<FeedbackReply> {
    return this.post(`${this.endpoint}/${id}/replies`, { body, attachmentUrl });
  }
}

export const feedbackService = new FeedbackService();
