import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEnum, IsOptional, IsDateString } from "class-validator";
import { PayoutStatus, PayoutMethod } from "@prisma/client";

export class UpdatePayoutDto {
  @ApiProperty({
    description: "Payout status",
    enum: PayoutStatus,
    required: false,
  })
  @IsEnum(PayoutStatus)
  @IsOptional()
  status?: PayoutStatus;

  @ApiProperty({
    description: "Payout method",
    enum: PayoutMethod,
    required: false,
  })
  @IsEnum(PayoutMethod)
  @IsOptional()
  payoutMethod?: PayoutMethod;

  @ApiProperty({
    description: "Transaction ID from payment provider",
    required: false,
  })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiProperty({ description: "Payout description", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Processed date", required: false })
  @IsDateString()
  @IsOptional()
  processedAt?: string;
}
