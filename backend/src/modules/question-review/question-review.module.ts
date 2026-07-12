import { Module } from "@nestjs/common";
import { QuestionReviewController } from "./question-review.controller";
import { QuestionReviewService } from "./question-review.service";

@Module({
  controllers: [QuestionReviewController],
  providers: [QuestionReviewService],
  exports: [QuestionReviewService],
})
export class QuestionReviewModule {}
