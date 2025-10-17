import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class StartAssessmentDto {
  @ApiProperty({
    description: "User ID starting the assessment",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: "Additional notes or context for the assessment",
    example: "Starting practice test for biochemistry review",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
