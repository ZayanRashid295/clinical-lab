import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class PlanFeatureDto {
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  limit?: number;
}

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yearlyPrice: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  trialEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  trialDurationDays?: number;

  @IsOptional()
  @IsArray()
  features?: PlanFeatureDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxUsers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  storageLimitMb?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  apiLimitMonthly?: number;
}
