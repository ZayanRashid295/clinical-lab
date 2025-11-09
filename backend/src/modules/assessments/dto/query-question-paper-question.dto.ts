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

export class QueryQuestionPaperQuestionDto {
  @ApiProperty({
    description: "Filter by question paper ID",
    example: "cmguoh2b30000lj45cqti52mx",
    required: false,
  })
  @IsOptional()
  @IsString()
  questionPaperId?: string;

  @ApiProperty({
    description: "Filter by question ID",
    example: "cmguoh2b30000lj45cqti52mx",
    required: false,
  })
  @IsOptional()
  @IsString()
  questionId?: string;

  @ApiProperty({
    description: "Filter by answered status",
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  hasAnswer?: boolean;

  @ApiProperty({
    description: "Filter by correctness",
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isCorrect?: boolean;

  @ApiProperty({
    description: "Filter question paper questions created from this date",
    example: "2024-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: "Filter question paper questions created until this date",
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
    enum: ["createdAt", "updatedAt", "order", "timeSpent"],
    example: "order",
    required: false,
  })
  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "order", "timeSpent"])
  sortBy?: "createdAt" | "updatedAt" | "order" | "timeSpent" = "order";

  @ApiProperty({
    description: "Sort order",
    enum: ["asc", "desc"],
    example: "asc",
    required: false,
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "asc";
}

