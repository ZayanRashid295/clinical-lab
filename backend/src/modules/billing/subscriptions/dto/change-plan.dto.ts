import { IsEnum, IsOptional, IsString } from "class-validator";
import { BillingInterval } from "@prisma/client";

export class ChangePlanDto {
  @IsString()
  planId: string;

  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;
}
