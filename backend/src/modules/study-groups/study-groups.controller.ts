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
import { StudyGroupsService } from "./study-groups.service";
import {
  CreateGroupPostDto,
  CreateStudyGroupDto,
  JoinByCodeDto,
  UpdateStudyGroupDto,
} from "./dto/study-group.dto";

@ApiTags("study-groups")
@Controller("study-groups")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudyGroupsController {
  constructor(private readonly service: StudyGroupsService) {}

  @Get()
  @ApiOperation({ summary: "Browse public study groups (or my groups)" })
  list(@Request() req, @Query("mine") mine?: string) {
    return this.service.list({
      mineOnly: mine === "true",
      userId: req.user?.userId,
    });
  }

  @Post()
  @ApiOperation({ summary: "Create a study group" })
  create(@Request() req, @Body() dto: CreateStudyGroupDto) {
    return this.service.create(req.user?.userId, dto);
  }

  @Post("join-code")
  @ApiOperation({ summary: "Join a private group with an invite code" })
  joinCode(@Request() req, @Body() dto: JoinByCodeDto) {
    return this.service.joinByCode(req.user?.userId, dto.inviteCode);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get group with members + recent posts" })
  get(@Request() req, @Param("id") id: string) {
    return this.service.findOne(req.user?.userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update group (owner only)" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateStudyGroupDto
  ) {
    return this.service.update(req.user?.userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete group (owner only)" })
  remove(@Request() req, @Param("id") id: string) {
    return this.service.remove(req.user?.userId, id);
  }

  @Post(":id/join")
  @ApiOperation({ summary: "Join a public group" })
  join(@Request() req, @Param("id") id: string) {
    return this.service.join(req.user?.userId, id);
  }

  @Post(":id/leave")
  @ApiOperation({ summary: "Leave a group" })
  leave(@Request() req, @Param("id") id: string) {
    return this.service.leave(req.user?.userId, id);
  }

  @Get(":id/posts")
  @ApiOperation({ summary: "List posts in a group" })
  posts(@Request() req, @Param("id") id: string) {
    return this.service.listPosts(req.user?.userId, id);
  }

  @Post(":id/posts")
  @ApiOperation({ summary: "Create a post in a group" })
  createPost(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: CreateGroupPostDto
  ) {
    return this.service.createPost(req.user?.userId, id, dto);
  }
}
