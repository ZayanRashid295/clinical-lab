import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt } from "class-validator";

export class CreateProductDto {
  @ApiProperty({ description: "Product name", example: "USMLE Step 1" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Product description", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Whether active", default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: "Category ID this product belongs to", required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: "Display order", required: false })
  @IsOptional()
  @IsInt()
  order?: number;
}
