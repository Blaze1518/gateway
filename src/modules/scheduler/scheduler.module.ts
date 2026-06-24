// src/modules/scheduler/scheduler.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SchedulerService } from '../scheduler/scheduler.service';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'portal-checks',
    }),
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
