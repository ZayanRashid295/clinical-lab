import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Topic } from "../../types/content";
import {
  TopicQueryParams,
  CreateTopicDto,
  UpdateTopicDto,
} from "./topics.types";

export class TopicsService extends BaseDataService<
  Topic,
  TopicQueryParams,
  CreateTopicDto,
  UpdateTopicDto
> {
  protected readonly endpoint = "/content/topics";

  async getTopics(
    params?: TopicQueryParams
  ): Promise<PaginatedResponse<Topic> | Topic[]> {
    return this.getAll(params);
  }

  async getTopic(id: string): Promise<Topic> {
    return this.getById(id);
  }

  async createTopic(
    topicData: CreateTopicDto
  ): Promise<CreateResponse | Topic> {
    return this.create(topicData);
  }

  async updateTopic(
    id: string,
    topicData: UpdateTopicDto
  ): Promise<UpdateResponse | Topic> {
    return this.update(id, topicData);
  }

  async deactivateTopic(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  async getTopicStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}
