import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export enum ReviewAnnotationTargetDto {
  STEM = "STEM",
  OPTION = "OPTION",
  EXPLANATION = "EXPLANATION",
  KEYWORD = "KEYWORD",
  TABLE = "TABLE",
  TABLE_CELL = "TABLE_CELL",
  TABLE_ROW = "TABLE_ROW",
  IMAGE = "IMAGE",
  METADATA = "METADATA",
  OVERALL = "OVERALL",
}

export enum ReviewAnnotationSeverityDto {
  MINOR = "MINOR",
  MAJOR = "MAJOR",
  CRITICAL = "CRITICAL",
}

export class CreateReviewAnnotationDto {
  @ApiProperty({ enum: ReviewAnnotationTargetDto })
  @IsEnum(ReviewAnnotationTargetDto)
  targetType!: ReviewAnnotationTargetDto;

  @ApiProperty()
  @IsString()
  targetKey!: string;

  @ApiProperty()
  @IsString()
  section!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  selectedText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  anchorMeta?: Record<string, unknown>;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: ReviewAnnotationSeverityDto, required: false })
  @IsOptional()
  @IsEnum(ReviewAnnotationSeverityDto)
  severity?: ReviewAnnotationSeverityDto;
}
