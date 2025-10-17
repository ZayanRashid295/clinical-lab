// Payout-related type definitions

import { RideUser } from "./ride";

export type PayoutStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type PayoutMethod =
  | "BANK_TRANSFER"
  | "PAYPAL"
  | "STRIPE_CONNECT"
  | "CASH"
  | "WALLET";

export type PayoutFrequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "MANUAL";

export type EarningsStatus = "PENDING" | "PAID_OUT" | "DISPUTED" | "REFUNDED";

export type FeeType = "FIXED" | "PERCENTAGE";

export interface Payout {
  id: string;
  driverId: string;
  amount: number | string; // Can be string from Prisma Decimal fields
  currency: string;
  status: PayoutStatus;
  payoutMethod: PayoutMethod;
  transactionId?: string;
  description?: string;
  scheduledAt: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  driver?: RideUser;
  payoutItems?: PayoutItem[];
  payoutMethodDetails?: PayoutMethodDetails;
  earnings?: Earnings[];
}

export interface PayoutItem {
  id: string;
  payoutId: string;
  rideId: string;
  amount: number | string; // Can be string from Prisma Decimal fields
  fee: number | string; // Platform fee deducted
  netAmount: number | string; // Amount after fees
  createdAt: string;

  // Relations
  payout?: Payout;
  ride?: any; // Ride type - avoiding circular import
}

export interface PayoutMethodDetails {
  id: string;
  payoutId: string;
  method: PayoutMethod;
  provider: string; // stripe, paypal, bank, etc.
  providerId?: string; // External provider ID
  accountDetails?: any; // Encrypted account details
  metadata?: any; // Additional method-specific data
  createdAt: string;
  updatedAt: string;

  // Relations
  payout?: Payout;
}

export interface PayoutSchedule {
  id: string;
  driverId: string;
  frequency: PayoutFrequency;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly
  dayOfMonth?: number; // 1-31 for monthly
  minimumAmount: number | string; // Can be string from Prisma Decimal fields
  isActive: boolean;
  lastProcessedAt?: string;
  nextScheduledAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  driver?: RideUser;
}

export interface PayoutSettings {
  id: string;
  driverId: string;
  defaultPayoutMethod: PayoutMethod;
  autoPayout: boolean;
  minimumPayoutAmount: number | string; // Can be string from Prisma Decimal fields
  payoutFrequency: PayoutFrequency;
  taxSettings?: any; // Tax withholding settings
  notifications?: any; // Notification preferences
  createdAt: string;
  updatedAt: string;

  // Relations
  driver?: RideUser;
}

export interface Earnings {
  id: string;
  driverId: string;
  rideId: string;
  grossEarnings: number | string; // Can be string from Prisma Decimal fields
  platformFee: number | string; // Can be string from Prisma Decimal fields
  netEarnings: number | string; // Can be string from Prisma Decimal fields
  payoutId?: string; // Null until paid out
  status: EarningsStatus;
  calculatedAt: string;
  paidOutAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  driver?: RideUser;
  ride?: any; // Ride type - avoiding circular import
  payout?: Payout;
}

export interface PayoutFee {
  id: string;
  name: string;
  type: FeeType;
  value: number | string; // Can be string from Prisma Decimal fields
  percentage?: number | string; // For percentage-based fees, can be string from Prisma Decimal fields
  isActive: boolean;
  appliesTo: string[]; // Which payout methods this applies to
  createdAt: string;
  updatedAt: string;
}

export interface PayoutFilters {
  status?: PayoutStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  driverId?: string;
}

export interface EarningsFilters {
  status?: EarningsStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  driverId?: string;
}
