// src/modules/tasks/dto/paginated-task-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { TaskResponseDto } from './task-response.dto';

export class PaginatedTaskResponseDto {
  @Expose()
  @Type(() => TaskResponseDto)
  items: TaskResponseDto[];

  @Expose() total: number;
  @Expose() page: number;
  @Expose() limit: number;
  @Expose() totalPages: number;
}
