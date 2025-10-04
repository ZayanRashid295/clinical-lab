import { IsString, IsObject, IsArray, IsOptional } from 'class-validator';

export class DoctorQuestionDto {
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

  @IsArray()
  conversation: any[];
}

export class DoctorQuestionResponseDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  explanation?: string;
}
