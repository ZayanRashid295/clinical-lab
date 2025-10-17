// Payment-related type definitions

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethodType = "CARD" | "WALLET" | "CASH" | "BANK_TRANSFER";

export type PaymentGateway = "STRIPE" | "PAYPAL" | "RAZORPAY" | "SQUARE";

export interface PaymentUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
}

export interface Payment {
  id: string;
  userId: string;
  rideId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethodType;
  transactionId?: string;
  gateway: PaymentGateway;
  description?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  user?: PaymentUser;
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
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaymentQueryParams extends PaymentFilters {
  userId?: string;
  rideId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePaymentDto {
  userId: string;
  rideId?: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  gateway: PaymentGateway;
  description?: string;
  transactionId?: string;
}

export interface UpdatePaymentDto {
  status?: PaymentStatus;
  description?: string;
  gatewayData?: any;
}

