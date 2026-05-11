import { Module } from "@nestjs/common";
import { QuestionsService } from "./questions.service";
import { QuestionsController } from "./questions.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, SubscriptionsModule, AuthModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
