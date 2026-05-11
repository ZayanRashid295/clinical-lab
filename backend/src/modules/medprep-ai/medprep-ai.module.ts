import { Module } from "@nestjs/common";
import { MedprepAiController } from "./medprep-ai.controller";
import { MedprepAiService } from "./medprep-ai.service";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { AchievementsModule } from "../achievements/achievements.module";

@Module({
  imports: [SubscriptionsModule, AchievementsModule],
  controllers: [MedprepAiController],
  providers: [MedprepAiService],
  exports: [MedprepAiService],
})
export class MedprepAiModule {}
