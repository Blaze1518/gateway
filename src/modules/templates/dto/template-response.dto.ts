// src/modules/templates/dto/template-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class TemplateResponseDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d2' })
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj?.id?.toString())
  id: string;

  @ApiProperty({ example: 'MOMO_PORTAL_CHECK' })
  @Expose()
  taskType: string;

  @ApiProperty({ example: 'momo-da-tab-by-dev-alpha' })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'Mẫu kiểm tra cổng nạp Đa Tab' })
  @Expose()
  name: string;

  @Expose()
  imageUrl: string;

  @ApiProperty({ example: 'PLAYWRIGHT' })
  @Expose()
  engine: string;

  @ApiProperty({
    example: 1,
    description: 'Phiên bản hiện tại của kịch bản gốc',
  })
  @Expose()
  version: number;

  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @Expose()
  @Transform(({ value }) => value?.toString())
  authorId: string;

  @Expose()
  variableDefinitions: any[];

  @Expose()
  baseWorkflow: any[];

  @Expose()
  isActive: boolean;
}
