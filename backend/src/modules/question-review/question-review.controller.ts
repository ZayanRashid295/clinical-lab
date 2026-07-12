import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { QuestionReviewService } from "./question-review.service";
import { QuestionReviewAdminService } from "./question-review-admin.service";
import { StartReviewAttemptDto } from "./dto/start-review-attempt.dto";
import { UpdateReviewResponseDto } from "./dto/update-review-response.dto";
import { CreateReviewAnnotationDto } from "./dto/create-review-annotation.dto";
import { UpdateQaIssueDto } from "./dto/update-qa-issue.dto";
import { CreateQaIssueCommentDto } from "./dto/create-qa-issue-comment.dto";
import { SaveQuestionQaDraftDto } from "./dto/save-question-qa-draft.dto";
import { ApproveQuestionQaDto } from "./dto/approve-question-qa.dto";

@ApiTags("question-review")
@Controller("question-review")
export class QuestionReviewController {
  constructor(
    private reviewService: QuestionReviewService,
    private adminService: QuestionReviewAdminService
  ) {}

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

  @Get("attempts/:attemptId/responses/:questionId/annotations")
  listAnnotations(
    @Param("attemptId") attemptId: string,
    @Param("questionId") questionId: string,
    @Headers("x-review-attempt-secret") attemptSecret: string
  ) {
    return this.reviewService.listAnnotations(
      attemptId,
      questionId,
      attemptSecret
    );
  }

  @Post("attempts/:attemptId/responses/:questionId/annotations")
  createAnnotation(
    @Param("attemptId") attemptId: string,
    @Param("questionId") questionId: string,
    @Headers("x-review-attempt-secret") attemptSecret: string,
    @Body() dto: CreateReviewAnnotationDto
  ) {
    return this.reviewService.createAnnotation(
      attemptId,
      questionId,
      attemptSecret,
      dto
    );
  }

  @Delete("attempts/:attemptId/responses/:questionId/annotations/:annotationId")
  deleteAnnotation(
    @Param("attemptId") attemptId: string,
    @Param("questionId") questionId: string,
    @Param("annotationId") annotationId: string,
    @Headers("x-review-attempt-secret") attemptSecret: string
  ) {
    return this.reviewService.deleteAnnotation(
      attemptId,
      questionId,
      annotationId,
      attemptSecret
    );
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

  @Get("admin/qa/dashboard")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  getQaDashboard() {
    return this.adminService.getDashboard();
  }

  @Get("admin/qa/inbox")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  listQaInbox(
    @Query("system") system?: string,
    @Query("topic") topic?: string,
    @Query("reviewer") reviewer?: string,
    @Query("category") category?: string,
    @Query("severity") severity?: string,
    @Query("status") status?: string,
    @Query("assignedToId") assignedToId?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("sort") sort?: string,
    @Query("questionId") questionId?: string
  ) {
    return this.adminService.listInbox({
      system,
      topic,
      reviewer,
      category,
      severity,
      status,
      assignedToId,
      dateFrom,
      dateTo,
      sort,
      questionId,
    });
  }

  @Get("admin/qa/filter-options")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  getQaFilterOptions() {
    return this.adminService.listFilterOptions();
  }

  @Get("admin/qa/assignees")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  listQaAssignees() {
    return this.adminService.listAssignees();
  }

  @Get("admin/qa/reviewer-insights")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  getReviewerInsights() {
    return this.adminService.getReviewerInsights();
  }

  @Get("admin/qa/issues/:issueId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  getQaIssue(@Param("issueId") issueId: string) {
    return this.adminService.getIssue(issueId);
  }

  @Patch("admin/qa/issues/:issueId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  updateQaIssue(
    @Param("issueId") issueId: string,
    @Body() dto: UpdateQaIssueDto,
    @Req() req: any
  ) {
    return this.adminService.updateIssue(issueId, dto, this.actorFromReq(req));
  }

  @Post("admin/qa/issues/:issueId/comments")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  addQaIssueComment(
    @Param("issueId") issueId: string,
    @Body() dto: CreateQaIssueCommentDto,
    @Req() req: any
  ) {
    return this.adminService.addIssueComment(
      issueId,
      dto,
      this.actorFromReq(req)
    );
  }

  @Get("admin/qa/questions/:questionId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  getQuestionQaReview(@Param("questionId") questionId: string) {
    return this.adminService.getQuestionReview(questionId);
  }

  @Post("admin/qa/questions/:questionId/draft")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  saveQuestionQaDraft(
    @Param("questionId") questionId: string,
    @Body() dto: SaveQuestionQaDraftDto,
    @Req() req: any
  ) {
    return this.adminService.saveQuestionDraft(
      questionId,
      dto,
      this.actorFromReq(req)
    );
  }

  @Post("admin/qa/questions/:questionId/approval")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  approveQuestionQa(
    @Param("questionId") questionId: string,
    @Body() dto: ApproveQuestionQaDto,
    @Req() req: any
  ) {
    return this.adminService.approveQuestion(
      questionId,
      dto,
      this.actorFromReq(req)
    );
  }

  @Post("admin/qa/sync")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "FACULTY")
  syncQaIssues() {
    return this.adminService.syncIssuesFromAnnotations();
  }

  private actorFromReq(req: any) {
    const id = req.user?.userId ?? req.user?.id ?? "system";
    const name =
      req.user?.firstName && req.user?.lastName
        ? `${req.user.firstName} ${req.user.lastName}`.trim()
        : req.user?.email ?? "Editor";
    return { id, name };
  }
}
