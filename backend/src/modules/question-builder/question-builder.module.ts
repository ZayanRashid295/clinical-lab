import { Module } from "@nestjs/common";
import { QuestionBuilderController } from "./question-builder.controller";
import { QuestionBuilderService } from "./question-builder.service";
import { AuthModule } from "../auth/auth.module";
import { ActivityLogModule } from "../activity-log/activity-log.module";

@Module({
  imports: [AuthModule, ActivityLogModule],
  controllers: [QuestionBuilderController],
  providers: [QuestionBuilderService],
})
export class QuestionBuilderModule {}
