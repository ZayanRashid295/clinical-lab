import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import {
  MedprepConversationStatus,
  MedprepMessageRole,
  MedprepMode,
} from "@prisma/client";

export class StartMedprepSessionDto {
  @ApiProperty({ enum: MedprepMode })
  @IsEnum(MedprepMode)
  mode!: MedprepMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseInstanceId?: string;

  @ApiPropertyOptional({ description: "Case title for dashboard cards" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGeneratedCase?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  caseSnapshot?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateMedprepSessionDto {
  @ApiPropertyOptional({ enum: MedprepConversationStatus })
  @IsOptional()
  @IsEnum(MedprepConversationStatus)
  status?: MedprepConversationStatus;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({ description: "Case title for dashboard / resume cards" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}

export class CreateMedprepMessageDto {
  @ApiProperty({ enum: MedprepMessageRole })
  @IsEnum(MedprepMessageRole)
  role!: MedprepMessageRole;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isIntervention?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  relevanceScore?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateMedprepMessageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isIntervention?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpsertMedprepSoapDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiSubjective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiObjective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiAssessment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class SubmitMedprepSoapDto extends PartialType(UpsertMedprepSoapDto) {}

export class SubmitMedprepDiagnosisDto {
  @ApiProperty()
  @IsString()
  submittedDiagnosis!: string;

  @ApiProperty()
  @IsString()
  actualDiagnosis!: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRareCase?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseDifficulty?: string;
}

export class UpsertMedprepHintSessionDto {
  @ApiProperty()
  @IsString()
  sessionKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalHintsUsed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  highImportanceHints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mediumImportanceHints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lowImportanceHints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gradePenalty?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  hintTimestamps?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  hintsByCategory?: Record<string, unknown>;
}
