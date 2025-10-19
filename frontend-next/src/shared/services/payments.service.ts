import { BaseApiService } from "../../app/services/base/base-api.service";

export class PaymentsService extends BaseApiService {
  async getPayments(): Promise<any> {
    // Mock data for payments
    const mockPayments = [
      {
        id: "pay_1",
        amount: 25.5,
        status: "completed",
        method: "Credit Card",
        date: "2024-01-15",
      },
      {
        id: "pay_2",
        amount: 18.75,
        status: "pending",
        method: "Bank Transfer",
        date: "2024-01-16",
      },
    ];
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockPayments), 500)
    );
  }

  async createPayment(paymentData: any): Promise<any> {
    // Mock payment creation
    const mockPayment = {
      id: `pay_${Date.now()}`,
      ...paymentData,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockPayment), 500)
    );
  }

  async getPayment(id: string): Promise<any> {
    // Mock single payment
    const mockPayment = {
      id: id,
      amount: 25.5,
      status: "completed",
      method: "Credit Card",
      date: "2024-01-15",
    };
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockPayment), 500)
    );
  }

  // Payment method endpoints
  async getPaymentMethods(userId?: string): Promise<any> {
    // Mock data for payment methods
    const mockPaymentMethods = [
      {
        id: "pm_1",
        type: "CREDIT_CARD",
        provider: "Visa",
        last4: "1234",
        createdAt: "2024-01-15T10:30:00Z",
        isDefault: true,
        brand: "visa",
      },
      {
        id: "pm_2",
        type: "BANK_ACCOUNT",
        provider: "Chase",
        last4: "5678",
        createdAt: "2024-01-10T14:20:00Z",
        isDefault: false,
        brand: "chase",
      },
    ];
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockPaymentMethods), 500)
    );
  }

  async createPaymentMethod(methodData: any): Promise<any> {
    // Mock payment method creation
    const mockMethod = {
      id: `pm_${Date.now()}`,
      ...methodData,
      createdAt: new Date().toISOString(),
    };
    return new Promise((resolve) => setTimeout(() => resolve(mockMethod), 500));
  }

  async updatePaymentMethod(id: string, methodData: any): Promise<any> {
    // Mock payment method update
    const mockMethod = {
      id: id,
      ...methodData,
      updatedAt: new Date().toISOString(),
    };
    return new Promise((resolve) => setTimeout(() => resolve(mockMethod), 500));
  }

  async deletePaymentMethod(id: string): Promise<any> {
    // Mock payment method deletion
    return new Promise((resolve) =>
      setTimeout(() => resolve({ id, deleted: true }), 500)
    );
  }
}

export const paymentsService = new PaymentsService();
