import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateQaIssueCommentDto {
  @IsString()
  body!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
