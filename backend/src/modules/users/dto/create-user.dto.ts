import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsBoolean,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    description: "User email address",
    example: "john.doe@example.com",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @ApiProperty({ description: "User first name", example: "John" })
  @IsString({ message: "First name must be a string" })
  firstName: string;

  @ApiProperty({ description: "User last name", example: "Doe" })
  @IsString({ message: "Last name must be a string" })
  lastName: string;

  @ApiProperty({
    description: "User phone number",
    example: "+1 (555) 123-4567",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Phone must be a string" })
  phone?: string;

  @ApiProperty({
    description: "User password",
    example: "password123",
    minLength: 6,
  })
  @IsString({ message: "Password must be a string" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;

  @ApiProperty({ description: "User avatar URL", required: false })
  @IsOptional()
  @IsString({ message: "Avatar must be a string" })
  avatar?: string;

  @ApiProperty({
    description: "User active status",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}
