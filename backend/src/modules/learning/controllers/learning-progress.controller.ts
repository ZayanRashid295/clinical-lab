import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { LearningProgressService } from "../services/learning-progress.service";
// import { LearningProgressService } from "../services/learning-progress.service";

@Controller("learning/progress")
@UseGuards(JwtAuthGuard)
export class LearningProgressController {
  constructor(
    private readonly learningProgressService: LearningProgressService
  ) {}

  @Get()
  async getLearningProgress(@Request() req: any) {
    return this.learningProgressService.getLearningProgress(req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async updateLearningProgress(@Request() req: any, @Body() sessionData: any) {
    return this.learningProgressService.updateLearningProgress(
      req.user.id,
      sessionData
    );
  }

  @Get("analytics")
  async getLearningAnalytics(@Request() req: any) {
    return this.learningProgressService.getLearningAnalytics(req.user.id);
  }

  @Get("leaderboard")
  async getLeaderboard() {
    return this.learningProgressService.getLeaderboard();
  }
}
