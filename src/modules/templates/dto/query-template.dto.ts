// src/modules/templates/dto/query-template.dto.ts
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTemplateDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên hoặc slug kịch bản' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'MOMO_PORTAL_CHECK' })
  @IsOptional()
  @IsString()
  taskType?: string;

  @ApiPropertyOptional({ enum: ['PLAYWRIGHT', 'AXIOS_HTTP'] })
  @IsOptional()
  @IsEnum(['PLAYWRIGHT', 'AXIOS_HTTP'])
  engine?: string;
}
