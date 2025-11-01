import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateProductSubtypeDto {
  @ApiProperty({
    description: "Product ID",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: "Subtype name",
    example: "Qbank",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Subtype description",
    example: "Question bank access",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Whether the subtype is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

