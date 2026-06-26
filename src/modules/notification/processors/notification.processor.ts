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

    // =========================================================================
    // 🛡️ LÁ CHẮN TRÍCH XUẤT: Bọc lót lấy trạng thái bất kể JSON phẳng hay lồng khay data
    // =========================================================================
    const oldStatus = event.oldStatus || event.data?.oldStatus || 'UNKNOWN';
    const newStatus = event.newStatus || event.data?.newStatus || 'UNKNOWN';

    // Đồng bộ ngược lại vào event để tầng Telegram Service bốc dữ liệu đồng nhất
    if (!event.oldStatus) event.oldStatus = oldStatus;
    if (!event.newStatus) event.newStatus = newStatus;

    // 🎯 ĐIỀU KIỆN CHÍ MẠNG: So khớp đổi màu trạng thái thực tế
    const isStateChanged = oldStatus !== newStatus;

    // =========================================================================
    // 🚀 LUỒNG 1: BIẾN ĐỘNG TRẠNG THÁI -> Bắn hỏa tốc Telegram ngay lập tức (0s delay)
    // =========================================================================
    if (isStateChanged) {
      this.logger.warn(
        `🚨 [Alert State Changed] Phát hiện biến động trạng thái [${oldStatus} ➔ ${newStatus}] tại đài [${clusterKey}]. Khai hỏa Telegram!`,
      );

      const text = this.telegramService.renderSingleAlert(event);
      await this.telegramService.sendMessage(text);

      return {
        strategy: 'IMMEDIATE_TELE',
        taskId: event.taskId,
        trigger: `${oldStatus}->${newStatus}`,
      };
    }

    // =========================================================================
    // ⏳ LUỒNG 2: NHỊP TIM ỔN ĐỊNH -> Gom tụ giảm tải rải muối thời gian 5 phút
    // =========================================================================
    const windowSeconds = 60; // 5 phút gom đạn 1 lần (300 giây)
    const bufferKey = `notify:buffer:${clusterKey}`;
    const lockKey = `notify:lock:${clusterKey}`;

    const redisClient = this.redisService.getClient();

    // Rpush cục nhịp tim ổn định này vào hàng sau của Redis List buffer
    await redisClient.rpush(bufferKey, JSON.stringify(event));

    // Thăm dò xem chiếc đồng hồ đếm ngược 5 phút cho đài này đã bật chưa
    const isClockRunning = await redisClient.get(lockKey);

    if (!isClockRunning) {
      this.logger.log(
        `⏰ [Timer Init] Kích hoạt đồng hồ cát 5 phút cho đài [${clusterKey}]. Bắt đầu gom tụ nhịp tim ổn định...`,
      );

      // Cắm cờ khóa timer sống trong 5 phút + 5s bù trừ trễ mạng chống trùng luồng
      await redisClient.set(lockKey, 'RUNNING', 'EX', windowSeconds + 5);

      // Đẩy duy nhất 1 con Job Delayed hẹn giờ 5 phút sau thức giấc thu hoạch rổ RAM
      await this.aggQueue.add(
        'flush-buffer',
        { clusterKey },
        {
          delay: windowSeconds * 1000, // Đổi sang ms cho BullMQ (300,000ms)
          jobId: `timer:${clusterKey}`, // Khóa cứng ID theo đài để triệt tiêu việc đẻ trùng Timer rác
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    }

    return {
      strategy: 'BUFFERED_TELE',
      clusterKey,
      info: 'Stable status, waiting for flush',
    };
  }
}
