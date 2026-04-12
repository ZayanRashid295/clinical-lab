import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SystemsService } from "./systems.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateSystemDto } from "./dto/create-system.dto";
import { UpdateSystemDto } from "./dto/update-system.dto";
import { QuerySystemDto } from "./dto/query-system.dto";

@ApiTags("systems")
@Controller("systems")
export class SystemsController {
  constructor(private readonly systemsService: SystemsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all systems with filtering, pagination, and sorting" })
  async findAll(@Query() query: QuerySystemDto) {
    return this.systemsService.findAll(query);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get system statistics" })
  getStats() {
    return this.systemsService.getSystemStats();
  }

  @Get("list")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get systems list (optionally filtered by product)" })
  @ApiQuery({ name: "productId", required: false })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getSystems(
    @Query("productId") productId?: string,
    @Query("isActive") isActive?: boolean,
  ) {
    return this.systemsService.getSystems(productId, isActive);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get system by ID with topics" })
  async getSystem(@Param("id") id: string) {
    return this.systemsService.getSystem(id);
  }

  @Get(":id/topics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all topics for a system" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getSystemTopics(@Param("id") id: string, @Query("isActive") isActive?: boolean) {
    return this.systemsService.getSystemTopics(id, isActive);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new system" })
  async create(@Body() createDto: CreateSystemDto) {
    return this.systemsService.createSystem(createDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update system" })
  async update(@Param("id") id: string, @Body() updateDto: UpdateSystemDto) {
    return this.systemsService.updateSystem(id, updateDto);
  }

  @Delete("permanent/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Permanently delete system" })
  async removePermanent(@Param("id") id: string) {
    return this.systemsService.removeSystemPermanent(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate system" })
  async remove(@Param("id") id: string) {
    return this.systemsService.removeSystem(id);
  }
}
