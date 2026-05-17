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
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { FacultyService } from "./faculty.service";

@ApiTags("faculty")
@ApiBearerAuth()
@Controller("faculty")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("FACULTY", "SUPERADMIN", "ADMIN")
export class FacultyController {
  constructor(private readonly faculty: FacultyService) {}

  private uid(req: { user: { userId?: string; id?: string } }) {
    return req.user.userId ?? req.user.id;
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Faculty command center stats" })
  dashboard(@Request() req) {
    return this.faculty.getDashboard(this.uid(req));
  }

  @Get("students")
  listStudents(@Request() req, @Query("search") search?: string) {
    return this.faculty.listStudents(this.uid(req), search);
  }

  @Get("students/:studentId")
  studentDetail(@Request() req, @Param("studentId") studentId: string) {
    return this.faculty.getStudentDetail(this.uid(req), studentId);
  }

  @Post("compare")
  compare(@Request() req, @Body() body: { studentIds: string[] }) {
    return this.faculty.compareStudents(this.uid(req), body.studentIds ?? []);
  }

  @Get("assignments")
  listAssignments(@Request() req) {
    return this.faculty.listAssignments(this.uid(req));
  }

  @Post("assignments")
  createAssignment(@Request() req, @Body() body: Record<string, unknown>) {
    return this.faculty.createAssignment(this.uid(req), body);
  }

  @Post("assignments/:id/publish")
  publishAssignment(@Request() req, @Param("id") id: string) {
    return this.faculty.publishAssignment(this.uid(req), id);
  }

  @Get("cases")
  listCases(@Request() req, @Query("mode") mode?: string) {
    return this.faculty.listCases(this.uid(req), mode);
  }

  @Post("cases")
  createCase(@Request() req, @Body() body: Record<string, unknown>) {
    return this.faculty.createCase(this.uid(req), body);
  }

  @Post("cases/:id/publish")
  publishCase(@Request() req, @Param("id") id: string) {
    return this.faculty.publishCase(this.uid(req), id);
  }

  @Get("questions")
  listQuestions(@Request() req) {
    return this.faculty.listQuestions(this.uid(req));
  }

  @Post("questions")
  createQuestion(@Request() req, @Body() body: Record<string, unknown>) {
    return this.faculty.createQuestion(this.uid(req), body);
  }

  @Get("question-sets")
  listQuestionSets(@Request() req) {
    return this.faculty.listQuestionSets(this.uid(req));
  }

  @Post("question-sets")
  createQuestionSet(@Request() req, @Body() body: Record<string, unknown>) {
    return this.faculty.createQuestionSet(this.uid(req), body);
  }

  @Get("messages/threads")
  listThreads(@Request() req) {
    return this.faculty.listThreads(this.uid(req));
  }

  @Get("messages/threads/:threadId")
  getThread(@Request() req, @Param("threadId") threadId: string) {
    return this.faculty.getThreadMessages(this.uid(req), threadId);
  }

  @Post("messages/with-student/:studentId")
  openWithStudent(@Request() req, @Param("studentId") studentId: string) {
    return this.faculty.getOrCreateThread(this.uid(req), studentId);
  }

  @Post("messages/threads/:threadId")
  sendMessage(
    @Request() req,
    @Param("threadId") threadId: string,
    @Body() body: { content: string; metadata?: Record<string, unknown> },
  ) {
    return this.faculty.sendMessage(
      this.uid(req),
      threadId,
      body.content ?? "",
      body.metadata,
    );
  }
}
