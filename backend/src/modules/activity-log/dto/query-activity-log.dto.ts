import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";
import {
  ACTIVITY_COMPONENTS,
  ACTIVITY_EVENTS,
} from "../activity-log.constants";

const COMPONENT_VALUES = Object.values(ACTIVITY_COMPONENTS);
const EVENT_VALUES = Object.values(ACTIVITY_EVENTS);

export class QueryActivityLogDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: "Filter by actor user ID" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, description: "Filter by affected user ID" })
  @IsOptional()
  @IsString()
  affectedUserId?: string;

  @ApiProperty({ required: false, enum: COMPONENT_VALUES })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiProperty({ required: false, enum: EVENT_VALUES })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 25, maximum: 500 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 25;

  @ApiProperty({ required: false, enum: ["createdAt", "component", "eventName"] })
  @IsOptional()
  @IsEnum(["createdAt", "component", "eventName"])
  sortBy?: "createdAt" | "component" | "eventName" = "createdAt";

  @ApiProperty({ required: false, enum: ["asc", "desc"] })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
