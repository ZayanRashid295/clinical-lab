import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { ActivityLogService } from "./activity-log.service";
import { ActivityLogDetailsService } from "./activity-log-details.service";
import { ActivityLogController } from "./activity-log.controller";

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [ActivityLogController],
  providers: [ActivityLogService, ActivityLogDetailsService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
