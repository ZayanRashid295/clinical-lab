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

export class QuerySectionDto {
  @ApiProperty({
    description: "Search term for section name or description",
    example: "General Principles",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Filter by section status",
    enum: ["ACTIVE", "INACTIVE"],
    example: "ACTIVE",
    required: false,
  })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @ApiProperty({
    description: "Filter by product ID",
    example: "cmguoh2b30000lj45cqti52mx",
    required: false,
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({
    description: "Filter sections created from this date",
    example: "2024-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: "Filter sections created until this date",
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
    enum: ["createdAt", "updatedAt", "name", "order", "isActive"],
    example: "order",
    required: false,
  })
  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "name", "order", "isActive"])
  sortBy?: "createdAt" | "updatedAt" | "name" | "order" | "isActive" = "order";

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

