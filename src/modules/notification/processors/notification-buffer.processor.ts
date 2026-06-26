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
    const statusHashKey = `site:portals:status:${clusterKey}`;

    const redisClient = this.redisService.getClient();

    const rawEvents = await redisClient.lrange(bufferKey, 0, -1);
    await redisClient.del(bufferKey);
    await redisClient.del(lockKey);

    const checkCounts = new Map<string, number>();
    if (rawEvents && rawEvents.length > 0) {
      rawEvents.forEach((item) => {
        try {
          const evt = JSON.parse(item);
          checkCounts.set(evt.taskId, (checkCounts.get(evt.taskId) || 0) + 1);
        } catch {}
      });
    }

    const fullState = await redisClient.hgetall(statusHashKey);

    if (!fullState || Object.keys(fullState).length === 0) {
      return {
        empty: true,
        message: 'No registered portals found in state store',
      };
    }

    const syntheticEvents: any[] = [];

    Object.entries(fullState).forEach(([taskId, jsonStr]) => {
      try {
        const state = JSON.parse(jsonStr);
        const count = checkCounts.get(taskId) || 0;

        syntheticEvents.push({
          taskId,
          newStatus: state.status,
          variableValues: {
            tabName: state.tabName,
            portalText: state.portalText,
          },
          data: {
            reasonCode: state.reasonCode,
          },
          checkCount: count,
        });
      } catch (e) {}
    });

    const text = this.telegramService.renderAggregatedAlert(
      clusterKey,
      syntheticEvents,
    );
    await this.telegramService.sendMessage(text);

    this.logger.log(
      `🚀 [Buffer Tele] Đã xuất bản bản tin Snapshot toàn vẹn trạng thái [${syntheticEvents.length}] cổng nạp cho đài [${clusterKey}].`,
    );
    return { status: 'FLUSHED_TELE', count: syntheticEvents.length };
  }
}
