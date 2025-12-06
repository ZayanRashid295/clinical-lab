import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, Min, IsBoolean } from "class-validator";

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
    description: "Whether the answer is correct",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

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

  @ApiProperty({
    description: "Whether question is marked for review",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  markedForReview?: boolean;
}
