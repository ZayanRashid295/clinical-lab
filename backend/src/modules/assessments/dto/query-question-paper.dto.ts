import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";

export class QueryQuestionPaperDto {
  @ApiProperty({
    description: "Search term for question paper name or description",
    example: "Practice Test",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Filter by question paper status",
    enum: ["ACTIVE", "INACTIVE"],
    example: "ACTIVE",
    required: false,
  })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @ApiProperty({
    description: "Filter by question paper type",
    enum: ["practice", "mock", "assessment"],
    example: "practice",
    required: false,
  })
  @IsOptional()
  @IsEnum(["practice", "mock", "assessment"])
  type?: "practice" | "mock" | "assessment";

  @ApiProperty({
    description: "Filter by user ID",
    example: "cmguoh2b30000lj45cqti52mx",
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: "Filter question papers created from this date",
    example: "2024-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: "Filter question papers created until this date",
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
    enum: ["createdAt", "updatedAt", "name", "type", "isActive"],
    example: "createdAt",
    required: false,
  })
  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "name", "type", "isActive"])
  sortBy?: "createdAt" | "updatedAt" | "name" | "type" | "isActive" =
    "createdAt";

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
