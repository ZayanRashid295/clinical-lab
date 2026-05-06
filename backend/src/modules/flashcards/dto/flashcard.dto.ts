import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FlashcardRating } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateFlashcardDto {
  @ApiPropertyOptional({ example: "Cardiology" })
  @IsOptional()
  @IsString()
  deck?: string;

  @ApiProperty({ example: "Most common cause of MI?" })
  @IsString()
  front: string;

  @ApiProperty({ example: "Atherosclerotic plaque rupture" })
  @IsString()
  back: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ example: "easy | medium | hard" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  difficulty?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() questionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() topicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subtopicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() systemId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;
}

export class UpdateFlashcardDto extends CreateFlashcardDto {
  @ApiPropertyOptional() @IsOptional() @IsString() declare front: string;
  @ApiPropertyOptional() @IsOptional() @IsString() declare back: string;
}

export class ReviewFlashcardDto {
  @ApiProperty({ enum: FlashcardRating })
  @IsEnum(FlashcardRating)
  rating: FlashcardRating;
}

export class QueryFlashcardsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() deck?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ description: "true to only return cards due now" })
  @IsOptional()
  @IsString()
  due?: string;
}
