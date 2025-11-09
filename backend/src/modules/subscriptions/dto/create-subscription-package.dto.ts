import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsDecimal,
} from "class-validator";

export class CreateSubscriptionPackageDto {
  @ApiProperty({
    description: "Product subtype ID",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  productSubtypeId: string;

  @ApiProperty({
    description: "Package name",
    example: "Premium",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Package description",
    example: "180-day access with all features included",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Package price",
    example: 249.99,
  })
  @IsDecimal()
  price: number;

  @ApiProperty({
    description: "Currency",
    example: "USD",
    default: "USD",
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: "Validity period in days",
    example: 180,
  })
  @IsInt()
  @Min(1)
  validityDays: number;

  @ApiProperty({
    description: "Whether the package is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
