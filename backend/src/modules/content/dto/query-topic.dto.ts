import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsBoolean, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

export class QueryTopicDto {
  @ApiProperty({ description: "Search term", required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: "Filter by status", enum: ["ACTIVE", "INACTIVE"], required: false })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @ApiProperty({ description: "Filter by system ID", required: false })
  @IsOptional()
  @IsString()
  systemId?: string;

  @ApiProperty({ description: "Filter from date", required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ description: "Filter to date", required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ description: "Page number", default: 1, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: "Items per page", default: 10, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ description: "Sort field", default: "order", required: false })
  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "name", "order", "isActive"])
  sortBy?: "createdAt" | "updatedAt" | "name" | "order" | "isActive" = "order";

  @ApiProperty({ description: "Sort order", enum: ["asc", "desc"], default: "asc", required: false })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "asc";

  @ApiProperty({ description: "Return all records without pagination", required: false })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  listAll?: boolean;
}
