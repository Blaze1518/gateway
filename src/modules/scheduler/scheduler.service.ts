// src/modules/scheduler/scheduler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskDocument } from '../tasks/schemas/task.schema';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue('portal-checks') private readonly portalQueue: Queue,
    @InjectQueue('account-maintenance')
    private readonly maintenanceQueue: Queue,
  ) {}

  private getQueueByTaskType(taskType: string): Queue {
    if (taskType === 'ACCOUNT_MAINTENANCE') {
      return this.maintenanceQueue;
    }
    return this.portalQueue;
  }

  async registerTask(task: TaskDocument | any) {
    const taskIdStr = task._id.toString();
    const repeatableJobId = `repeat_${taskIdStr}`;

    const targetQueue = this.getQueueByTaskType(task.taskType);

    this.logger.log(
      `🔔 [Register] Bot: [${task.jobName}] | Loại: [${task.taskType}] ➔ Tuyến Queue: [${targetQueue.name}] | Chu kỳ: [${task.cronExpression}]`,
    );

    await targetQueue.add(
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
      `✅ [Success] Bot [${task.jobName}] đã găm lịch trình thành công vào Queue [${targetQueue.name}].`,
    );
  }

  async unregisterTask(task: TaskDocument | any) {
    const taskIdStr = task._id.toString();

    const targetQueue = this.getQueueByTaskType(task.taskType);
    const schedulers = await targetQueue.getJobSchedulers();

    const targetScheduler = schedulers.find(
      (scheduler) =>
        scheduler.id === `repeat_${taskIdStr}` ||
        scheduler.pattern === task.cronExpression,
    );

    if (targetScheduler && targetScheduler.id) {
      await targetQueue.removeJobScheduler(targetScheduler.id);
      this.logger.log(
        `🚨 [Unregistered] Đã gỡ chu kỳ thành công Bot: [${task.jobName}] khỏi Queue [${targetQueue.name}]`,
      );
    } else {
      this.logger.warn(
        `⚠️ Không tìm thấy lịch trình của Bot [${task.jobName}] trên tuyến Queue [${targetQueue.name}] để huỷ.`,
      );
    }
  }

  async triggerImmediateTestRun(task: TaskDocument | any) {
    const instantJobId = `test_${task._id.toString()}_${Date.now()}`;

    const targetQueue = this.getQueueByTaskType(task.taskType);

    this.logger.log(
      `🚀 [Immediate Trigger] Đang bắn 1 Job hỏa tốc cho Bot [${task.jobName}] vào Queue [${targetQueue.name}]`,
    );

    await targetQueue.add(
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
  }
}
