import { Module } from "@nestjs/common";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AchievementsModule } from "../achievements/achievements.module";

@Module({
  imports: [NotificationsModule, AchievementsModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
