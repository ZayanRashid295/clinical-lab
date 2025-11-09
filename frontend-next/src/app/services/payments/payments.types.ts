import { QueryParams } from "../base/api-types";
import { Payment, PaymentStatus, PaymentMethodType } from "../../types/payment";

// Payments-specific query parameters
export interface PaymentQueryParams extends QueryParams {
  status?: PaymentStatus;
  method?: PaymentMethodType;
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
  rideId?: string;
}

// Create payment data transfer object
export interface CreatePaymentDto {
  userId: string;
  rideId?: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  description?: string;
  metadata?: {
    [key: string]: any;
  };
}

// Update payment data transfer object
export interface UpdatePaymentDto {
  status?: PaymentStatus;
  transactionId?: string;
  gatewayData?: {
    [key: string]: any;
  };
}
