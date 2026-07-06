import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BillingSubscriptionsService } from "../subscriptions/billing-subscriptions.service";

@Injectable()
export class BillingScheduler {
  private readonly logger = new Logger(BillingScheduler.name);

  constructor(private subscriptions: BillingSubscriptionsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: "billing:trial-reminders" })
  async trialReminders() {
    this.logger.debug("Running trial reminder job");
    await this.subscriptions.processTrialReminders();
  }

  @Cron(CronExpression.EVERY_HOUR, { name: "billing:payment-retries" })
  async paymentRetries() {
    this.logger.debug("Running payment retry job");
    await this.subscriptions.processDueRetries();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: "billing:expire-cancelled" })
  async expireCancelled() {
    this.logger.debug("Running expired subscription job");
    await this.subscriptions.processExpiredSubscriptions();
  }
}
