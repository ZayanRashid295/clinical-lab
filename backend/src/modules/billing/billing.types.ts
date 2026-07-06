import { BillingInterval, BillingSubscriptionStatus } from "@prisma/client";

export interface PlanFeature {
  key: string;
  name: string;
  enabled?: boolean;
  limit?: number;
}

export const RETRY_SCHEDULE_HOURS = [24, 72, 120, 168] as const;

export const ACTIVE_ACCESS_STATUSES: BillingSubscriptionStatus[] = [
  BillingSubscriptionStatus.TRIALING,
  BillingSubscriptionStatus.ACTIVE,
  BillingSubscriptionStatus.PAST_DUE,
];

export function mapStripeStatus(status: string): BillingSubscriptionStatus {
  const map: Record<string, BillingSubscriptionStatus> = {
    trialing: BillingSubscriptionStatus.TRIALING,
    active: BillingSubscriptionStatus.ACTIVE,
    past_due: BillingSubscriptionStatus.PAST_DUE,
    canceled: BillingSubscriptionStatus.CANCELED,
    unpaid: BillingSubscriptionStatus.PAYMENT_FAILED,
    incomplete: BillingSubscriptionStatus.INCOMPLETE,
    incomplete_expired: BillingSubscriptionStatus.EXPIRED,
    paused: BillingSubscriptionStatus.PAUSED,
  };
  return map[status] ?? BillingSubscriptionStatus.INCOMPLETE;
}

export function stripeInterval(interval: BillingInterval): "month" | "year" {
  return interval === BillingInterval.YEARLY ? "year" : "month";
}

export function parsePlanFeatures(featuresJson: unknown): PlanFeature[] {
  if (!Array.isArray(featuresJson)) return [];
  return featuresJson.filter(
    (f): f is PlanFeature =>
      typeof f === "object" &&
      f !== null &&
      typeof (f as PlanFeature).key === "string" &&
      typeof (f as PlanFeature).name === "string"
  );
}
