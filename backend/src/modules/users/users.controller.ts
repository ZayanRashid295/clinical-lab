import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { ActivityLogService } from "../activity-log/activity-log.service";
import {
  ACTIVITY_COMPONENTS,
  ACTIVITY_EVENTS,
} from "../activity-log/activity-log.constants";
import { extractRequestContext } from "../../common/utils/request-context.util";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Get all users with filtering, pagination, and sorting",
  })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get user statistics" })
  @ApiResponse({
    status: 200,
    description: "User statistics retrieved successfully",
  })
  getStats() {
    return this.usersService.getStats();
  }

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async create(@Request() req, @Body() createUserDto: CreateUserDto) {
    const created = await this.usersService.create(createUserDto);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      affectedUserId: created?.id,
      component: ACTIVITY_COMPONENTS.USER,
      eventName: ACTIVITY_EVENTS.USER_CREATED,
      contextType: "user",
      contextId: created?.id,
      contextLabel: created?.email,
      ...ctx,
    });
    return created;
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateUserDto: any,
  ) {
    if (updateUserDto.name && !updateUserDto.name.trim()) {
      throw new Error("Name cannot be empty");
    }
    if (updateUserDto.email && !updateUserDto.email.trim()) {
      throw new Error("Email cannot be empty");
    }

    const updated = await this.usersService.update(id, updateUserDto);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      affectedUserId: id,
      component: ACTIVITY_COMPONENTS.USER,
      eventName: ACTIVITY_EVENTS.USER_UPDATED,
      contextType: "user",
      contextId: id,
      contextLabel: updated?.email ?? id,
      ...ctx,
    });
    return updated;
  }

  @Delete(":id")
  @ApiOperation({ summary: "Mark user as inactive" })
  @ApiResponse({ status: 200, description: "User marked inactive successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async remove(@Request() req, @Param("id") id: string) {
    const result = await this.usersService.remove(id);
    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      affectedUserId: id,
      component: ACTIVITY_COMPONENTS.USER,
      eventName: ACTIVITY_EVENTS.USER_DEACTIVATED,
      contextType: "user",
      contextId: id,
      ...ctx,
    });
    return result;
  }
}
