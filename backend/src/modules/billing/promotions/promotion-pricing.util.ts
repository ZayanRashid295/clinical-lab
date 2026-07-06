import { BillingInterval, BillingPromotionType } from "@prisma/client";

export interface PromotionQuoteLine {
  label: string;
  amount: number;
}

export interface PromotionQuoteResult {
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
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function getPlanPrice(
  plan: { monthlyPrice: unknown; yearlyPrice: unknown },
  interval: BillingInterval
): number {
  const raw = interval === BillingInterval.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;
  return roundMoney(Number(raw));
}

export function parseJsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export function calculateDiscountAmount(
  originalAmount: number,
  promotion: {
    type: BillingPromotionType;
    percentOff: unknown;
    amountOff: unknown;
    maxDiscountAmount: unknown;
  }
): number {
  if (originalAmount <= 0) return 0;

  let discount = 0;
  switch (promotion.type) {
    case BillingPromotionType.PERCENTAGE:
    case BillingPromotionType.MULTI_CYCLE_PERCENTAGE:
    case BillingPromotionType.LIFETIME_PERCENTAGE: {
      const pct = Number(promotion.percentOff ?? 0);
      discount = originalAmount * (pct / 100);
      break;
    }
    case BillingPromotionType.FIXED_AMOUNT: {
      discount = Number(promotion.amountOff ?? 0);
      break;
    }
    case BillingPromotionType.FREE_FIRST_CYCLE:
      discount = originalAmount;
      break;
    default:
      discount = 0;
  }

  const maxCap = promotion.maxDiscountAmount != null ? Number(promotion.maxDiscountAmount) : null;
  if (maxCap != null && maxCap > 0) {
    discount = Math.min(discount, maxCap);
  }

  return roundMoney(Math.min(Math.max(discount, 0), originalAmount));
}

export function buildPromotionQuote(
  plan: { id: string; name: string; monthlyPrice: unknown; yearlyPrice: unknown; currency: string },
  interval: BillingInterval,
  promotion?: {
    id: string;
    code: string;
    name: string | null;
    type: BillingPromotionType;
    description: string | null;
    percentOff: unknown;
    amountOff: unknown;
    maxDiscountAmount: unknown;
  } | null
): PromotionQuoteResult {
  const originalAmount = getPlanPrice(plan, interval);
  const discountAmount = promotion ? calculateDiscountAmount(originalAmount, promotion) : 0;
  const finalAmount = roundMoney(Math.max(0, originalAmount - discountAmount));

  const lines: PromotionQuoteLine[] = [
    { label: "Original price", amount: originalAmount },
  ];
  if (promotion && discountAmount > 0) {
    lines.push({
      label: `Promotion (${promotion.code})`,
      amount: -discountAmount,
    });
  }
  lines.push({ label: "Total due today", amount: finalAmount });

  return {
    planId: plan.id,
    planName: plan.name,
    billingInterval: interval,
    currency: plan.currency,
    originalAmount,
    discountAmount,
    finalAmount,
    requiresPayment: finalAmount > 0,
    promotion: promotion
      ? {
          id: promotion.id,
          code: promotion.code,
          name: promotion.name,
          type: promotion.type,
          description: promotion.description,
        }
      : null,
    lines,
  };
}
