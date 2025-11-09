import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
} from "class-validator";

export class CreateRoleDto {
  @ApiProperty({
    description: "Role name (unique identifier)",
    example: "ADMIN",
  })
  @IsString({ message: "Name must be a string" })
  name: string;

  @ApiProperty({
    description: "Display name for the role",
    example: "Administrator",
  })
  @IsString({ message: "Display name must be a string" })
  displayName: string;

  @ApiProperty({
    description: "Role description",
    example: "Full system access with all permissions",
  })
  @IsString({ message: "Description must be a string" })
  description: string;

  @ApiProperty({
    description: "List of permission names",
    example: ["USER_MANAGEMENT", "ROLE_MANAGEMENT"],
    type: [String],
  })
  @IsArray({ message: "Permissions must be an array" })
  @ArrayNotEmpty({ message: "At least one permission is required" })
  @IsString({ each: true, message: "Each permission must be a string" })
  permissions: string[];

  @ApiProperty({
    description: "Role active status",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}
