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
    private readonly telegramService: TelegramService, // 🌟 Tiêm trực tiếp Telegram không qua trung gian
    @InjectQueue('notification-aggregation-queue')
    private readonly aggQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const event = job.data;
    const clusterKey = event.targetSiteCode;

    this.logger.log(
      `📡 Event dữ liệu nhận được:\n${JSON.stringify(event, null, 2)}`,
    );
    // 🧠 Tra cứu luật trễ động theo Template Slug
    const windowSeconds = this.resolveWindowSeconds(event.templateSlug);

    // 🚀 LUỒNG 1: KHẨN CẤP (windowSeconds = 0) -> Bắn thẳng Telegram lập tức
    if (windowSeconds === 0) {
      this.logger.log(
        `⚡ [Immediate Tele] Báo động KHẨN CẤP (0s delay). Gọi Telegram Service gửi ngay...`,
      );

      const text = this.telegramService.renderSingleAlert(event);
      await this.telegramService.sendMessage(text);

      return { strategy: 'IMMEDIATE_TELE', taskId: event.taskId };
    }

    // ⏳ LUỒNG 2: GOM TỤ GIẢM TẢI (windowSeconds > 0) -> Xếp hàng vào rổ RAM
    const bufferKey = `notify:buffer:${clusterKey}`;
    const lockKey = `notify:lock:${clusterKey}`;

    await this.redisService.getClient().rpush(bufferKey, JSON.stringify(event));

    const isClockRunning = await this.redisService.getClient().get(lockKey);
    if (!isClockRunning) {
      await this.redisService
        .getClient()
        .set(lockKey, 'RUNNING', 'EX', windowSeconds + 5);

      await this.aggQueue.add(
        'flush-buffer',
        { clusterKey },
        {
          delay: windowSeconds * 1000,
          jobId: `timer:${clusterKey}`,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    }

    return { strategy: 'BUFFERED_TELE', clusterKey };
  }

  private resolveWindowSeconds(templateSlug: string): number {
    // Nếu check cổng thường thì gom 15s chống spam, kịch bản khác mặc định nã ngay (0s)
    if (
      templateSlug === 'momo-pay-da-tab-by-admin' ||
      templateSlug.includes('portal-check')
    ) {
      return 0;
    }
    return 0;
  }
}
