// src/modules/result/result.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ResultProcessor } from './processors/result.processor';
import { ResultService } from './result.service';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),

    BullModule.registerQueue(
      {
        name: 'global-task-results',
      },
      {
        name: 'notification-events',
      },
    ),
  ],
  providers: [ResultProcessor, ResultService],
  exports: [ResultService],
})
export class ResultModule {}
