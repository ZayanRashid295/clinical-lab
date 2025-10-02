import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsEnum, IsOptional, Min } from "class-validator";
import { EarningsStatus } from "@prisma/client";

export class CreateEarningsDto {
  @ApiProperty({ description: "Driver ID" })
  @IsString()
  driverId: string;

  @ApiProperty({ description: "Ride ID" })
  @IsString()
  rideId: string;

  @ApiProperty({ description: "Gross earnings amount", example: 25.0 })
  @IsNumber()
  @Min(0)
  grossEarnings: number;

  @ApiProperty({ description: "Platform fee amount", example: 2.5 })
  @IsNumber()
  @Min(0)
  platformFee: number;

  @ApiProperty({ description: "Net earnings amount", example: 22.5 })
  @IsNumber()
  @Min(0)
  netEarnings: number;
}

export class UpdateEarningsDto {
  @ApiProperty({
    description: "Earnings status",
    enum: EarningsStatus,
    required: false,
  })
  @IsEnum(EarningsStatus)
  @IsOptional()
  status?: EarningsStatus;

  @ApiProperty({ description: "Payout ID (when paid out)", required: false })
  @IsString()
  @IsOptional()
  payoutId?: string;
}

export class EarningsFiltersDto {
  @ApiProperty({ description: "Driver ID filter", required: false })
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiProperty({
    description: "Earnings status filter",
    enum: EarningsStatus,
    required: false,
  })
  @IsEnum(EarningsStatus)
  @IsOptional()
  status?: EarningsStatus;

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
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ description: "End date filter (ISO string)", required: false })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiProperty({ description: "Minimum amount filter", required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiProperty({ description: "Maximum amount filter", required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @ApiProperty({
    description: "Page number for pagination",
    required: false,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: "Items per page", required: false, default: 10 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
