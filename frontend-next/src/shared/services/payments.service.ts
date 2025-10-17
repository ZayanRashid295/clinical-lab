import { BaseApiService } from "../../app/services/base/base-api.service";

export class PaymentsService extends BaseApiService {
  async getPayments(): Promise<any> {
    return this.get("/payments");
  }

  async createPayment(paymentData: any): Promise<any> {
    return this.post("/payments", paymentData);
  }

  async getPayment(id: string): Promise<any> {
    return this.get(`/payments/${id}`);
  }

  // Payment method endpoints
  async getPaymentMethods(userId?: string): Promise<any> {
    const params = userId ? { userId } : undefined;
    return this.get("/payments/methods", params);
  }

  async createPaymentMethod(methodData: any): Promise<any> {
    return this.post("/payments/methods", methodData);
  }

  async updatePaymentMethod(id: string, methodData: any): Promise<any> {
    return this.patch(`/payments/methods/${id}`, methodData);
  }

  async deletePaymentMethod(id: string): Promise<any> {
    return this.delete(`/payments/methods/${id}`);
  }
}

export const paymentsService = new PaymentsService();
