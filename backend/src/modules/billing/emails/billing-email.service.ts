import { Injectable, Logger } from "@nestjs/common";
import { BillingSubscription, User } from "@prisma/client";
import { NotificationsService } from "../../notifications/notifications.service";

type SubscriptionWithPlan = BillingSubscription & { plan?: { name: string } };

@Injectable()
export class BillingEmailService {
  private readonly logger = new Logger(BillingEmailService.name);

  constructor(private notifications: NotificationsService) {}

  private async notify(user: User, type: string, title: string, message: string, data?: object) {
    try {
      await this.notifications.create({
        userId: user.id,
        type: type as any,
        title,
        message,
        data: data ?? {},
      });
    } catch (err: any) {
      this.logger.warn(`Billing notification failed for ${user.email}: ${err?.message}`);
    }
    this.logger.log(`[Billing Email] ${title} → ${user.email}: ${message}`);
  }

  sendTrialStarted(user: User, sub: SubscriptionWithPlan) {
    return this.notify(
      user,
      "BILLING_TRIAL_STARTED",
      "Free trial started",
      `Your ${sub.plan?.name ?? "plan"} trial has begun. Enjoy full access!`,
      { subscriptionId: sub.id }
    );
  }

  sendTrialReminder(user: User, sub: SubscriptionWithPlan, daysRemaining: number) {
    return this.notify(
      user,
      "BILLING_TRIAL_REMINDER",
      `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left in your trial`,
      `Your trial ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Your card will be charged automatically.`,
      { subscriptionId: sub.id, daysRemaining }
    );
  }

  sendTrialEnding(user: User, sub: SubscriptionWithPlan) {
    return this.notify(
      user,
      "BILLING_TRIAL_ENDING",
      "Trial ending soon",
      "Your free trial is ending soon. We'll charge your saved payment method.",
      { subscriptionId: sub.id }
    );
  }

  sendTrialEnded(user: User, sub: SubscriptionWithPlan) {
    return this.notify(
      user,
      "BILLING_TRIAL_ENDED",
      "Trial ended",
      "Your free trial has ended. Welcome to your paid subscription!",
      { subscriptionId: sub.id }
    );
  }

  sendPaymentSuccessful(user: User, sub: SubscriptionWithPlan, amount: number) {
    return this.notify(
      user,
      "BILLING_PAYMENT_SUCCESS",
      "Payment successful",
      `We received your payment of $${amount.toFixed(2)}.`,
      { subscriptionId: sub.id, amount }
    );
  }

  sendPaymentFailed(user: User, sub: SubscriptionWithPlan) {
    return this.notify(
      user,
      "BILLING_PAYMENT_FAILED",
      "Payment failed",
      "We couldn't process your payment. Please update your payment method to keep access.",
      { subscriptionId: sub.id }
    );
  }

  sendSubscriptionActivated(user: User, sub: SubscriptionWithPlan) {
    return this.notify(
      user,
      "BILLING_SUBSCRIPTION_ACTIVE",
      "Subscription activated",
      `Your ${sub.plan?.name ?? "subscription"} is now active.`,
      { subscriptionId: sub.id }
    );
  }

  sendSubscriptionCancelled(user: User, sub: SubscriptionWithPlan) {
    return this.notify(
      user,
      "BILLING_SUBSCRIPTION_CANCELLED",
      "Subscription cancelled",
      "Your subscription will remain active until the end of the current billing period.",
      { subscriptionId: sub.id }
    );
  }

  sendRenewalConfirmation(user: User, sub: SubscriptionWithPlan) {
    return this.notify(
      user,
      "BILLING_RENEWAL",
      "Subscription renewed",
      `Your ${sub.plan?.name ?? "subscription"} has been renewed successfully.`,
      { subscriptionId: sub.id }
    );
  }

  sendReceipt(user: User, amount: number, invoiceNumber: string) {
    return this.notify(
      user,
      "BILLING_RECEIPT",
      "Payment receipt",
      `Receipt for invoice ${invoiceNumber}: $${amount.toFixed(2)}.`,
      { invoiceNumber, amount }
    );
  }
}
