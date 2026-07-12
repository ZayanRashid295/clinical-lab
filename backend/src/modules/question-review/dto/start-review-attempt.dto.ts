import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class StartReviewAttemptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reviewerName: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  reviewerEmail?: string;
}
