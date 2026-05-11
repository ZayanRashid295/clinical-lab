import { Module } from "@nestjs/common";
import { StudyPlansController } from "./study-plans.controller";
import { StudyPlansService } from "./study-plans.service";
import { AuthModule } from "../auth/auth.module";
import { AchievementsModule } from "../achievements/achievements.module";

@Module({
  imports: [AuthModule, AchievementsModule],
  controllers: [StudyPlansController],
  providers: [StudyPlansService],
  exports: [StudyPlansService],
})
export class StudyPlansModule {}
