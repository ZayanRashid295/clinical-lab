import { IsEnum, IsOptional, IsString, ValidateIf } from "class-validator";
import { BillingInterval } from "@prisma/client";

export class SubscribeDto {
  @IsString()
  planId: string;

  @ValidateIf((o) => o.paymentMethodId !== undefined && o.paymentMethodId !== null)
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  /** @deprecated use promotionCode */
  @IsOptional()
  @IsString()
  couponCode?: string;
}
