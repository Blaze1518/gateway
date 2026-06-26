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
    private readonly telegramService: TelegramService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { clusterKey } = job.data;
    const bufferKey = `notify:buffer:${clusterKey}`;
    const lockKey = `notify:lock:${clusterKey}`;

    const redisClient = this.redisService.getClient();

    // 🌟 RÚT SẠCH NGUYÊN KHỐI: Rút toàn bộ đống nhịp tim tích lũy trong 5 phút ra khỏi Redis List
    const rawEvents = await redisClient.lrange(bufferKey, 0, -1);

    // TẬP LỆNH GIẢI PHÓNG RAM TRÊN PRODUCTION: Xóa sạch xô chứa và dỡ khóa Timer lập tức
    await redisClient.del(bufferKey);
    await redisClient.del(lockKey);

    if (!rawEvents || rawEvents.length === 0) {
      return { empty: true, message: 'Buffer was empty at flush time' };
    }

    const events = rawEvents.map((item) => JSON.parse(item));

    // Gom nhóm và định dạng tin nhắn sang phom Markdown sạch
    const text = this.telegramService.renderAggregatedAlert(clusterKey, events);
    await this.telegramService.sendMessage(text);

    this.logger.log(
      `🚀 [Buffer Tele] Đã bắn thành công bản tin gom tụ tổng hợp ${events.length} sự kiện nhịp tim cho cụm đài [${clusterKey}].`,
    );
    return { status: 'FLUSHED_TELE', count: events.length };
  }
}
