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
import { DiscussionsService } from "./discussions.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateDiscussionDto,
  CreateReplyDto,
  QueryDiscussionDto,
  UpdateDiscussionDto,
  VoteDto,
} from "./dto/discussion.dto";

@ApiTags("discussions")
@Controller("discussions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiscussionsController {
  constructor(private readonly service: DiscussionsService) {}

  @Get()
  @ApiOperation({ summary: "List discussions with optional filters" })
  list(@Query() query: QueryDiscussionDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a discussion with replies" })
  get(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a discussion" })
  create(@Request() req, @Body() dto: CreateDiscussionDto) {
    return this.service.create(req.user?.userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a discussion (author only)" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateDiscussionDto
  ) {
    return this.service.update(req.user?.userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a discussion (author only)" })
  remove(@Request() req, @Param("id") id: string) {
    return this.service.remove(req.user?.userId, id);
  }

  @Post(":id/replies")
  @ApiOperation({ summary: "Reply to a discussion" })
  reply(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: CreateReplyDto
  ) {
    return this.service.addReply(req.user?.userId, id, dto);
  }

  @Post(":id/vote")
  @ApiOperation({ summary: "Up/down-vote a discussion" })
  vote(@Request() req, @Param("id") id: string, @Body() dto: VoteDto) {
    return this.service.vote(req.user?.userId, id, dto);
  }
}
