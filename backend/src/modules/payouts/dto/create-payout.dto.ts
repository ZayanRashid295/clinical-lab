import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from "class-validator";
import { PayoutMethod } from "@prisma/client";

export class CreatePayoutDto {
  @ApiProperty({ description: "Driver ID" })
  @IsString()
  driverId: string;

  @ApiProperty({ description: "Payout amount", example: 150.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: "Currency code", example: "USD", default: "USD" })
  @IsString()
  @IsOptional()
  currency?: string = "USD";

  @ApiProperty({
    description: "Payout method",
    enum: PayoutMethod,
    example: PayoutMethod.BANK_TRANSFER,
  })
  @IsEnum(PayoutMethod)
  payoutMethod: PayoutMethod;

  @ApiProperty({ description: "Payout description", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "Scheduled date for payout",
    example: "2024-01-15T10:00:00Z",
  })
  @IsDateString()
  scheduledAt: string;
}
