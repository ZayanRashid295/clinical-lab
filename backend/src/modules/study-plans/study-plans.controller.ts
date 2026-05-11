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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { EntitlementGuard } from "../auth/guards/entitlement.guard";
import { RequiredEntitlements } from "../auth/decorators/entitlements.decorator";
import { StudyPlansService } from "./study-plans.service";
import {
  CreateStudyPlanDto,
  CreateStudyTaskDto,
  QueryStudyTasksDto,
  UpdateStudyPlanDto,
  UpdateStudyTaskDto,
} from "./dto/study-plan.dto";

@ApiTags("study-plans")
@ApiBearerAuth()
@Controller("study-plans")
@UseGuards(JwtAuthGuard, EntitlementGuard)
@RequiredEntitlements("study.planner")
export class StudyPlansController {
  constructor(private readonly service: StudyPlansService) {}

  private uid(req: any) {
    return req.user.userId ?? req.user.id;
  }

  @Get()
  @ApiOperation({ summary: "List all study plans for me" })
  list(@Request() req) {
    return this.service.listPlans(this.uid(req));
  }

  @Get("active")
  @ApiOperation({ summary: "Get my active (or latest) study plan" })
  active(@Request() req) {
    return this.service.getActiveOrLatest(this.uid(req));
  }

  @Get("progress")
  @ApiOperation({ summary: "Plan progress + day countdown" })
  progress(@Request() req) {
    return this.service.progress(this.uid(req));
  }

  @Post()
  @ApiOperation({ summary: "Create a study plan (becomes active)" })
  create(@Request() req, @Body() dto: CreateStudyPlanDto) {
    return this.service.createPlan(this.uid(req), dto);
  }

  @Patch(":id")
  update(@Request() req, @Param("id") id: string, @Body() dto: UpdateStudyPlanDto) {
    return this.service.updatePlan(this.uid(req), id, dto);
  }

  @Delete(":id")
  remove(@Request() req, @Param("id") id: string) {
    return this.service.deletePlan(this.uid(req), id);
  }

  // tasks
  @Get("tasks/list")
  @ApiOperation({ summary: "List my study tasks (filter by date/range/status)" })
  listTasks(@Request() req, @Query() q: QueryStudyTasksDto) {
    return this.service.listTasks(this.uid(req), q);
  }

  @Post("tasks")
  @ApiOperation({ summary: "Create a study task (auto-creates a plan if none)" })
  createTask(@Request() req, @Body() dto: CreateStudyTaskDto) {
    return this.service.createTask(this.uid(req), dto);
  }

  @Patch("tasks/:id")
  updateTask(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateStudyTaskDto
  ) {
    return this.service.updateTask(this.uid(req), id, dto);
  }

  @Delete("tasks/:id")
  deleteTask(@Request() req, @Param("id") id: string) {
    return this.service.deleteTask(this.uid(req), id);
  }
}
