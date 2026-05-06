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
import { FeedbackService } from "./feedback.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateFeedbackDto,
  CreateFeedbackReplyDto,
  UpdateFeedbackDto,
} from "./dto/feedback.dto";

function isStaff(req: any): boolean {
  const roles: string[] = (req.user?.roles ?? []).map((r: any) =>
    typeof r === "string" ? r.toUpperCase() : r?.name?.toUpperCase() ?? ""
  );
  return roles.some((r) => ["SUPERADMIN", "ADMIN"].includes(r));
}

@ApiTags("feedback")
@Controller("feedback")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get("me")
  @ApiOperation({ summary: "List my tickets" })
  myTickets(@Request() req) {
    return this.service.listMy(req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: "List all tickets (admin)" })
  list(@Request() req, @Query("status") status?: string) {
    if (!isStaff(req)) return this.service.listMy(req.user?.userId);
    return this.service.listAll({ status });
  }

  @Post()
  @ApiOperation({ summary: "Create a feedback / support ticket" })
  create(@Request() req, @Body() dto: CreateFeedbackDto) {
    return this.service.create(req.user?.userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a ticket with replies" })
  get(@Request() req, @Param("id") id: string) {
    return this.service.findOne(req.user?.userId, id, isStaff(req));
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a ticket" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateFeedbackDto
  ) {
    return this.service.update(req.user?.userId, id, dto, isStaff(req));
  }

  @Post(":id/replies")
  @ApiOperation({ summary: "Reply to a ticket" })
  reply(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: CreateFeedbackReplyDto
  ) {
    return this.service.addReply(req.user?.userId, id, dto, isStaff(req));
  }
}
