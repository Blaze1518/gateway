import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { MongooseModule, InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema, TaskDocument } from './schemas/task.schema';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { RedisService } from '../../common/redis/redis.service';
import { ResourceKeeperRegistry } from '../resource/resource-keeper-registry.service';
import { ResourceModule } from '../resource/resource.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    SchedulerModule,
    ResourceModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(TasksModule.name);

  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly redisService: RedisService,
    private readonly resourceRegistry: ResourceKeeperRegistry,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log(
      '⏳ [Bootstrapper] Đang tiến hành quét MongoDB để đồng bộ lại bộ đếm tham chiếu tài nguyên trên Redis...',
    );
    try {
      const redis = this.redisService.getClient();

      const oldKeys = await redis.keys('resource:refcount:*');
      if (oldKeys.length > 0) {
        await redis.del(...oldKeys);
      }

      const activeStats = await this.taskModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$targetSiteCode', count: { $sum: 1 } } },
      ]);

      if (activeStats.length === 0) {
        this.logger.log(
          '✅ [Bootstrapper] Hệ thống sạch! Không ghi nhận Đài nào có Task đang hoạt động ngầm.',
        );
        return;
      }

      for (const stat of activeStats) {
        const siteCode = stat._id;
        const taskCount = stat.count;

        if (!siteCode) continue;

        const refKey = `resource:refcount:${siteCode.toUpperCase()}`;
        await redis.set(refKey, taskCount);

        this.logger.log(
          `⚙️ [Bootstrapper Restoration] Khôi phục thành công Đài [${siteCode.toUpperCase()}] với ${taskCount} Tasks hoạt động.`,
        );

        await redis.set(refKey, 0);
        await this.resourceRegistry.incrementRef(siteCode);
        await redis.set(refKey, taskCount);
      }

      this.logger.log(
        '✅ [Bootstrapper Success] Toàn bộ mạch điều phối biến đếm trạng thái đã khôi phục nguyên trạng mượt mà!',
      );
    } catch (error) {
      this.logger.error(
        `❌ [Bootstrapper Failed] Thất bại khi tự sửa lỗi đồng bộ bộ đếm tài nguyên: ${error.message}`,
      );
    }
  }
}
