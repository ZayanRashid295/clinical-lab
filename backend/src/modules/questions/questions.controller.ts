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
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { CreateQuestionChoiceDto } from "./dto/create-question-choice.dto";
import { UpdateQuestionChoiceDto } from "./dto/update-question-choice.dto";
import { QueryQuestionDto } from "./dto/query-question.dto";
import { QueryQuestionChoiceDto } from "./dto/query-question-choice.dto";
import { FilteredQuestionsDto } from "./dto/filtered-questions.dto";

@ApiTags("questions")
@Controller("questions")
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all questions with filtering, pagination, and sorting",
  })
  @ApiResponse({
    status: 200,
    description: "Questions retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(@Query() query: QueryQuestionDto) {
    return this.questionsService.findAll(query);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question statistics" })
  @ApiResponse({
    status: 200,
    description: "Question statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
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
    @Query("topicId") topicId?: string,
    @Query("tagId") tagId?: string,
    @Query("difficulty") difficulty?: string,
    @Query("isActive") isActive?: boolean,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.questionsService.findAllLegacy({
      topicId,
      tagId,
      difficulty,
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
    @Query("topicId") topicId?: string,
    @Query("tagId") tagId?: string,
    @Query("difficulty") difficulty?: string,
    @Query("count") count?: number
  ) {
    return this.questionsService.getRandomQuestions({
      topicId,
      tagId,
      difficulty,
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
    @Param("topicId") topicId: string,
    @Query("isActive") isActive?: boolean,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.questionsService.getQuestionsByTopic(
      topicId,
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
    console.log(`🔍 Controller - Received: pool=${pool}, marked=${marked} (parsed: ${markedBool})`);
    return this.questionsService.getTestCreationData({
      pool: pool as "unused" | "marked" | "incorrect" | "correct" | "omitted" | undefined,
      marked: markedBool,
      userId: req.user?.userId,
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
      tagIds: query.tagIds,
      systemIds: query.systemIds,
      subjectIds: query.subjectIds,
      topicIds: query.topicIds,
      pool: query.pool,
      marked: query.marked,
      limit: query.limit,
      userId: req.user?.userId,
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question by ID with choices" })
  @ApiResponse({ status: 200, description: "Question retrieved successfully" })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findOne(@Param("id") id: string) {
    return this.questionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new question (Admin only)" })
  @ApiResponse({ status: 201, description: "Question created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update question (Admin only)" })
  @ApiResponse({ status: 200, description: "Question updated successfully" })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async update(
    @Param("id") id: string,
    @Body() updateQuestionDto: UpdateQuestionDto
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete question (Admin only)" })
  @ApiResponse({ status: 200, description: "Question deleted successfully" })
  @ApiResponse({ status: 404, description: "Question not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async remove(@Param("id") id: string) {
    return this.questionsService.remove(id);
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
  @UseInterceptors(FileInterceptor("image"))
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
}
