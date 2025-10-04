import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
// import { AIConversationService } from "../services/ai-conversation.service";
import { DoctorQuestionDto } from "../dto/doctor-question.dto";
import { PatientResponseDto } from "../dto/patient-response.dto";
import { DoctorThoughtDto } from "../dto/doctor-thought.dto";
import { AskDoctorDto } from "../dto/ask-doctor.dto";
import { AIConversationService } from "../services/ai-conversation.service";

@Controller("learning/ai")
// @UseGuards(JwtAuthGuard) // Temporarily disabled for development
export class AIConversationController {
  constructor(private readonly aiConversationService: AIConversationService) {}

  @Post("doctor-question")
  @HttpCode(HttpStatus.OK)
  async generateDoctorQuestion(@Body() doctorQuestionDto: DoctorQuestionDto) {
    return this.aiConversationService.generateDoctorQuestion(doctorQuestionDto);
  }

  @Post("patient-response")
  @HttpCode(HttpStatus.OK)
  async generatePatientResponse(
    @Body() patientResponseDto: PatientResponseDto
  ) {
    return this.aiConversationService.generatePatientResponse(
      patientResponseDto
    );
  }

  @Post("doctor-thought")
  @HttpCode(HttpStatus.OK)
  async generateDoctorThought(@Body() doctorThoughtDto: DoctorThoughtDto) {
    return this.aiConversationService.generateDoctorThought(doctorThoughtDto);
  }

  @Post("ask-doctor")
  @HttpCode(HttpStatus.OK)
  async askDoctor(@Body() askDoctorDto: AskDoctorDto) {
    return this.aiConversationService.askDoctor(askDoctorDto);
  }
}
