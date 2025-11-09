import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt, Min } from "class-validator";

export class CreateSectionDto {
  @ApiProperty({
    description: "Product ID this section belongs to",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: "Section name",
    example: "General Principles",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Section description",
    example: "Foundational principles in medical sciences",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Order of the section",
    example: 1,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: "Whether the section is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
