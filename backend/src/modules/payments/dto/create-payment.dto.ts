import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

// These string unions must stay in sync with the Prisma enums
export type PaymentMethodType = "CARD" | "WALLET" | "CASH" | "BANK_TRANSFER";

export type PaymentGateway = "STRIPE" | "PAYPAL" | "RAZORPAY" | "SQUARE";

export class CreatePaymentDto {
  @ApiProperty({
    description: "User ID who is making the payment",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description:
      "Optional subscription package ID for which this payment is being made",
    required: false,
  })
  @IsString()
  @IsOptional()
  subscriptionPackageId?: string;

  @ApiProperty({
    description:
      "Amount to be charged. If subscriptionPackageId is provided, this can be omitted and will be taken from the package.",
    example: 49.99,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: "Currency code (ISO 4217). Defaults to USD.",
    example: "USD",
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: "Payment method type. Defaults to CARD.",
    enum: ["CARD", "WALLET", "CASH", "BANK_TRANSFER"],
    required: false,
  })
  @IsEnum(["CARD", "WALLET", "CASH", "BANK_TRANSFER"])
  @IsOptional()
  method?: PaymentMethodType;

  @ApiProperty({
    description: "Payment gateway. Defaults to STRIPE for v1 implementation.",
    enum: ["STRIPE", "PAYPAL", "RAZORPAY", "SQUARE"],
    required: false,
  })
  @IsEnum(["STRIPE", "PAYPAL", "RAZORPAY", "SQUARE"])
  @IsOptional()
  gateway?: PaymentGateway;

  @ApiProperty({
    description: "Optional description for the payment",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}


































