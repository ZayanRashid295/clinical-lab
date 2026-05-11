import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class PricingQuoteEntitlementDto {
  @ApiProperty({ description: "Entitlement key", example: "qbank.access" })
  @IsString()
  key: string;

  @ApiProperty({ description: "Entitlement value JSON", required: false, example: { enabled: true } })
  @IsOptional()
  valueJson?: any;
}

export class PricingQuoteRequestDto {
  @ApiProperty({ description: "Validity in days", example: 90 })
  @IsInt()
  @Min(1)
  validityDays: number;

  @ApiProperty({ description: "Currency", example: "USD", required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: "Selected entitlements", type: [PricingQuoteEntitlementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingQuoteEntitlementDto)
  entitlements: PricingQuoteEntitlementDto[];
}

