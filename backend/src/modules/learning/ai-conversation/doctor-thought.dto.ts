import { IsString, IsObject, IsArray, IsOptional } from 'class-validator';

export class DoctorThoughtDto {
  @IsString()
  context: string;

  @IsArray()
  conversation: any[];

  @IsObject()
  currentCase: any;

  @IsObject()
  patientInfo: {
    age: string;
    gender: string;
    occupation: string;
  };

  @IsOptional()
  @IsString()
  instruction?: string;
}

export class DoctorThoughtResponseDto {
  @IsString()
  thought: string;
}
