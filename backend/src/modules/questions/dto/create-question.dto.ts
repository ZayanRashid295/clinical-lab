import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsIn,
} from "class-validator";

export class CreateQuestionDto {
  @ApiProperty({
    description: "Topic ID this question belongs to",
    example: "cmguoh2dg000hlj45zxmb3rsl",
  })
  @IsString()
  topicId: string;

  @ApiProperty({
    description: "Product tag ID (optional)",
    example: "cmguoh2bu0001lj45dttw7000",
    required: false,
  })
  @IsOptional()
  @IsString()
  productTagId?: string;

  @ApiProperty({
    description: "Question text",
    example:
      "Which of the following is the most common cause of acute myocardial infarction?",
  })
  @IsString()
  question: string;

  @ApiProperty({
    description: "Explanation for the correct answer",
    example:
      "Atherosclerotic plaque rupture is the most common cause of acute MI...",
    required: false,
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({
    description: "Question difficulty level",
    example: "medium",
    enum: ["easy", "medium", "hard"],
    default: "medium",
    required: false,
  })
  @IsOptional()
  @IsIn(["easy", "medium", "hard"])
  difficulty?: string;

  @ApiProperty({
    description: "Points for correct answer",
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiProperty({
    description: "Whether the question is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
