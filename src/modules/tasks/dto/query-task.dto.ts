// src/modules/tasks/dto/query-task.dto.ts
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTaskDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Tìm kiếm bot theo tên gợi nhớ' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetSiteCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taskType?: string;

  @ApiPropertyOptional({ enum: ['SUCCESS', 'FAILED', 'UNKNOWN'] })
  @IsOptional()
  @IsEnum(['SUCCESS', 'FAILED', 'UNKNOWN'])
  lastExecutionStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
