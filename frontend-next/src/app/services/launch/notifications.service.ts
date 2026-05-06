import { BaseApiService } from "../base/base-api.service";
import type { AppNotification } from "./types";

export class LaunchNotificationsService extends BaseApiService {
  private endpoint = "/notifications";

  async listMine(opts: { unreadOnly?: boolean; take?: number } = {}): Promise<AppNotification[]> {
    return this.get(`${this.endpoint}/me`, {
      unreadOnly: opts.unreadOnly ? "true" : undefined,
      take: opts.take,
    });
  }

  async unreadCount(): Promise<{ count: number }> {
    return this.get(`${this.endpoint}/me/unread-count`);
  }

  async markAsRead(id: string): Promise<AppNotification> {
    return this.patch(`${this.endpoint}/${id}/read`, {});
  }

  async markAllRead(): Promise<{ count: number }> {
    return this.patch(`${this.endpoint}/me/read-all`, {});
  }

  async remove(id: string): Promise<{ message: string }> {
    return this.delete(`${this.endpoint}/${id}`);
  }
}

export const launchNotificationsService = new LaunchNotificationsService();
