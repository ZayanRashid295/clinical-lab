import { Module } from "@nestjs/common";
import { QuestionReportsController } from "./question-reports.controller";
import { QuestionReportsService } from "./question-reports.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [QuestionReportsController],
  providers: [QuestionReportsService],
  exports: [QuestionReportsService],
})
export class QuestionReportsModule {}
