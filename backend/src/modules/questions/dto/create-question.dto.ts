import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsIn,
  IsArray,
  IsObject,
} from "class-validator";

export class CreateQuestionDto {
  @ApiProperty({
    description: "Subtopic ID this question belongs to",
    example: "cmguoh2dg000hlj45zxmb3rsl",
  })
  @IsString()
  subtopicId: string;

  @ApiProperty({
    description: "Topic ID (optional/legacy)",
    required: false,
  })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiProperty({
    description: "System ID (optional, for full hierarchy payloads)",
    required: false,
  })
  @IsOptional()
  @IsString()
  systemId?: string;

  @ApiProperty({
    description: "Category ID (optional, persisted on question)",
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    description: "Product ID (optional, persisted on question)",
    required: false,
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({
    description: "Product tag ID (optional)",
    example: "cmguoh2bu0001lj45dttw7000",
    required: false,
  })
  @IsOptional()
  @IsString()
  productTagId?: string;

  @ApiProperty({
    description: "Question text",
    example: "Which of the following is the most common cause of acute myocardial infarction?",
  })
  @IsString()
  question: string;

  @ApiProperty({
    description: "Question title",
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: "Explanation for the correct answer",
    example:
      "Atherosclerotic plaque rupture is the most common cause of acute MI...",
    required: false,
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({
    description: "Question difficulty level",
    example: "medium",
    enum: ["easy", "medium", "hard"],
    default: "medium",
    required: false,
  })
  @IsOptional()
  @IsIn(["easy", "medium", "hard"])
  difficulty?: string;

  @ApiProperty({
    description: "Points for correct answer",
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiProperty({
    description: "Whether the question is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // New optional metadata fields for question-generator
  @ApiProperty({
    description: "Subject for categorization (e.g., Pathology) - display name from Product",
    required: false,
    example: "Pathology",
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: "System for categorization (e.g., Endocrine) - display name from Chapter",
    required: false,
    example: "Endocrine",
  })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiProperty({
    description: "Chapter ID for Subject dropdown",
    required: false,
    example: "cmguoh2dg000hlj45zxmb3rsl",
  })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiProperty({
    description: "Tags for the question",
    required: false,
    example: ["CAH", "Enzyme deficiency", "Adrenal glands"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  // Rich explanation data (optional)
  @ApiProperty({
    description:
      "Rich explanation blocks (text/table/images). Each item should include type, order, and data JSON.",
    required: false,
    type: Array,
  })
  @IsOptional()
  @IsArray()
  explanationBlocks?: Array<{
    type: "TEXT" | "TABLE" | "IMAGES";
    order?: number;
    data: any;
  }>;

  @ApiProperty({
    description:
      "Per-answer explanations keyed by choice label (A-E). Each value is an array of blocks.",
    required: false,
    type: Object,
  })
  @IsOptional()
  @IsObject()
  perAnswerExplanations?: Record<
    string,
    Array<{
      type: "TEXT" | "TABLE" | "IMAGES";
      order?: number;
      data: any;
    }>
  >;

  // Rich question stem blocks (supports text, images, and tables)
  @ApiProperty({
    description:
      "Rich question stem blocks (text/images/tables). Each item should include type, order, and data JSON.",
    required: false,
    type: Array,
  })
  @IsOptional()
  @IsArray()
  questionStemBlocks?: Array<{
    type: "TEXT" | "IMAGES" | "TABLE";
    order?: number;
    data: any;
  }>;
}
