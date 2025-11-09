import { BaseApiService } from "../../app/services/base/base-api.service";

export class NotificationsService extends BaseApiService {
  async getNotifications(): Promise<any> {
    return this.get("/notifications");
  }

  async markNotificationAsRead(id: string): Promise<any> {
    return this.patch(`/notifications/${id}/read`);
  }
}

export const notificationsService = new NotificationsService();
