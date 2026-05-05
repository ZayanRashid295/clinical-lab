import { ApiProperty, PartialType } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export enum GoalMetric {
  QUESTIONS_ANSWERED = "QUESTIONS_ANSWERED",
  CORRECT_ANSWERS = "CORRECT_ANSWERS",
  STUDY_MINUTES = "STUDY_MINUTES",
  FLASHCARDS_REVIEWED = "FLASHCARDS_REVIEWED",
  NOTES_CREATED = "NOTES_CREATED",
  TESTS_COMPLETED = "TESTS_COMPLETED",
}

export enum GoalPeriod {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
}

export class CreateGoalDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: GoalMetric }) @IsEnum(GoalMetric) metric!: GoalMetric;
  @ApiProperty() @IsInt() @Min(1) target!: number;
  @ApiProperty({ enum: GoalPeriod, required: false })
  @IsOptional()
  @IsEnum(GoalPeriod)
  period?: GoalPeriod;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean()
  reminderEnabled?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) @Max(23)
  reminderHour?: number;
}

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class RecordGoalProgressDto {
  @ApiProperty({ enum: GoalMetric }) @IsEnum(GoalMetric) metric!: GoalMetric;
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
