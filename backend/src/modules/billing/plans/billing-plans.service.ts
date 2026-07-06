import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { StripePaymentProvider } from "../providers/stripe-payment.provider";
import { stripeInterval } from "../billing.types";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";

@Injectable()
export class BillingPlansService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripePaymentProvider
  ) {}

  async findPublic() {
    return this.prisma.billingPlan.findMany({
      where: { isActive: true, isPublic: true, deletedAt: null },
      orderBy: { displayOrder: "asc" },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.billingPlan.findMany({
      where: includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null },
      orderBy: { displayOrder: "asc" },
    });
  }

  async findById(id: string) {
    const plan = await this.prisma.billingPlan.findFirst({
      where: { id, deletedAt: null },
    });
    if (!plan) throw new NotFoundException("Plan not found");
    return plan;
  }

  async create(dto: CreatePlanDto) {
    if (dto.isDefault) {
      await this.prisma.billingPlan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const product = await this.stripe.createProduct({
      name: dto.name,
      description: dto.description,
    });

    const monthlyPrice = await this.stripe.createPrice({
      productId: product.productId,
      amount: Number(dto.monthlyPrice),
      currency: dto.currency ?? "USD",
      interval: "month",
    });

    const yearlyPrice = await this.stripe.createPrice({
      productId: product.productId,
      amount: Number(dto.yearlyPrice),
      currency: dto.currency ?? "USD",
      interval: "year",
    });

    return this.prisma.billingPlan.create({
      data: {
        name: dto.name,
        description: dto.description,
        monthlyPrice: dto.monthlyPrice,
        yearlyPrice: dto.yearlyPrice,
        currency: dto.currency ?? "USD",
        trialEnabled: dto.trialEnabled ?? false,
        trialDurationDays: dto.trialDurationDays ?? 0,
        featuresJson: (dto.features ?? []) as unknown as Prisma.InputJsonValue,
        displayOrder: dto.displayOrder ?? 0,
        isPopular: dto.isPopular ?? false,
        isActive: dto.isActive ?? true,
        isPublic: dto.isPublic ?? true,
        isDefault: dto.isDefault ?? false,
        maxUsers: dto.maxUsers,
        storageLimitMb: dto.storageLimitMb,
        apiLimitMonthly: dto.apiLimitMonthly,
        stripeProductId: product.productId,
        stripeMonthlyPriceId: monthlyPrice.priceId,
        stripeYearlyPriceId: yearlyPrice.priceId,
      },
    });
  }

  async update(id: string, dto: UpdatePlanDto) {
    const plan = await this.findById(id);

    if (dto.isDefault) {
      await this.prisma.billingPlan.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    if (plan.stripeProductId && (dto.name || dto.description)) {
      await this.stripe.updateProduct(plan.stripeProductId, {
        name: dto.name ?? plan.name,
        description: dto.description ?? plan.description ?? undefined,
      });
    }

    return this.prisma.billingPlan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        monthlyPrice: dto.monthlyPrice,
        yearlyPrice: dto.yearlyPrice,
        currency: dto.currency,
        trialEnabled: dto.trialEnabled,
        trialDurationDays: dto.trialDurationDays,
        featuresJson: dto.features as unknown as Prisma.InputJsonValue | undefined,
        displayOrder: dto.displayOrder,
        isPopular: dto.isPopular,
        isActive: dto.isActive,
        isPublic: dto.isPublic,
        isDefault: dto.isDefault,
        maxUsers: dto.maxUsers,
        storageLimitMb: dto.storageLimitMb,
        apiLimitMonthly: dto.apiLimitMonthly,
      },
    });
  }

  async remove(id: string) {
    const activeCount = await this.prisma.billingSubscription.count({
      where: {
        planId: id,
        status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] },
      },
    });
    if (activeCount > 0) {
      throw new BadRequestException("Cannot delete plan with active subscriptions");
    }
    return this.prisma.billingPlan.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async ensureStripePrices(planId: string) {
    const plan = await this.findById(planId);
    if (plan.stripeMonthlyPriceId && plan.stripeYearlyPriceId) return plan;

    const product = plan.stripeProductId
      ? { productId: plan.stripeProductId }
      : await this.stripe.createProduct({ name: plan.name, description: plan.description ?? undefined });

    const monthlyPrice = plan.stripeMonthlyPriceId
      ? { priceId: plan.stripeMonthlyPriceId }
      : await this.stripe.createPrice({
          productId: product.productId,
          amount: Number(plan.monthlyPrice),
          currency: plan.currency,
          interval: "month",
        });

    const yearlyPrice = plan.stripeYearlyPriceId
      ? { priceId: plan.stripeYearlyPriceId }
      : await this.stripe.createPrice({
          productId: product.productId,
          amount: Number(plan.yearlyPrice),
          currency: plan.currency,
          interval: "year",
        });

    return this.prisma.billingPlan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: product.productId,
        stripeMonthlyPriceId: monthlyPrice.priceId,
        stripeYearlyPriceId: yearlyPrice.priceId,
      },
    });
  }

  getStripePriceId(
    plan: { stripeMonthlyPriceId: string | null; stripeYearlyPriceId: string | null },
    interval: "MONTHLY" | "YEARLY"
  ) {
    const priceId =
      interval === "YEARLY" ? plan.stripeYearlyPriceId : plan.stripeMonthlyPriceId;
    if (!priceId) throw new BadRequestException("Plan is missing Stripe price configuration");
    return priceId;
  }
}
