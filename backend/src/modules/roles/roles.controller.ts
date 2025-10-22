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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { RolesService } from "./roles.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { QueryRoleDto } from "./dto/query-role.dto";

@ApiTags("roles")
@Controller("roles")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({
    summary: "Get all roles with filtering, pagination, and sorting",
  })
  @ApiResponse({ status: 200, description: "Roles retrieved successfully" })
  findAll(@Query() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get role statistics" })
  @ApiResponse({
    status: 200,
    description: "Role statistics retrieved successfully",
  })
  getStats() {
    return this.rolesService.getStats();
  }

  @Post()
  @ApiOperation({ summary: "Create a new role" })
  @ApiResponse({ status: 201, description: "Role created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 409, description: "Role already exists" })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get role by ID" })
  @ApiResponse({ status: 200, description: "Role retrieved successfully" })
  @ApiResponse({ status: 404, description: "Role not found" })
  findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update role" })
  @ApiResponse({ status: 200, description: "Role updated successfully" })
  @ApiResponse({ status: 404, description: "Role not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  update(@Param("id") id: string, @Body() updateRoleDto: UpdateRoleDto) {
    // Validate name if provided
    if (updateRoleDto.name && !updateRoleDto.name.trim()) {
      throw new Error("Name cannot be empty");
    }
    if (updateRoleDto.displayName && !updateRoleDto.displayName.trim()) {
      throw new Error("Display name cannot be empty");
    }

    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deactivate role" })
  @ApiResponse({ status: 200, description: "Role deactivated successfully" })
  @ApiResponse({ status: 404, description: "Role not found" })
  remove(@Param("id") id: string) {
    return this.rolesService.remove(id);
  }
}
