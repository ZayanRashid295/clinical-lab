import { ApiProperty, PartialType } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export enum AchievementCategory {
  STUDY = "STUDY",
  STREAK = "STREAK",
  PROGRESS = "PROGRESS",
  COMMUNITY = "COMMUNITY",
  MASTERY = "MASTERY",
  MILESTONE = "MILESTONE",
}

export enum AchievementMetric {
  QUESTIONS_ANSWERED = "QUESTIONS_ANSWERED",
  CORRECT_ANSWERS = "CORRECT_ANSWERS",
  TESTS_COMPLETED = "TESTS_COMPLETED",
  FLASHCARDS_REVIEWED = "FLASHCARDS_REVIEWED",
  NOTES_CREATED = "NOTES_CREATED",
  STREAK_DAYS = "STREAK_DAYS",
  STUDY_MINUTES = "STUDY_MINUTES",
  DISCUSSION_POSTS = "DISCUSSION_POSTS",
  GOAL_COMPLETED = "GOAL_COMPLETED",
  AI_TUTOR_MESSAGES = "AI_TUTOR_MESSAGES",
  STUDY_TASKS_COMPLETED = "STUDY_TASKS_COMPLETED",
  STUDY_GROUP_POSTS = "STUDY_GROUP_POSTS",
  MEDPREP_CONVERSATIONS = "MEDPREP_CONVERSATIONS",
  QUESTION_REPORTS_SUBMITTED = "QUESTION_REPORTS_SUBMITTED",
  FEEDBACK_TICKETS_SUBMITTED = "FEEDBACK_TICKETS_SUBMITTED",
  MOCK_EXAMS_COMPLETED = "MOCK_EXAMS_COMPLETED",
  STUDY_GROUPS_JOINED = "STUDY_GROUPS_JOINED",
}

export class CreateAchievementDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() icon?: string;
  @ApiProperty({ enum: AchievementCategory, required: false })
  @IsOptional()
  @IsEnum(AchievementCategory)
  category?: AchievementCategory;
  @ApiProperty({ enum: AchievementMetric })
  @IsEnum(AchievementMetric)
  metric!: AchievementMetric;
  @ApiProperty() @IsInt() @Min(1) threshold!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0)
  points?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateAchievementDto extends PartialType(CreateAchievementDto) {}

export class RecordActivityDto {
  @ApiProperty({ enum: AchievementMetric })
  @IsEnum(AchievementMetric)
  metric!: AchievementMetric;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;
}
