// src/modules/resource/schemas/resource.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ResourceDocument = Resource & Document;

@Schema({ timestamps: true, collection: 'resources' })
export class Resource {
  @Prop({ required: true, uppercase: true })
  type: string;

  @Prop({ required: true, uppercase: true })
  groupKey: string;

  @Prop({ required: true, unique: true })
  resourceId: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  staticData: any;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  lastUsedAt: Date;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
ResourceSchema.index({ type: 1, groupKey: 1, isActive: 1 });
