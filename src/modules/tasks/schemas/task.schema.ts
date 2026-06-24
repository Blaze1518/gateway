import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true, collection: 'tasks' })
export class Task {
  @Prop({ required: true, trim: true })
  jobName: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
    index: true,
  })
  templateId: mongoose.Types.ObjectId;
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  templateSlug: string;

  @Prop({ required: true, uppercase: true, trim: true, index: true })
  taskType: string;

  @Prop({ required: true, default: 1 })
  templateVersion: number;

  @Prop({
    required: true,
    enum: ['PLAYWRIGHT', 'AXIOS_HTTP'],
    default: 'PLAYWRIGHT',
  })
  engine: string;

  @Prop({ required: true, uppercase: true, trim: true, index: true })
  targetSiteCode: string;

  @Prop({ required: true, trim: true })
  cronExpression: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  variableValues: Record<string, any>;
  @Prop({ default: false })
  isCustomized: boolean;

  @Prop({ type: [mongoose.Schema.Types.Mixed], required: true })
  compiledWorkflow: any[];
  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastExecutedAt: Date;

  @Prop({
    required: true,
    enum: ['SUCCESS', 'FAILED', 'UNKNOWN'],
    default: 'UNKNOWN',
    index: true,
  })
  lastExecutionStatus: 'SUCCESS' | 'FAILED' | 'UNKNOWN';

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updatedBy: mongoose.Types.ObjectId;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ targetSiteCode: 1, isActive: 1, lastExecutionStatus: 1 });
TaskSchema.index({ templateId: 1, templateVersion: 1 });
