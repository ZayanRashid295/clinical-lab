import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AssessmentsService } from "./assessments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SubscriptionGuard } from "../auth/guards/subscription.guard";
import { FeatureGuard } from "../auth/guards/feature.guard";
import { CombinedAccessGuard } from "../auth/guards/combined-access.guard";
import { RequireActiveSubscription } from "../auth/decorators/subscription.decorator";
import { RequiredFeatures } from "../auth/decorators/features.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateQuestionPaperDto } from "./dto/create-question-paper.dto";
import { UpdateQuestionPaperDto } from "./dto/update-question-paper.dto";
import { CreateQuestionPaperQuestionDto } from "./dto/create-question-paper-question.dto";
import { UpdateQuestionPaperQuestionDto } from "./dto/update-question-paper-question.dto";
import { StartAssessmentDto } from "./dto/start-assessment.dto";
import { SubmitAssessmentDto } from "./dto/submit-assessment.dto";
import { QueryQuestionPaperDto } from "./dto/query-question-paper.dto";
import { QueryQuestionPaperQuestionDto } from "./dto/query-question-paper-question.dto";
import { ActivityLogService } from "../activity-log/activity-log.service";
import {
  ACTIVITY_COMPONENTS,
  ACTIVITY_EVENTS,
} from "../activity-log/activity-log.constants";
import { extractRequestContext } from "../../common/utils/request-context.util";

