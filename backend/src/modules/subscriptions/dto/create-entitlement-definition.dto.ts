import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export enum EntitlementType {
  BOOLEAN = "BOOLEAN",
  SET = "SET",
  NUMBER_LIMIT = "NUMBER_LIMIT",
  JSON_CONSTRAINTS = "JSON_CONSTRAINTS",
}

export class CreateEntitlementDefinitionDto {
  @ApiProperty({ description: "Stable entitlement key", example: "qbank.access" })
  @IsString()
  key: string;

  @ApiProperty({ description: "Display name", example: "Qbank Access" })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: "Optional description",
    example: "Access to the question bank module",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Optional product subtype scope",
    example: "cmguoh2b30000lj45cqti52mx",
    required: false,
  })
  @IsOptional()
  @IsString()
  productSubtypeId?: string;

  @ApiProperty({
    description: "Entitlement type",
    enum: EntitlementType,
    default: EntitlementType.BOOLEAN,
    required: false,
  })
  @IsOptional()
  @IsEnum(EntitlementType)
  type?: EntitlementType;

  @ApiProperty({
    description: "Whether the entitlement definition is active",
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

