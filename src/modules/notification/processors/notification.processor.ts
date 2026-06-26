// src/modules/notification/processors/notification.processor.ts
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { RedisService } from '../../../common/redis/redis.service';
import { TelegramService } from '../telegram.service';

@Processor('notification-events', { concurrency: 10 })
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly telegramService: TelegramService,
    @InjectQueue('notification-aggregation-queue')
    private readonly aggQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const event = job.data;
    const clusterKey = event.targetSiteCode;

    const oldStatus = event.oldStatus || event.data?.oldStatus || 'UNKNOWN';
    const newStatus = event.newStatus || event.data?.newStatus || 'UNKNOWN';

    if (!event.oldStatus) event.oldStatus = oldStatus;
    if (!event.newStatus) event.newStatus = newStatus;

    const isStateChanged = oldStatus !== newStatus;

    if (isStateChanged) {
      this.logger.warn(
        `🚨 [Alert State Changed] Phát hiện biến động trạng thái [${oldStatus} ➔ ${newStatus}] tại đài [${clusterKey}]. Khai hỏa Telegram!`,
      );
      const text = this.telegramService.renderSingleAlert(event);
      await this.telegramService.sendMessage(text);
      return { strategy: 'IMMEDIATE_TELE', taskId: event.taskId };
    }

    const windowSeconds = 120;
    const bufferKey = `notify:buffer:${clusterKey}`;
    const lockKey = `notify:lock:${clusterKey}`;

    const redisClient = this.redisService.getClient();
    await redisClient.rpush(bufferKey, JSON.stringify(event));

    const isClockRunning = await redisClient.get(lockKey);

    if (!isClockRunning) {
      this.logger.log(
        `⏰ [Timer Init] Kích hoạt đồng hồ cát 5 phút cho đài [${clusterKey}]. Tiến hành gom tụ nhịp tim ổn định...`,
      );

      await redisClient.set(lockKey, 'RUNNING', 'EX', windowSeconds + 5);

      try {
        if (!this.aggQueue) {
          throw new Error(
            '❌ Thất bại: "this.aggQueue" đang bị UNDEFINED! NestJS chưa tiêm được Queue này vào Processor.',
          );
        }

        this.logger.log(
          `⏳ [Queue Push] Đang đẩy lệnh đặt Timer Delayed ${windowSeconds}s vào BullMQ...`,
        );

        await this.aggQueue.add(
          'flush-buffer',
          { clusterKey },
          {
            delay: windowSeconds * 1000,
            jobId: `timer-${clusterKey}`,
            removeOnComplete: true,
            removeOnFail: true,
          },
        );

        this.logger.log(
          `✅ [Queue Success] Đã găm thành công Job Delayed [timer:${clusterKey}] vào xô RAM Redis!`,
        );
      } catch (queueError: any) {
        this.logger.error(
          `💥 [LỖI NGẦM TÓM SỐNG] Lệnh add Job vào aggQueue thất bại vỡ trận! Lỗi chi tiết: ${queueError.message}`,
          queueError.stack,
        );
      }
    }

    return { strategy: 'BUFFERED_TELE', clusterKey };
  }
}
