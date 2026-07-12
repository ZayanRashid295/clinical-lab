import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StudentStatsService } from "./student-stats.service";

@ApiTags("student-stats")
@ApiBearerAuth()
@Controller("student/stats")
@UseGuards(JwtAuthGuard)
export class StudentStatsController {
  constructor(private readonly service: StudentStatsService) {}

  @Get("dashboard")
  @ApiOperation({
    summary:
      "Aggregated dashboard stats: question score, qbank usage, tests, plan progress, notes, bookmarks",
  })
  dashboard(@Request() req) {
    return this.service.getDashboard(req.user.userId ?? req.user.id);
  }
}
