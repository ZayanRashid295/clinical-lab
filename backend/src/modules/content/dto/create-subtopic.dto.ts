import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt, Min } from "class-validator";

export class CreateSubtopicDto {
  @ApiProperty({ description: "Topic ID this subtopic belongs to" })
  @IsString()
  topicId: string;

  @ApiProperty({ description: "Subtopic name", example: "History & Presentation" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Subtopic description", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Display order", default: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ description: "Whether active", default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
