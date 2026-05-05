import { BaseApiService } from "../base/base-api.service";
import type { StudyGroup, StudyGroupDetail, StudyGroupPost } from "./types";

export interface CreateStudyGroupPayload {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  isPrivate?: boolean;
}

export interface CreateGroupPostPayload {
  body: string;
  attachmentUrl?: string;
  pinned?: boolean;
}

export class StudyGroupsService extends BaseApiService {
  private endpoint = "/study-groups";

  async list(opts: { mineOnly?: boolean } = {}): Promise<StudyGroup[]> {
    return this.get(this.endpoint, { mine: opts.mineOnly ? "true" : undefined });
  }

  async findOne(id: string): Promise<StudyGroupDetail> {
    return this.get(`${this.endpoint}/${id}`);
  }

  async create(payload: CreateStudyGroupPayload): Promise<StudyGroup> {
    return this.post(this.endpoint, payload);
  }

  async update(id: string, payload: Partial<CreateStudyGroupPayload>) {
    return this.patch(`${this.endpoint}/${id}`, payload);
  }

  async remove(id: string) {
    return this.delete(`${this.endpoint}/${id}`);
  }

  async join(id: string) {
    return this.post(`${this.endpoint}/${id}/join`, {});
  }

  async joinByCode(inviteCode: string) {
    return this.post(`${this.endpoint}/join-code`, { inviteCode });
  }

  async leave(id: string) {
    return this.post(`${this.endpoint}/${id}/leave`, {});
  }

  async listPosts(id: string): Promise<StudyGroupPost[]> {
    return this.get(`${this.endpoint}/${id}/posts`);
  }

  async createPost(id: string, payload: CreateGroupPostPayload): Promise<StudyGroupPost> {
    return this.post(`${this.endpoint}/${id}/posts`, payload);
  }
}

export const studyGroupsService = new StudyGroupsService();
