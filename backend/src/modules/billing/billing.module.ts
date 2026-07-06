import { Module, forwardRef } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuthModule } from "../auth/auth.module";
import { StripePaymentProvider } from "./providers/stripe-payment.provider";
import { BillingPlansService } from "./plans/billing-plans.service";
import { BillingPlansController } from "./plans/billing-plans.controller";
import { BillingSubscriptionsService } from "./subscriptions/billing-subscriptions.service";
import { BillingSubscriptionsController } from "./subscriptions/billing-subscriptions.controller";
import { BillingWebhooksService } from "./webhooks/billing-webhooks.service";
import { BillingWebhooksController } from "./webhooks/billing-webhooks.controller";
import { BillingEmailService } from "./emails/billing-email.service";
import { BillingScheduler } from "./scheduler/billing.scheduler";
import { BillingPromotionsService } from "./promotions/billing-promotions.service";
import { BillingPromotionsController } from "./promotions/billing-promotions.controller";
import { FeatureAccessGuard } from "./guards/feature-access.guard";

@Module({
  imports: [PrismaModule, NotificationsModule, ScheduleModule.forRoot(), forwardRef(() => AuthModule)],
  controllers: [
    BillingPlansController,
    BillingSubscriptionsController,
    BillingWebhooksController,
    BillingPromotionsController,
  ],
  providers: [
    StripePaymentProvider,
    BillingPlansService,
    BillingSubscriptionsService,
    BillingPromotionsService,
    BillingWebhooksService,
    BillingEmailService,
    BillingScheduler,
    FeatureAccessGuard,
  ],
  exports: [BillingSubscriptionsService, BillingPlansService, BillingPromotionsService, FeatureAccessGuard],
})
export class BillingModule {}
