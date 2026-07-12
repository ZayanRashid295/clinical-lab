import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { QuestionReviewService } from "./question-review.service";
import { StartReviewAttemptDto } from "./dto/start-review-attempt.dto";
import { UpdateReviewResponseDto } from "./dto/update-review-response.dto";

@ApiTags("question-review")
@Controller("question-review")
export class QuestionReviewController {
  constructor(private reviewService: QuestionReviewService) {}

  @Get("bundles/:slug")
  getBundle(@Param("slug") slug: string) {
    return this.reviewService.getBundleBySlug(slug);
  }

  @Post("bundles/:slug/start")
  start(@Param("slug") slug: string, @Body() dto: StartReviewAttemptDto) {
    return this.reviewService.startAttempt(slug, dto);
  }

  @Get("attempts/:attemptId")
  getAttempt(
    @Param("attemptId") attemptId: string,
    @Headers("x-review-attempt-secret") attemptSecret: string
  ) {
    return this.reviewService.getAttempt(attemptId, attemptSecret);
  }

  @Patch("attempts/:attemptId/responses/:questionId")
  updateResponse(
    @Param("attemptId") attemptId: string,
    @Param("questionId") questionId: string,
    @Headers("x-review-attempt-secret") attemptSecret: string,
    @Body() dto: UpdateReviewResponseDto
  ) {
    return this.reviewService.updateResponse(
      attemptId,
      questionId,
      attemptSecret,
      dto
    );
  }

  @Post("attempts/:attemptId/complete")
  complete(
    @Param("attemptId") attemptId: string,
    @Headers("x-review-attempt-secret") attemptSecret: string
  ) {
    return this.reviewService.completeAttempt(attemptId, attemptSecret);
  }

  @Get("admin/bundles")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  listBundles() {
    return this.reviewService.listBundlesAdmin();
  }

  @Get("admin/attempts")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  listAttempts(@Query("bundleId") bundleId?: string) {
    return this.reviewService.listAttemptsAdmin(bundleId);
  }

  @Get("admin/attempts/:attemptId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  getAttemptAdmin(@Param("attemptId") attemptId: string) {
    return this.reviewService.getAttemptAdmin(attemptId);
  }
}
