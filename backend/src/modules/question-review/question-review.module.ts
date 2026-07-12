import { Module } from "@nestjs/common";
import { QuestionReviewController } from "./question-review.controller";
import { QuestionReviewService } from "./question-review.service";
import { QuestionReviewAdminService } from "./question-review-admin.service";

@Module({
  controllers: [QuestionReviewController],
  providers: [QuestionReviewService, QuestionReviewAdminService],
  exports: [QuestionReviewService, QuestionReviewAdminService],
})
export class QuestionReviewModule {}
