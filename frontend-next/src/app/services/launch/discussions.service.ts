import { BaseApiService } from "../base/base-api.service";
import type {
  Discussion,
  DiscussionContext,
  DiscussionReply,
  DiscussionWithReplies,
} from "./types";

export interface CreateDiscussionPayload {
  title: string;
  body: string;
  context?: DiscussionContext;
  questionId?: string;
  topicId?: string;
  systemId?: string;
  productId?: string;
}

export interface QueryDiscussionsParams {
  search?: string;
  context?: DiscussionContext;
  questionId?: string;
  topicId?: string;
  systemId?: string;
  productId?: string;
  authorId?: string;
}

export class DiscussionsService extends BaseApiService {
  private endpoint = "/discussions";

  async list(params: QueryDiscussionsParams = {}): Promise<Discussion[]> {
    return this.get(this.endpoint, params as Record<string, any>);
  }

  async findOne(id: string): Promise<DiscussionWithReplies> {
    return this.get(`${this.endpoint}/${id}`);
  }

  async create(payload: CreateDiscussionPayload): Promise<Discussion> {
    return this.post(this.endpoint, payload);
  }

  async update(id: string, payload: Partial<CreateDiscussionPayload> & { pinned?: boolean; isClosed?: boolean; }): Promise<Discussion> {
    return this.patch(`${this.endpoint}/${id}`, payload);
  }

  async remove(id: string): Promise<{ message: string }> {
    return this.delete(`${this.endpoint}/${id}`);
  }

  async reply(id: string, body: string, isAnswer = false): Promise<DiscussionReply> {
    return this.post(`${this.endpoint}/${id}/replies`, { body, isAnswer });
  }

  async vote(id: string, vote: 1 | -1) {
    return this.post(`${this.endpoint}/${id}/vote`, { vote });
  }
}

export const discussionsService = new DiscussionsService();
