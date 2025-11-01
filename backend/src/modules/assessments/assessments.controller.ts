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
import { CreateQuestionPaperDto } from "./dto/create-question-paper.dto";
import { UpdateQuestionPaperDto } from "./dto/update-question-paper.dto";
import { CreateQuestionPaperQuestionDto } from "./dto/create-question-paper-question.dto";
import { UpdateQuestionPaperQuestionDto } from "./dto/update-question-paper-question.dto";
import { StartAssessmentDto } from "./dto/start-assessment.dto";
import { SubmitAssessmentDto } from "./dto/submit-assessment.dto";
import { QueryQuestionPaperDto } from "./dto/query-question-paper.dto";
import { QueryQuestionPaperQuestionDto } from "./dto/query-question-paper-question.dto";

@ApiTags("assessments")
@Controller("assessments")
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

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
  async findAll(@Query() query: QueryQuestionPaperDto) {
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
  @ApiOperation({ summary: "Create new question paper (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Question paper created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Body() createQuestionPaperDto: CreateQuestionPaperDto) {
    return this.assessmentsService.create(createQuestionPaperDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update question paper (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Question paper updated successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async update(
    @Param("id") id: string,
    @Body() updateQuestionPaperDto: UpdateQuestionPaperDto
  ) {
    return this.assessmentsService.update(id, updateQuestionPaperDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate question paper (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Question paper deactivated successfully",
  })
  @ApiResponse({ status: 404, description: "Question paper not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async remove(@Param("id") id: string) {
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
    @Param("id") id: string,
    @Body() startAssessmentDto: StartAssessmentDto
  ) {
    return this.assessmentsService.startAssessment(id, startAssessmentDto);
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
    @Param("id") id: string,
    @Body() submitAssessmentDto: SubmitAssessmentDto
  ) {
    return this.assessmentsService.submitAssessment(id, submitAssessmentDto);
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
  async getAssessmentResults(@Param("id") id: string) {
    return this.assessmentsService.getAssessmentResults(id);
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
