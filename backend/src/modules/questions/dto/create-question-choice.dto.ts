import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsBoolean, IsInt, Min, IsOptional } from "class-validator";

export class CreateQuestionChoiceDto {
  @ApiProperty({
    description: "Choice text",
    example: "Atherosclerotic plaque rupture",
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: "Whether this choice is correct",
    example: true,
  })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({
    description: "Order of the choice (A, B, C, D)",
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
