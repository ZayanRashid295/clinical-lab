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

  /**
   * Get topics with optional filtering and pagination
   */
  async getTopics(
    params?: TopicQueryParams
  ): Promise<PaginatedResponse<Topic> | Topic[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific topic by ID
   */
  async getTopic(id: string): Promise<Topic> {
    return this.getById(id);
  }

  /**
   * Create a new topic
   */
  async createTopic(
    topicData: CreateTopicDto
  ): Promise<CreateResponse | Topic> {
    return this.create(topicData);
  }

  /**
   * Update an existing topic
   */
  async updateTopic(
    id: string,
    topicData: UpdateTopicDto
  ): Promise<UpdateResponse | Topic> {
    return this.update(id, topicData);
  }

  /**
   * Deactivate a topic (soft delete)
   */
  async deactivateTopic(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get topic statistics
   */
  async getTopicStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

