import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt, Min } from "class-validator";

export class CreateTopicDto {
  @ApiProperty({
    description: "Chapter ID this topic belongs to",
    example: "cmguoh2dg000hlj45zxmb3rsl",
  })
  @IsString()
  chapterId: string;

  @ApiProperty({
    description: "Topic name",
    example: "Amino acids, proteins, and enzymes",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Topic description",
    example: "Fundamental concepts of protein structure and function",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Order of the topic",
    example: 1,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: "Whether the topic is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
