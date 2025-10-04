import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { LearningCasesService } from "./learning-cases.service";
import { CreateLearningCaseDto } from "./create-learning-case.dto";

@Controller("learning/cases")
@UseGuards(JwtAuthGuard)
export class LearningCasesController {
  constructor(private readonly learningCasesService: LearningCasesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLearningCase(
    @Body() createLearningCaseDto: CreateLearningCaseDto
  ) {
    return this.learningCasesService.createLearningCase(createLearningCaseDto);
  }

  @Get()
  async getAllLearningCases() {
    return this.learningCasesService.getAllLearningCases();
  }

  @Get(":id")
  async getLearningCaseById(@Param("id") id: string) {
    return this.learningCasesService.getLearningCaseById(id);
  }

  @Put(":id")
  async updateLearningCase(
    @Param("id") id: string,
    @Body() updateData: Partial<CreateLearningCaseDto>
  ) {
    return this.learningCasesService.updateLearningCase(id, updateData);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLearningCase(@Param("id") id: string) {
    return this.learningCasesService.deleteLearningCase(id);
  }
}
