import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export enum QuestionReportReason {
  INCORRECT_ANSWER = "INCORRECT_ANSWER",
  TYPO = "TYPO",
  UNCLEAR = "UNCLEAR",
  OUTDATED = "OUTDATED",
  DUPLICATE = "DUPLICATE",
  OFFENSIVE = "OFFENSIVE",
  OTHER = "OTHER",
}

export enum QuestionReportStatus {
  OPEN = "OPEN",
  TRIAGED = "TRIAGED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  RESOLVED = "RESOLVED",
}

export class CreateQuestionReportDto {
  @ApiProperty() @IsString() questionId!: string;
  @ApiProperty({ enum: QuestionReportReason })
  @IsEnum(QuestionReportReason)
  reason!: QuestionReportReason;
  @ApiProperty({ required: false }) @IsOptional() @IsString() details?: string;
}

export class UpdateQuestionReportDto extends PartialType(
  CreateQuestionReportDto
) {
  @ApiProperty({ enum: QuestionReportStatus, required: false })
  @IsOptional()
  @IsEnum(QuestionReportStatus)
  status?: QuestionReportStatus;
  @ApiProperty({ required: false }) @IsOptional() @IsString() resolution?: string;
}
