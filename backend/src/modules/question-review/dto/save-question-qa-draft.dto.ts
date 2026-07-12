import { IsObject, IsOptional, IsString } from "class-validator";

export class SaveQuestionQaDraftDto {
  @IsObject()
  draftSnapshot!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  summary?: string;
}
