import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { BillingInterval, BillingPromotionType } from "@prisma/client";

export class CreatePromotionDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BillingPromotionType)
  type?: BillingPromotionType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  percentOff?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountOff?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationCycles?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxRedemptions?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxRedemptionsPerUser?: number;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsArray()
  applicablePlanIds?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(BillingInterval, { each: true })
  applicableIntervals?: BillingInterval[];

  @IsOptional()
  @IsBoolean()
  firstTimeOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  existingCustomersOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
