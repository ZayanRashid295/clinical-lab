import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";
import { PayoutStatus, PayoutMethod } from "@prisma/client";

export class PayoutFiltersDto {
  @ApiProperty({ description: "Driver ID filter", required: false })
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiProperty({
    description: "Payout status filter",
    enum: PayoutStatus,
    required: false,
  })
  @IsEnum(PayoutStatus)
  @IsOptional()
  status?: PayoutStatus;

  @ApiProperty({
    description: "Payout method filter",
    enum: PayoutMethod,
    required: false,
  })
  @IsEnum(PayoutMethod)
  @IsOptional()
  payoutMethod?: PayoutMethod;

  @ApiProperty({
    description: "Search term for driver name or email",
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: "Start date filter (ISO string)",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ description: "End date filter (ISO string)", required: false })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiProperty({ description: "Minimum amount filter", required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  minAmount?: number;

  @ApiProperty({ description: "Maximum amount filter", required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  maxAmount?: number;

  @ApiProperty({
    description: "Page number for pagination",
    required: false,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({ description: "Items per page", required: false, default: 10 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @ApiProperty({
    description: "Sort field",
    required: false,
    default: "createdAt",
  })
  @IsString()
  @IsOptional()
  sortBy?: string = "createdAt";

  @ApiProperty({ description: "Sort order", required: false, default: "desc" })
  @IsString()
  @IsOptional()
  sortOrder?: "asc" | "desc" = "desc";
}
