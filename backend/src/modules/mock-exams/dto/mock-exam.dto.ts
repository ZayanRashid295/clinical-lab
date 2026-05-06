import { ApiProperty, PartialType } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateMockExamDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ default: 40 }) @IsInt() @Min(5) @Max(300)
  totalQuestions!: number;
  @ApiProperty({ default: 60 }) @IsInt() @Min(5) @Max(360)
  durationMinutes!: number;
  @ApiProperty({ required: false, default: "mixed" })
  @IsOptional()
  @IsString()
  difficulty?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() productId?: string;
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  systemIds?: string[];
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  topicIds?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class UpdateMockExamDto extends PartialType(CreateMockExamDto) {}

export class StartMockExamDto {
  @ApiProperty() @IsString() mockExamId!: string;
}

export class SubmitMockExamDto {
  @ApiProperty()
  @IsArray()
  answers!: Array<{
    questionPaperQuestionId: string;
    userAnswer: string;
    timeSpent?: number;
    markedForReview?: boolean;
  }>;
}
