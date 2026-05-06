import { BaseApiService } from "../base/base-api.service";
import type {
  AiTutorConversation,
  AiTutorConversationDetail,
  AiTutorContext,
  AiTutorMessage,
} from "./types";

export interface CreateConversationPayload {
  title?: string;
  context?: AiTutorContext;
  contextId?: string;
}

export interface UpdateConversationPayload {
  title?: string;
  pinned?: boolean;
  archive?: boolean;
}

export class AiTutorService extends BaseApiService {
  private endpoint = "/ai-tutor";

  async listConversations(): Promise<AiTutorConversation[]> {
    return this.get(`${this.endpoint}/conversations`);
  }

  async createConversation(payload: CreateConversationPayload): Promise<AiTutorConversation> {
    return this.post(`${this.endpoint}/conversations`, payload);
  }

  async getConversation(id: string): Promise<AiTutorConversationDetail> {
    return this.get(`${this.endpoint}/conversations/${id}`);
  }

  async updateConversation(id: string, payload: UpdateConversationPayload): Promise<AiTutorConversation> {
    return this.patch(`${this.endpoint}/conversations/${id}`, payload);
  }

  async deleteConversation(id: string) {
    return this.delete(`${this.endpoint}/conversations/${id}`);
  }

  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<{ userMessage: AiTutorMessage; assistantMessage: AiTutorMessage }> {
    return this.post(`${this.endpoint}/conversations/${conversationId}/messages`, {
      content,
    });
  }
}

export const aiTutorService = new AiTutorService();
