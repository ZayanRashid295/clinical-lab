import { Module } from "@nestjs/common";
import { AssessmentsService } from "./assessments.service";
import { AssessmentsController } from "./assessments.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { BillingModule } from "../billing/billing.module";
import { AchievementsModule } from "../achievements/achievements.module";
import { GoalsModule } from "../goals/goals.module";
import { ActivityLogModule } from "../activity-log/activity-log.module";

@Module({
  imports: [
    PrismaModule,
    BillingModule,
    AchievementsModule,
    GoalsModule,
    ActivityLogModule,
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
