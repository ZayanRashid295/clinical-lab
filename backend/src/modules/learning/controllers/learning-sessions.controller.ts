import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
// import { LearningSessionsService } from "../services/learning-sessions.service";
import { CreateLearningSessionDto } from "../dto/create-learning-session.dto";
import { LearningSessionsService } from "../services/learning-sessions.service";

@Controller("learning/sessions")
@UseGuards(JwtAuthGuard)
export class LearningSessionsController {
  constructor(
    private readonly learningSessionsService: LearningSessionsService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLearningSession(
    @Request() req: any,
    @Body() createLearningSessionDto: CreateLearningSessionDto
  ) {
    return this.learningSessionsService.createLearningSession(
      req.user.id,
      createLearningSessionDto
    );
  }

  @Get()
  async getUserLearningSessions(@Request() req: any) {
    return this.learningSessionsService.getUserLearningSessions(req.user.id);
  }

  @Get(":id")
  async getLearningSessionById(@Param("id") id: string, @Request() req: any) {
    return this.learningSessionsService.getLearningSessionById(id, req.user.id);
  }

  @Put(":id")
  async updateLearningSession(
    @Param("id") id: string,
    @Request() req: any,
    @Body() updateData: Partial<CreateLearningSessionDto>
  ) {
    return this.learningSessionsService.updateLearningSession(
      id,
      req.user.id,
      updateData
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLearningSession(@Param("id") id: string, @Request() req: any) {
    return this.learningSessionsService.deleteLearningSession(id, req.user.id);
  }
}
