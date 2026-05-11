import { Module } from "@nestjs/common";
import { QuestionReportsController } from "./question-reports.controller";
import { QuestionReportsService } from "./question-reports.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AchievementsModule } from "../achievements/achievements.module";

@Module({
  imports: [NotificationsModule, AchievementsModule],
  controllers: [QuestionReportsController],
  providers: [QuestionReportsService],
  exports: [QuestionReportsService],
})
export class QuestionReportsModule {}
