import { Module } from "@nestjs/common";
import { GoalsController } from "./goals.controller";
import { GoalsService } from "./goals.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AchievementsModule } from "../achievements/achievements.module";

@Module({
  imports: [NotificationsModule, AchievementsModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
