import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GoalsService } from "./goals.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateGoalDto,
  RecordGoalProgressDto,
  UpdateGoalDto,
} from "./dto/goal.dto";

@ApiTags("goals")
@Controller("goals")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  @Get()
  @ApiOperation({ summary: "List my goals (with current bucket progress)" })
  list(@Request() req) {
    return this.service.listMy(req.user?.userId);
  }

  @Post()
  @ApiOperation({ summary: "Create a goal" })
  create(@Request() req, @Body() dto: CreateGoalDto) {
    return this.service.create(req.user?.userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a goal with 30-bucket history" })
  get(@Request() req, @Param("id") id: string) {
    return this.service.findOne(req.user?.userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a goal" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateGoalDto
  ) {
    return this.service.update(req.user?.userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a goal" })
  remove(@Request() req, @Param("id") id: string) {
    return this.service.remove(req.user?.userId, id);
  }

  @Post("record")
  @ApiOperation({ summary: "Record progress for all active goals on a metric" })
  record(@Request() req, @Body() dto: RecordGoalProgressDto) {
    return this.service.recordProgress(
      req.user?.userId,
      dto.metric,
      dto.amount ?? 1
    );
  }
}
