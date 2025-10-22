import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsArray } from "class-validator";

export class UpdateRoleDto {
  @ApiProperty({
    description: "Role name (unique identifier)",
    example: "ADMIN",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Name must be a string" })
  name?: string;

  @ApiProperty({
    description: "Display name for the role",
    example: "Administrator",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Display name must be a string" })
  displayName?: string;

  @ApiProperty({
    description: "Role description",
    example: "Full system access with all permissions",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  description?: string;

  @ApiProperty({
    description: "List of permission names",
    example: ["USER_MANAGEMENT", "ROLE_MANAGEMENT"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: "Permissions must be an array" })
  @IsString({ each: true, message: "Each permission must be a string" })
  permissions?: string[];

  @ApiProperty({
    description: "Role active status",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}
