import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BookmarkType } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateBookmarkDto {
  @ApiProperty({ enum: BookmarkType })
  @IsEnum(BookmarkType)
  resourceType: BookmarkType;

  @ApiProperty({ example: "ckxyz..." })
  @IsString()
  resourceId: string;

  @ApiPropertyOptional({ example: "Tricky differential dx" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class QueryBookmarkDto {
  @ApiPropertyOptional({ enum: BookmarkType })
  @IsOptional()
  @IsEnum(BookmarkType)
  resourceType?: BookmarkType;
}
