import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt, Min } from "class-validator";

export class CreateChapterDto {
  @ApiProperty({
    description: "Section ID this chapter belongs to",
    example: "cmguoh2db000flj45izj915ih",
  })
  @IsString()
  sectionId: string;

  @ApiProperty({
    description: "Chapter name",
    example: "Biochemistry",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Chapter description",
    example: "Biochemical processes and molecular biology",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Order of the chapter",
    example: 1,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: "Whether the chapter is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
