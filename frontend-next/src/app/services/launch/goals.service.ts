import { BaseApiService } from "../base/base-api.service";
import type {
  Goal,
  GoalDetail,
  GoalMetric,
  GoalPeriod,
  GoalWithProgress,
} from "./types";

export interface CreateGoalPayload {
  title: string;
  description?: string;
  metric: GoalMetric;
  target: number;
  period?: GoalPeriod;
  reminderEnabled?: boolean;
  reminderHour?: number;
}

export interface UpdateGoalPayload extends Partial<CreateGoalPayload> {
  isActive?: boolean;
}

export class GoalsService extends BaseApiService {
  private endpoint = "/goals";

  async list(): Promise<GoalWithProgress[]> {
    return this.get(this.endpoint);
  }

  async findOne(id: string): Promise<GoalDetail> {
    return this.get(`${this.endpoint}/${id}`);
  }

  async create(payload: CreateGoalPayload): Promise<Goal> {
    return this.post(this.endpoint, payload);
  }

  async update(id: string, payload: UpdateGoalPayload): Promise<Goal> {
    return this.patch(`${this.endpoint}/${id}`, payload);
  }

  async remove(id: string) {
    return this.delete(`${this.endpoint}/${id}`);
  }

  async record(metric: GoalMetric, amount = 1) {
    return this.post(`${this.endpoint}/record`, { metric, amount });
  }
}

export const goalsService = new GoalsService();
