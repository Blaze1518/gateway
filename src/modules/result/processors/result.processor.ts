// src/modules/result/processors/result.processor.ts
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../../tasks/schemas/task.schema';
import { ResultService } from '../result.service';

@Processor('global-task-results', { concurrency: 5 })
export class ResultProcessor extends WorkerHost {
  private readonly logger = new Logger(ResultProcessor.name);

  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly resultService: ResultService,
    @InjectQueue('notification-events')
    private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const payload = job.data;
    const jobId = job.id;
    this.logger.log(
      `📥 [Result Processor] Đang xử lý hậu kỳ cho Job [${jobId}] - Bot [${payload.taskId}]`,
    );

    try {
      const statusForDb =
        payload.result.status === 'ALIVE' ? 'SUCCESS' : 'FAILED';
      await this.taskModel
        .findByIdAndUpdate(
          payload.taskId,
          {
            lastExecutedAt: new Date(),
            lastExecutionStatus: statusForDb,
            lastExecutionError:
              payload.result.status === 'DEAD' ? payload.result.rawLog : null,
          },
          { returnDocument: 'after' },
        )
        .exec();

      const evaluation = await this.resultService.evaluateResult(payload);

      if (evaluation.hasChanged) {
        this.logger.warn(
          `🚨 [Hậu Kỳ Biến Động] Cổng đổi màu [${evaluation.oldStatus} ➔ ${evaluation.newStatus}]. Đẩy sang luồng thông báo hỏa tốc.`,
        );
      } else {
        this.logger.log(
          `💤 [Hậu Kỳ Ổn Định] Cổng giữ nguyên nhịp tim [${evaluation.newStatus}]. Chuyển dữ liệu nuôi xô RAM gom tụ 5 phút.`,
        );
      }

      await this.notificationQueue.add(
        'dispatch-alert',
        {
          eventId: `evt_${Date.now()}_${payload.taskId}`,
          taskId: payload.taskId,
          engineType: payload.engineType,
          templateSlug: payload.templateSlug,
          targetSiteCode: payload.targetSiteCode,
          variableValues: payload.variableValues,
          executionTimeMs: payload.executionTimeMs,
          isTestRun: payload.isTestRun,
          timestamp: Date.now(),
          data: {
            oldStatus: evaluation.oldStatus,
            newStatus: evaluation.newStatus,
            reasonCode: evaluation.reasonCode,
            rawLog: payload.result.rawLog,
          },
        },
        { removeOnComplete: true, removeOnFail: true },
      );

      return { success: true, taskId: payload.taskId };
    } catch (error) {
      this.logger.error(
        `❌ Thất bại khi thực thi chuỗi hành động hậu kỳ của Bot [${payload.taskId}]: ${error.message}`,
      );
      throw error;
    }
  }
}
