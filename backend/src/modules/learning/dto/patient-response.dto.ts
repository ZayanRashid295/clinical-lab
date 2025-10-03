import {
  IsString,
  IsObject,
  IsArray,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class PatientResponseDto {
  @IsString()
  question: string;

  @IsObject()
  context: {
    caseId: string;
    disease: string;
    symptoms: string[];
    patientProfile: {
      name: string;
      age: number;
      gender: string;
      occupation: string;
    };
    conversationHistory: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;
  };

  @IsOptional()
  @IsString()
  instruction?: string;
}

export class PatientResponseResponseDto {
  @IsString()
  response: string;

  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;
}
