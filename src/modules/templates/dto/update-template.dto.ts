// src/modules/templates/dto/update-template.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsBoolean,
  IsMongoId,
} from 'class-validator';

export class UpdateTemplateDto {
  @ApiProperty({ example: 'MOMO_PORTAL_CHECK', required: false })
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiProperty({ example: 'momo-da-tab-by-dev-alpha', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'Mẫu kiểm tra cổng nạp Đa Tab nâng cấp',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'https://media.licdn.com/...', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    example: 'PLAYWRIGHT',
    enum: ['PLAYWRIGHT', 'AXIOS_HTTP'],
    required: false,
  })
  @IsEnum(['PLAYWRIGHT', 'AXIOS_HTTP'])
  @IsOptional()
  engine?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  variableDefinitions?: any[];

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  baseWorkflow?: any[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID người thực hiện sửa đổi kịch bản',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  updatedBy?: string;
}
