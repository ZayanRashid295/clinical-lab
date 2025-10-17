// Main API service that aggregates all module-specific services
import { authService } from "./auth.service";
import { usersService } from "./users.service";
import { ridesService } from "./rides.service";
import { paymentsService } from "./payments.service";
import { locationsService } from "./locations.service";
import { notificationsService } from "./notifications.service";
import { chatService } from "./chat.service";
import { fleetService } from "./fleet.service";
import { payoutsService } from "./payouts.service";
import { adminService } from "./admin.service";

class ApiService {
  // Auth endpoints
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

  // User endpoints
  async getUsers(): Promise<any> {
    return usersService.getUsers();
  }

  async getUser(id: string): Promise<any> {
    return usersService.getUser(id);
  }

  async updateUser(id: string, userData: any): Promise<any> {
    return usersService.updateUser(id, userData);
  }

  // Ride endpoints
  async getRides(params?: any): Promise<any> {
    return ridesService.getRides(params);
  }

  async createRide(rideData: any): Promise<any> {
    return ridesService.createRide(rideData);
  }

  async getRide(id: string): Promise<any> {
    return ridesService.getRide(id);
  }

  async updateRide(id: string, rideData: any): Promise<any> {
    return ridesService.updateRide(id, rideData);
  }

  // Payment endpoints
  async getPayments(): Promise<any> {
    return paymentsService.getPayments();
  }

  async createPayment(paymentData: any): Promise<any> {
    return paymentsService.createPayment(paymentData);
  }

  async getPayment(id: string): Promise<any> {
    return paymentsService.getPayment(id);
  }

  // Payment method endpoints
  async getPaymentMethods(userId?: string): Promise<any> {
    return paymentsService.getPaymentMethods(userId);
  }

  async createPaymentMethod(methodData: any): Promise<any> {
    return paymentsService.createPaymentMethod(methodData);
  }

  async updatePaymentMethod(id: string, methodData: any): Promise<any> {
    return paymentsService.updatePaymentMethod(id, methodData);
  }

  async deletePaymentMethod(id: string): Promise<any> {
    return paymentsService.deletePaymentMethod(id);
  }

  // Location endpoints
  async createLocation(locationData: any): Promise<any> {
    return locationsService.createLocation(locationData);
  }

  async getLocations(): Promise<any> {
    return locationsService.getLocations();
  }

  async updateDriverLocation(
    driverId: string,
    locationData: any
  ): Promise<any> {
    return locationsService.updateDriverLocation(driverId, locationData);
  }

  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number = 5
  ): Promise<any> {
    return locationsService.getNearbyDrivers(latitude, longitude, radius);
  }

  // Notification endpoints
  async getNotifications(): Promise<any> {
    return notificationsService.getNotifications();
  }

  async markNotificationAsRead(id: string): Promise<any> {
    return notificationsService.markNotificationAsRead(id);
  }

  // Chat endpoints
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

  // Fleet endpoints
  async getFleet(): Promise<any> {
    return fleetService.getFleet();
  }

  async getVehicles(): Promise<any> {
    return fleetService.getVehicles();
  }

  async getDrivers(): Promise<any> {
    return fleetService.getDrivers();
  }

  // Payout endpoints
  async getPayouts(params?: any): Promise<any> {
    return payoutsService.getPayouts(params);
  }

  async getPayout(id: string): Promise<any> {
    return payoutsService.getPayout(id);
  }

  async createPayout(payoutData: any): Promise<any> {
    return payoutsService.createPayout(payoutData);
  }

  async updatePayout(id: string, payoutData: any): Promise<any> {
    return payoutsService.updatePayout(id, payoutData);
  }

  async deletePayout(id: string): Promise<any> {
    return payoutsService.deletePayout(id);
  }

  async getDriverPayouts(driverId: string, params?: any): Promise<any> {
    return payoutsService.getDriverPayouts(driverId, params);
  }

  // Earnings endpoints
  async getEarnings(params?: any): Promise<any> {
    return payoutsService.getEarnings(params);
  }

  async getDriverEarnings(driverId: string, params?: any): Promise<any> {
    return payoutsService.getDriverEarnings(driverId, params);
  }

  async getPendingEarnings(driverId: string): Promise<any> {
    return payoutsService.getPendingEarnings(driverId);
  }

  async createEarnings(earningsData: any): Promise<any> {
    return payoutsService.createEarnings(earningsData);
  }

  async calculateEarningsForRide(rideId: string): Promise<any> {
    return payoutsService.calculateEarningsForRide(rideId);
  }

  // Payout settings endpoints
  async getPayoutSettings(driverId: string): Promise<any> {
    return payoutsService.getPayoutSettings(driverId);
  }

  async updatePayoutSettings(
    driverId: string,
    settingsData: any
  ): Promise<any> {
    return payoutsService.updatePayoutSettings(driverId, settingsData);
  }

  // Payout statistics endpoints
  async getPayoutStats(): Promise<any> {
    return payoutsService.getPayoutStats();
  }

  async getDriverPayoutStats(driverId: string): Promise<any> {
    return payoutsService.getDriverPayoutStats(driverId);
  }

  // Admin payout endpoints
  async processScheduledPayouts(): Promise<any> {
    return payoutsService.processScheduledPayouts();
  }

  // Admin endpoints
  async getSystemStats(): Promise<any> {
    return adminService.getSystemStats();
  }

  async getReports(): Promise<any> {
    return adminService.getReports();
  }
}

export const apiService = new ApiService();
export default apiService;
