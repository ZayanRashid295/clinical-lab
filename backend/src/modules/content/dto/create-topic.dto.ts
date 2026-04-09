import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt, Min } from "class-validator";

export class CreateTopicDto {
  @ApiProperty({ description: "System ID this topic belongs to" })
  @IsString()
  systemId: string;

  @ApiProperty({ description: "Topic name", example: "Acute Chest Pain" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Topic description", required: false })
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
