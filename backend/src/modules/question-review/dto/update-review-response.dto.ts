import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export enum ReviewDifficultyRatingDto {
  TOO_EASY = "TOO_EASY",
  APPROPRIATE = "APPROPRIATE",
  TOO_DIFFICULT = "TOO_DIFFICULT",
}

export enum ReviewApprovalStatusDto {
  APPROVE = "APPROVE",
  NEEDS_REVISION = "NEEDS_REVISION",
  REJECT = "REJECT",
}

export class ReviewProgressDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  stemReviewed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  explanationReviewed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  imagesReviewed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  metadataReviewed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  overallReviewed?: boolean;
}

export class UpdateReviewResponseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userAnswer?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isCorrect?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  qualityComment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpent?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  questionQualityRating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  explanationQualityRating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  imageQualityRating?: number;

  @ApiProperty({ enum: ReviewDifficultyRatingDto, required: false })
  @IsOptional()
  @IsEnum(ReviewDifficultyRatingDto)
  difficultyRating?: ReviewDifficultyRatingDto;

  @ApiProperty({ enum: ReviewApprovalStatusDto, required: false })
  @IsOptional()
  @IsEnum(ReviewApprovalStatusDto)
  approvalStatus?: ReviewApprovalStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  overallComment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  reviewProgress?: ReviewProgressDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  enterReviewMode?: boolean;
}
