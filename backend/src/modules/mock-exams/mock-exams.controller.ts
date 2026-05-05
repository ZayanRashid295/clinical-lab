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
import { MockExamsService } from "./mock-exams.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateMockExamDto,
  SubmitMockExamDto,
  UpdateMockExamDto,
} from "./dto/mock-exam.dto";

@ApiTags("mock-exams")
@Controller("mock-exams")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MockExamsController {
  constructor(private readonly service: MockExamsService) {}

  @Get()
  @ApiOperation({ summary: "List published mock exams" })
  list(@Query("includeUnpublished") includeUnpublished?: string) {
    return this.service.list({
      onlyPublished: includeUnpublished !== "true",
    });
  }

  @Get("my-attempts")
  @ApiOperation({ summary: "My mock exam attempts" })
  myAttempts(@Request() req) {
    return this.service.listMyAttempts(req.user?.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a mock exam definition" })
  get(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a mock exam (admin)" })
  create(@Request() req, @Body() dto: CreateMockExamDto) {
    return this.service.create(dto, req.user?.userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a mock exam (admin)" })
  update(@Param("id") id: string, @Body() dto: UpdateMockExamDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a mock exam (admin)" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post(":id/start")
  @ApiOperation({ summary: "Start a new attempt for a mock exam" })
  start(@Request() req, @Param("id") id: string) {
    return this.service.start(req.user?.userId, id);
  }

  @Post("attempts/:attemptId/submit")
  @ApiOperation({ summary: "Submit a mock exam attempt" })
  submit(
    @Request() req,
    @Param("attemptId") attemptId: string,
    @Body() dto: SubmitMockExamDto
  ) {
    return this.service.submit(req.user?.userId, attemptId, dto);
  }
}
