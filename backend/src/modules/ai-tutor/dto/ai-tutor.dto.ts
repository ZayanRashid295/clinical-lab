import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export enum AiTutorContext {
  GENERAL = "GENERAL",
  QUESTION = "QUESTION",
  TOPIC = "TOPIC",
  SYSTEM = "SYSTEM",
  PRODUCT = "PRODUCT",
  STUDY_PLAN = "STUDY_PLAN",
}

export class CreateConversationDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string;
  @ApiProperty({ enum: AiTutorContext, required: false })
  @IsOptional()
  @IsEnum(AiTutorContext)
  context?: AiTutorContext;
  @ApiProperty({ required: false }) @IsOptional() @IsString() contextId?: string;
}

export class UpdateConversationDto extends PartialType(CreateConversationDto) {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() pinned?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() archive?: boolean;
}

export class SendMessageDto {
  @ApiProperty() @IsString() content!: string;
}
