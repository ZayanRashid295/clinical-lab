// Main API service that aggregates all module-specific services
import { authService } from "./auth.service";
import { usersService } from "./users.service";
import { billingService } from "@/app/services/billing/billing.service";
import { notificationsService } from "./notifications.service";
import { chatService } from "./chat.service";
import { adminService } from "./admin.service";

class ApiService {
  async login(email: string, password: string): Promise<any> {
    return authService.login(email, password);
  }

  async register(userData: any): Promise<any> {
    return authService.register(userData);
  }

  async getProfile(): Promise<any> {
    return authService.getProfile();
  }

  async logout(): Promise<any> {
    return authService.logout();
  }

  async getUsers(): Promise<any> {
    return usersService.getUsers();
  }

  async getUser(id: string): Promise<any> {
    return usersService.getUser(id);
  }

  async updateUser(id: string, userData: any): Promise<any> {
    return usersService.updateUser(id, userData);
  }

  async getMyBilling(): Promise<any> {
    return billingService.getMyBilling();
  }

  async getPublicPlans(): Promise<any> {
    return billingService.getPublicPlans();
  }

  async getNotifications(): Promise<any> {
    return notificationsService.getNotifications();
  }

  async markNotificationAsRead(id: string): Promise<any> {
    return notificationsService.markNotificationAsRead(id);
  }

  async getChatRooms(): Promise<any> {
    return chatService.getChatRooms();
  }

  async createChatRoom(roomData: any): Promise<any> {
    return chatService.createChatRoom(roomData);
  }

  async sendMessage(messageData: any): Promise<any> {
    return chatService.sendMessage(messageData);
  }

  async getRoomMessages(roomId: string): Promise<any> {
    return chatService.getRoomMessages(roomId);
  }

  async getSystemStats(): Promise<any> {
    return adminService.getSystemStats();
  }

  async getReports(): Promise<any> {
    return adminService.getReports();
  }
}

export const apiService = new ApiService();
export default apiService;
