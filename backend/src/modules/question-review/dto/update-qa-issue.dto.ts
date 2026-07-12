import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateQaIssueDto {
  @IsOptional()
  @IsEnum([
    "NEW",
    "UNDER_REVIEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "WAITING_MEDICAL_REVIEW",
    "RESOLVED",
    "VERIFIED",
    "CLOSED",
    "REJECTED",
  ])
  status?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string | null;

  @IsOptional()
  @IsString()
  suggestedRevision?: string | null;

  @IsOptional()
  @IsString()
  currentContent?: string | null;
}
