import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ContentService } from "./content.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";
import { CreateSubtopicDto } from "./dto/create-subtopic.dto";
import { UpdateSubtopicDto } from "./dto/update-subtopic.dto";
import { QueryTopicDto } from "./dto/query-topic.dto";
import { QuerySubtopicDto } from "./dto/query-subtopic.dto";

@ApiTags("content")
@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ========== TOPICS (was Chapters) ==========
  @Get("topics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all topics with filtering, pagination, and sorting" })
  async findAllTopics(@Query() query: QueryTopicDto) {
    return this.contentService.findAllTopics(query);
  }

  @Get("topics/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get topic statistics" })
  getTopicStats() {
    return this.contentService.getTopicStats();
  }

  @Get("topics/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get topic by ID with subtopics" })
  async getTopic(@Param("id") id: string) {
    return this.contentService.getTopic(id);
  }

  @Get("topics/:id/subtopics")
  @ApiOperation({ summary: "Get subtopics for a topic" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getTopicSubtopics(@Param("id") id: string, @Query("isActive") isActive?: boolean) {
    return this.contentService.getTopicSubtopics(id, isActive);
  }

  @Post("topics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new topic" })
  async createTopic(@Body() createDto: CreateTopicDto) {
    return this.contentService.createTopic(createDto);
  }

  @Patch("topics/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update topic" })
  async updateTopic(@Param("id") id: string, @Body() updateDto: UpdateTopicDto) {
    return this.contentService.updateTopic(id, updateDto);
  }

  @Delete("topics/permanent/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Permanently delete topic" })
  async removeTopicPermanent(@Param("id") id: string) {
    return this.contentService.removeTopicPermanent(id);
  }

  @Delete("topics/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mark topic as inactive" })
  async removeTopic(@Param("id") id: string) {
    return this.contentService.removeTopic(id);
  }

  // ========== SUBTOPICS (was Topics) ==========
  @Get("subtopics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all subtopics with filtering, pagination, and sorting" })
  async findAllSubtopics(@Query() query: QuerySubtopicDto) {
    return this.contentService.findAllSubtopics(query);
  }

  @Get("subtopics/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get subtopic statistics" })
  getSubtopicStats() {
    return this.contentService.getSubtopicStats();
  }

  @Get("subtopics/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get subtopic by ID with questions" })
  async getSubtopic(@Param("id") id: string) {
    return this.contentService.getSubtopic(id);
  }

  @Get("subtopics/:id/questions")
  @ApiOperation({ summary: "Get questions for a subtopic" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async getSubtopicQuestions(
    @Param("id") id: string,
    @Query("isActive") isActive?: boolean,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ) {
    return this.contentService.getSubtopicQuestions(id, isActive, limit, offset);
  }

  @Post("subtopics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new subtopic" })
  async createSubtopic(@Body() createDto: CreateSubtopicDto) {
    return this.contentService.createSubtopic(createDto);
  }

  @Patch("subtopics/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update subtopic" })
  async updateSubtopic(@Param("id") id: string, @Body() updateDto: UpdateSubtopicDto) {
    return this.contentService.updateSubtopic(id, updateDto);
  }

  @Delete("subtopics/permanent/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Permanently delete subtopic" })
  async removeSubtopicPermanent(@Param("id") id: string) {
    return this.contentService.removeSubtopicPermanent(id);
  }

  @Delete("subtopics/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mark subtopic as inactive" })
  async removeSubtopic(@Param("id") id: string) {
    return this.contentService.removeSubtopic(id);
  }
}