@ApiTags("assessments")
@Controller("assessments")
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  // ========== QUESTION PAPERS ==========
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all question papers with filtering, pagination, and sorting",
  })
  @ApiResponse({
    status: 200,
    description: "Question papers retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(@Request() req, @Query() query: QueryQuestionPaperDto) {
    const authenticatedUserId = req.user?.userId;
    // Automatically filter by user's ID if not explicitly provided
    // This ensures users only see their own tests
    if (authenticatedUserId && !query.userId) {
      query.userId = authenticatedUserId;
    }
    return this.assessmentsService.findAll(query);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question paper statistics" })
  @ApiResponse({
    status: 200,
    description: "Question paper statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getStats() {
    return this.assessmentsService.getStats();
  }

  @Get("user/:userId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's question papers" })
  @ApiResponse({
    status: 200,
    description: "Question papers retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getUserQuestionPapers(
    @Param("userId") userId: string,
    @Query("type") type?: string,
    @Query("isActive") isActive?: boolean
  ) {
    return this.assessmentsService.getUserQuestionPapers(
      userId,
      type,
      isActive
    );
  }

  // ========== QUESTION PAPER QUESTIONS (must come before :id routes) ==========
  @Get("questions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get all question paper questions with filtering, pagination, and sorting",
  })
  @ApiResponse({
    status: 200,
    description: "Question paper questions retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAllQuestionPaperQuestions(
    @Query() query: QueryQuestionPaperQuestionDto
  ) {
    return this.assessmentsService.findAllQuestionPaperQuestions(query);
  }

  @Get("questions/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question paper question statistics" })
  @ApiResponse({
    status: 200,
    description: "Question paper question statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getQuestionPaperQuestionStats() {
    return this.assessmentsService.getQuestionPaperQuestionStats();
  }

  @Get("question-pool/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user question pool statistics" })
  @ApiResponse({
    status: 200,
    description: "User question pool statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiQuery({ name: "tagIds", required: false, type: String, description: "Comma-separated tag IDs" })
  @ApiQuery({ name: "systemIds", required: false, type: String, description: "Comma-separated system (section) IDs" })
  @ApiQuery({ name: "subjectIds", required: false, type: String, description: "Comma-separated subject (chapter) IDs" })
  @ApiQuery({ name: "topicIds", required: false, type: String, description: "Comma-separated topic IDs" })
  @ApiQuery({ name: "marked", required: false, type: Boolean, description: "Filter by marked status (true = only marked, false = only unmarked)" })
  getUserQuestionPoolStats(
    @Request() req,
    @Query("tagIds") tagIds?: string,
    @Query("systemIds") systemIds?: string,
    @Query("subjectIds") subjectIds?: string,
    @Query("topicIds") topicIds?: string,
    @Query("marked") marked?: string
  ) {
    const filters: {
      tagIds?: string[];
      systemIds?: string[];
      subjectIds?: string[];
      topicIds?: string[];
      marked?: boolean;
    } = {};

    if (tagIds) {
      filters.tagIds = tagIds.split(",").filter((id) => id.trim());
    }
    if (systemIds) {
      filters.systemIds = systemIds.split(",").filter((id) => id.trim());
    }
    if (subjectIds) {
      filters.subjectIds = subjectIds.split(",").filter((id) => id.trim());
    }
    if (topicIds) {
      filters.topicIds = topicIds.split(",").filter((id) => id.trim());
    }
    if (marked !== undefined) {
      // Parse marked strictly from the query string: "true" -> true, "false" -> false, anything else -> undefined
      if (marked === "true") {
        filters.marked = true;
      } else if (marked === "false") {
        filters.marked = false;
      }
    }

    return this.assessmentsService.getUserQuestionPoolStats(req.user.userId, filters);
  }

  @Get("questions/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question paper question by ID" })
  @ApiResponse({
    status: 200,
    description: "Question paper question retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Question paper question not found",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findOneQuestionPaperQuestion(@Param("id") id: string) {
    return this.assessmentsService.findOneQuestionPaperQuestion(id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question paper by ID" })
  @ApiResponse({
    status: 200,
    description: "Question paper retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findOne(@Param("id") id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Get(":id/questions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get questions in a question paper" })
  @ApiResponse({
    status: 200,
    description: "Questions retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getQuestionPaperQuestions(@Param("id") id: string) {
    return this.assessmentsService.getQuestionPaperQuestions(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new question paper" })
  @ApiResponse({
    status: 201,
    description: "Question paper created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(
    @Request() req,
    @Body() createQuestionPaperDto: CreateQuestionPaperDto
  ) {
    // Ensure users can only create tests for themselves
    const authenticatedUserId = req.user?.userId;
    if (!authenticatedUserId) {
      throw new Error("User not authenticated");
    }
    // Override userId with authenticated user's ID
    createQuestionPaperDto.userId = authenticatedUserId;
    const created = await this.assessmentsService.create(createQuestionPaperDto);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: authenticatedUserId,
      affectedUserId: authenticatedUserId,
      component: ACTIVITY_COMPONENTS.ASSESSMENT,
      eventName: ACTIVITY_EVENTS.QUIZ_CREATED,
      contextType: "question_paper",
      contextId: created?.id,
      contextLabel: created?.name ?? createQuestionPaperDto.name,
      ...ctx,
    });
    return created;
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update question paper" })
  @ApiResponse({
    status: 200,
    description: "Question paper updated successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - can only update own tests" })
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateQuestionPaperDto: UpdateQuestionPaperDto
  ) {
    const authenticatedUserId = req.user?.userId;
    if (!authenticatedUserId) {
      throw new Error("User not authenticated");
    }
    // Verify the test belongs to the user
    const questionPaper = await this.assessmentsService.getQuestionPaper(id);
    if (questionPaper.userId !== authenticatedUserId) {
      throw new Error("You can only update your own tests");
    }
    // Ensure userId cannot be changed
    if (updateQuestionPaperDto.userId) {
      updateQuestionPaperDto.userId = authenticatedUserId;
    }
    return this.assessmentsService.update(id, updateQuestionPaperDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mark question paper as inactive" })
  @ApiResponse({
    status: 200,
    description: "Question paper marked inactive successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - can only delete own tests" })
  async remove(@Request() req, @Param("id") id: string) {
    const authenticatedUserId = req.user?.userId;
    if (!authenticatedUserId) {
      throw new Error("User not authenticated");
    }
    // Verify the test belongs to the user
    const questionPaper = await this.assessmentsService.getQuestionPaper(id);
    if (questionPaper.userId !== authenticatedUserId) {
      throw new Error("You can only delete your own tests");
    }
    return this.assessmentsService.remove(id);
  }

  // ========== ASSESSMENT ACTIONS ==========
  @Post(":id/start")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Start an assessment" })
  @ApiResponse({
    status: 200,
    description: "Assessment started successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async startAssessment(
    @Request() req,
    @Param("id") id: string,
    @Body() startAssessmentDto: StartAssessmentDto
  ) {
    const result = await this.assessmentsService.startAssessment(id, startAssessmentDto);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      affectedUserId: req.user?.userId,
      component: ACTIVITY_COMPONENTS.ASSESSMENT,
      eventName: ACTIVITY_EVENTS.QUIZ_STARTED,
      contextType: "question_paper",
      contextId: id,
      contextLabel: result?.questionPaper?.name,
      ...ctx,
    });
    return result;
  }

  @Post(":id/submit")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit assessment answers" })
  @ApiResponse({
    status: 200,
    description: "Assessment submitted successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async submitAssessment(
    @Request() req,
    @Param("id") id: string,
    @Body() submitAssessmentDto: SubmitAssessmentDto
  ) {
    const result = await this.assessmentsService.submitAssessment(
      id,
      submitAssessmentDto,
      req.user?.userId
    );
    const ctx = extractRequestContext(req);
    const testHistory =
      await this.assessmentsService.getQuestionPaperAuditSnapshot(id);
    const paperName = testHistory?.questionPaper?.name ?? id;
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      affectedUserId: req.user?.userId,
      component: ACTIVITY_COMPONENTS.ASSESSMENT,
      eventName: ACTIVITY_EVENTS.QUIZ_SUBMITTED,
      contextType: "question_paper",
      contextId: id,
      contextLabel: paperName,
      metadata: {
        score: result?.results?.score,
        correctAnswers: result?.results?.correctAnswers,
        totalQuestions: result?.results?.totalQuestions,
        testHistory,
      },
      ...ctx,
    });
    return result;
  }

  @Get(":id/results")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get assessment results" })
  @ApiResponse({
    status: 200,
    description: "Assessment results retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getAssessmentResults(@Request() req, @Param("id") id: string) {
    const result = await this.assessmentsService.getAssessmentResults(id);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      affectedUserId: req.user?.userId,
      component: ACTIVITY_COMPONENTS.ASSESSMENT,
      eventName: ACTIVITY_EVENTS.QUIZ_VIEWED,
      contextType: "question_paper",
      contextId: id,
      contextLabel: result?.questionPaper?.name ?? id,
      ...ctx,
    });
    return result;
  }

  @Post("questions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create question paper question (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Question paper question created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createQuestionPaperQuestion(
    @Body() createQuestionPaperQuestionDto: CreateQuestionPaperQuestionDto
  ) {
    return this.assessmentsService.createQuestionPaperQuestion(
      createQuestionPaperQuestionDto
    );
  }

  @Post(":questionPaperId/questions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add question to question paper" })
  @ApiResponse({
    status: 201,
    description: "Question added successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async addQuestionToPaper(
    @Param("questionPaperId") questionPaperId: string,
    @Body() createQuestionPaperQuestionDto: CreateQuestionPaperQuestionDto
  ) {
    return this.assessmentsService.addQuestionToPaper(
      questionPaperId,
      createQuestionPaperQuestionDto
    );
  }

  @Patch("questions/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update question paper question (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Question updated successfully",
  })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateQuestionPaperQuestion(
    @Param("id") id: string,
    @Body() updateQuestionPaperQuestionDto: UpdateQuestionPaperQuestionDto
  ) {
    return this.assessmentsService.updateQuestionPaperQuestion(
      id,
      updateQuestionPaperQuestionDto
    );
  }

  @Delete("questions/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Remove question from question paper (Admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "Question removed successfully",
  })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async removeQuestionPaperQuestion(@Param("id") id: string) {
    return this.assessmentsService.removeQuestionPaperQuestion(id);
  }
}
