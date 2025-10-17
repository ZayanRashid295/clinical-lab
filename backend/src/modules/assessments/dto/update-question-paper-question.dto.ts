import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, Min } from "class-validator";

export class UpdateQuestionPaperQuestionDto {
  @ApiProperty({
    description: "User's selected answer",
    example: "A",
    required: false,
  })
  @IsOptional()
  @IsString()
  userAnswer?: string;

  @ApiProperty({
    description: "Time spent on this question in seconds",
    example: 120,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpent?: number;

  @ApiProperty({
    description: "Order of the question in the paper",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
