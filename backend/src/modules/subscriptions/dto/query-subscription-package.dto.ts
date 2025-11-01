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

export class QuerySubscriptionPackageDto {
  @ApiProperty({
    description: "Search term for package name or description",
    example: "premium",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Filter by package status",
    enum: ["ACTIVE", "INACTIVE"],
    example: "ACTIVE",
    required: false,
  })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @ApiProperty({
    description: "Filter by product subtype ID",
    example: "cmguoh2b30000lj45cqti52mx",
    required: false,
  })
  @IsOptional()
  @IsString()
  productSubtypeId?: string;

  @ApiProperty({
    description: "Filter packages created from this date",
    example: "2024-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: "Filter packages created until this date",
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
    enum: ["createdAt", "updatedAt", "name", "price", "validityDays", "isActive"],
    example: "createdAt",
    required: false,
  })
  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "name", "price", "validityDays", "isActive"])
  sortBy?: "createdAt" | "updatedAt" | "name" | "price" | "validityDays" | "isActive" =
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

