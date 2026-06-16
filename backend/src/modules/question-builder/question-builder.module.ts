import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { QuestionBuilderController } from "./question-builder.controller";
import { QuestionBuilderService } from "./question-builder.service";

@Module({
  imports: [AuthModule],
  controllers: [QuestionBuilderController],
  providers: [QuestionBuilderService],
})
export class QuestionBuilderModule {}
