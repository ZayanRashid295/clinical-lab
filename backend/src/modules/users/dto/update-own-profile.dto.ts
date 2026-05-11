import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";

/** Fields any authenticated user may update on their own account. */
export class UpdateOwnProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "First name cannot be empty" })
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "Last name cannot be empty" })
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: "Invalid email address" })
  email?: string;

  /** Omit or pass null / "" to clear phone (if allowed by uniqueness). */
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== "")
  @IsString()
  phone?: string | null;
}
