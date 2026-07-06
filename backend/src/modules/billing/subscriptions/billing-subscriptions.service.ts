import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  BillingInterval,
  BillingInvoiceStatus,
  BillingPaymentStatus,
  BillingRetryStatus,
  BillingSubscriptionStatus,
  User,
} from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { StripePaymentProvider } from "../providers/stripe-payment.provider";
import { BillingPlansService } from "../plans/billing-plans.service";
import { BillingEmailService } from "../emails/billing-email.service";
import { BillingPromotionsService } from "../promotions/billing-promotions.service";
import { buildPromotionQuote } from "../promotions/promotion-pricing.util";
import {
  ACTIVE_ACCESS_STATUSES,
  mapStripeStatus,
  parsePlanFeatures,
  RETRY_SCHEDULE_HOURS,
} from "../billing.types";
import { SubscribeDto } from "./dto/subscribe.dto";
import { ChangePlanDto } from "./dto/change-plan.dto";

@Injectable()
export class BillingSubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripePaymentProvider,
    private plansService: BillingPlansService,
    private emailService: BillingEmailService,
    private promotionsService: BillingPromotionsService
  ) {}

  private getUserId(user: { userId?: string; id?: string }) {
    return user.userId || user.id;
  }

  async getCurrentSubscription(userId: string) {
    return this.prisma.billingSubscription.findFirst({
      where: {
        userId,
        status: { in: ACTIVE_ACCESS_STATUSES },
      },
      include: { plan: true, coupon: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getUserFeatures(userId: string): Promise<string[]> {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub) {
      const defaultPlan = await this.prisma.billingPlan.findFirst({
        where: { isDefault: true, isActive: true, deletedAt: null },
      });
      if (!defaultPlan) return [];
      return parsePlanFeatures(defaultPlan.featuresJson)
        .filter((f) => f.enabled !== false)
        .map((f) => f.key);
    }
    return parsePlanFeatures(sub.plan.featuresJson)
      .filter((f) => f.enabled !== false)
      .map((f) => f.key);
  }

  async hasFeature(userId: string, featureKey: string): Promise<boolean> {
    const features = await this.getUserFeatures(userId);
    return features.includes(featureKey);
  }

  private static normalizeRoles(roles: unknown): string[] {
    if (!roles) return [];
    const list = Array.isArray(roles) ? roles : [roles];
    return list
      .map((r: { name?: string; role?: { name?: string } } | string) =>
        typeof r === "string" ? r : r.name || r.role?.name
      )
      .filter((name): name is string => Boolean(name));
  }

  private static isAdminRole(roles: string[]): boolean {
    return roles.includes("ADMIN") || roles.includes("SUPERADMIN");
  }

  /** Requires an active subscription with qbank.access (admins bypass). */
  async assertCanUseQbank(userId: string | undefined, roles?: unknown): Promise<void> {
    const normalizedRoles = BillingSubscriptionsService.normalizeRoles(roles);
    if (BillingSubscriptionsService.isAdminRole(normalizedRoles)) return;

    if (!userId) {
      throw new ForbiddenException("User not authenticated");
    }

    const sub = await this.getCurrentSubscription(userId);
    if (!sub) {
      throw new ForbiddenException(
        "Access denied. Missing features: Qbank Access. Please upgrade your plan."
      );
    }

    const features = await this.getUserFeatures(userId);
    if (!features.includes("qbank.access")) {
      throw new ForbiddenException(
        "Access denied. Missing features: Qbank Access. Please upgrade your plan."
      );
    }
  }

  async createSetupIntent(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    let customerId = await this.getOrCreateProviderCustomer(user);
    const intent = await this.stripe.createSetupIntent({
      customerId,
      metadata: { userId },
    });
    return intent;
  }

  private async getOrCreateProviderCustomer(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.prisma.billingSubscription.findFirst({
      where: { userId: user.id, providerCustomerId: { not: null } },
      select: { providerCustomerId: true },
    });
    if (existing?.providerCustomerId) return existing.providerCustomerId;

    const { customerId } = await this.stripe.createCustomer({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      metadata: { userId: user.id },
    });
    return customerId;
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const plan = await this.plansService.findById(dto.planId);
    if (!plan.isActive) throw new BadRequestException("Plan is not available");

    const interval = dto.billingInterval ?? BillingInterval.MONTHLY;
    const promotionCode = dto.promotionCode ?? dto.couponCode;
    const quote = await this.promotionsService.quote(
      plan.id,
      interval,
      promotionCode,
      userId
    );

    const existing = await this.getCurrentSubscription(userId);
    if (existing?.providerSubscriptionId) {
      throw new BadRequestException(
        "You already have an active subscription. Use change plan from billing."
      );
    }

    if (existing) {
      if (quote.requiresPayment) {
        if (!dto.paymentMethodId) {
          throw new BadRequestException("Payment method is required for this subscription");
        }
        const planWithPrices = await this.plansService.ensureStripePrices(plan.id);
        return this.upgradeLocalToPaid(user, existing, planWithPrices, dto, interval, quote);
      }
      return this.upgradeLocalFree(user, existing, plan, interval, quote);
    }

    if (quote.requiresPayment) {
      if (!dto.paymentMethodId) {
        throw new BadRequestException("Payment method is required for this subscription");
      }
      const planWithPrices = await this.plansService.ensureStripePrices(plan.id);
      return this.subscribeWithPayment(user, planWithPrices, dto, interval, quote);
    }

    return this.subscribeWithoutPayment(user, plan, interval, quote);
  }

  private async subscribeWithoutPayment(
    user: User,
    plan: { id: string; name: string; currency: string; trialEnabled: boolean; trialDurationDays: number },
    interval: BillingInterval,
    quote: Awaited<ReturnType<BillingPromotionsService["quote"]>>
  ) {
    const now = new Date();
    const periodEnd = new Date(now);
    if (interval === BillingInterval.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const subscription = await this.prisma.$transaction(async (tx) => {
      const created = await tx.billingSubscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: BillingSubscriptionStatus.ACTIVE,
          billingInterval: interval,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          couponId: quote.promotion?.id ?? null,
          metadataJson: {
            promotionCode: quote.promotion?.code ?? null,
            originalAmount: quote.originalAmount,
            discountAmount: quote.discountAmount,
            finalAmount: quote.finalAmount,
            activatedWithoutPayment: true,
          },
        },
        include: { plan: true },
      });

      if (quote.promotion) {
        await this.promotionsService.redeemInTransaction(tx, {
          promotionId: quote.promotion.id,
          userId: user.id,
          subscriptionId: created.id,
          originalAmount: quote.originalAmount,
          discountAmount: quote.discountAmount,
          finalAmount: quote.finalAmount,
          currency: plan.currency,
          billingInterval: interval,
        });
      }

      const invoiceNumber = `INV-FREE-${created.id.slice(-8).toUpperCase()}`;
      await tx.billingInvoice.create({
        data: {
          userId: user.id,
          subscriptionId: created.id,
          invoiceNumber,
          amount: 0,
          currency: plan.currency,
          status: BillingInvoiceStatus.PAID,
          paidAt: now,
          periodStart: now,
          periodEnd,
        },
      });

      await tx.billingPayment.create({
        data: {
          userId: user.id,
          subscriptionId: created.id,
          amount: 0,
          currency: plan.currency,
          status: BillingPaymentStatus.SUCCEEDED,
          description: quote.promotion
            ? `Promotion ${quote.promotion.code} — no payment required`
            : "Complimentary subscription",
        },
      });

      return created;
    });

    await this.logEvent(user.id, "subscription.created", {
      subscriptionId: subscription.id,
      promotionCode: quote.promotion?.code,
      freeActivation: true,
    });
    await this.emailService.sendSubscriptionActivated(user, subscription);
    return subscription;
  }

  private async upgradeLocalFree(
    user: User,
    existing: { id: string },
    plan: { id: string; name: string; currency: string },
    interval: BillingInterval,
    quote: Awaited<ReturnType<BillingPromotionsService["quote"]>>
  ) {
    const subscription = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.billingSubscription.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          billingInterval: interval,
          couponId: quote.promotion?.id ?? null,
          metadataJson: {
            promotionCode: quote.promotion?.code ?? null,
            originalAmount: quote.originalAmount,
            discountAmount: quote.discountAmount,
            finalAmount: quote.finalAmount,
            activatedWithoutPayment: true,
          },
        },
        include: { plan: true },
      });

      if (quote.promotion) {
        await this.promotionsService.redeemInTransaction(tx, {
          promotionId: quote.promotion.id,
          userId: user.id,
          subscriptionId: updated.id,
          originalAmount: quote.originalAmount,
          discountAmount: quote.discountAmount,
          finalAmount: quote.finalAmount,
          currency: plan.currency,
          billingInterval: interval,
        });
      }

      return updated;
    });

    await this.logEvent(user.id, "subscription.plan_changed", {
      subscriptionId: subscription.id,
      promotionCode: quote.promotion?.code,
      freeActivation: true,
    });
    return subscription;
  }

  private async upgradeLocalToPaid(
    user: User,
    existing: { id: string },
    plan: Awaited<ReturnType<BillingPlansService["ensureStripePrices"]>>,
    dto: SubscribeDto,
    interval: BillingInterval,
    quote: Awaited<ReturnType<BillingPromotionsService["quote"]>>
  ) {
    const customerId = await this.getOrCreateProviderCustomer(user);
    await this.stripe.attachPaymentMethod({
      customerId,
      paymentMethodId: dto.paymentMethodId!,
    });
    await this.stripe.setDefaultPaymentMethod(customerId, dto.paymentMethodId!);

    const card = await this.stripe.retrievePaymentMethod(dto.paymentMethodId!);
    await this.prisma.billingPaymentMethod.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
    await this.prisma.billingPaymentMethod.upsert({
      where: {
        provider_providerMethodId: {
          provider: "stripe",
          providerMethodId: dto.paymentMethodId!,
        },
      },
      create: {
        userId: user.id,
        provider: "stripe",
        providerMethodId: dto.paymentMethodId!,
        cardBrand: card.brand,
        cardLast4: card.last4,
        cardExpMonth: card.expMonth,
        cardExpYear: card.expYear,
        isDefault: true,
      },
      update: {
        cardBrand: card.brand,
        cardLast4: card.last4,
        cardExpMonth: card.expMonth,
        cardExpYear: card.expYear,
        isDefault: true,
        isActive: true,
      },
    });

    const priceId = this.plansService.getStripePriceId(plan, interval);
    const trialDays = plan.trialEnabled ? plan.trialDurationDays : 0;

    let stripeCouponId: string | undefined;
    if (quote.promotion) {
      const promo = await this.promotionsService.findById(quote.promotion.id);
      stripeCouponId = promo.providerCouponId ?? undefined;
    }

    const stripeSub = await this.stripe.createSubscription({
      customerId,
      priceId,
      paymentMethodId: dto.paymentMethodId!,
      trialDays: trialDays > 0 ? trialDays : undefined,
      couponId: stripeCouponId,
      metadata: {
        userId: user.id,
        planId: plan.id,
        promotionCode: quote.promotion?.code ?? "",
      },
    });

    const now = new Date();
    const trialEnd = stripeSub.trialEnd;
    const status = mapStripeStatus(stripeSub.status);

    const subscription = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.billingSubscription.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          status,
          billingInterval: interval,
          trialStart: trialDays > 0 ? now : null,
          trialEnd: trialEnd ?? null,
          currentPeriodStart: now,
          currentPeriodEnd: stripeSub.currentPeriodEnd ?? null,
          providerCustomerId: customerId,
          providerSubscriptionId: stripeSub.subscriptionId,
          couponId: quote.promotion?.id ?? null,
          metadataJson: {
            promotionCode: quote.promotion?.code ?? null,
            originalAmount: quote.originalAmount,
            discountAmount: quote.discountAmount,
            finalAmount: quote.finalAmount,
            activatedWithoutPayment: false,
          },
        },
        include: { plan: true },
      });

      if (quote.promotion) {
        await this.promotionsService.redeemInTransaction(tx, {
          promotionId: quote.promotion.id,
          userId: user.id,
          subscriptionId: updated.id,
          originalAmount: quote.originalAmount,
          discountAmount: quote.discountAmount,
          finalAmount: quote.finalAmount,
          currency: plan.currency,
          billingInterval: interval,
        });
      }

      return updated;
    });

    await this.logEvent(user.id, "subscription.plan_changed", {
      subscriptionId: subscription.id,
      promotionCode: quote.promotion?.code,
    });
    return subscription;
  }

  private async subscribeWithPayment(
    user: User,
    plan: Awaited<ReturnType<BillingPlansService["ensureStripePrices"]>>,
    dto: SubscribeDto,
    interval: BillingInterval,
    quote: Awaited<ReturnType<BillingPromotionsService["quote"]>>
  ) {
    const customerId = await this.getOrCreateProviderCustomer(user);
    await this.stripe.attachPaymentMethod({
      customerId,
      paymentMethodId: dto.paymentMethodId!,
    });
    await this.stripe.setDefaultPaymentMethod(customerId, dto.paymentMethodId!);

    const card = await this.stripe.retrievePaymentMethod(dto.paymentMethodId!);
    await this.prisma.billingPaymentMethod.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
    await this.prisma.billingPaymentMethod.upsert({
      where: {
        provider_providerMethodId: {
          provider: "stripe",
          providerMethodId: dto.paymentMethodId!,
        },
      },
      create: {
        userId: user.id,
        provider: "stripe",
        providerMethodId: dto.paymentMethodId!,
        cardBrand: card.brand,
        cardLast4: card.last4,
        cardExpMonth: card.expMonth,
        cardExpYear: card.expYear,
        isDefault: true,
      },
      update: {
        cardBrand: card.brand,
        cardLast4: card.last4,
        cardExpMonth: card.expMonth,
        cardExpYear: card.expYear,
        isDefault: true,
        isActive: true,
      },
    });

    const priceId = this.plansService.getStripePriceId(plan, interval);
    const trialDays = plan.trialEnabled ? plan.trialDurationDays : 0;

    let stripeCouponId: string | undefined;
    if (quote.promotion) {
      const promo = await this.promotionsService.findById(quote.promotion.id);
      stripeCouponId = promo.providerCouponId ?? undefined;
    }

    const stripeSub = await this.stripe.createSubscription({
      customerId,
      priceId,
      paymentMethodId: dto.paymentMethodId!,
      trialDays: trialDays > 0 ? trialDays : undefined,
      couponId: stripeCouponId,
      metadata: {
        userId: user.id,
        planId: plan.id,
        promotionCode: quote.promotion?.code ?? "",
      },
    });

    const now = new Date();
    const trialEnd = stripeSub.trialEnd;
    const status = mapStripeStatus(stripeSub.status);

    const subscription = await this.prisma.$transaction(async (tx) => {
      const created = await tx.billingSubscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status,
          billingInterval: interval,
          trialStart: trialDays > 0 ? now : null,
          trialEnd: trialEnd ?? null,
          currentPeriodStart: now,
          currentPeriodEnd: stripeSub.currentPeriodEnd ?? null,
          providerCustomerId: customerId,
          providerSubscriptionId: stripeSub.subscriptionId,
          couponId: quote.promotion?.id ?? null,
          metadataJson: {
            promotionCode: quote.promotion?.code ?? null,
            originalAmount: quote.originalAmount,
            discountAmount: quote.discountAmount,
            finalAmount: quote.finalAmount,
          },
        },
        include: { plan: true },
      });

      if (quote.promotion) {
        await this.promotionsService.redeemInTransaction(tx, {
          promotionId: quote.promotion.id,
          userId: user.id,
          subscriptionId: created.id,
          originalAmount: quote.originalAmount,
          discountAmount: quote.discountAmount,
          finalAmount: quote.finalAmount,
          currency: plan.currency,
          billingInterval: interval,
        });
      }

      return created;
    });

    await this.logEvent(user.id, "subscription.created", { subscriptionId: subscription.id });

    if (status === BillingSubscriptionStatus.TRIALING) {
      await this.emailService.sendTrialStarted(user, subscription);
    } else {
      await this.emailService.sendSubscriptionActivated(user, subscription);
    }

    return subscription;
  }

  async cancel(userId: string) {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub) throw new NotFoundException("No active subscription");

    if (sub.providerSubscriptionId) {
      await this.stripe.cancelSubscription(sub.providerSubscriptionId, true);
    }

    const updated = await this.prisma.billingSubscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
      include: { plan: true },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) await this.emailService.sendSubscriptionCancelled(user, updated);
    await this.logEvent(userId, "subscription.cancelled", { subscriptionId: sub.id });
    return updated;
  }

  async resume(userId: string) {
    const sub = await this.prisma.billingSubscription.findFirst({
      where: { userId, cancelAtPeriodEnd: true, status: { in: ACTIVE_ACCESS_STATUSES } },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException("No cancellable subscription to resume");

    if (sub.providerSubscriptionId) {
      await this.stripe.resumeSubscription(sub.providerSubscriptionId);
    }

    return this.prisma.billingSubscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: false, canceledAt: null },
      include: { plan: true },
    });
  }

  async changePlan(userId: string, dto: ChangePlanDto) {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub) throw new NotFoundException("No active subscription");

    const newPlan = await this.plansService.findById(dto.planId);
    const interval = dto.billingInterval ?? sub.billingInterval;

    if (sub.providerSubscriptionId) {
      const planWithPrices = await this.plansService.ensureStripePrices(newPlan.id);
      const priceId = this.plansService.getStripePriceId(planWithPrices, interval);
      await this.stripe.updateSubscription({
        subscriptionId: sub.providerSubscriptionId,
        priceId,
      });
    }

    return this.prisma.billingSubscription.update({
      where: { id: sub.id },
      data: { planId: newPlan.id, billingInterval: interval },
      include: { plan: true },
    });
  }

  async updatePaymentMethod(userId: string, paymentMethodId: string) {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub?.providerCustomerId) {
      throw new BadRequestException("No billing customer found");
    }

    await this.stripe.attachPaymentMethod({
      customerId: sub.providerCustomerId,
      paymentMethodId,
    });
    await this.stripe.setDefaultPaymentMethod(sub.providerCustomerId, paymentMethodId);

    if (sub.providerSubscriptionId) {
      await this.stripe.updateSubscription({
        subscriptionId: sub.providerSubscriptionId,
        paymentMethodId,
      });
    }

    const card = await this.stripe.retrievePaymentMethod(paymentMethodId);
    await this.prisma.billingPaymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.billingPaymentMethod.upsert({
      where: {
        provider_providerMethodId: {
          provider: "stripe",
          providerMethodId: paymentMethodId,
        },
      },
      create: {
        userId,
        provider: "stripe",
        providerMethodId: paymentMethodId,
        cardBrand: card.brand,
        cardLast4: card.last4,
        cardExpMonth: card.expMonth,
        cardExpYear: card.expYear,
        isDefault: true,
      },
      update: {
        cardBrand: card.brand,
        cardLast4: card.last4,
        cardExpMonth: card.expMonth,
        cardExpYear: card.expYear,
        isDefault: true,
        isActive: true,
      },
    });
  }

  async getBillingSummary(userId: string) {
    const [subscription, paymentMethod, invoices, payments] = await Promise.all([
      this.getCurrentSubscription(userId),
      this.prisma.billingPaymentMethod.findFirst({
        where: { userId, isDefault: true, isActive: true },
      }),
      this.prisma.billingInvoice.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      this.prisma.billingPayment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    let trialDaysRemaining: number | null = null;
    if (subscription?.status === BillingSubscriptionStatus.TRIALING && subscription.trialEnd) {
      trialDaysRemaining = Math.max(
        0,
        Math.ceil((subscription.trialEnd.getTime() - Date.now()) / 86400000)
      );
    }

    const amount =
      subscription?.billingInterval === BillingInterval.YEARLY
        ? subscription.plan.yearlyPrice
        : subscription?.plan.monthlyPrice;

    const promotion = subscription?.coupon ?? null;
    const metadata = (subscription?.metadataJson ?? {}) as Record<string, unknown>;
    const discountAmount =
      metadata.discountAmount != null ? Number(metadata.discountAmount) : null;
    const originalAmount =
      metadata.originalAmount != null ? Number(metadata.originalAmount) : null;
    const finalAmount =
      metadata.finalAmount != null ? Number(metadata.finalAmount) : null;

    return {
      subscription,
      paymentMethod,
      invoices,
      payments,
      trialDaysRemaining,
      nextBillingDate: subscription?.currentPeriodEnd ?? null,
      amount: amount ?? null,
      managedByStripe: !!subscription?.providerSubscriptionId,
      features: subscription
        ? parsePlanFeatures(subscription.plan.featuresJson)
        : [],
      promotion: promotion
        ? {
            id: promotion.id,
            code: promotion.code,
            name: promotion.name,
            description: promotion.description,
            type: promotion.type,
            validUntil: promotion.validUntil,
            discountAmount,
            originalAmount,
            finalAmount,
          }
        : null,
    };
  }

  async listAllAdmin() {
    return this.prisma.billingSubscription.findMany({
      include: {
        plan: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  async schedulePaymentRetry(subscriptionId: string, attemptNumber: number) {
    const hours = RETRY_SCHEDULE_HOURS[attemptNumber - 1];
    if (!hours) return null;

    const scheduledAt = new Date(Date.now() + hours * 3600000);
    return this.prisma.billingPaymentRetry.create({
      data: { subscriptionId, attemptNumber, scheduledAt },
    });
  }

  async moveToFreePlan(userId: string) {
    const defaultPlan = await this.prisma.billingPlan.findFirst({
      where: { isDefault: true, isActive: true, deletedAt: null },
    });
    if (!defaultPlan) return;

    await this.prisma.billingSubscription.updateMany({
      where: { userId, status: { in: ACTIVE_ACCESS_STATUSES } },
      data: { status: BillingSubscriptionStatus.EXPIRED, endedAt: new Date() },
    });
  }

  async recordPayment(
    userId: string,
    subscriptionId: string,
    amount: number,
    currency: string,
    providerPaymentId: string,
    status: BillingPaymentStatus,
    description?: string
  ) {
    return this.prisma.billingPayment.create({
      data: {
        userId,
        subscriptionId,
        amount,
        currency,
        status,
        providerPaymentId,
        description,
      },
    });
  }

  async recordInvoice(
    userId: string,
    subscriptionId: string | null,
    invoiceNumber: string,
    amount: number,
    currency: string,
    providerInvoiceId: string,
    status: BillingInvoiceStatus,
    periodStart?: Date,
    periodEnd?: Date
  ) {
    return this.prisma.billingInvoice.upsert({
      where: { providerInvoiceId },
      create: {
        userId,
        subscriptionId,
        invoiceNumber,
        amount,
        currency,
        providerInvoiceId,
        status,
        periodStart,
        periodEnd,
        paidAt: status === BillingInvoiceStatus.PAID ? new Date() : null,
      },
      update: {
        status,
        paidAt: status === BillingInvoiceStatus.PAID ? new Date() : undefined,
      },
    });
  }

  async getUserEntitlementsMap(userId: string): Promise<Record<string, unknown>> {
    const sub = await this.getCurrentSubscription(userId);
    const plan = sub?.plan ?? (await this.prisma.billingPlan.findFirst({
      where: { isDefault: true, isActive: true, deletedAt: null },
    }));
    if (!plan) return {};
    const features = parsePlanFeatures(plan.featuresJson);
    return Object.fromEntries(
      features.map((f) => [f.key, { enabled: f.enabled !== false, limit: f.limit }])
    );
  }

  async logEvent(userId: string | null, type: string, payload: Record<string, unknown>) {
    return this.prisma.billingEvent.create({
      data: { userId, type, payload: payload as object },
    });
  }

  async processDueRetries() {
    const due = await this.prisma.billingPaymentRetry.findMany({
      where: { status: BillingRetryStatus.PENDING, scheduledAt: { lte: new Date() } },
      include: { subscription: { include: { plan: true, user: true } } },
      take: 50,
    });

    for (const retry of due) {
      const sub = retry.subscription;
      if (!sub.providerSubscriptionId) continue;

      try {
        await this.stripe.updateSubscription({
          subscriptionId: sub.providerSubscriptionId,
          paymentMethodId: undefined,
        });
        await this.prisma.billingPaymentRetry.update({
          where: { id: retry.id },
          data: { status: BillingRetryStatus.SUCCEEDED, attemptedAt: new Date() },
        });
      } catch (err: any) {
        const nextAttempt = retry.attemptNumber + 1;
        await this.prisma.billingPaymentRetry.update({
          where: { id: retry.id },
          data: {
            status: BillingRetryStatus.FAILED,
            attemptedAt: new Date(),
            failureReason: err?.message,
          },
        });

        if (nextAttempt > RETRY_SCHEDULE_HOURS.length) {
          await this.prisma.billingSubscription.update({
            where: { id: sub.id },
            data: { status: BillingSubscriptionStatus.PAYMENT_FAILED },
          });
          await this.emailService.sendPaymentFailed(sub.user, sub);
        } else {
          await this.schedulePaymentRetry(sub.id, nextAttempt);
          await this.emailService.sendPaymentFailed(sub.user, sub);
        }
      }
    }
  }

  async processTrialReminders() {
    const now = new Date();
    const thresholds = [7, 3, 1];

    for (const days of thresholds) {
      const start = new Date(now.getTime() + (days - 1) * 86400000);
      const end = new Date(now.getTime() + days * 86400000);

      const subs = await this.prisma.billingSubscription.findMany({
        where: {
          status: BillingSubscriptionStatus.TRIALING,
          trialEnd: { gte: start, lt: end },
        },
        include: { user: true, plan: true },
      });

      for (const sub of subs) {
        await this.emailService.sendTrialReminder(sub.user, sub, days);
      }
    }
  }

  async processExpiredSubscriptions() {
    const expired = await this.prisma.billingSubscription.findMany({
      where: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { lte: new Date() },
        status: { in: [BillingSubscriptionStatus.ACTIVE, BillingSubscriptionStatus.CANCELED] },
      },
      include: { user: true },
    });

    for (const sub of expired) {
      await this.prisma.billingSubscription.update({
        where: { id: sub.id },
        data: { status: BillingSubscriptionStatus.EXPIRED, endedAt: new Date() },
      });
      await this.moveToFreePlan(sub.userId);
    }
  }
}
