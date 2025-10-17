import {
  Payment,
  PaymentQueryParams,
  PaginatedResponse,
  CreatePaymentDto,
  UpdatePaymentDto,
} from "../types/payment";

class PaymentsService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get payments with optional filtering and pagination
   */
  async getPayments(
    params?: PaymentQueryParams
  ): Promise<PaginatedResponse<Payment> | Payment[]> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/payments?${queryString}` : "/payments";

    return await this.request<PaginatedResponse<Payment> | Payment[]>(endpoint);
  }

  /**
   * Get a specific payment by ID
   */
  async getPayment(id: string): Promise<Payment> {
    return await this.request<Payment>(`/payments/${id}`);
  }

  /**
   * Create a new payment
   */
  async createPayment(paymentData: CreatePaymentDto): Promise<Payment> {
    return this.request<Payment>("/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Update an existing payment
   */
  async updatePayment(
    id: string,
    paymentData: UpdatePaymentDto
  ): Promise<Payment> {
    return this.request<Payment>(`/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(paymentData),
    });
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
    const endpoint = userId
      ? `/payment-methods?userId=${userId}`
      : "/payment-methods";
    return this.request<any[]>(endpoint);
  }

  /**
   * Create a new payment method
   */
  async createPaymentMethod(methodData: any): Promise<any> {
    return this.request<any>("/payment-methods", {
      method: "POST",
      body: JSON.stringify(methodData),
    });
  }

  /**
   * Update an existing payment method
   */
  async updatePaymentMethod(id: string, methodData: any): Promise<any> {
    return this.request<any>(`/payment-methods/${id}`, {
      method: "PATCH",
      body: JSON.stringify(methodData),
    });
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(id: string): Promise<void> {
    return this.request<void>(`/payment-methods/${id}`, {
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const paymentsService = new PaymentsService();
export default paymentsService;
