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
    // Mock data for payouts
    const mockPayouts = [
      {
        id: "payout_1",
        driverId: "driver_1",
        amount: 150.75,
        status: "COMPLETED",
        scheduledAt: "2024-01-15T10:00:00Z",
        processedAt: "2024-01-15T10:30:00Z",
        payoutMethod: "bank_transfer",
        transactionId: "TXN-001",
        description: "Weekly payout",
      },
      {
        id: "payout_2",
        driverId: "driver_2",
        amount: 89.5,
        status: "PENDING",
        scheduledAt: "2024-01-16T14:00:00Z",
        processedAt: null,
        payoutMethod: "paypal",
        transactionId: null,
        description: "Monthly payout",
      },
    ];

    // Mock pagination response
    const mockResponse = {
      data: mockPayouts,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: mockPayouts.length,
        totalPages: 1,
      },
    };

    return new Promise((resolve) =>
      setTimeout(() => resolve(mockResponse), 500)
    );
  }

  async getPayout(id: string): Promise<any> {
    // Mock single payout
    const mockPayout = {
      id: id,
      driverId: "driver_1",
      amount: 150.75,
      status: "COMPLETED",
      scheduledAt: "2024-01-15T10:00:00Z",
      processedAt: "2024-01-15T10:30:00Z",
      payoutMethod: "bank_transfer",
      transactionId: "TXN-001",
      description: "Weekly payout",
    };
    return new Promise((resolve) => setTimeout(() => resolve(mockPayout), 500));
  }

  async createPayout(payoutData: any): Promise<any> {
    // Mock payout creation
    const mockPayout = {
      id: `payout_${Date.now()}`,
      ...payoutData,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    return new Promise((resolve) => setTimeout(() => resolve(mockPayout), 500));
  }

  async updatePayout(id: string, payoutData: any): Promise<any> {
    // Mock payout update
    const mockPayout = {
      id: id,
      ...payoutData,
      updatedAt: new Date().toISOString(),
    };
    return new Promise((resolve) => setTimeout(() => resolve(mockPayout), 500));
  }

  async deletePayout(id: string): Promise<any> {
    // Mock payout deletion
    return new Promise((resolve) =>
      setTimeout(() => resolve({ id, deleted: true }), 500)
    );
  }

  async getDriverPayouts(driverId: string, params?: any): Promise<any> {
    // Mock driver payouts
    const mockDriverPayouts = [
      {
        id: "payout_1",
        driverId: driverId,
        amount: 150.75,
        status: "COMPLETED",
        scheduledAt: "2024-01-15T10:00:00Z",
        processedAt: "2024-01-15T10:30:00Z",
        payoutMethod: "bank_transfer",
        transactionId: "TXN-001",
        description: "Weekly payout",
      },
    ];
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockDriverPayouts), 500)
    );
  }

  // Earnings endpoints
  async getEarnings(params?: PayoutsQueryParams): Promise<any> {
    // Mock earnings data
    const mockEarnings = [
      {
        id: "earning_1",
        driverId: "driver_1",
        amount: 75.25,
        rideId: "ride_1",
        date: "2024-01-15T10:00:00Z",
        status: "PAID",
      },
    ];
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockEarnings), 500)
    );
  }

  async getDriverEarnings(driverId: string, params?: any): Promise<any> {
    // Mock driver earnings
    const mockEarnings = [
      {
        id: "earning_1",
        driverId: driverId,
        amount: 75.25,
        rideId: "ride_1",
        date: "2024-01-15T10:00:00Z",
        status: "PAID",
      },
    ];
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockEarnings), 500)
    );
  }

  async getPendingEarnings(driverId: string): Promise<any> {
    // Mock pending earnings
    const mockPendingEarnings = [
      {
        id: "earning_2",
        driverId: driverId,
        amount: 45.5,
        rideId: "ride_2",
        date: "2024-01-16T14:00:00Z",
        status: "PENDING",
      },
    ];
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockPendingEarnings), 500)
    );
  }

  async createEarnings(earningsData: any): Promise<any> {
    // Mock earnings creation
    const mockEarning = {
      id: `earning_${Date.now()}`,
      ...earningsData,
      createdAt: new Date().toISOString(),
    };
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockEarning), 500)
    );
  }

  async calculateEarningsForRide(rideId: string): Promise<any> {
    // Mock earnings calculation
    const mockCalculation = {
      rideId: rideId,
      amount: 25.75,
      calculatedAt: new Date().toISOString(),
    };
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockCalculation), 500)
    );
  }

  // Payout settings endpoints
  async getPayoutSettings(driverId: string): Promise<any> {
    // Mock payout settings
    const mockSettings = {
      driverId: driverId,
      method: "BANK_TRANSFER",
      frequency: "WEEKLY",
      minimumAmount: 50.0,
    };
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockSettings), 500)
    );
  }

  async updatePayoutSettings(
    driverId: string,
    settingsData: any
  ): Promise<any> {
    // Mock settings update
    const mockUpdatedSettings = {
      driverId: driverId,
      ...settingsData,
      updatedAt: new Date().toISOString(),
    };
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockUpdatedSettings), 500)
    );
  }

  // Payout statistics endpoints
  async getPayoutStats(): Promise<any> {
    // Mock payout stats
    const mockStats = {
      totalPayouts: 150,
      totalAmount: 12500.75,
      pendingPayouts: 5,
      completedPayouts: 145,
    };
    return new Promise((resolve) => setTimeout(() => resolve(mockStats), 500));
  }

  async getDriverPayoutStats(driverId: string): Promise<any> {
    // Mock driver payout stats
    const mockDriverStats = {
      driverId: driverId,
      totalEarnings: 1250.5,
      totalPayouts: 8,
      pendingAmount: 75.25,
    };
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockDriverStats), 500)
    );
  }

  // Admin payout endpoints
  async processScheduledPayouts(): Promise<any> {
    // Mock processing result
    const mockResult = {
      processed: 5,
      failed: 0,
      processedAt: new Date().toISOString(),
    };
    return new Promise((resolve) => setTimeout(() => resolve(mockResult), 500));
  }
}

export const payoutsService = new PayoutsService();
