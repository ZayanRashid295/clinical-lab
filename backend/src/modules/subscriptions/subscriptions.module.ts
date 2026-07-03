import { Module } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionsController } from "./subscriptions.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { ActivityLogModule } from "../activity-log/activity-log.module";

@Module({
  imports: [PrismaModule, ActivityLogModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
