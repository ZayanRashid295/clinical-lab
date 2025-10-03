import { IsString, IsObject, IsArray } from 'class-validator';

export class AskDoctorDto {
  @IsString()
  question: string;

  @IsObject()
  context: {
    caseId: string;
    specialty: string;
    difficulty: string;
    chiefComplaint: string;
    patientAge: string;
    patientGender: string;
    patientOccupation: string;
    symptoms: string[];
    medicalHistory: string[];
    vitalSigns: any;
    physicalExam: any;
    labResults: any;
    disease: string;
    patientProfile: any;
    conversationHistory: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;
  };

  @IsArray()
  conversation: any[];
}

export class AskDoctorResponseDto {
  @IsString()
  response: string;
}
