import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StripeService } from "./stripe.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import {
  PaymentGateway,
  PaymentMethodType,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";
import Stripe from "stripe";

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService
  ) {}

  /**
   * Phase 1: create a Stripe PaymentIntent and persist a Payment row.
   */
  async create(createPaymentDto: CreatePaymentDto) {
    const { userId, subscriptionPackageId } = createPaymentDto;

    if (!userId) {
      throw new BadRequestException("userId is required");
    }

    // 1) Resolve amount + currency
    let amount = createPaymentDto.amount;
    let currency = (createPaymentDto.currency || "USD").toLowerCase();

    if (subscriptionPackageId) {
      const subscriptionPackage =
        await this.prisma.subscriptionPackage.findUnique({
          where: { id: subscriptionPackageId },
        });

      if (!subscriptionPackage) {
        throw new BadRequestException(
          `SubscriptionPackage ${subscriptionPackageId} not found`
        );
      }

      amount = Number(subscriptionPackage.price);
      currency = subscriptionPackage.currency.toLowerCase();
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException(
        "amount must be provided and > 0 (or derived from subscriptionPackage)"
      );
    }

    // 2) Create Stripe PaymentIntent (amount is in smallest currency unit)
    const stripeAmount = Math.round(amount * 100);

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: stripeAmount,
      currency,
      metadata: {
        userId,
        subscriptionPackageId: subscriptionPackageId || "",
      },
    });

    // 3) Create Payment row
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: null,
        amount,
        currency: currency.toUpperCase(),
        status: PaymentStatus.PENDING,
        method: PaymentMethodType.CARD,
        transactionId: paymentIntent.id,
        gateway: PaymentGateway.STRIPE,
        gatewayData: paymentIntent as any,
        description:
          createPaymentDto.description ||
          (subscriptionPackageId
            ? "Subscription purchase"
            : "One-time payment"),
      },
    });

    return {
      paymentId: payment.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency: currency.toUpperCase(),
    };
  }

  /**
   * Handle incoming Stripe webhook events with signature verification.
   * @param payload Raw request body (string or Buffer)
   * @param signature Stripe signature from 'stripe-signature' header
   */
  async handleStripeWebhook(
    payload: string | Buffer,
    signature: string | undefined
  ) {
    const webhookSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET");
    const isProduction = process.env.NODE_ENV === "production";

    // If no webhook secret configured, allow unverified webhooks in dev mode
    if (!webhookSecret || webhookSecret === "whsec_dummy" || webhookSecret === "") {
      if (isProduction) {
        throw new UnauthorizedException(
          "Webhook secret not configured. Cannot verify webhook in production."
        );
      }
      
      Logger.warn(
        "STRIPE_WEBHOOK_SECRET not configured. Webhook verification skipped (dev mode).",
        "PaymentsService"
      );
      
      // For dev: try to parse as JSON event (manual testing)
      try {
        const parsed = typeof payload === "string" ? JSON.parse(payload) : JSON.parse(payload.toString());
        
        // Handle both Stripe Event format and direct PaymentIntent format (for manual testing)
        let event: Stripe.Event;
        if (parsed.type && parsed.data) {
          // Already a Stripe Event object
          event = parsed as Stripe.Event;
        } else if (parsed.object === "payment_intent") {
          // Direct PaymentIntent object - wrap it in an Event structure
          const status = parsed.status;
          if (status === "succeeded") {
            event = {
              id: `evt_manual_${Date.now()}`,
              object: "event",
              type: "payment_intent.succeeded",
              data: { object: parsed },
              created: Math.floor(Date.now() / 1000),
              livemode: false,
              pending_webhooks: 0,
              request: null,
              api_version: null,
            } as Stripe.Event;
          } else if (status === "requires_payment_method" || status === "canceled") {
            event = {
              id: `evt_manual_${Date.now()}`,
              object: "event",
              type: "payment_intent.payment_failed",
              data: { object: parsed },
              created: Math.floor(Date.now() / 1000),
              livemode: false,
              pending_webhooks: 0,
              request: null,
              api_version: null,
            } as Stripe.Event;
          } else {
            throw new BadRequestException(`Cannot process PaymentIntent with status: ${status}`);
          }
        } else {
          throw new BadRequestException("Invalid webhook payload format");
        }
        
        Logger.log(`🔔 Received unverified Stripe webhook: ${event.type}`, "PaymentsService");
        return this.processWebhookEvent(event);
      } catch (err) {
        throw new BadRequestException(`Invalid webhook payload: ${err.message}`);
      }
    }

    // If webhook secret is configured, signature is required
    if (!signature) {
      if (isProduction) {
        throw new UnauthorizedException("Missing Stripe signature header");
    }
      // In dev, if secret is set but no signature, still allow (for testing)
      Logger.warn(
        "Webhook secret configured but no signature provided. Allowing in dev mode.",
        "PaymentsService"
      );
      try {
        const parsed = typeof payload === "string" ? JSON.parse(payload) : JSON.parse(payload.toString());
        
        // Handle both Stripe Event format and direct PaymentIntent format (for manual testing)
        let event: Stripe.Event;
        if (parsed.type && parsed.data) {
          // Already a Stripe Event object
          event = parsed as Stripe.Event;
        } else if (parsed.object === "payment_intent") {
          // Direct PaymentIntent object - wrap it in an Event structure
          const status = parsed.status;
          if (status === "succeeded") {
            event = {
              id: `evt_manual_${Date.now()}`,
              object: "event",
              type: "payment_intent.succeeded",
              data: { object: parsed },
              created: Math.floor(Date.now() / 1000),
              livemode: false,
              pending_webhooks: 0,
              request: null,
              api_version: null,
            } as Stripe.Event;
          } else if (status === "requires_payment_method" || status === "canceled") {
            event = {
              id: `evt_manual_${Date.now()}`,
              object: "event",
              type: "payment_intent.payment_failed",
              data: { object: parsed },
              created: Math.floor(Date.now() / 1000),
              livemode: false,
              pending_webhooks: 0,
              request: null,
              api_version: null,
            } as Stripe.Event;
          } else {
            throw new BadRequestException(`Cannot process PaymentIntent with status: ${status}`);
          }
        } else {
          throw new BadRequestException("Invalid webhook payload format");
        }
        
        Logger.log(`🔔 Received unverified Stripe webhook (secret set but no sig): ${event.type}`, "PaymentsService");
        return this.processWebhookEvent(event);
      } catch (err) {
        throw new BadRequestException(`Invalid webhook payload: ${err.message}`);
      }
    }

    // Verify webhook signature
    try {
      const event = this.stripeService.verifyWebhookSignature(
        payload,
        signature,
        webhookSecret
      );

      Logger.log(`🔔 Verified Stripe webhook: ${event.type}`, "PaymentsService");
      return this.processWebhookEvent(event);
    } catch (err) {
      Logger.error(
        `❌ Webhook signature verification failed: ${err.message}`,
        err.stack,
        "PaymentsService"
      );
      throw new UnauthorizedException("Invalid webhook signature");
    }
    }

  /**
   * Process a verified Stripe webhook event
   */
  private async processWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "payment_intent.succeeded":
        return this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );

      case "payment_intent.payment_failed":
        return this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );

      default:
        Logger.log(
          `ℹ️ Unhandled Stripe event type: ${event.type}`,
          "PaymentsService"
        );
        return { received: true };
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ) {
    const transactionId = paymentIntent.id;

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
    });

    if (!payment) {
      Logger.warn(
        `Stripe webhook (succeeded): Payment not found for transactionId=${transactionId}`,
        "PaymentsService"
      );
      return { received: true };
    }

    // Update payment status and gateway data
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        gatewayData: paymentIntent as any,
      },
    });

    const subscriptionPackageId =
      paymentIntent.metadata?.subscriptionPackageId || "";

    // If there's no subscriptionPackageId or subscription already linked, we're done
    if (!subscriptionPackageId || payment.subscriptionId) {
      return { received: true };
    }

    // Create a subscription for the user based on the package validityDays
    const subscriptionPackage =
      await this.prisma.subscriptionPackage.findUnique({
        where: { id: subscriptionPackageId },
      });

    if (!subscriptionPackage) {
      Logger.warn(
        `Stripe webhook (succeeded): SubscriptionPackage not found for id=${subscriptionPackageId}`,
        "PaymentsService"
      );
      return { received: true };
    }

    // Use a transaction to ensure atomicity: cancel old subscriptions and create new one
    // This prevents race conditions when multiple payments succeed simultaneously
    const subscription = await this.prisma.$transaction(async (tx) => {
      // First, cancel ALL existing ACTIVE subscriptions for this user
      // This must happen in the same transaction to prevent race conditions
      const cancelledCount = await tx.subscription.updateMany({
        where: {
          userId: payment.userId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: {
          status: SubscriptionStatus.CANCELLED,
        },
      });

      if (cancelledCount.count > 0) {
        Logger.log(
          `Cancelled ${cancelledCount.count} existing ACTIVE subscription(s) for user ${payment.userId}`,
          "PaymentsService"
        );
      }

      // Now create the new subscription
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + subscriptionPackage.validityDays);

      return await tx.subscription.create({
        data: {
          userId: payment.userId,
          subscriptionPackageId,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          endDate: end,
          autoRenew: false,
          payments: {
            connect: { id: payment.id },
          },
        },
      });
    });

    // Link payment back to subscription
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: subscription.id },
    });

    Logger.log(
      `✅ Created subscription ${subscription.id} for user ${payment.userId} from payment ${payment.id}`,
      "PaymentsService"
    );

    return { received: true };
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const transactionId = paymentIntent.id;

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
    });

    if (!payment) {
      Logger.warn(
        `Stripe webhook (failed): Payment not found for transactionId=${transactionId}`,
        "PaymentsService"
      );
      return { received: true };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        gatewayData: paymentIntent as any,
      },
    });

    Logger.log(
      `⚠️ Marked payment ${payment.id} as FAILED from Stripe webhook`,
      "PaymentsService"
    );

    return { received: true };
  }

  async findAll(queryParams?: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const page = queryParams?.page || 1;
    const limit = queryParams?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (queryParams?.status) {
      where.status = queryParams.status;
    }

    if (queryParams?.method) {
      where.method = queryParams.method;
    }

    if (queryParams?.search) {
      where.OR = [
        {
          transactionId: { contains: queryParams.search },
        },
        { description: { contains: queryParams.search } },
        {
          user: {
            email: { contains: queryParams.search },
          },
        },
        {
          user: {
            firstName: { contains: queryParams.search },
          },
        },
        {
          user: {
            lastName: { contains: queryParams.search },
          },
        },
      ];
    }

    if (queryParams?.dateFrom || queryParams?.dateTo) {
      where.createdAt = {};
      if (queryParams.dateFrom) {
        where.createdAt.gte = new Date(queryParams.dateFrom);
      }
      if (queryParams.dateTo) {
        where.createdAt.lte = new Date(queryParams.dateTo);
      }
    }

    if (queryParams?.minAmount || queryParams?.maxAmount) {
      where.amount = {};
      if (queryParams.minAmount) {
        where.amount.gte = queryParams.minAmount;
      }
      if (queryParams.maxAmount) {
        where.amount.lte = queryParams.maxAmount;
      }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" }; // Default sort
    if (queryParams?.sortBy) {
      orderBy = {};
      orderBy[queryParams.sortBy] = queryParams.sortOrder || "desc";
    }

    // Filter out payments with invalid users (users that don't exist)
    // This prevents Prisma errors when a payment references a deleted user
    // Always filter by valid users to prevent errors from Prisma Studio or direct queries
    const validUserIds = await this.prisma.user.findMany({
      select: { id: true },
    });
    const validUserIdArray = validUserIds.map((u) => u.id);
    
    // Build where clause that ensures userId is in valid users
    let whereWithValidUser = where;
    
    if (validUserIdArray.length > 0) {
      // If already filtering by userId, check if it's valid
      if (where.userId) {
        // If userId is a direct value, check if it's valid
        if (typeof where.userId === 'string') {
          if (!validUserIdArray.includes(where.userId)) {
            // Invalid userId, return empty result
            return {
              data: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
              },
            };
          }
          // Valid userId, keep the filter
          whereWithValidUser = where;
        } else if (where.userId.in) {
          // Filter the in array to only valid user IDs
          const validInArray = where.userId.in.filter((id: string) => 
            validUserIdArray.includes(id)
          );
          if (validInArray.length === 0) {
            return {
              data: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
              },
            };
          }
          whereWithValidUser = {
            ...where,
            userId: { in: validInArray },
          };
        } else {
          // Other userId filters, add valid user constraint
          whereWithValidUser = {
            ...where,
            userId: {
              ...where.userId,
              in: validUserIdArray,
            },
          };
        }
      } else {
        // No userId filter, add valid user constraint
        whereWithValidUser = {
          ...where,
          userId: {
            in: validUserIdArray,
          },
        };
      }
    } else {
      // No valid users exist, return empty result
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Get total count for pagination (only count payments with valid users)
    const total = await this.prisma.payment.count({ where: whereWithValidUser });

    // Get paginated results
    // Note: whereWithValidUser already filters to only valid users, so this should not fail
    const payments = await this.prisma.payment.findMany({
      where: whereWithValidUser,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find payments with invalid user IDs (for testing/cleanup)
   */
  async findInvalidPayments() {
    const allPayments = await this.prisma.payment.findMany({
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    const validUserIds = await this.prisma.user.findMany({
      select: { id: true },
    });
    const validUserIdSet = new Set(validUserIds.map((u) => u.id));

    const invalidPayments = allPayments.filter(
      (p) => !validUserIdSet.has(p.userId)
    );

    return invalidPayments;
  }

  /**
   * Delete payments with invalid user IDs (for testing cleanup)
   * WARNING: This permanently deletes payments!
   * 
   * Use this to clean up orphaned payments that reference deleted users.
   * This prevents Prisma errors when querying payments with user relations.
   */
  async deleteInvalidPayments() {
    const invalidPayments = await this.findInvalidPayments();
    const invalidPaymentIds = invalidPayments.map((p) => p.id);

    if (invalidPaymentIds.length === 0) {
      return {
        deleted: 0,
        message: "No invalid payments found",
      };
    }

    const result = await this.prisma.payment.deleteMany({
      where: {
        id: {
          in: invalidPaymentIds,
        },
      },
    });

    Logger.warn(
      `Deleted ${result.count} invalid payment(s) with non-existent users`,
      "PaymentsService"
    );

    return {
      deleted: result.count,
      message: `Deleted ${result.count} invalid payment(s)`,
      invalidPaymentIds,
    };
  }

  /**
   * Clean up invalid payments automatically
   * Call this periodically or on startup to maintain data integrity
   */
  async cleanupInvalidPayments() {
    try {
      const result = await this.deleteInvalidPayments();
      if (result.deleted > 0) {
        Logger.log(
          `🧹 Cleaned up ${result.deleted} invalid payment(s)`,
          "PaymentsService"
        );
      }
      return result;
    } catch (error) {
      Logger.error(
        "Failed to clean up invalid payments",
        error,
        "PaymentsService"
      );
      throw error;
    }
  }

  /**
   * Manually sync payment status from Stripe
   * Useful when webhook is missed or in development
   */
  async syncPaymentFromStripe(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException("Payment not found");
    }

    if (!payment.transactionId) {
      throw new BadRequestException("Payment has no transaction ID");
    }

    if (payment.gateway !== PaymentGateway.STRIPE) {
      throw new BadRequestException("Payment is not a Stripe payment");
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await this.stripeService.retrievePaymentIntent(
      payment.transactionId
    );

    // If payment succeeded on Stripe but is still PENDING in our DB, process it
    if (paymentIntent.status === "succeeded" && payment.status === PaymentStatus.PENDING) {
      Logger.log(
        `🔄 Syncing payment ${paymentId} from Stripe (succeeded but PENDING in DB)`,
        "PaymentsService"
      );
      
      // Process as if webhook was received
      await this.handlePaymentIntentSucceeded(paymentIntent);
      
      // Return updated payment
      return this.findOne(paymentId);
    }

    // If payment failed on Stripe but is still PENDING in our DB, update it
    if (
      (paymentIntent.status === "requires_payment_method" ||
        paymentIntent.status === "canceled") &&
      payment.status === PaymentStatus.PENDING
    ) {
      Logger.log(
        `🔄 Syncing payment ${paymentId} from Stripe (failed but PENDING in DB)`,
        "PaymentsService"
      );
      
      await this.handlePaymentIntentFailed(paymentIntent);
      
      return this.findOne(paymentId);
    }

    // Payment status is already in sync
    return this.findOne(paymentId);
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        refunds: true,
      },
    });

    if (!payment) {
      return null;
    }

    // Check if user exists before including it
    const user = await this.prisma.user.findUnique({
      where: { id: payment.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    return {
      ...payment,
      user: user || null, // Return null if user doesn't exist
    };
  }

  // Payment Methods methods
  async getPaymentMethods(userId?: string) {
    const where = userId ? { userId } : {};

    try {
      const result = await this.prisma.paymentMethod.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });

      return result;
    } catch (error) {
      console.error("❌ Error in getPaymentMethods:", error);
      throw error;
    }
  }

  async createPaymentMethod(createPaymentMethodDto: any) {
    // Validate required fields
    if (!createPaymentMethodDto.userId) {
      throw new Error("User ID is required");
    }
    if (!createPaymentMethodDto.type) {
      throw new Error("Payment method type is required");
    }
    if (!createPaymentMethodDto.provider) {
      throw new Error("Provider is required");
    }
    if (!createPaymentMethodDto.providerId) {
      throw new Error("Provider ID is required");
    }

    // If this is set as default, unset other defaults for this user
    if (createPaymentMethodDto.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: {
          userId: createPaymentMethodDto.userId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.paymentMethod.create({
      data: createPaymentMethodDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updatePaymentMethod(id: string, updatePaymentMethodDto: any) {
    // If this is set as default, unset other defaults for this user
    if (updatePaymentMethodDto.isDefault) {
      const paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (paymentMethod) {
        await this.prisma.paymentMethod.updateMany({
          where: {
            userId: paymentMethod.userId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }
    }

    return this.prisma.paymentMethod.update({
      where: { id },
      data: updatePaymentMethodDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deletePaymentMethod(id: string) {
    return this.prisma.paymentMethod.delete({
      where: { id },
    });
  }
}
