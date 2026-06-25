// src/modules/templates/templates.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from './schemas/template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
  ) {}

  async create(
    createTemplateDto: CreateTemplateDto,
  ): Promise<TemplateDocument> {
    try {
      const createdTemplate = new this.templateModel(createTemplateDto);
      return await createdTemplate.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Đường dẫn kịch bản (slug) '${createTemplateDto.slug}' đã tồn tại hệ thống.`,
        );
      }
      throw new InternalServerErrorException(
        'Lỗi hệ thống trong quá trình khởi tạo mẫu',
      );
    }
  }

  async findAll(query: QueryTemplateDto) {
    const { page = 1, limit = 10, search, taskType, engine } = query;
    const skip = (page - 1) * limit;
    const filterOptions: any = {};

    if (taskType) filterOptions.taskType = taskType;
    if (engine) filterOptions.engine = engine;

    if (search) {
      filterOptions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.templateModel
        .find(filterOptions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        // .populate('authorId', 'name email')
        .lean()
        .exec(),
      this.templateModel.countDocuments(filterOptions).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    const template = await this.templateModel
      .findById(id)
      .populate('authorId', 'name email')
      .lean()
      .exec();
    if (!template) {
      throw new NotFoundException(
        `Không tìm thấy kịch bản mẫu có ID hệ thống: ${id}`,
      );
    }
    return template;
  }

  async findBySlug(slug: string): Promise<any> {
    const template = await this.templateModel
      .findOne({ slug: slug.toLowerCase() })
      .lean()
      .exec();
    if (!template) {
      throw new NotFoundException(
        `Không tồn tại kịch bản mẫu ứng với liên kết slug: ${slug}`,
      );
    }
    return template;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<any> {
    try {
      const updatedTemplate = await this.templateModel
        .findByIdAndUpdate(id, updateTemplateDto, {
          new: true,
          runValidators: true,
        })
        .lean()
        .exec();

      if (!updatedTemplate) {
        throw new NotFoundException(
          `Mục tiêu kịch bản ID ${id} không tồn tại để cập nhật`,
        );
      }
      return updatedTemplate;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Yêu cầu thay đổi thất bại, chuỗi định danh slug đã bị chiếm dụng.`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<TemplateDocument> {
    const deletedTemplate = await this.templateModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedTemplate) {
      throw new NotFoundException(`Mục tiêu cần xóa (ID: ${id}) không tồn tại`);
    }
    return deletedTemplate;
  }
}
