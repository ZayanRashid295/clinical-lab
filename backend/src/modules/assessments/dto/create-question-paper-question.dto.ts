import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, Min, IsBoolean } from "class-validator";

export class CreateQuestionPaperQuestionDto {
  @ApiProperty({
    description: "Question paper ID",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  questionPaperId: string;

  @ApiProperty({
    description: "Question ID to add to the paper",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: "Order of the question in the paper",
    example: 1,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: "Whether question is marked for review",
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  markedForReview?: boolean;
}
