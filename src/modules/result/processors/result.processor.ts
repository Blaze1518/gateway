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
      // =========================================================================
      // 🏁 BƯỚC 1: SNAPSHOT MONGODB (BẤT BIẾN)
      // =========================================================================
      const statusForDb =
        payload.result.status === 'ALIVE' ? 'SUCCESS' : 'FAILED';
      await this.taskModel
        .findByIdAndUpdate(payload.taskId, {
          lastExecutedAt: new Date(),
          lastExecutionStatus: statusForDb,
          lastExecutionError:
            payload.result.status === 'DEAD' ? payload.result.rawLog : null,
        })
        .exec();

      // =========================================================================
      // ⚙️ BƯỚC 2: ỦY THÁC HOÀN TOÀN CHO SERVICE PHÂN TÍCH (LỎNG LẺO TUYỆT ĐỐI)
      // =========================================================================
      const evaluation = await this.resultService.evaluateResult(payload);

      // =========================================================================
      // 🚀 BƯỚC 3: PHÁT EVENT NGHIỆP VỤ SẠCH SANG MODULE NOTIFICATION
      // =========================================================================
      // Chỉ kích nổ luồng thông báo nếu có biến động đổi màu THỰC SỰ hoặc đó là một lượt chạy thử
      // if (evaluation.hasChanged || payload.isTestRun) {
      if (true) {
        this.logger.log(
          `🔔 [Alert Triggered] Phát hiện đổi màu trạng thái (${evaluation.oldStatus} ➔ ${evaluation.newStatus}). Bắn lệnh sang Module Notification...`,
        );

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
      } else {
        this.logger.log(
          `💤 [System Stable] Trạng thái cổng nạp không đổi (${evaluation.newStatus}). Hệ thống im lặng cản nhiễu.`,
        );
      }

      return { success: true, taskId: payload.taskId };
    } catch (error) {
      this.logger.error(
        `❌ Thất bại khi thực thi chuỗi hành động hậu kỳ của Bot [${payload.taskId}]: ${error.message}`,
      );
      throw error;
    }
  }
}
