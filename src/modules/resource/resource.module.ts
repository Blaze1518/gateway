// src/modules/resource/resource.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourceKeeperRegistry } from './resource-keeper-registry.service';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    SchedulerModule,
  ],
  providers: [ResourceKeeperRegistry],
  exports: [ResourceKeeperRegistry],
})
export class ResourceModule {}
