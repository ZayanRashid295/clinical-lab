import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt, Min } from "class-validator";

export class CreateQuestionPaperDto {
  @ApiProperty({
    description: "User ID who owns this question paper",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: "Question paper name",
    example: "Practice Test 1",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Question paper description",
    example: "First practice test for USMLE Step 1 preparation",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Type of question paper",
    example: "practice",
    enum: ["practice", "mock", "assessment"],
    default: "practice",
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: "Total number of questions",
    example: 50,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalQuestions?: number;

  @ApiProperty({
    description: "Time limit in minutes",
    example: 60,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimit?: number;

  @ApiProperty({
    description: "Whether the question paper is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
