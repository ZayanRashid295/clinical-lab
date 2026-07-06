import { BaseApiService } from "../base/base-api.service";

export type BillingInterval = "MONTHLY" | "YEARLY";

export type BillingSubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED"
  | "INCOMPLETE"
  | "PAYMENT_FAILED"
  | "PAUSED";

export interface PlanFeature {
  key: string;
  name: string;
  enabled?: boolean;
  limit?: number;
}

export interface BillingPlan {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  trialEnabled: boolean;
  trialDurationDays: number;
  featuresJson: PlanFeature[];
  displayOrder: number;
  isPopular: boolean;
  isActive: boolean;
  isPublic: boolean;
  isDefault: boolean;
}

export interface BillingSubscription {
  id: string;
  status: BillingSubscriptionStatus;
  billingInterval: BillingInterval;
  trialStart?: string;
  trialEnd?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  plan: BillingPlan;
}

export interface BillingPaymentMethod {
  id: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  isDefault: boolean;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

export interface BillingPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
}

export interface BillingSummary {
  subscription: BillingSubscription | null;
  paymentMethod: BillingPaymentMethod | null;
  invoices: BillingInvoice[];
  payments: BillingPayment[];
  trialDaysRemaining: number | null;
  nextBillingDate: string | null;
  amount: number | null;
  managedByStripe?: boolean;
  features: PlanFeature[];
  promotion?: BillingPromotionSummary | null;
}

export type BillingPromotionType =
  | "PERCENTAGE"
  | "FIXED_AMOUNT"
  | "FREE_FIRST_CYCLE"
  | "MULTI_CYCLE_PERCENTAGE"
  | "LIFETIME_PERCENTAGE";

export interface BillingPromotion {
  id: string;
  code: string;
  name?: string | null;
  description?: string | null;
  type: BillingPromotionType;
  percentOff?: number | null;
  amountOff?: number | null;
  maxDiscountAmount?: number | null;
  currency?: string | null;
  durationMonths?: number | null;
  durationCycles?: number | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number | null;
  planId?: string | null;
  applicablePlanIds?: string[];
  applicableIntervals?: BillingInterval[];
  firstTimeOnly: boolean;
  existingCustomersOnly: boolean;
  isActive: boolean;
  validFrom: string;
  validUntil?: string | null;
  redemptionCount: number;
  _count?: { redemptions: number };
}

export interface BillingPromotionSummary {
  id: string;
  code: string;
  name?: string | null;
  description?: string | null;
  type: BillingPromotionType;
  validUntil?: string | null;
  discountAmount?: number | null;
  originalAmount?: number | null;
  finalAmount?: number | null;
}

export interface PromotionQuoteLine {
  label: string;
  amount: number;
}

export interface PromotionQuote {
  planId: string;
  planName: string;
  billingInterval: BillingInterval;
  currency: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  requiresPayment: boolean;
  promotion: {
    id: string;
    code: string;
    name: string | null;
    type: BillingPromotionType;
    description: string | null;
  } | null;
  lines: PromotionQuoteLine[];
  error?: string;
}

export class BillingService extends BaseApiService {
  async getPublicPlans(): Promise<BillingPlan[]> {
    return this.get("/billing/plans/public");
  }

  async getAdminPlans(): Promise<BillingPlan[]> {
    return this.get("/billing/plans");
  }

  async createPlan(data: Partial<BillingPlan>): Promise<BillingPlan> {
    return this.post("/billing/plans", data);
  }

  async updatePlan(id: string, data: Partial<BillingPlan>): Promise<BillingPlan> {
    return this.patch(`/billing/plans/${id}`, data);
  }

  async deletePlan(id: string): Promise<void> {
    await this.delete(`/billing/plans/${id}`);
  }

  async getMyBilling(): Promise<BillingSummary> {
    return this.get("/billing/me");
  }

  async getMyFeatures(): Promise<string[]> {
    const res = await this.get<{ features: string[] }>("/billing/me/features");
    return res.features;
  }

  async createSetupIntent(): Promise<{ clientSecret: string; setupIntentId: string }> {
    return this.post("/billing/setup-intent");
  }

  async getPromotionQuote(
    planId: string,
    billingInterval: BillingInterval,
    promotionCode?: string
  ): Promise<PromotionQuote> {
    return this.post("/billing/promotions/quote", {
      planId,
      billingInterval,
      promotionCode,
    });
  }

  async subscribe(
    planId: string,
    billingInterval: BillingInterval,
    options?: { paymentMethodId?: string; promotionCode?: string }
  ) {
    return this.post("/billing/subscribe", {
      planId,
      billingInterval,
      paymentMethodId: options?.paymentMethodId,
      promotionCode: options?.promotionCode,
    });
  }

  async getPromotions(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.get<{ data: BillingPromotion[]; total: number }>(`/billing/promotions${qs}`);
  }

  async createPromotion(data: Partial<BillingPromotion>) {
    return this.post("/billing/promotions", data);
  }

  async updatePromotion(id: string, data: Partial<BillingPromotion>) {
    return this.patch(`/billing/promotions/${id}`, data);
  }

  async archivePromotion(id: string) {
    return this.delete(`/billing/promotions/${id}`);
  }

  async duplicatePromotion(id: string) {
    return this.post(`/billing/promotions/${id}/duplicate`);
  }

  async getPromotionRedemptions(id: string) {
    return this.get(`/billing/promotions/${id}/redemptions`);
  }

  /** @deprecated use subscribe with options */
  async subscribeLegacy(planId: string, paymentMethodId: string, billingInterval: BillingInterval) {
    return this.subscribe(planId, billingInterval, { paymentMethodId });
  }

  async cancel(): Promise<BillingSubscription> {
    return this.post("/billing/cancel");
  }

  async resume(): Promise<BillingSubscription> {
    return this.post("/billing/resume");
  }

  async changePlan(planId: string, billingInterval?: BillingInterval) {
    return this.post("/billing/change-plan", { planId, billingInterval });
  }

  async updatePaymentMethod(paymentMethodId: string) {
    return this.post("/billing/payment-method", { paymentMethodId });
  }

  async getAdminSubscriptions() {
    return this.get("/billing/admin/subscriptions");
  }
}

export const billingService = new BillingService();
