import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt } from "class-validator";

export class CreateSystemDto {
  @ApiProperty({ description: "Parent product ID" })
  @IsString()
  productId: string;

  @ApiProperty({ description: "System name", example: "Cardiovascular" })
  @IsString()
  name: string;

  @ApiProperty({ description: "System description", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Display order", required: false })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ description: "Whether active", default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
