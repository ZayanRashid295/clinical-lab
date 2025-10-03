import { IsString, IsOptional, IsBoolean, IsArray, IsObject, IsEnum } from 'class-validator';

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export class CreateLearningCaseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @IsString()
  disease: string;

  @IsString()
  diseaseName: string;

  @IsString()
  specialty: string;

  @IsOptional()
  @IsBoolean()
  isRare?: boolean;

  @IsArray()
  symptoms: string[];

  @IsArray()
  history: string[];

  @IsObject()
  labs: Record<string, any>;

  @IsArray()
  expectedQuestions: string[];

  @IsObject()
  patientProfile: {
    name: string;
    age: number;
    gender: string;
    occupation: string;
  };

  @IsOptional()
  @IsObject()
  vitalSigns?: {
    bloodPressure: string;
    heartRate: number;
    temperature: string;
    respiratoryRate: number;
    oxygenSaturation?: number;
  };

  @IsOptional()
  @IsObject()
  physicalExam?: {
    general: string;
    cardiovascular: string;
    respiratory: string;
    abdominal: string;
    neurological: string;
  };
}
