// Payment-related type definitions

import { User } from "./user";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethodType = "CARD" | "WALLET" | "CASH" | "BANK_TRANSFER";

export type PaymentGateway = "STRIPE" | "PAYPAL" | "RAZORPAY" | "SQUARE";

export interface Payment {
  id: string;
  userId: string;
  rideId?: string;
  amount: number; // Can be string from Prisma Decimal fields
  currency: string;
  status: PaymentStatus;
  method: PaymentMethodType;
  transactionId?: string;
  gateway: PaymentGateway;
  description?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  user?: User;
  ride?: any; // Ride type - avoiding circular import

  // Additional backend fields
  gatewayData?: {
    chargeId?: string;
    balanceTransaction?: string;
    [key: string]: any;
  };
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider: string;
  providerId: string;
  isDefault: boolean;
  isActive: boolean;
  metadata?: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    holderName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethodType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}
