import { Module } from "@nestjs/common";
import { AiTutorController } from "./ai-tutor.controller";
import { AiTutorService } from "./ai-tutor.service";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { AchievementsModule } from "../achievements/achievements.module";

@Module({
  imports: [PrismaModule, ConfigModule, SubscriptionsModule, AchievementsModule],
  controllers: [AiTutorController],
  providers: [AiTutorService],
  exports: [AiTutorService],
})
export class AiTutorModule {}
