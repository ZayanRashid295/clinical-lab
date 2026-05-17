import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StudentInstitutionService } from "./student-institution.service";

@ApiTags("student-institution")
@ApiBearerAuth()
@Controller("student/institution")
@UseGuards(JwtAuthGuard)
export class StudentInstitutionController {
  constructor(private readonly service: StudentInstitutionService) {}

  private uid(req: { user: { userId?: string; id?: string } }) {
    return req.user.userId ?? req.user.id;
  }

  @Get()
  @ApiOperation({ summary: "Institution context for current student" })
  context(@Request() req) {
    return this.service.getInstitutionContext(this.uid(req));
  }

  @Get("assignments")
  assignments(@Request() req) {
    return this.service.listAssignments(this.uid(req));
  }

  @Get("cases")
  cases(@Request() req, @Query("mode") mode?: string) {
    return this.service.listInstitutionCases(this.uid(req), mode);
  }

  @Get("cases/:caseId")
  getCase(@Request() req, @Param("caseId") caseId: string) {
    return this.service.getInstitutionCase(this.uid(req), caseId);
  }

  @Post("assignments/:assignmentId/progress")
  updateAssignmentProgress(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
    @Body()
    body: {
      status?: string;
      conversationId?: string;
      score?: number;
      institutionCaseId?: string;
    },
  ) {
    return this.service.updateAssignmentProgress(this.uid(req), assignmentId, {
      status: body.status as any,
      conversationId: body.conversationId,
      score: body.score,
      institutionCaseId: body.institutionCaseId,
    });
  }

  @Get("questions")
  questions(@Request() req) {
    return this.service.listInstitutionQuestions(this.uid(req));
  }

  @Get("messages/threads")
  messageThreads(@Request() req) {
    return this.service.listMessageThreads(this.uid(req));
  }

  @Get("messages/threads/:threadId")
  getThread(@Request() req, @Param("threadId") threadId: string) {
    return this.service.getThreadMessages(this.uid(req), threadId);
  }

  @Post("messages/with-faculty/:facultyUserId")
  openFacultyThread(
    @Request() req,
    @Param("facultyUserId") facultyUserId: string,
  ) {
    return this.service.openThreadWithFaculty(this.uid(req), facultyUserId);
  }

  @Post("messages/threads/:threadId")
  sendMessage(
    @Request() req,
    @Param("threadId") threadId: string,
    @Body() body: { content: string },
  ) {
    return this.service.sendStudentMessage(
      this.uid(req),
      threadId,
      body.content ?? "",
    );
  }
}
