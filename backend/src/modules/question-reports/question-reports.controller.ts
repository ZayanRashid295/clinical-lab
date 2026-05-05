import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { QuestionReportsService } from "./question-reports.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateQuestionReportDto,
  UpdateQuestionReportDto,
} from "./dto/question-report.dto";

@ApiTags("question-reports")
@Controller("question-reports")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuestionReportsController {
  constructor(private readonly service: QuestionReportsService) {}

  @Get("me")
  @ApiOperation({ summary: "List my submitted reports" })
  myReports(@Request() req) {
    return this.service.listMy(req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: "List all reports (admin)" })
  list(
    @Query("status") status?: string,
    @Query("questionId") questionId?: string
  ) {
    return this.service.listAll({ status, questionId });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a report" })
  get(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "File a question report" })
  create(@Request() req, @Body() dto: CreateQuestionReportDto) {
    return this.service.create(req.user?.userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update / triage a report (admin)" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateQuestionReportDto
  ) {
    return this.service.update(req.user?.userId, id, dto);
  }
}
