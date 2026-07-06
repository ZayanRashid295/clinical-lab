import { Injectable, Logger } from "@nestjs/common";
import {
  BillingInvoiceStatus,
  BillingPaymentStatus,
  BillingSubscriptionStatus,
  BillingWebhookStatus,
} from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { StripePaymentProvider } from "../providers/stripe-payment.provider";
import { BillingSubscriptionsService } from "../subscriptions/billing-subscriptions.service";
import { BillingEmailService } from "../emails/billing-email.service";
import { mapStripeStatus } from "../billing.types";

@Injectable()
export class BillingWebhooksService {
  private readonly logger = new Logger(BillingWebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private stripe: StripePaymentProvider,
    private subscriptions: BillingSubscriptionsService,
    private emailService: BillingEmailService
  ) {}

  async handleStripeWebhook(payload: string | Buffer, signature: string) {
    const event = this.stripe.verifyWebhook(payload, signature) as Stripe.Event;

    const existing = await this.prisma.billingWebhookEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existing?.status === BillingWebhookStatus.PROCESSED) {
      return { received: true, duplicate: true };
    }

    const record = await this.prisma.billingWebhookEvent.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        eventType: event.type,
        payload: event as object,
        status: BillingWebhookStatus.PENDING,
      },
      update: {},
    });

    try {
      await this.processEvent(event);
      await this.prisma.billingWebhookEvent.update({
        where: { id: record.id },
        data: { status: BillingWebhookStatus.PROCESSED, processedAt: new Date() },
      });
    } catch (err: any) {
      this.logger.error(`Webhook ${event.type} failed: ${err?.message}`);
      await this.prisma.billingWebhookEvent.update({
        where: { id: record.id },
        data: {
          status: BillingWebhookStatus.FAILED,
          errorMessage: err?.message,
          processedAt: new Date(),
        },
      });
      throw err;
    }

    return { received: true };
  }

  private async processEvent(event: Stripe.Event) {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.trial_will_end":
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      case "invoice.created":
      case "invoice.finalized":
        await this.handleInvoice(event.data.object as Stripe.Invoice, BillingInvoiceStatus.OPEN);
        break;
      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "payment_intent.succeeded":
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_method.attached":
        await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;
      default:
        this.logger.debug(`Unhandled webhook event: ${event.type}`);
    }
  }

  private async findSubscriptionByProviderId(providerSubscriptionId: string) {
    return this.prisma.billingSubscription.findUnique({
      where: { providerSubscriptionId },
      include: { user: true, plan: true },
    });
  }

  private async handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
    const sub = await this.findSubscriptionByProviderId(stripeSub.id);
    if (!sub) return;

    const status = mapStripeStatus(stripeSub.status);
    await this.prisma.billingSubscription.update({
      where: { id: sub.id },
      data: {
        status,
        trialStart: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000) : null,
        trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
      },
    });

    if (status === BillingSubscriptionStatus.ACTIVE && sub.status !== BillingSubscriptionStatus.ACTIVE) {
      await this.emailService.sendSubscriptionActivated(sub.user, sub);
    }
  }

  private async handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
    const sub = await this.findSubscriptionByProviderId(stripeSub.id);
    if (!sub) return;

    await this.prisma.billingSubscription.update({
      where: { id: sub.id },
      data: {
        status: BillingSubscriptionStatus.CANCELED,
        endedAt: new Date(),
      },
    });
    await this.subscriptions.moveToFreePlan(sub.userId);
  }

  private async handleTrialWillEnd(stripeSub: Stripe.Subscription) {
    const sub = await this.findSubscriptionByProviderId(stripeSub.id);
    if (!sub) return;
    await this.emailService.sendTrialEnding(sub.user, sub);
  }

  private async handleInvoice(invoice: Stripe.Invoice, status: BillingInvoiceStatus) {
    if (!invoice.id) return;
    const subId = (invoice as any).subscription;
    const sub = subId
      ? await this.findSubscriptionByProviderId(String(subId))
      : null;

    const userId =
      sub?.userId ||
      (invoice.metadata?.userId as string) ||
      (invoice.customer_email
        ? (
            await this.prisma.user.findFirst({ where: { email: invoice.customer_email } })
          )?.id
        : null);

    if (!userId) return;

    await this.subscriptions.recordInvoice(
      userId,
      sub?.id ?? null,
      invoice.number ?? `INV-${invoice.id.slice(-8)}`,
      (invoice.amount_due ?? 0) / 100,
      (invoice.currency ?? "usd").toUpperCase(),
      invoice.id,
      status,
      invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
      invoice.period_end ? new Date(invoice.period_end * 1000) : undefined
    );
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    await this.handleInvoice(invoice, BillingInvoiceStatus.PAID);
    const subId = (invoice as any).subscription;
    const sub = subId
      ? await this.findSubscriptionByProviderId(String(subId))
      : null;
    if (!sub) return;

    await this.subscriptions.recordPayment(
      sub.userId,
      sub.id,
      (invoice.amount_paid ?? 0) / 100,
      (invoice.currency ?? "usd").toUpperCase(),
      String((invoice as any).payment_intent ?? invoice.id),
      BillingPaymentStatus.SUCCEEDED,
      "Subscription renewal"
    );

    await this.prisma.billingSubscription.update({
      where: { id: sub.id },
      data: { status: BillingSubscriptionStatus.ACTIVE },
    });

    await this.emailService.sendPaymentSuccessful(sub.user, sub, (invoice.amount_paid ?? 0) / 100);
    await this.emailService.sendRenewalConfirmation(sub.user, sub);
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subId = (invoice as any).subscription;
    const sub = subId
      ? await this.findSubscriptionByProviderId(String(subId))
      : null;
    if (!sub) return;

    await this.prisma.billingSubscription.update({
      where: { id: sub.id },
      data: { status: BillingSubscriptionStatus.PAST_DUE },
    });

    await this.subscriptions.schedulePaymentRetry(sub.id, 1);
    await this.emailService.sendPaymentFailed(sub.user, sub);
  }

  private async handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
    const userId = pi.metadata?.userId;
    if (!userId) return;

    await this.subscriptions.recordPayment(
      userId,
      pi.metadata?.subscriptionId ?? null,
      (pi.amount_received ?? pi.amount) / 100,
      (pi.currency ?? "usd").toUpperCase(),
      pi.id,
      BillingPaymentStatus.SUCCEEDED,
      pi.description ?? undefined
    );
  }

  private async handlePaymentFailed(pi: Stripe.PaymentIntent) {
    const userId = pi.metadata?.userId;
    if (!userId) return;

    await this.subscriptions.recordPayment(
      userId,
      pi.metadata?.subscriptionId ?? null,
      pi.amount / 100,
      (pi.currency ?? "usd").toUpperCase(),
      pi.id,
      BillingPaymentStatus.FAILED,
      pi.last_payment_error?.message
    );
  }

  private async handlePaymentMethodAttached(pm: Stripe.PaymentMethod) {
    const userId = pm.metadata?.userId;
    if (!userId || pm.type !== "card" || !pm.card) return;

    await this.prisma.billingPaymentMethod.upsert({
      where: {
        provider_providerMethodId: { provider: "stripe", providerMethodId: pm.id },
      },
      create: {
        userId,
        provider: "stripe",
        providerMethodId: pm.id,
        cardBrand: pm.card.brand,
        cardLast4: pm.card.last4,
        cardExpMonth: pm.card.exp_month,
        cardExpYear: pm.card.exp_year,
      },
      update: {
        cardBrand: pm.card.brand,
        cardLast4: pm.card.last4,
        cardExpMonth: pm.card.exp_month,
        cardExpYear: pm.card.exp_year,
        isActive: true,
      },
    });
  }
}
