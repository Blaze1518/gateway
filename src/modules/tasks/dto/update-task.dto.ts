// src/modules/tasks/dto/update-task.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsDateString()
  lastExecutedAt?: Date;

  @IsOptional()
  @IsEnum(['SUCCESS', 'FAILED', 'UNKNOWN'])
  lastExecutionStatus?: 'SUCCESS' | 'FAILED' | 'UNKNOWN';
}
