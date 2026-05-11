import { Module } from "@nestjs/common";
import { FlashcardsController } from "./flashcards.controller";
import { FlashcardsService } from "./flashcards.service";
import { AchievementsModule } from "../achievements/achievements.module";
import { GoalsModule } from "../goals/goals.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AchievementsModule, GoalsModule, AuthModule],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
