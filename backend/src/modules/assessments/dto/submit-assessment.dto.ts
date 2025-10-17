import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class QuestionAnswerDto {
  @ApiProperty({
    description: "Question paper question ID",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  questionPaperQuestionId: string;

  @ApiProperty({
    description: "User's selected answer",
    example: "A",
  })
  @IsString()
  userAnswer: string;

  @ApiProperty({
    description: "Time spent on this question in seconds",
    example: 120,
    required: false,
  })
  @IsOptional()
  timeSpent?: number;
}

export class SubmitAssessmentDto {
  @ApiProperty({
    description: "User ID submitting the assessment",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: "Array of question answers",
    type: [QuestionAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  answers: QuestionAnswerDto[];

  @ApiProperty({
    description: "Additional notes or feedback",
    example:
      "Completed practice test, found biochemistry questions challenging",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
