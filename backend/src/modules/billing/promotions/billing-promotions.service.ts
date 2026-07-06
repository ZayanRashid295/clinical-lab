import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BillingInterval, BillingPromotionType } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import {
  ACTIVE_ACCESS_STATUSES,
} from "../billing.types";
import {
  buildPromotionQuote,
  parseJsonStringArray,
  PromotionQuoteResult,
} from "./promotion-pricing.util";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";
import { QueryPromotionDto } from "./dto/query-promotion.dto";

export class PromotionValidationError extends BadRequestException {
  constructor(message: string) {
    super({ message, code: "PROMOTION_INVALID" });
  }
}

@Injectable()
export class BillingPromotionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryPromotionDto) {
    const where: Record<string, unknown> = { archivedAt: null };
    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      this.prisma.billingCoupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip ?? 0,
        take: query.take ?? 50,
        include: {
          _count: { select: { redemptions: true } },
          plan: { select: { id: true, name: true } },
        },
      }),
      this.prisma.billingCoupon.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    const promo = await this.prisma.billingCoupon.findFirst({
      where: { id, archivedAt: null },
      include: {
        _count: { select: { redemptions: true } },
        plan: { select: { id: true, name: true } },
      },
    });
    if (!promo) throw new NotFoundException("Promotion not found");
    return promo;
  }

  async findByCode(code: string) {
    return this.prisma.billingCoupon.findFirst({
      where: { code: code.toUpperCase().trim(), archivedAt: null },
    });
  }

  async create(dto: CreatePromotionDto, adminUserId?: string) {
    return this.prisma.billingCoupon.create({
      data: {
        code: dto.code.toUpperCase().trim(),
        name: dto.name,
        description: dto.description,
        type: dto.type ?? BillingPromotionType.PERCENTAGE,
        percentOff: dto.percentOff,
        amountOff: dto.amountOff,
        maxDiscountAmount: dto.maxDiscountAmount,
        currency: dto.currency ?? "USD",
        durationMonths: dto.durationMonths,
        durationCycles: dto.durationCycles,
        maxRedemptions: dto.maxRedemptions,
        maxRedemptionsPerUser: dto.maxRedemptionsPerUser ?? 1,
        planId: dto.planId,
        applicablePlanIds: dto.applicablePlanIds ?? [],
        applicableIntervals: dto.applicableIntervals ?? [],
        firstTimeOnly: dto.firstTimeOnly ?? false,
        existingCustomersOnly: dto.existingCustomersOnly ?? false,
        stackable: dto.stackable ?? false,
        autoApply: dto.autoApply ?? false,
        isActive: dto.isActive ?? true,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        createdBy: adminUserId,
        updatedBy: adminUserId,
      },
    });
  }

  async update(id: string, dto: UpdatePromotionDto, adminUserId?: string) {
    await this.findById(id);
    return this.prisma.billingCoupon.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code ? dto.code.toUpperCase().trim() : undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        updatedBy: adminUserId,
      },
    });
  }

  async archive(id: string, adminUserId?: string) {
    await this.findById(id);
    return this.prisma.billingCoupon.update({
      where: { id },
      data: { archivedAt: new Date(), isActive: false, updatedBy: adminUserId },
    });
  }

  async duplicate(id: string, adminUserId?: string) {
    const source = await this.findById(id);
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return this.create(
      {
        code: `${source.code}-${suffix}`,
        name: source.name ? `${source.name} (Copy)` : undefined,
        description: source.description ?? undefined,
        type: source.type,
        percentOff: source.percentOff != null ? Number(source.percentOff) : undefined,
        amountOff: source.amountOff != null ? Number(source.amountOff) : undefined,
        maxDiscountAmount:
          source.maxDiscountAmount != null ? Number(source.maxDiscountAmount) : undefined,
        currency: source.currency ?? undefined,
        durationMonths: source.durationMonths ?? undefined,
        durationCycles: source.durationCycles ?? undefined,
        maxRedemptions: source.maxRedemptions ?? undefined,
        maxRedemptionsPerUser: source.maxRedemptionsPerUser ?? 1,
        planId: source.planId ?? undefined,
        applicablePlanIds: parseJsonStringArray(source.applicablePlanIds),
        applicableIntervals: parseJsonStringArray(source.applicableIntervals) as BillingInterval[],
        firstTimeOnly: source.firstTimeOnly,
        existingCustomersOnly: source.existingCustomersOnly,
        stackable: source.stackable,
        autoApply: source.autoApply,
        isActive: false,
        validFrom: source.validFrom.toISOString(),
        validUntil: source.validUntil?.toISOString(),
      },
      adminUserId
    );
  }

  async getRedemptions(promotionId: string) {
    return this.prisma.billingCouponRedemption.findMany({
      where: { couponId: promotionId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async validateForCheckout(
    code: string,
    planId: string,
    interval: BillingInterval,
    userId?: string
  ) {
    const promotion = await this.findByCode(code);
    if (!promotion) {
      throw new PromotionValidationError("This promotion code is not valid.");
    }

    await this.assertPromotionEligible(promotion, planId, interval, userId);
    return promotion;
  }

  async quote(
    planId: string,
    interval: BillingInterval,
    promotionCode?: string,
    userId?: string
  ): Promise<PromotionQuoteResult> {
    const plan = await this.prisma.billingPlan.findFirst({
      where: { id: planId, deletedAt: null, isActive: true },
    });
    if (!plan) throw new NotFoundException("Plan not found");

    if (!promotionCode?.trim()) {
      return buildPromotionQuote(plan, interval, null);
    }

    try {
      const promotion = await this.validateForCheckout(
        promotionCode,
        planId,
        interval,
        userId
      );
      return buildPromotionQuote(plan, interval, promotion);
    } catch (err) {
      if (err instanceof PromotionValidationError) {
        return {
          ...buildPromotionQuote(plan, interval, null),
          error: err.message,
        } as PromotionQuoteResult & { error?: string };
      }
      throw err;
    }
  }

  private async assertPromotionEligible(
    promotion: {
      id: string;
      code: string;
      name: string | null;
      type: BillingPromotionType;
      description: string | null;
      percentOff: unknown;
      amountOff: unknown;
      maxDiscountAmount: unknown;
      isActive: boolean;
      validFrom: Date;
      validUntil: Date | null;
      maxRedemptions: number | null;
      redemptionCount: number;
      maxRedemptionsPerUser: number | null;
      planId: string | null;
      applicablePlanIds: unknown;
      applicableIntervals: unknown;
      firstTimeOnly: boolean;
      existingCustomersOnly: boolean;
    },
    planId: string,
    interval: BillingInterval,
    userId?: string
  ) {
    const now = new Date();

    if (!promotion.isActive) {
      throw new PromotionValidationError("This promotion is no longer active.");
    }
    if (promotion.validFrom > now) {
      throw new PromotionValidationError("This promotion is not active yet.");
    }
    if (promotion.validUntil && promotion.validUntil < now) {
      throw new PromotionValidationError("This promotion has expired.");
    }
    if (
      promotion.maxRedemptions != null &&
      promotion.redemptionCount >= promotion.maxRedemptions
    ) {
      throw new PromotionValidationError("This promotion has reached its usage limit.");
    }

    if (promotion.planId && promotion.planId !== planId) {
      throw new PromotionValidationError("This promotion does not apply to the selected plan.");
    }

    const planIds = parseJsonStringArray(promotion.applicablePlanIds);
    if (planIds.length > 0 && !planIds.includes(planId)) {
      throw new PromotionValidationError("This promotion does not apply to the selected plan.");
    }

    const intervals = parseJsonStringArray(promotion.applicableIntervals);
    if (intervals.length > 0 && !intervals.includes(interval)) {
      throw new PromotionValidationError("This promotion does not apply to the selected billing cycle.");
    }

    if (userId) {
      const userRedemptions = await this.prisma.billingCouponRedemption.count({
        where: { couponId: promotion.id, userId },
      });
      const perUserLimit = promotion.maxRedemptionsPerUser ?? 1;
      if (userRedemptions >= perUserLimit) {
        throw new PromotionValidationError("You have already used this promotion code.");
      }

      const hadSubscription = await this.prisma.billingSubscription.count({
        where: { userId },
      });

      if (promotion.firstTimeOnly && hadSubscription > 0) {
        throw new PromotionValidationError("This promotion is only available for new subscribers.");
      }

      if (promotion.existingCustomersOnly && hadSubscription === 0) {
        throw new PromotionValidationError("This promotion is only available for existing customers.");
      }

      const activeSub = await this.prisma.billingSubscription.findFirst({
        where: { userId, status: { in: ACTIVE_ACCESS_STATUSES } },
      });
      if (activeSub) {
        throw new PromotionValidationError("You already have an active subscription.");
      }
    }
  }

  async redeemInTransaction(
    tx: {
      billingCoupon: PrismaService["billingCoupon"];
      billingCouponRedemption: PrismaService["billingCouponRedemption"];
    },
    params: {
      promotionId: string;
      userId: string;
      subscriptionId: string;
      originalAmount: number;
      discountAmount: number;
      finalAmount: number;
      currency: string;
      billingInterval: BillingInterval;
    }
  ) {
    const promotion = await tx.billingCoupon.findUnique({
      where: { id: params.promotionId },
    });
    if (!promotion) {
      throw new PromotionValidationError("Promotion not found.");
    }
    if (
      promotion.maxRedemptions != null &&
      promotion.redemptionCount >= promotion.maxRedemptions
    ) {
      throw new PromotionValidationError("This promotion has reached its usage limit.");
    }

    await tx.billingCoupon.update({
      where: { id: params.promotionId },
      data: { redemptionCount: { increment: 1 } },
    });

    await tx.billingCouponRedemption.create({
      data: {
        couponId: params.promotionId,
        userId: params.userId,
        subscriptionId: params.subscriptionId,
        originalAmount: params.originalAmount,
        discountAmount: params.discountAmount,
        finalAmount: params.finalAmount,
        currency: params.currency,
        billingInterval: params.billingInterval,
      },
    });
  }
}
