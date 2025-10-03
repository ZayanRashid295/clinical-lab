import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LearningService } from './learning.service';
import { CreateLearningCaseDto } from './dto/create-learning-case.dto';
import { CreateLearningSessionDto } from './dto/create-learning-session.dto';
import { DoctorQuestionDto } from './dto/doctor-question.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { DoctorThoughtDto } from './dto/doctor-thought.dto';
import { AskDoctorDto } from './dto/ask-doctor.dto';

@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  // Learning Cases Endpoints
  @Post('cases')
  async createLearningCase(@Body() createLearningCaseDto: CreateLearningCaseDto) {
    return this.learningService.createLearningCase(createLearningCaseDto);
  }

  @Get('cases')
  async getAllLearningCases() {
    return this.learningService.getAllLearningCases();
  }

  @Get('cases/:id')
  async getLearningCaseById(@Param('id') id: string) {
    return this.learningService.getLearningCaseById(id);
  }

  // Learning Sessions Endpoints
  @Post('sessions')
  async createLearningSession(
    @Request() req: any,
    @Body() createLearningSessionDto: CreateLearningSessionDto,
  ) {
    return this.learningService.createLearningSession(req.user.id, createLearningSessionDto);
  }

  @Get('sessions')
  async getUserLearningSessions(@Request() req: any) {
    return this.learningService.getUserLearningSessions(req.user.id);
  }

  @Get('sessions/:id')
  async getLearningSessionById(@Param('id') id: string, @Request() req: any) {
    return this.learningService.getLearningSessionById(id, req.user.id);
  }

  @Put('sessions/:id')
  async updateLearningSession(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateData: Partial<CreateLearningSessionDto>,
  ) {
    return this.learningService.updateLearningSession(id, req.user.id, updateData);
  }

  // AI Conversation Generation Endpoints
  @Post('doctor-question')
  @HttpCode(HttpStatus.OK)
  async generateDoctorQuestion(@Body() doctorQuestionDto: DoctorQuestionDto) {
    return this.learningService.generateDoctorQuestion(doctorQuestionDto);
  }

  @Post('patient-response')
  @HttpCode(HttpStatus.OK)
  async generatePatientResponse(@Body() patientResponseDto: PatientResponseDto) {
    return this.learningService.generatePatientResponse(patientResponseDto);
  }

  @Post('doctor-thought')
  @HttpCode(HttpStatus.OK)
  async generateDoctorThought(@Body() doctorThoughtDto: DoctorThoughtDto) {
    return this.learningService.generateDoctorThought(doctorThoughtDto);
  }

  @Post('ask-doctor')
  @HttpCode(HttpStatus.OK)
  async askDoctor(@Body() askDoctorDto: AskDoctorDto) {
    return this.learningService.askDoctor(askDoctorDto);
  }

  // Learning Progress Endpoints
  @Get('progress')
  async getLearningProgress(@Request() req: any) {
    return this.learningService.getLearningProgress(req.user.id);
  }

  @Post('progress')
  async updateLearningProgress(
    @Request() req: any,
    @Body() sessionData: any,
  ) {
    return this.learningService.updateLearningProgress(req.user.id, sessionData);
  }
}
