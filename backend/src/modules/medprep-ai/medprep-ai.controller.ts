import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  MedprepConversationStatus,
  MedprepMode,
} from "@prisma/client";
import { MedprepAiService } from "./medprep-ai.service";
import {
  CreateMedprepMessageDto,
  StartMedprepSessionDto,
  SubmitMedprepDiagnosisDto,
  SubmitMedprepSoapDto,
  UpdateMedprepSessionDto,
  UpsertMedprepHintSessionDto,
  UpsertMedprepSoapDto,
} from "./dto/medprep-ai.dto";

@ApiTags("medprep-ai")
@Controller("medprep-ai")
export class MedprepAiController {
  constructor(private readonly medprepAiService: MedprepAiService) {}

  private resolveUserId(req: any): string {
    return (
      req.user?.userId ||
      req.headers?.["x-user-id"] ||
      req.body?.userId ||
      req.query?.userId
    );
  }

  @Get("modes")
  @ApiOperation({ summary: "List MedPrep modes" })
  getModes() {
    return this.medprepAiService.getModes();
  }

  @Get("me/case-limits")
  @ApiOperation({
    summary: "Subscription case quotas vs usage per MedPrep mode",
  })
  getMyCaseLimits(@Request() req: any) {
    return this.medprepAiService.getMyCaseLimitSummary(this.resolveUserId(req));
  }

  @Post("sessions")
  @ApiOperation({ summary: "Start or resume an active session" })
  startSession(@Request() req, @Body() dto: StartMedprepSessionDto) {
    return this.medprepAiService.startSession(this.resolveUserId(req), dto);
  }

  @Get("sessions")
  @ApiOperation({ summary: "List my MedPrep sessions" })
  listSessions(
    @Request() req,
    @Query("mode") mode?: MedprepMode,
    @Query("status") status?: MedprepConversationStatus,
    @Query("caseId") caseId?: string
  ) {
    return this.medprepAiService.listSessions(this.resolveUserId(req), {
      mode,
      status,
      caseId,
    });
  }

  @Get("sessions/resume")
  @ApiOperation({ summary: "Get latest active session for mode/case" })
  getResume(
    @Request() req,
    @Query("mode") mode: MedprepMode,
    @Query("caseId") caseId?: string
  ) {
    return this.medprepAiService.getResumeSession(
      this.resolveUserId(req),
      mode,
      caseId
    );
  }

  @Get("sessions/:id")
  @ApiOperation({ summary: "Get hydrated session by id" })
  getSession(@Request() req, @Param("id") id: string) {
    return this.medprepAiService.getSession(this.resolveUserId(req), id);
  }

  @Patch("sessions/:id")
  @ApiOperation({ summary: "Update session status/metadata/score" })
  updateSession(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateMedprepSessionDto
  ) {
    return this.medprepAiService.updateSession(this.resolveUserId(req), id, dto);
  }

  @Get("sessions/:id/messages")
  @ApiOperation({ summary: "List session messages" })
  listMessages(@Request() req, @Param("id") id: string) {
    return this.medprepAiService.listMessages(this.resolveUserId(req), id);
  }

  @Post("sessions/:id/messages")
  @ApiOperation({ summary: "Add a message to session transcript" })
  addMessage(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: CreateMedprepMessageDto
  ) {
    return this.medprepAiService.addMessage(this.resolveUserId(req), id, dto);
  }

  @Put("sessions/:id/soap")
  @ApiOperation({ summary: "Save or update SOAP draft" })
  upsertSoap(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpsertMedprepSoapDto
  ) {
    return this.medprepAiService.upsertSoap(this.resolveUserId(req), id, dto);
  }

  @Post("sessions/:id/soap/submit")
  @ApiOperation({ summary: "Submit SOAP note" })
  submitSoap(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: SubmitMedprepSoapDto
  ) {
    return this.medprepAiService.submitSoap(this.resolveUserId(req), id, dto);
  }

  @Post("sessions/:id/diagnosis")
  @ApiOperation({ summary: "Persist diagnosis submission" })
  submitDiagnosis(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: SubmitMedprepDiagnosisDto
  ) {
    return this.medprepAiService.submitDiagnosis(this.resolveUserId(req), id, dto);
  }

  @Put("sessions/:id/hints")
  @ApiOperation({ summary: "Upsert hint session telemetry" })
  upsertHints(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpsertMedprepHintSessionDto
  ) {
    return this.medprepAiService.upsertHintSession(this.resolveUserId(req), id, dto);
  }

  @Post("sessions/:id/score")
  @ApiOperation({ summary: "Persist score artifacts for session" })
  scoreSession(
    @Request() req,
    @Param("id") id: string,
    @Body("score") score: number,
    @Body("feedback") feedback?: string
  ) {
    return this.medprepAiService.scoreSession(
      this.resolveUserId(req),
      id,
      score,
      feedback
    );
  }
}
