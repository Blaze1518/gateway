// src/modules/notification/processors/notification-buffer.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RedisService } from '../../../common/redis/redis.service';
import { TelegramService } from '../telegram.service';

@Processor('notification-aggregation-queue', { concurrency: 2 })
export class NotificationBufferProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationBufferProcessor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly telegramService: TelegramService, // 🌟 Gọi thẳng ông thần Telegram
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { clusterKey } = job.data;
    const bufferKey = `notify:buffer:${clusterKey}`;
    const lockKey = `notify:lock:${clusterKey}`;

    const rawEvents = await this.redisService
      .getClient()
      .lrange(bufferKey, 0, -1);
    await this.redisService.getClient().del(bufferKey);
    await this.redisService.getClient().del(lockKey);

    if (!rawEvents || rawEvents.length === 0) return { empty: true };
    const events = rawEvents.map((item) => JSON.parse(item));

    // Ủy thác việc gom nhóm dịch chữ và format Markdown cho Telegram Service tự lo
    const text = this.telegramService.renderAggregatedAlert(clusterKey, events);
    await this.telegramService.sendMessage(text);

    this.logger.log(
      `🚀 [Buffer Tele] Đã bắn thành công bản tin gom tụ ${events.length} sự kiện cho đài [${clusterKey}].`,
    );
    return { status: 'FLUSHED_TELE', count: events.length };
  }
}
