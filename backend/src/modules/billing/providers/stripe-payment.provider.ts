import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import {
  AttachPaymentMethodParams,
  CreateCustomerParams,
  CreateCustomerResult,
  CreatePriceParams,
  CreatePriceResult,
  CreateProductParams,
  CreateProductResult,
  CreateSetupIntentParams,
  CreateSetupIntentResult,
  CreateSubscriptionParams,
  CreateSubscriptionResult,
  PaymentProvider,
  UpdateSubscriptionParams,
} from "./payment-provider.interface";

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";
  private stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>("STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    this.stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion });
  }

  async createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
    return { customerId: customer.id };
  }

  async createSetupIntent(params: CreateSetupIntentParams): Promise<CreateSetupIntentResult> {
    const intent = await this.stripe.setupIntents.create({
      customer: params.customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: params.metadata,
    });
    if (!intent.client_secret) {
      throw new Error("SetupIntent missing client_secret");
    }
    return { clientSecret: intent.client_secret, setupIntentId: intent.id };
  }

  async attachPaymentMethod(params: AttachPaymentMethodParams): Promise<void> {
    await this.stripe.paymentMethods.attach(params.paymentMethodId, {
      customer: params.customerId,
    });
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> {
    const subParams: Stripe.SubscriptionCreateParams = {
      customer: params.customerId,
      items: [{ price: params.priceId }],
      default_payment_method: params.paymentMethodId,
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: params.metadata,
    };

    if (params.trialDays && params.trialDays > 0) {
      subParams.trial_period_days = params.trialDays;
    }
    if (params.couponId) {
      subParams.discounts = [{ coupon: params.couponId }];
    }

    const subscription = await this.stripe.subscriptions.create(subParams);
    const sub = subscription as Stripe.Subscription;
    return {
      subscriptionId: sub.id,
      status: sub.status,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
      currentPeriodEnd: (sub as any).current_period_end
        ? new Date((sub as any).current_period_end * 1000)
        : undefined,
    };
  }

  async updateSubscription(params: UpdateSubscriptionParams): Promise<void> {
    const update: Stripe.SubscriptionUpdateParams = {};
    if (params.cancelAtPeriodEnd !== undefined) {
      update.cancel_at_period_end = params.cancelAtPeriodEnd;
    }
    if (params.paymentMethodId) {
      update.default_payment_method = params.paymentMethodId;
    }
    if (params.priceId) {
      const sub = await this.stripe.subscriptions.retrieve(params.subscriptionId);
      const itemId = sub.items.data[0]?.id;
      if (itemId) {
        update.items = [{ id: itemId, price: params.priceId }];
        update.proration_behavior = "create_prorations";
      }
    }
    await this.stripe.subscriptions.update(params.subscriptionId, update);
  }

  async cancelSubscription(subscriptionId: string, atPeriodEnd = true): Promise<void> {
    if (atPeriodEnd) {
      await this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      return;
    }
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
  }

  async createProduct(params: CreateProductParams): Promise<CreateProductResult> {
    const product = await this.stripe.products.create({
      name: params.name,
      description: params.description,
      metadata: params.metadata,
    });
    return { productId: product.id };
  }

  async createPrice(params: CreatePriceParams): Promise<CreatePriceResult> {
    const price = await this.stripe.prices.create({
      product: params.productId,
      unit_amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      recurring: { interval: params.interval },
    });
    return { priceId: price.id };
  }

  async updateProduct(productId: string, params: Partial<CreateProductParams>): Promise<void> {
    await this.stripe.products.update(productId, {
      name: params.name,
      description: params.description,
      metadata: params.metadata,
    });
  }

  async retrievePaymentMethod(paymentMethodId: string) {
    const pm = await this.stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.type !== "card" || !pm.card) {
      return {};
    }
    return {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    };
  }

  verifyWebhook(payload: string | Buffer, signature: string): Stripe.Event {
    const secret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
