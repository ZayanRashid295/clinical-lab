import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import { ActivityLogService } from "./activity-log.service";
import { ActivityLogDetailsService } from "./activity-log-details.service";
import { QueryActivityLogDto } from "./dto/query-activity-log.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("activity-log")
@Controller("activity-log")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPERADMIN")
@ApiBearerAuth()
export class ActivityLogController {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly activityLogDetailsService: ActivityLogDetailsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List activity logs (admin only)" })
  @ApiResponse({ status: 200, description: "Activity logs retrieved" })
  findAll(@Query() query: QueryActivityLogDto) {
    return this.activityLogService.findAll(query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Activity log statistics (admin only)" })
  getStats() {
    return this.activityLogService.getStats();
  }

  @Get("filters")
  @ApiOperation({ summary: "Filter options for activity logs (admin only)" })
  getFilters() {
    return this.activityLogService.getFilterOptions();
  }

  @Get("export")
  @ApiOperation({ summary: "Export activity logs as CSV (admin only)" })
  async exportCsv(@Query() query: QueryActivityLogDto, @Res() res: Response) {
    const csv = await this.activityLogService.exportCsv(query);
    const filename = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get(":id/details")
  @ApiOperation({ summary: "Get full contextual details for an activity log (admin only)" })
  @ApiResponse({ status: 200, description: "Full activity log details retrieved" })
  @ApiResponse({ status: 404, description: "Activity log not found" })
  getDetails(@Param("id") id: string) {
    return this.activityLogDetailsService.getFullDetails(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single activity log entry (admin only)" })
  async findOne(@Param("id") id: string) {
    const log = await this.activityLogService.findOne(id);
    if (!log) {
      throw new NotFoundException(`Activity log ${id} not found`);
    }
    return log;
  }
}
