import { IsEnum, IsOptional, IsString } from "class-validator";
import { BillingInterval } from "@prisma/client";

export class PromotionQuoteDto {
  @IsString()
  planId: string;

  @IsEnum(BillingInterval)
  billingInterval: BillingInterval;

  @IsOptional()
  @IsString()
  promotionCode?: string;
}
