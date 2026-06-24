// src/modules/tasks/dto/create-task.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsMongoId,
  IsObject,
  IsArray,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: 'Bot tự động check cổng đài F8BET nhóm Momo 33' })
  @IsString()
  @IsNotEmpty()
  jobName: string;

  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d2' })
  @IsMongoId()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({ example: 'momo-pay-da-tab-by-admin' })
  @IsString()
  @IsNotEmpty()
  templateSlug: string;

  @ApiProperty({ example: 'MOMO_PORTAL_CHECK' })
  @IsString()
  @IsNotEmpty()
  taskType: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'templateVersion phải là số nguyên' })
  @IsNotEmpty({ message: 'templateVersion không được để trống' })
  templateVersion: number;

  @ApiProperty({ example: 'PLAYWRIGHT', enum: ['PLAYWRIGHT', 'AXIOS_HTTP'] })
  @IsEnum(['PLAYWRIGHT', 'AXIOS_HTTP'])
  engine: string;

  @ApiProperty({ example: 'F8BET' })
  @IsString()
  @IsNotEmpty()
  targetSiteCode: string;

  @ApiProperty({ example: '*/3 * * * *' })
  @IsString()
  @IsNotEmpty()
  cronExpression: string;

  @ApiProperty({ example: { siteUrl: 'https://f8bet.com', amountValue: 50 } })
  @IsObject()
  @IsNotEmpty()
  variableValues: Record<string, any>;

  @ApiProperty({ example: [] })
  @IsArray()
  @IsNotEmpty()
  compiledWorkflow: any[];

  @IsOptional()
  @IsBoolean()
  isCustomized?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsMongoId()
  @IsNotEmpty()
  updatedBy: string;
}
