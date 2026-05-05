import { Module } from "@nestjs/common";
import { AssessmentsService } from "./assessments.service";
import { AssessmentsController } from "./assessments.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { AchievementsModule } from "../achievements/achievements.module";
import { GoalsModule } from "../goals/goals.module";

@Module({
  imports: [PrismaModule, SubscriptionsModule, AchievementsModule, GoalsModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
