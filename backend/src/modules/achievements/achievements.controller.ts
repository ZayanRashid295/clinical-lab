import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AchievementsService } from "./achievements.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateAchievementDto,
  RecordActivityDto,
  UpdateAchievementDto,
} from "./dto/achievement.dto";

@ApiTags("achievements")
@Controller("achievements")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AchievementsController {
  constructor(private readonly service: AchievementsService) {}

  @Get()
  @ApiOperation({ summary: "List achievements catalog" })
  list() {
    return this.service.listAchievements();
  }

  @Get("me")
  @ApiOperation({ summary: "Get my achievements / streak / points overview" })
  me(@Request() req) {
    return this.service.getUserOverview(req.user?.userId);
  }

  @Get("leaderboard")
  @ApiOperation({ summary: "Top points earners" })
  leaderboard(@Query("limit") limit?: string) {
    return this.service.getLeaderboard(limit ? Number(limit) : 10);
  }

  @Post("record")
  @ApiOperation({ summary: "Record an activity event for the current user" })
  record(@Request() req, @Body() dto: RecordActivityDto) {
    return this.service.recordActivity(
      req.user?.userId,
      dto.metric as any,
      dto.amount ?? 1
    );
  }

  // ----- admin catalog -----
  @Post()
  @ApiOperation({ summary: "Create achievement (admin)" })
  create(@Body() dto: CreateAchievementDto) {
    return this.service.createAchievement(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update achievement (admin)" })
  update(@Param("id") id: string, @Body() dto: UpdateAchievementDto) {
    return this.service.updateAchievement(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete achievement (admin)" })
  remove(@Param("id") id: string) {
    return this.service.removeAchievement(id);
  }
}
