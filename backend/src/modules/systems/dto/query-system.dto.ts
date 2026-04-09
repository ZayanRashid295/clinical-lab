import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min, IsBoolean } from "class-validator";
import { Type, Transform } from "class-transformer";

export class QuerySystemDto {
  @ApiProperty({ description: "Search term", required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: "Filter by status", enum: ["ACTIVE", "INACTIVE"], required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: "Filter by product ID", required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ description: "Filter by date from", required: false })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({ description: "Filter by date to", required: false })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({ description: "Page number", default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ description: "Items per page", default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ description: "Sort field", default: "order", required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: "Sort order", enum: ["asc", "desc"], default: "asc", required: false })
  @IsOptional()
  @IsString()
  sortOrder?: string;

  @ApiProperty({ description: "Return all records without pagination", required: false })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  listAll?: boolean;
}
