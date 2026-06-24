// src/modules/tasks/dto/task-response.dto.ts
import { Expose, Transform } from 'class-transformer';

export class TaskResponseDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj?.id?.toString())
  id: string;

  @Expose() jobName: string;
  @Expose() @Transform(({ value }) => value?.toString()) templateId: string;
  @Expose() templateSlug: string;
  @Expose() taskType: string;
  @Expose() templateVersion: number;
  @Expose() engine: string;
  @Expose() targetSiteCode: string;
  @Expose() cronExpression: string;
  @Expose() variableValues: Record<string, any>;
  @Expose() isCustomized: boolean;
  @Expose() compiledWorkflow: any[];
  @Expose() isActive: boolean;
  @Expose() lastExecutedAt: Date;
  @Expose() lastExecutionStatus: string;
  @Expose() @Transform(({ value }) => value?.toString()) updatedBy: string;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
