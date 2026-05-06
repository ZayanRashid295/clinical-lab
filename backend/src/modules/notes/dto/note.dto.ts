import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateNoteDto {
  @ApiProperty({ example: "Aortic Dissection — pearls" })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: "Sudden tearing chest pain..." })
  @IsString()
  body: string;

  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pinned?: boolean;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() questionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() topicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subtopicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() systemId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;
}

export class UpdateNoteDto extends CreateNoteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() declare title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() declare body: string;
}

export class QueryNotesDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() systemId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() topicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subtopicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() questionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pinned?: string;
}
