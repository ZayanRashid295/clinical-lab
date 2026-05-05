import { ApiProperty, PartialType } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export enum DiscussionContext {
  GENERAL = "GENERAL",
  QUESTION = "QUESTION",
  TOPIC = "TOPIC",
  SYSTEM = "SYSTEM",
  PRODUCT = "PRODUCT",
}

export class CreateDiscussionDto {
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiProperty({ enum: DiscussionContext, required: false })
  @IsOptional()
  @IsEnum(DiscussionContext)
  context?: DiscussionContext;
  @ApiProperty({ required: false }) @IsOptional() @IsString() questionId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() topicId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() systemId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() productId?: string;
}

export class UpdateDiscussionDto extends PartialType(CreateDiscussionDto) {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() pinned?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isClosed?: boolean;
}

export class CreateReplyDto {
  @ApiProperty() @IsString() body!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isAnswer?: boolean;
}

export class VoteDto {
  @ApiProperty({ description: "1 for upvote, -1 for downvote" })
  @IsInt()
  vote!: 1 | -1;
}

export class QueryDiscussionDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() search?: string;
  @ApiProperty({ enum: DiscussionContext, required: false })
  @IsOptional()
  @IsEnum(DiscussionContext)
  context?: DiscussionContext;
  @ApiProperty({ required: false }) @IsOptional() @IsString() questionId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() topicId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() systemId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() productId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() authorId?: string;
}
