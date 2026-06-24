import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { AutomationModule } from '../automation/automation.module';
import { AuthKeeperService } from './auth-keeper.service';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    AutomationModule,
    BullModule.forRoot({
      connection: { host: process.env.REDIS_HOST || 'localhost', port: 6379 },
    }),
  ],
  providers: [AuthKeeperService],
})
export class AuthKeeperModule {}
