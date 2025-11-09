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

export class QueryUserDto {
  @ApiProperty({
    description: "Search term for email, first name, or last name",
    example: "john",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Filter by user status",
    enum: ["ACTIVE", "INACTIVE"],
    example: "ACTIVE",
    required: false,
  })
  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @ApiProperty({
    description: "Filter by user role",
    enum: ["ADMIN", "FLEET_MANAGER", "DRIVER", "CUSTOMER_SUPPORT"],
    example: "ADMIN",
    required: false,
  })
  @IsOptional()
  @IsEnum(["ADMIN", "FLEET_MANAGER", "DRIVER", "CUSTOMER_SUPPORT"])
  role?: "ADMIN" | "FLEET_MANAGER" | "DRIVER" | "CUSTOMER_SUPPORT";

  @ApiProperty({
    description: "Filter users created from this date",
    example: "2024-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: "Filter users created until this date",
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
    enum: [
      "createdAt",
      "updatedAt",
      "firstName",
      "lastName",
      "email",
      "isActive",
      "role",
    ],
    example: "createdAt",
    required: false,
  })
  @IsOptional()
  @IsEnum([
    "createdAt",
    "updatedAt",
    "firstName",
    "lastName",
    "email",
    "isActive",
    "role",
  ])
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "firstName"
    | "lastName"
    | "email"
    | "isActive"
    | "role" = "createdAt";

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
