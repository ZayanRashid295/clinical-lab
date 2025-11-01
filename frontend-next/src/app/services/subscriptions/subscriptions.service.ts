import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Subscription } from "../../types/subscription";
import { SubscriptionQueryParams, CreateSubscriptionDto, UpdateSubscriptionDto } from "./subscriptions.types";

export class SubscriptionsService extends BaseDataService<
  Subscription,
  SubscriptionQueryParams,
  CreateSubscriptionDto,
  UpdateSubscriptionDto
> {
  protected readonly endpoint = "/subscriptions";

  /**
   * Get subscriptions with optional filtering and pagination
   */
  async getSubscriptions(
    params?: SubscriptionQueryParams
  ): Promise<PaginatedResponse<Subscription> | Subscription[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific subscription by ID
   */
  async getSubscription(id: string): Promise<Subscription> {
    return this.getById(id);
  }

  /**
   * Create a new subscription
   */
  async createSubscription(
    subscriptionData: CreateSubscriptionDto
  ): Promise<CreateResponse<Subscription>> {
    return this.create(subscriptionData);
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(
    id: string,
    subscriptionData: UpdateSubscriptionDto
  ): Promise<UpdateResponse<Subscription>> {
    return this.update(id, subscriptionData);
  }

  /**
   * Cancel a subscription (soft delete)
   */
  async cancelSubscription(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    cancelled: number;
    suspended: number;
    pending: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

