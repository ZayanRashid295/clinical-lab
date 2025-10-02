import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { RidesService } from "./rides.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("rides")
@Controller("rides")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new ride request" })
  @ApiResponse({
    status: 201,
    description: "Ride request created successfully",
  })
  create(@Body() createRideDto: any) {
    return this.ridesService.create(createRideDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all rides with optional filtering, sorting, and pagination",
  })
  @ApiResponse({ status: 200, description: "Rides retrieved successfully" })
  @ApiQuery({
    name: "page",
    required: false,
    type: "number",
    description: "Page number",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: "number",
    description: "Items per page",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: "string",
    description: "Search term",
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: "string",
    description: "Filter by status",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: "string",
    description: "Sort by field",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    enum: ["asc", "desc"],
    description: "Sort order",
  })
  @ApiQuery({
    name: "dateFrom",
    required: false,
    type: "string",
    description: "Filter from date",
  })
  @ApiQuery({
    name: "dateTo",
    required: false,
    type: "string",
    description: "Filter to date",
  })
  @ApiQuery({
    name: "minFare",
    required: false,
    type: "number",
    description: "Minimum fare",
  })
  @ApiQuery({
    name: "maxFare",
    required: false,
    type: "number",
    description: "Maximum fare",
  })
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("minFare") minFare?: string,
    @Query("maxFare") maxFare?: string
  ) {
    const queryParams = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
      minFare: minFare ? parseFloat(minFare) : undefined,
      maxFare: maxFare ? parseFloat(maxFare) : undefined,
    };

    return this.ridesService.findAll(queryParams);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get ride by ID" })
  @ApiResponse({ status: 200, description: "Ride retrieved successfully" })
  @ApiResponse({ status: 404, description: "Ride not found" })
  findOne(@Param("id") id: string) {
    return this.ridesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update ride status" })
  @ApiResponse({ status: 200, description: "Ride updated successfully" })
  @ApiResponse({ status: 404, description: "Ride not found" })
  update(@Param("id") id: string, @Body() updateRideDto: any) {
    return this.ridesService.update(id, updateRideDto);
  }
}
