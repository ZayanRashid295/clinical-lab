import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreatePackageFeatureDto {
  @ApiProperty({
    description: "Feature name",
    example: "Qbank Access",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Feature description",
    example: "Access to Qbank feature",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Whether the feature is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
