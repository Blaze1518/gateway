import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskDocument } from '../tasks/schemas/task.schema';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue('portal-checks') private readonly portalQueue: Queue,
  ) {}

  async registerTask(task: TaskDocument | any) {
    const taskIdStr = task._id.toString();
    const repeatableJobId = `repeat_${taskIdStr}`;

    this.logger.log(
      `🔔 [Register] Đang nạp cấu hình chu kỳ cho Bot: [${task.jobName}] - Chu kỳ: [${task.cronExpression}]`,
    );

    await this.portalQueue.add(
      'run-check',
      {
        taskId: taskIdStr,
        targetSiteCode: task.targetSiteCode,
        taskType: task.taskType,
        templateSlug: task.templateSlug,
        variableValues: task.variableValues,
        compiledWorkflow: task.compiledWorkflow || [],
      },
      {
        jobId: repeatableJobId,
        repeat: {
          pattern: task.cronExpression,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    this.logger.log(
      `✅ [Success] Bot [${task.jobName}] đã được đưa vào lịch trình tự động của Redis.`,
    );
  }

  async unregisterTask(task: TaskDocument | any) {
    const taskIdStr = task._id.toString();

    const schedulers = await this.portalQueue.getJobSchedulers();

    const targetScheduler = schedulers.find(
      (scheduler) =>
        scheduler.id === `repeat_${taskIdStr}` ||
        scheduler.pattern === task.cronExpression,
    );

    if (targetScheduler && targetScheduler.id) {
      await this.portalQueue.removeJobScheduler(targetScheduler.id);

      this.logger.log(
        `🚨 [Unregistered] Đã tháo ngòi chu kỳ, dừng hoạt động của Bot: [${task.jobName}]`,
      );
    } else {
      this.logger.warn(
        `⚠️ Không tìm thấy lịch trình của Bot [${task.jobName}] trên Redis để huỷ.`,
      );
    }
  }

  async triggerImmediateTestRun(task: TaskDocument | any) {
    const instantJobId = `test_${task._id.toString()}_${Date.now()}`;

    await this.portalQueue.add(
      'run-check',
      {
        jobId: instantJobId,
        taskId: task._id.toString(),
        targetSiteCode: task.targetSiteCode,
        taskType: task.taskType,
        templateSlug: task.templateSlug,
        variableValues: task.variableValues,
        compiledWorkflow: task.compiledWorkflow || [],
        isTestRun: true,
      },
      {
        jobId: instantJobId,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `🚀 [Test Run] Đã phát hỏa lệnh cào thử khẩn cấp cho Bot: [${task.jobName}]`,
    );
  }
}
