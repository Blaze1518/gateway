// src/modules/templates/dto/create-template.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  IsMongoId,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VariableDefinitionDto, WorkflowStepDto } from './sub-dtos.dto';

export class CreateTemplateDto {
  @ApiProperty({ example: 'MOMO_PORTAL_CHECK' })
  @IsString()
  @IsNotEmpty()
  taskType: string;

  @ApiProperty({ example: 'momo-da-tab-by-dev-alpha' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Mẫu kiểm tra cổng nạp Đa Tab' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://media.licdn.com/...', required: false })
  @IsString({ message: 'imageUrl phải là một chuỗi đường dẫn ký tự' })
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'PLAYWRIGHT', enum: ['PLAYWRIGHT', 'AXIOS_HTTP'] })
  @IsEnum(['PLAYWRIGHT', 'AXIOS_HTTP'])
  engine: string;

  @ApiProperty({ type: [VariableDefinitionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VariableDefinitionDto)
  variableDefinitions?: VariableDefinitionDto[];

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  baseWorkflow: WorkflowStepDto[];

  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
