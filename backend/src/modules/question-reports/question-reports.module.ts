import { Module } from "@nestjs/common";
import { QuestionReportsController } from "./question-reports.controller";
import { QuestionReportsService } from "./question-reports.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AchievementsModule } from "../achievements/achievements.module";
import { ActivityLogModule } from "../activity-log/activity-log.module";

@Module({
  imports: [NotificationsModule, AchievementsModule, ActivityLogModule],
  controllers: [QuestionReportsController],
  providers: [QuestionReportsService],
  exports: [QuestionReportsService],
})
export class QuestionReportsModule {}
