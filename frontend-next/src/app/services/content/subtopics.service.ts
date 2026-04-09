import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Subtopic } from "../../types/content";
import {
  SubtopicQueryParams,
  CreateSubtopicDto,
  UpdateSubtopicDto,
} from "./subtopics.types";

export class SubtopicsService extends BaseDataService<
  Subtopic,
  SubtopicQueryParams,
  CreateSubtopicDto,
  UpdateSubtopicDto
> {
  protected readonly endpoint = "/content/subtopics";

  async getSubtopics(
    params?: SubtopicQueryParams
  ): Promise<PaginatedResponse<Subtopic> | Subtopic[]> {
    return this.getAll(params);
  }

  async getSubtopic(id: string): Promise<Subtopic> {
    return this.getById(id);
  }

  async createSubtopic(
    data: CreateSubtopicDto
  ): Promise<CreateResponse | Subtopic> {
    return this.create(data);
  }

  async updateSubtopic(
    id: string,
    data: UpdateSubtopicDto
  ): Promise<UpdateResponse | Subtopic> {
    return this.update(id, data);
  }

  async deactivateSubtopic(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  async getSubtopicStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}
