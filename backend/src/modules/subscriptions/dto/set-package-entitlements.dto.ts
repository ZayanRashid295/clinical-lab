import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class PackageEntitlementInputDto {
  @ApiProperty({ description: "Entitlement definition id" })
  @IsString()
  entitlementDefinitionId: string;

  @ApiProperty({
    description: "Entitlement value payload (JSON)",
    required: false,
    example: { enabled: true, limit: 1000 },
  })
  @IsOptional()
  valueJson?: any;
}

export class SetPackageEntitlementsDto {
  @ApiProperty({ description: "Entitlements to set (replaces existing)", type: [PackageEntitlementInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageEntitlementInputDto)
  entitlements: PackageEntitlementInputDto[];
}

