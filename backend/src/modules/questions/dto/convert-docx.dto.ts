import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsArray } from "class-validator";

export class ConvertDocxDto {
  @ApiProperty({
    description: "HTML content extracted from DOCX file (with image placeholders)",
    example: "<p>Question Id: 515131</p><p>Q 04: A 30-year-old man presents with...</p><img src=\"[IMAGE_PLACEHOLDER:image_0.png\" />",
  })
  @IsString()
  @IsNotEmpty()
  htmlContent: string;

  @ApiProperty({
    description: "Array of image placeholders found in the document",
    example: ["image_0.png", "image_1.jpg"],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagePlaceholders?: string[];
}
