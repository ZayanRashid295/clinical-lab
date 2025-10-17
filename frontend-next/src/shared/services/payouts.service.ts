import { BaseApiService } from "../../app/services/base/base-api.service";

export interface PayoutsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  driverId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export class PayoutsService extends BaseApiService {
  async getPayouts(params?: PayoutsQueryParams): Promise<any> {
    return this.get("/payouts", params);
  }

  async getPayout(id: string): Promise<any> {
    return this.get(`/payouts/${id}`);
  }

  async createPayout(payoutData: any): Promise<any> {
    return this.post("/payouts", payoutData);
  }

  async updatePayout(id: string, payoutData: any): Promise<any> {
    return this.patch(`/payouts/${id}`, payoutData);
  }

  async deletePayout(id: string): Promise<any> {
    return this.delete(`/payouts/${id}`);
  }

  async getDriverPayouts(driverId: string, params?: any): Promise<any> {
    return this.get(`/payouts/driver/${driverId}`, params);
  }

  // Earnings endpoints
  async getEarnings(params?: PayoutsQueryParams): Promise<any> {
    return this.get("/payouts/earnings/all", params);
  }

  async getDriverEarnings(driverId: string, params?: any): Promise<any> {
    return this.get(`/payouts/earnings/driver/${driverId}`, params);
  }

  async getPendingEarnings(driverId: string): Promise<any> {
    return this.get(`/payouts/earnings/pending/${driverId}`);
  }

  async createEarnings(earningsData: any): Promise<any> {
    return this.post("/payouts/earnings", earningsData);
  }

  async calculateEarningsForRide(rideId: string): Promise<any> {
    return this.post(`/payouts/earnings/calculate/${rideId}`);
  }

  // Payout settings endpoints
  async getPayoutSettings(driverId: string): Promise<any> {
    return this.get(`/payouts/settings/driver/${driverId}`);
  }

  async updatePayoutSettings(
    driverId: string,
    settingsData: any
  ): Promise<any> {
    return this.patch(`/payouts/settings/driver/${driverId}`, settingsData);
  }

  // Payout statistics endpoints
  async getPayoutStats(): Promise<any> {
    return this.get("/payouts/stats/overview");
  }

  async getDriverPayoutStats(driverId: string): Promise<any> {
    return this.get(`/payouts/stats/driver/${driverId}`);
  }

  // Admin payout endpoints
  async processScheduledPayouts(): Promise<any> {
    return this.post("/payouts/process-scheduled");
  }
}

export const payoutsService = new PayoutsService();
