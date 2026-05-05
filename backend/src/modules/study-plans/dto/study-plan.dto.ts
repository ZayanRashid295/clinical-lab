import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StudyTaskStatus, StudyTaskType } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateStudyPlanDto {
  @ApiProperty({ example: "USMLE 60-day plan" })
  @IsString()
  name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() goal?: string;

  @ApiProperty({ example: "2026-04-25" })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: "2026-06-25" })
  @IsDateString()
  endDate: string;
}

export class UpdateStudyPlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() goal?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
}

export class CreateStudyTaskDto {
  @ApiProperty({ example: "Cardiology — Chapter 3" })
  @IsString()
  title: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ enum: StudyTaskType, default: StudyTaskType.GENERAL })
  @IsOptional()
  @IsEnum(StudyTaskType)
  type?: StudyTaskType;

  @ApiProperty({ example: "2026-04-25T09:00:00Z" })
  @IsDateString()
  scheduledFor: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() systemId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() topicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subtopicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() questionPaperId?: string;
}

export class UpdateStudyTaskDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: StudyTaskType })
  @IsOptional()
  @IsEnum(StudyTaskType)
  type?: StudyTaskType;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledFor?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() durationMinutes?: number;
  @ApiPropertyOptional({ enum: StudyTaskStatus })
  @IsOptional()
  @IsEnum(StudyTaskStatus)
  status?: StudyTaskStatus;
}

export class QueryStudyTasksDto {
  @ApiPropertyOptional({ enum: StudyTaskStatus })
  @IsOptional()
  @IsEnum(StudyTaskStatus)
  status?: StudyTaskStatus;

  @ApiPropertyOptional({ description: "ISO date — e.g. 2026-04-25" })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: "Range start (ISO)" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: "Range end (ISO)" })
  @IsOptional()
  @IsDateString()
  to?: string;
}
