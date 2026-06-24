// src/modules/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationBufferProcessor } from './processors/notification-buffer.processor';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'notification-events' },
      { name: 'notification-aggregation-queue' },
    ),
  ],
  providers: [
    NotificationProcessor,
    NotificationBufferProcessor,
    TelegramService,
  ],
})
export class NotificationModule {}
