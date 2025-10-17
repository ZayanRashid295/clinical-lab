import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateTagDto {
  @ApiProperty({
    description: "Tag name",
    example: "Anatomy",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Tag description",
    example: "Anatomy related questions",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Hex color for UI display",
    example: "#FF5733",
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: "Whether the tag is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
