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
import { TagsService } from "./tags.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";

@ApiTags("tags")
@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: "Get all tags" })
  @ApiResponse({ status: 200, description: "Tags retrieved successfully" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async findAll(@Query("isActive") isActive?: boolean) {
    return this.tagsService.findAll(isActive);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get tag by ID" })
  @ApiResponse({ status: 200, description: "Tag retrieved successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  async findOne(@Param("id") id: string) {
    return this.tagsService.findOne(id);
  }

  @Get(":id/questions")
  @ApiOperation({ summary: "Get questions for a tag" })
  @ApiResponse({ status: 200, description: "Questions retrieved successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async getTagQuestions(
    @Param("id") id: string,
    @Query("isActive") isActive?: boolean,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.tagsService.getTagQuestions(id, isActive, limit, offset);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new tag (Admin only)" })
  @ApiResponse({ status: 201, description: "Tag created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update tag (Admin only)" })
  @ApiResponse({ status: 200, description: "Tag updated successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async update(@Param("id") id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate tag (Admin only)" })
  @ApiResponse({ status: 200, description: "Tag deactivated successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async remove(@Param("id") id: string) {
    return this.tagsService.remove(id);
  }
}
