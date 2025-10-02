import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  findAll() {
    return this.usersService.findAll();
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
  update(@Param("id") id: string, @Body() updateUserDto: any) {
    // Validate required fields
    if (updateUserDto.name && !updateUserDto.name.trim()) {
      throw new Error("Name cannot be empty");
    }
    if (updateUserDto.email && !updateUserDto.email.trim()) {
      throw new Error("Email cannot be empty");
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deactivate user" })
  @ApiResponse({ status: 200, description: "User deactivated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
