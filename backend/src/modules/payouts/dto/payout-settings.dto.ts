import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from "class-validator";
import { PayoutMethod, PayoutFrequency } from "@prisma/client";

export class CreatePayoutSettingsDto {
  @ApiProperty({ description: "Driver ID" })
  @IsString()
  driverId: string;

  @ApiProperty({
    description: "Default payout method",
    enum: PayoutMethod,
    example: PayoutMethod.BANK_TRANSFER,
  })
  @IsEnum(PayoutMethod)
  defaultPayoutMethod: PayoutMethod;

  @ApiProperty({ description: "Enable automatic payouts", default: false })
  @IsBoolean()
  @IsOptional()
  autoPayout?: boolean = false;

  @ApiProperty({ description: "Minimum payout amount", example: 50.0 })
  @IsNumber()
  @Min(0.01)
  minimumPayoutAmount: number;

  @ApiProperty({
    description: "Payout frequency",
    enum: PayoutFrequency,
    default: PayoutFrequency.WEEKLY,
  })
  @IsEnum(PayoutFrequency)
  @IsOptional()
  payoutFrequency?: PayoutFrequency = PayoutFrequency.WEEKLY;

  @ApiProperty({ description: "Tax settings (JSON)", required: false })
  @IsOptional()
  taxSettings?: any;

  @ApiProperty({
    description: "Notification preferences (JSON)",
    required: false,
  })
  @IsOptional()
  notifications?: any;
}

export class UpdatePayoutSettingsDto {
  @ApiProperty({
    description: "Default payout method",
    enum: PayoutMethod,
    required: false,
  })
  @IsEnum(PayoutMethod)
  @IsOptional()
  defaultPayoutMethod?: PayoutMethod;

  @ApiProperty({ description: "Enable automatic payouts", required: false })
  @IsBoolean()
  @IsOptional()
  autoPayout?: boolean;

  @ApiProperty({ description: "Minimum payout amount", required: false })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  minimumPayoutAmount?: number;

  @ApiProperty({
    description: "Payout frequency",
    enum: PayoutFrequency,
    required: false,
  })
  @IsEnum(PayoutFrequency)
  @IsOptional()
  payoutFrequency?: PayoutFrequency;

  @ApiProperty({ description: "Tax settings (JSON)", required: false })
  @IsOptional()
  taxSettings?: any;

  @ApiProperty({
    description: "Notification preferences (JSON)",
    required: false,
  })
  @IsOptional()
  notifications?: any;
}
