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
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { Express } from "express";
import { QuestionsService } from "./questions.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FeatureGuard } from "../auth/guards/feature.guard";
import { EntitlementGuard } from "../auth/guards/entitlement.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { RequiredFeatures } from "../auth/decorators/features.decorator";
import { RequiredEntitlements } from "../auth/decorators/entitlements.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { CreateQuestionChoiceDto } from "./dto/create-question-choice.dto";
import { UpdateQuestionChoiceDto } from "./dto/update-question-choice.dto";
import { QueryQuestionDto } from "./dto/query-question.dto";
import { QueryQuestionChoiceDto } from "./dto/query-question-choice.dto";
import { FilteredQuestionsDto } from "./dto/filtered-questions.dto";
import { ConvertDocxDto } from "./dto/convert-docx.dto";
import { ActivityLogService } from "../activity-log/activity-log.service";
import {
  ACTIVITY_COMPONENTS,
  ACTIVITY_EVENTS,
} from "../activity-log/activity-log.constants";
import { extractRequestContext } from "../../common/utils/request-context.util";

@ApiTags("questions")
@Controller("questions")
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, FeatureGuard, EntitlementGuard)
  @RequiredFeatures("Qbank Access")
  @RequiredEntitlements("qbank.access")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all questions with filtering, pagination, and sorting",
  })
  @ApiResponse({
    status: 200,
    description: "Questions retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Qbank Access feature required" })
  async findAll(@Query() query: QueryQuestionDto) {
    return this.questionsService.findAll(query);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, FeatureGuard, EntitlementGuard)
  @RequiredFeatures("Qbank Access")
  @RequiredEntitlements("qbank.access")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question statistics" })
  @ApiResponse({
    status: 200,
    description: "Question statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Qbank Access feature required" })
  getStats() {
    return this.questionsService.getStats();
  }

  @Get("legacy")
  @ApiOperation({ summary: "Get all questions with filters (legacy)" })
  @ApiResponse({ status: 200, description: "Questions retrieved successfully" })
  @ApiQuery({ name: "topicId", required: false, type: String })
  @ApiQuery({ name: "tagId", required: false, type: String })
  @ApiQuery({ name: "difficulty", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async findAllLegacy(
    @Query("topicId") subtopicId?: string,
    @Query("systemId") systemId?: string,
    @Query("topicId") topicId?: string,
    @Query("difficulty") difficulty?: string,
    @Query("isActive") isActive?: boolean,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.questionsService.findAllLegacy({
      subtopicId, systemId, topicId, difficulty,
      isActive,
      limit,
      offset,
    });
  }

  @Get("random")
  @ApiOperation({ summary: "Get random questions for practice" })
  @ApiResponse({
    status: 200,
    description: "Random questions retrieved successfully",
  })
  @ApiQuery({ name: "topicId", required: false, type: String })
  @ApiQuery({ name: "tagId", required: false, type: String })
  @ApiQuery({ name: "difficulty", required: false, type: String })
  @ApiQuery({ name: "count", required: false, type: Number })
  async getRandomQuestions(
    @Query("topicId") subtopicId?: string,
    @Query("systemId") systemId?: string,
    @Query("topicId") topicId?: string,
    @Query("difficulty") difficulty?: string,
    @Query("count") count?: number
  ) {
    return this.questionsService.getRandomQuestions({
      subtopicId, systemId, topicId, difficulty,
      count,
    });
  }

  @Get("by-topic/:topicId")
  @ApiOperation({ summary: "Get questions by topic" })
  @ApiResponse({ status: 200, description: "Questions retrieved successfully" })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async getQuestionsByTopic(
    @Param("topicId") subtopicId: string,
    @Query("isActive") isActive?: boolean,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.questionsService.getQuestionsByTopic(
      subtopicId,
      isActive,
      limit,
      offset
    );
  }

  @Get("by-tag/:tagId")
  @ApiOperation({ summary: "Get questions by tag" })
  @ApiResponse({ status: 200, description: "Questions retrieved successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async getQuestionsByTag(
    @Param("tagId") tagId: string,
    @Query("isActive") isActive?: boolean,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.questionsService.getQuestionsByTag(
      tagId,
      isActive,
      limit,
      offset
    );
  }

  // ========== QUESTION CHOICES (must come before :id routes) ==========
  @Get("choices")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get all question choices with filtering, pagination, and sorting",
  })
  @ApiResponse({
    status: 200,
    description: "Question choices retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAllQuestionChoices(@Query() query: QueryQuestionChoiceDto) {
    return this.questionsService.findAllQuestionChoices(query);
  }

  @Get("choices/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question choice statistics" })
  @ApiResponse({
    status: 200,
    description: "Question choice statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getQuestionChoiceStats() {
    return this.questionsService.getQuestionChoiceStats();
  }

  @Get("choices/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question choice by ID" })
  @ApiResponse({
    status: 200,
    description: "Question choice retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Question choice not found",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findOneQuestionChoice(@Param("id") id: string) {
    return this.questionsService.findOneQuestionChoice(id);
  }

  // Specific routes must come before :id route to avoid route conflicts
  @Get("test-creation-data")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get hierarchical data for test creation (tags, systems, subjects, topics with question counts)",
  })
  @ApiResponse({
    status: 200,
    description: "Test creation data retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiQuery({ name: "pool", required: false, enum: ["unused", "marked", "incorrect", "correct", "omitted"], description: "Question pool to filter counts by" })
  @ApiQuery({ name: "marked", required: false, type: Boolean, description: "Filter by marked status (true = only marked, false = only unmarked)" })
  async getTestCreationData(@Request() req, @Query("pool") pool?: string, @Query("marked") marked?: string) {
    // Parse marked strictly from the query string: "true" -> true, "false" -> false, anything else/undefined -> undefined
    let markedBool: boolean | undefined = undefined;
    if (marked === "true") {
      markedBool = true;
    } else if (marked === "false") {
      markedBool = false;
    }
    return this.questionsService.getTestCreationData({
      pool: pool as "unused" | "marked" | "incorrect" | "correct" | "omitted" | undefined,
      marked: markedBool,
      userId: req.user?.userId,
      userRoles: req.user?.roles || [],
    });
  }

  @Get("filtered")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get filtered questions for test taking based on tags, systems, subjects, topics, and question pool",
  })
  @ApiResponse({
    status: 200,
    description: "Filtered questions retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getFilteredQuestions(@Request() req, @Query() query: FilteredQuestionsDto) {
    return this.questionsService.getFilteredQuestions({
      systemIds: query.systemIds,
      subjectIds: query.subjectIds,
      topicIds: query.topicIds,
      subtopicIds: query.subtopicIds,
      pool: query.pool,
      marked: query.marked,
      limit: query.limit,
      userId: req.user?.userId,
      userRoles: req.user?.roles || [], // Pass user roles to bypass subscription checks for ADMIN/SUPERADMIN
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, FeatureGuard, EntitlementGuard)
  @RequiredFeatures("Qbank Access")
  @RequiredEntitlements("qbank.access")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question by ID with choices" })
  @ApiResponse({ status: 200, description: "Question retrieved successfully" })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Qbank Access feature required" })
  async findOne(@Param("id") id: string) {
    return this.questionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new question (Admin only)" })
  @ApiResponse({ status: 201, description: "Question created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin role required" })
  async create(@Request() req, @Body() createQuestionDto: CreateQuestionDto) {
    const created = await this.questionsService.create(createQuestionDto);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      component: ACTIVITY_COMPONENTS.QBANK,
      eventName: ACTIVITY_EVENTS.QUESTION_CREATED,
      contextType: "question",
      contextId: created?.id,
      contextLabel: (created as { subject?: string })?.subject ?? created?.id,
      ...ctx,
    });
    return created;
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update question (Admin only)" })
  @ApiResponse({ status: 200, description: "Question updated successfully" })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin role required" })
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateQuestionDto: UpdateQuestionDto
  ) {
    const updated = await this.questionsService.update(id, updateQuestionDto);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      component: ACTIVITY_COMPONENTS.QBANK,
      eventName: ACTIVITY_EVENTS.QUESTION_UPDATED,
      contextType: "question",
      contextId: id,
      contextLabel: (updated as { subject?: string })?.subject ?? id,
      ...ctx,
    });
    return updated;
  }

  @Delete("permanent/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Permanently delete question (Admin only)" })
  @ApiResponse({ status: 200, description: "Question permanently deleted" })
  @ApiResponse({ status: 404, description: "Question not found" })
  async removePermanent(@Request() req, @Param("id") id: string) {
    const result = await this.questionsService.removePermanent(id);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      component: ACTIVITY_COMPONENTS.QBANK,
      eventName: ACTIVITY_EVENTS.QUESTION_DELETED,
      contextType: "question",
      contextId: id,
      contextLabel: id,
      metadata: { permanent: true },
      ...ctx,
    });
    return result;
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mark question as inactive (Admin only)" })
  @ApiResponse({ status: 200, description: "Question marked inactive successfully" })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async remove(@Request() req, @Param("id") id: string) {
    const result = await this.questionsService.remove(id);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      component: ACTIVITY_COMPONENTS.QBANK,
      eventName: ACTIVITY_EVENTS.QUESTION_DELETED,
      contextType: "question",
      contextId: id,
      contextLabel: id,
      ...ctx,
    });
    return result;
  }

  @Post("choices")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create question choice (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Question choice created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createQuestionChoice(
    @Body() createChoiceDto: CreateQuestionChoiceDto & { questionId: string }
  ) {
    return this.questionsService.createQuestionChoice(createChoiceDto);
  }

  @Post(":questionId/choices")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add choice to question (Admin only)" })
  @ApiResponse({ status: 201, description: "Choice created successfully" })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async addChoice(
    @Param("questionId") questionId: string,
    @Body() createChoiceDto: CreateQuestionChoiceDto
  ) {
    return this.questionsService.addChoice(questionId, createChoiceDto);
  }

  @Patch("choices/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update question choice (Admin only)" })
  @ApiResponse({ status: 200, description: "Choice updated successfully" })
  @ApiResponse({ status: 404, description: "Choice not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateQuestionChoice(
    @Param("id") id: string,
    @Body() updateChoiceDto: UpdateQuestionChoiceDto
  ) {
    return this.questionsService.updateQuestionChoice(id, updateChoiceDto);
  }

  @Delete("choices/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete question choice (Admin only)" })
  @ApiResponse({ status: 200, description: "Choice deleted successfully" })
  @ApiResponse({ status: 404, description: "Choice not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async removeQuestionChoice(@Param("id") id: string) {
    return this.questionsService.removeQuestionChoice(id);
  }

  @Post("upload-image")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor("image", {
      limits: { fileSize: 10 * 1024 * 1024 },
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOperation({ summary: "Upload image for question content" })
  @ApiResponse({
    status: 201,
    description: "Image uploaded successfully",
    schema: {
      type: "object",
      properties: {
        url: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid file" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.questionsService.uploadImage(file);
  }

  @Post("convert-docx-to-markdown")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Convert DOCX text content to Markdown using OpenAI" })
  @ApiResponse({
    status: 200,
    description: "Markdown generated successfully",
    schema: {
      type: "object",
      properties: {
        markdown: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid request or OpenAI error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async convertDocxToMarkdown(@Body() dto: ConvertDocxDto) {
    return this.questionsService.convertDocxToMarkdown(dto);
  }
}
