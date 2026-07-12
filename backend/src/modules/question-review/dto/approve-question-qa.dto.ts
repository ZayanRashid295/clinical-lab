import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export class ApproveQuestionQaDto {
  @IsEnum(["DRAFT", "NEEDS_REVISION", "APPROVED", "REJECTED"])
  productionStatus!: string;

  @IsOptional()
  @IsObject()
  ratings?: Record<string, number>;

  @IsOptional()
  @IsString()
  decisionNote?: string;
}
