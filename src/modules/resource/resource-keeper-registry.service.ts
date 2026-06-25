// src/modules/resource/resource-keeper-registry.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from '../../common/redis/redis.service';
import { SchedulerService } from '../scheduler/scheduler.service'; // 🎛️ Tiêm bộ đặt lịch sẵn có của bác
import { Task, TaskDocument } from '../tasks/schemas/task.schema'; // Bảng Task tổng

@Injectable()
export class ResourceKeeperRegistry {
  private readonly logger = new Logger(ResourceKeeperRegistry.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly schedulerService: SchedulerService,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  async incrementRef(siteCode: string): Promise<void> {
    if (!siteCode) return;
    const redis = this.redisService.getClient();
    const normalizedSite = siteCode.toUpperCase();
    const refKey = `resource:refcount:${normalizedSite}`;

    const currentRef = await redis.incr(refKey);
    this.logger.log(
      `📈 [Registry] Đài [${normalizedSite}] nhận thêm 1 Task xài. Tổng tham chiếu: ${currentRef}`,
    );

    if (currentRef === 1) {
      this.logger.log(
        `🚀 [Warming Up] Đài [${normalizedSite}] chính thức hoạt động! Đang kích hoạt toàn bộ Task nuôi phiên tương ứng từ DB...`,
      );

      const maintenanceTasks = await this.taskModel
        .find({
          taskType: 'ACCOUNT_MAINTENANCE',
          targetSiteCode: normalizedSite,
        })
        .exec();

      for (const task of maintenanceTasks) {
        if (!task.isActive) {
          task.isActive = true;
          await task.save();
        }

        await this.schedulerService.registerTask(task);

        this.logger.log(
          `✅ [Điều Job Bật] Đã nạp lịch nuôi phiên chu kỳ [${task.cronExpression}] cho tài khoản [${task.variableValues?.username}]`,
        );
      }
    }
  }

  async decrementRef(siteCode: string): Promise<void> {
    if (!siteCode) return;
    const redis = this.redisService.getClient();
    const normalizedSite = siteCode.toUpperCase();
    const refKey = `resource:refcount:${normalizedSite}`;

    const isExist = await redis.exists(refKey);
    if (!isExist) return;

    const currentRef = await redis.decr(refKey);
    this.logger.log(
      `📉 [Registry] Đài [${normalizedSite}] giảm đi 1 Task xài. Tổng tham chiếu còn lại: ${currentRef}`,
    );

    if (currentRef <= 0) {
      await redis.set(refKey, 0);

      this.logger.warn(
        `💤 [Cooling Down] Đài [${normalizedSite}] không còn Bot nào chạy. Tiến hành tháo xích hủy lịch toàn bộ Task nuôi phiên!`,
      );

      const maintenanceTasks = await this.taskModel
        .find({
          taskType: 'ACCOUNT_MAINTENANCE',
          targetSiteCode: normalizedSite,
        })
        .exec();

      for (const task of maintenanceTasks) {
        if (task.isActive) {
          task.isActive = false;
          await task.save();
        }

        await this.schedulerService.unregisterTask(task);

        this.logger.log(
          `🚨 [Điều Job Tắt] Đã tháo lịch nuôi ngầm của tài khoản [${task.variableValues?.username}]`,
        );
      }

      const sessionKeys = await redis.keys(
        `account:session:${normalizedSite}:*`,
      );
      if (sessionKeys.length > 0) {
        await redis.del(...sessionKeys);
      }
    }
  }
}
