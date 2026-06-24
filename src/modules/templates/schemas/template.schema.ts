// src/modules/templates/schemas/template.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({ _id: false })
class VariableDefinition {
  @Prop({ required: true, trim: true }) key: string;
  @Prop({ required: true, trim: true }) label: string;
  @Prop({ required: true, enum: ['TEXT', 'NUMBER', 'SELECT'], default: 'TEXT' })
  type: string;
  @Prop({ type: [String], default: [] }) options: string[];
  @Prop({ default: '' }) placeholder: string;
}
const VariableDefinitionSchema =
  SchemaFactory.createForClass(VariableDefinition);

@Schema({ timestamps: true, collection: 'templates' })
export class Template {
  @Prop({ required: true, uppercase: true, trim: true, index: true })
  taskType: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({
    required: true,
    enum: ['PLAYWRIGHT', 'AXIOS_HTTP'],
    default: 'PLAYWRIGHT',
  })
  engine: string;

  @Prop({ type: [VariableDefinitionSchema], default: [] })
  variableDefinitions: VariableDefinition[];

  @Prop({ type: [mongoose.Schema.Types.Mixed], required: true })
  baseWorkflow: any[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  authorId: mongoose.Types.ObjectId;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updatedBy: mongoose.Types.ObjectId;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

TemplateSchema.index({ taskType: 1, isActive: 1 });
TemplateSchema.index({ name: 'text', slug: 'text' });
