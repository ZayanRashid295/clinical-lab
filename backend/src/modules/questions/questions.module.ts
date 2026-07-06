import { Module } from "@nestjs/common";
import { QuestionsService } from "./questions.service";
import { QuestionsController } from "./questions.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { BillingModule } from "../billing/billing.module";
import { AuthModule } from "../auth/auth.module";
import { ActivityLogModule } from "../activity-log/activity-log.module";

@Module({
  imports: [PrismaModule, BillingModule, AuthModule, ActivityLogModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
