import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ description: "Category name", example: "Medical" })
  @IsString()
  name: string;

  @ApiProperty({ description: "URL-friendly slug", example: "medical" })
  @IsString()
  slug: string;

  @ApiProperty({ description: "Category description", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Icon for UI display", required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: "Display order", required: false })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ description: "Whether active", default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
