// src/modules/sites/dto/site-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

export class SiteResponseDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj?.id?.toString())
  id: string;

  @ApiProperty({ example: 'Kênh Tin Tức ABC' })
  @Expose()
  title: string;

  @Exclude()
  linkPhoto: string;
}
