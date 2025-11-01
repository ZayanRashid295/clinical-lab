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
import { ContentService } from "./content.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateSectionDto } from "./dto/create-section.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { CreateChapterDto } from "./dto/create-chapter.dto";
import { UpdateChapterDto } from "./dto/update-chapter.dto";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";
import { QuerySectionDto } from "./dto/query-section.dto";
import { QueryChapterDto } from "./dto/query-chapter.dto";
import { QueryTopicDto } from "./dto/query-topic.dto";

@ApiTags("content")
@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ========== SECTIONS ==========
  @Get("sections")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all sections with filtering, pagination, and sorting",
  })
  @ApiResponse({ status: 200, description: "Sections retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAllSections(@Query() query: QuerySectionDto) {
    return this.contentService.findAllSections(query);
  }

  @Get("sections/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get section statistics" })
  @ApiResponse({
    status: 200,
    description: "Section statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getSectionStats() {
    return this.contentService.getSectionStats();
  }

  @Get("sections/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get section by ID" })
  @ApiResponse({ status: 200, description: "Section retrieved successfully" })
  @ApiResponse({ status: 404, description: "Section not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getSection(@Param("id") id: string) {
    return this.contentService.getSection(id);
  }

  @Get("sections/:id/chapters")
  @ApiOperation({ summary: "Get chapters for a section" })
  @ApiResponse({ status: 200, description: "Chapters retrieved successfully" })
  @ApiResponse({ status: 404, description: "Section not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getSectionChapters(
    @Param("id") id: string,
    @Query("isActive") isActive?: boolean
  ) {
    return this.contentService.getSectionChapters(id, isActive);
  }

  @Post("sections")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new section (Admin only)" })
  @ApiResponse({ status: 201, description: "Section created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createSection(@Body() createSectionDto: CreateSectionDto) {
    return this.contentService.createSection(createSectionDto);
  }

  @Patch("sections/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update section (Admin only)" })
  @ApiResponse({ status: 200, description: "Section updated successfully" })
  @ApiResponse({ status: 404, description: "Section not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateSection(
    @Param("id") id: string,
    @Body() updateSectionDto: UpdateSectionDto
  ) {
    return this.contentService.updateSection(id, updateSectionDto);
  }

  @Delete("sections/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate section (Admin only)" })
  @ApiResponse({ status: 200, description: "Section deactivated successfully" })
  @ApiResponse({ status: 404, description: "Section not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async removeSection(@Param("id") id: string) {
    return this.contentService.removeSection(id);
  }

  // ========== CHAPTERS ==========
  @Get("chapters")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all chapters with filtering, pagination, and sorting",
  })
  @ApiResponse({
    status: 200,
    description: "Chapters retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAllChapters(@Query() query: QueryChapterDto) {
    return this.contentService.findAllChapters(query);
  }

  @Get("chapters/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get chapter statistics" })
  @ApiResponse({
    status: 200,
    description: "Chapter statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getChapterStats() {
    return this.contentService.getChapterStats();
  }

  @Get("chapters/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get chapter by ID" })
  @ApiResponse({
    status: 200,
    description: "Chapter retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Chapter not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getChapter(@Param("id") id: string) {
    return this.contentService.getChapter(id);
  }

  @Get("chapters/:id/topics")
  @ApiOperation({ summary: "Get topics for a chapter" })
  @ApiResponse({ status: 200, description: "Topics retrieved successfully" })
  @ApiResponse({ status: 404, description: "Chapter not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getChapterTopics(
    @Param("id") id: string,
    @Query("isActive") isActive?: boolean
  ) {
    return this.contentService.getChapterTopics(id, isActive);
  }

  @Post("chapters")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new chapter (Admin only)" })
  @ApiResponse({ status: 201, description: "Chapter created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createChapter(@Body() createChapterDto: CreateChapterDto) {
    return this.contentService.createChapter(createChapterDto);
  }

  @Patch("chapters/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update chapter (Admin only)" })
  @ApiResponse({ status: 200, description: "Chapter updated successfully" })
  @ApiResponse({ status: 404, description: "Chapter not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateChapter(
    @Param("id") id: string,
    @Body() updateChapterDto: UpdateChapterDto
  ) {
    return this.contentService.updateChapter(id, updateChapterDto);
  }

  @Delete("chapters/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate chapter (Admin only)" })
  @ApiResponse({ status: 200, description: "Chapter deactivated successfully" })
  @ApiResponse({ status: 404, description: "Chapter not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async removeChapter(@Param("id") id: string) {
    return this.contentService.removeChapter(id);
  }

  // ========== TOPICS ==========
  @Get("topics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all topics with filtering, pagination, and sorting",
  })
  @ApiResponse({ status: 200, description: "Topics retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAllTopics(@Query() query: QueryTopicDto) {
    return this.contentService.findAllTopics(query);
  }

  @Get("topics/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get topic statistics" })
  @ApiResponse({
    status: 200,
    description: "Topic statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getTopicStats() {
    return this.contentService.getTopicStats();
  }

  @Get("topics/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get topic by ID" })
  @ApiResponse({ status: 200, description: "Topic retrieved successfully" })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getTopic(@Param("id") id: string) {
    return this.contentService.getTopic(id);
  }

  @Get("topics/:id/questions")
  @ApiOperation({ summary: "Get questions for a topic" })
  @ApiResponse({ status: 200, description: "Questions retrieved successfully" })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async getTopicQuestions(
    @Param("id") id: string,
    @Query("isActive") isActive?: boolean,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.contentService.getTopicQuestions(id, isActive, limit, offset);
  }

  @Post("topics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new topic (Admin only)" })
  @ApiResponse({ status: 201, description: "Topic created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.contentService.createTopic(createTopicDto);
  }

  @Patch("topics/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update topic (Admin only)" })
  @ApiResponse({ status: 200, description: "Topic updated successfully" })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateTopic(
    @Param("id") id: string,
    @Body() updateTopicDto: UpdateTopicDto
  ) {
    return this.contentService.updateTopic(id, updateTopicDto);
  }

  @Delete("topics/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate topic (Admin only)" })
  @ApiResponse({ status: 200, description: "Topic deactivated successfully" })
  @ApiResponse({ status: 404, description: "Topic not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async removeTopic(@Param("id") id: string) {
    return this.contentService.removeTopic(id);
  }
}
