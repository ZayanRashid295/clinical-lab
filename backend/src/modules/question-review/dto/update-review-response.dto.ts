import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateReviewResponseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userAnswer?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  qualityComment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpent?: number;
}
