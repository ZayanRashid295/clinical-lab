import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";

export class QueryQuestionDto {
  @ApiProperty({
    description: "Search term for question text or explanation",
    example: "myocardial infarction",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Filter by question status",
    enum: ["ACTIVE", "INACTIVE"],
    example: "ACTIVE",
    required: false,
  })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @ApiProperty({
    description: "Filter by difficulty level",
    enum: ["easy", "medium", "hard"],
    example: "medium",
    required: false,
  })
  @IsOptional()
  @IsEnum(["easy", "medium", "hard"])
  difficulty?: "easy" | "medium" | "hard";

  @ApiProperty({
    description: "Filter by topic ID",
    example: "cmguoh2dg000hlj45zxmb3rsl",
    required: false,
  })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiProperty({
    description: "Filter by product tag ID",
    example: "cmguoh2bu0001lj45dttw7000",
    required: false,
  })
  @IsOptional()
  @IsString()
  productTagId?: string;

  @ApiProperty({
    description: "Filter questions created from this date",
    example: "2024-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: "Filter questions created until this date",
    example: "2024-12-31",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    description: "Page number for pagination",
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: "Number of items per page",
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: "Field to sort by",
    enum: ["createdAt", "updatedAt", "question", "difficulty", "points", "isActive"],
    example: "createdAt",
    required: false,
  })
  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "question", "difficulty", "points", "isActive"])
  sortBy?: "createdAt" | "updatedAt" | "question" | "difficulty" | "points" | "isActive" = "createdAt";

  @ApiProperty({
    description: "Sort order",
    enum: ["asc", "desc"],
    example: "desc",
    required: false,
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}

