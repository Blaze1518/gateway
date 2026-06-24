// src/modules/templates/dto/sub-dtos.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VariableDefinitionDto {
  @ApiProperty({ example: 'siteUrl' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Đường dẫn đài' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'TEXT', enum: ['TEXT', 'NUMBER', 'SELECT'] })
  @IsEnum(['TEXT', 'NUMBER', 'SELECT'])
  type: string;

  @ApiProperty({ example: [] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({ example: 'Nhập URL...' })
  @IsString()
  @IsOptional()
  placeholder?: string;
}

export class WorkflowStepDto {
  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'GOTO' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'Truy cập trang chủ' })
  @IsString()
  @IsOptional()
  description?: string;
}
