import { BaseApiService } from "../base/base-api.service";
import type {
  Achievement,
  AchievementsOverview,
  AchievementMetric,
} from "./types";

export class AchievementsService extends BaseApiService {
  private endpoint = "/achievements";

  async list(): Promise<Achievement[]> {
    return this.get(this.endpoint);
  }

  async overview(): Promise<AchievementsOverview> {
    return this.get(`${this.endpoint}/me`);
  }

  async leaderboard(limit = 10) {
    return this.get(`${this.endpoint}/leaderboard`, { limit });
  }

  async record(metric: AchievementMetric, amount?: number) {
    return this.post(`${this.endpoint}/record`, { metric, amount });
  }
}

export const achievementsService = new AchievementsService();
