import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

export class QueryEntitlementDefinitionDto {
  @ApiPropertyOptional({ description: "Search by key/displayName", example: "qbank" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by status", enum: ["ACTIVE", "INACTIVE"] })
  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @ApiPropertyOptional({ description: "Filter by product subtype", example: "cmguoh2b30000lj45cqti52mx" })
  @IsOptional()
  @IsString()
  productSubtypeId?: string;

  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: "Page size", default: 50 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: "Sort by field",
    default: "createdAt",
    enum: ["createdAt", "updatedAt", "key", "displayName", "isActive"],
  })
  @IsOptional()
  sortBy?: "createdAt" | "updatedAt" | "key" | "displayName" | "isActive";

  @ApiPropertyOptional({ description: "Sort order", default: "desc", enum: ["asc", "desc"] })
  @IsOptional()
  sortOrder?: "asc" | "desc";
}

