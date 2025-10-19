import { BaseApiService } from "../base/base-api.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Payment } from "../../types/payment";
import {
  PaymentQueryParams,
  CreatePaymentDto,
  UpdatePaymentDto,
} from "./payments.types";

export class PaymentsService extends BaseApiService {
  private readonly endpoint = "/payments";

  /**
   * Get payments with optional filtering and pagination
   */
  async getPayments(
    params?: PaymentQueryParams
  ): Promise<PaginatedResponse<Payment> | Payment[]> {
    return this.get(this.endpoint, params);
  }

  /**
   * Get a specific payment by ID
   */
  async getPayment(id: string): Promise<Payment> {
    return this.get(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new payment
   */
  async createPayment(paymentData: CreatePaymentDto): Promise<CreateResponse> {
    return this.post(this.endpoint, paymentData);
  }

  /**
   * Update an existing payment
   */
  async updatePayment(
    id: string,
    paymentData: UpdatePaymentDto
  ): Promise<UpdateResponse> {
    return this.patch(`${this.endpoint}/${id}`, paymentData);
  }

  /**
   * Get payments for a specific user
   */
  async getUserPayments(
    userId: string,
    params?: Omit<PaymentQueryParams, "userId">
  ): Promise<PaginatedResponse<Payment> | Payment[]> {
    return this.getPayments({ ...params, userId });
  }

  /**
   * Get payments for a specific ride
   */
  async getRidePayments(
    rideId: string,
    params?: Omit<PaymentQueryParams, "rideId">
  ): Promise<PaginatedResponse<Payment> | Payment[]> {
    return this.getPayments({ ...params, rideId });
  }

  /**
   * Get payment history (completed payments only)
   */
  async getPaymentHistory(
    params?: Omit<PaymentQueryParams, "status">
  ): Promise<PaginatedResponse<Payment> | Payment[]> {
    return this.getPayments({ ...params, status: "COMPLETED" });
  }

  /**
   * Get payment methods for a user
   */
  async getPaymentMethods(userId?: string): Promise<any[]> {
    // Mock data for payment methods
    const mockPaymentMethods = [
      {
        id: "pm_1",
        type: "CREDIT_CARD",
        provider: "Visa",
        last4: "1234",
        userId: userId || "user_1",
        createdAt: "2024-01-15T10:30:00Z",
        isDefault: true,
        brand: "visa",
      },
      {
        id: "pm_2",
        type: "BANK_ACCOUNT",
        provider: "Chase",
        last4: "5678",
        userId: userId || "user_1",
        createdAt: "2024-01-10T14:20:00Z",
        isDefault: false,
        brand: "chase",
      },
    ];
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockPaymentMethods), 500)
    );
  }

  /**
   * Create a new payment method
   */
  async createPaymentMethod(methodData: any): Promise<any> {
    // Mock payment method creation
    const mockMethod = {
      id: `pm_${Date.now()}`,
      ...methodData,
      createdAt: new Date().toISOString(),
    };
    return new Promise((resolve) => setTimeout(() => resolve(mockMethod), 500));
  }

  /**
   * Update an existing payment method
   */
  async updatePaymentMethod(id: string, methodData: any): Promise<any> {
    // Mock payment method update
    const mockMethod = {
      id: id,
      ...methodData,
      updatedAt: new Date().toISOString(),
    };
    return new Promise((resolve) => setTimeout(() => resolve(mockMethod), 500));
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(id: string): Promise<void> {
    // Mock payment method deletion
    return new Promise((resolve) => setTimeout(() => resolve(), 500));
  }
}

// Export singleton instance
export const paymentsService = new PaymentsService();
export default paymentsService;
