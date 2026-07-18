import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const MARKETING_DEMO_PACKS = [
  "fcps-medicine-and-allied",
  "jcat-medicine-and-allied",
] as const;
export type MarketingDemoPack = (typeof MARKETING_DEMO_PACKS)[number];

export const MARKETING_DEMO_SAMPLE_PATHS: Record<MarketingDemoPack, string> = {
  "fcps-medicine-and-allied": "/landing-page/fcps/medicine-and-allied/sample",
  "jcat-medicine-and-allied": "/landing-page/jcat/medicine-and-allied/sample",
};

export class CreateMarketingDemoLeadDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  graduatingYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @ApiProperty({ enum: MARKETING_DEMO_PACKS })
  @IsIn(MARKETING_DEMO_PACKS)
  pack!: MarketingDemoPack;
}
