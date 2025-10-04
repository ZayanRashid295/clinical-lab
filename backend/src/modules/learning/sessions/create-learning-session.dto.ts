import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsNumber,
} from "class-validator";

export class CreateLearningSessionDto {
  @IsString()
  caseId: string;

  @IsOptional()
  @IsObject()
  conversation?: any[];

  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  questionsAsked?: number;

  @IsOptional()
  @IsNumber()
  keyFindings?: number;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  soapNote?: string;
}
