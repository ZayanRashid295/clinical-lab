import { ApiProperty, PartialType } from "@nestjs/swagger";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateStudyGroupDto {
  @ApiProperty() @IsString() @MaxLength(80) name!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() category?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() icon?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isPrivate?: boolean;
}

export class UpdateStudyGroupDto extends PartialType(CreateStudyGroupDto) {}

export class JoinByCodeDto {
  @ApiProperty() @IsString() inviteCode!: string;
}

export class CreateGroupPostDto {
  @ApiProperty() @IsString() body!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() attachmentUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() pinned?: boolean;
}
