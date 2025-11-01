import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsArray } from "class-validator";

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

  @ApiProperty({
    description: "Array of product tag IDs to associate with this product",
    example: ["cmguoh2b30000lj45cqti52mx", "cmguoh2b30000lj45cqti52my"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
