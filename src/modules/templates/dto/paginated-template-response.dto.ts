// src/modules/templates/dto/paginated-template-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { TemplateResponseDto } from './template-response.dto';

export class PaginatedTemplateResponseDto {
  @Expose()
  @Type(() => TemplateResponseDto)
  items: TemplateResponseDto[];

  @Expose() total: number;
  @Expose() page: number;
  @Expose() limit: number;
  @Expose() totalPages: number;
}
