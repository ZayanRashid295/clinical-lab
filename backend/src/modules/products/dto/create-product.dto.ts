import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateProductDto {
  @ApiProperty({
    description: "Product name",
    example: "USMLE Step 1",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Product description",
    example:
      "United States Medical Licensing Examination Step 1 - Comprehensive question bank and learning materials",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Whether the product is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
