import { ApiProperty, PartialType } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export enum FeedbackCategory {
  GENERAL = "GENERAL",
  BUG = "BUG",
  FEATURE_REQUEST = "FEATURE_REQUEST",
  CONTENT = "CONTENT",
  BILLING = "BILLING",
  ACCOUNT = "ACCOUNT",
}

export enum FeedbackPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum FeedbackStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING_USER = "WAITING_USER",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export class CreateFeedbackDto {
  @ApiProperty() @IsString() @MaxLength(200) subject!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiProperty({ enum: FeedbackCategory, required: false })
  @IsOptional()
  @IsEnum(FeedbackCategory)
  category?: FeedbackCategory;
  @ApiProperty({ enum: FeedbackPriority, required: false })
  @IsOptional()
  @IsEnum(FeedbackPriority)
  priority?: FeedbackPriority;
  @ApiProperty({ required: false }) @IsOptional() @IsString() attachmentUrl?: string;
}

export class UpdateFeedbackDto extends PartialType(CreateFeedbackDto) {
  @ApiProperty({ enum: FeedbackStatus, required: false })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;
  @ApiProperty({ required: false }) @IsOptional() @IsString() assigneeId?: string;
}

export class CreateFeedbackReplyDto {
  @ApiProperty() @IsString() body!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() attachmentUrl?: string;
}
