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

export class QuerySubscriptionDto {
  @ApiProperty({
    description: "Search term for user email or name",
    example: "john",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Filter by subscription status",
    enum: ["ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED", "PENDING"],
    example: "ACTIVE",
    required: false,
  })
  @IsOptional()
  @IsEnum(["ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED", "PENDING"])
  status?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED" | "PENDING";

  @ApiProperty({
    description: "Filter by user ID",
    example: "cmguoh2b30000lj45cqti52mx",
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: "Filter by subscription package ID",
    example: "cmguoh2b30000lj45cqti52mx",
    required: false,
  })
  @IsOptional()
  @IsString()
  subscriptionPackageId?: string;

  @ApiProperty({
    description: "Filter subscriptions created from this date",
    example: "2024-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: "Filter subscriptions created until this date",
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
    enum: ["createdAt", "updatedAt", "status", "startDate", "endDate"],
    example: "createdAt",
    required: false,
  })
  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "status", "startDate", "endDate"])
  sortBy?: "createdAt" | "updatedAt" | "status" | "startDate" | "endDate" =
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

