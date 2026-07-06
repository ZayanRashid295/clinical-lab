import { Module } from "@nestjs/common";
import { MockExamsController } from "./mock-exams.controller";
import { MockExamsService } from "./mock-exams.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AchievementsModule } from "../achievements/achievements.module";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [NotificationsModule, AchievementsModule, BillingModule],
  controllers: [MockExamsController],
  providers: [MockExamsService],
  exports: [MockExamsService],
})
export class MockExamsModule {}
