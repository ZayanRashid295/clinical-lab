import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsArray, IsString, IsNumber, Min, Max, IsEnum } from "class-validator";
import { Transform } from "class-transformer";

export class FilteredQuestionsDto {
  @ApiProperty({
    description: "Array of system IDs to filter by",
    example: ["system1", "system2"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").filter((v) => v.trim());
    }
    return Array.isArray(value) ? value : [];
  })
  systemIds?: string[];
                                                                                                                                                                                                                                                                                                                                                                                                                                                      
  @ApiProperty({
    description: "Array of system (section) IDs to filter by",
    example: ["system1", "system2"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").filter((v) => v.trim());
    }
    return Array.isArray(value) ? value : [];
  })
  subjectIds?: string[];

  @ApiProperty({
    description: "Array of topic IDs to filter by",
    example: ["topic1", "topic2"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").filter((v) => v.trim());
    }
    return Array.isArray(value) ? value : [];
  })
  topicIds?: string[];

  @ApiProperty({
    description: "Array of subtopic IDs to filter by",
    example: ["subtopic1", "subtopic2"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").filter((v) => v.trim());
    }
    return Array.isArray(value) ? value : [];
  })
  subtopicIds?: string[];

  @ApiProperty({
    description: "Question pool to filter by (unused, incorrect, correct, omitted). Use 'marked' parameter separately to filter by marked status.",
    example: "unused",
    enum: ["unused", "incorrect", "correct", "omitted"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["unused", "incorrect", "correct", "omitted"])
  pool?: "unused" | "incorrect" | "correct" | "omitted";

  @ApiProperty({
    description: "Filter to only include questions that have been marked for review. Can be combined with pool filter.",
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  marked?: boolean;

  @ApiProperty({
    description: "Maximum number of questions to return",
    example: 100,
    minimum: 1,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}





















