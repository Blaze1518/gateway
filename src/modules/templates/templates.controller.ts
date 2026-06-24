// src/modules/templates/templates.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { TemplateResponseDto } from './dto/template-response.dto';
import { PaginatedTemplateResponseDto } from './dto/paginated-template-response.dto';
import { plainToInstance } from 'class-transformer';
@ApiTags('Job Templates')
@Controller('templates')
@UseInterceptors(ClassSerializerInterceptor)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới một kịch bản mẫu (Template)' })
  @ApiResponse({ status: 201, type: TemplateResponseDto })
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    const result = await this.templatesService.create(createTemplateDto);
    return plainToInstance(
      TemplateResponseDto,
      result.toObject ? result.toObject() : result,
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách kịch bản phân trang & lọc nâng cao' })
  @ApiResponse({ status: 200, type: PaginatedTemplateResponseDto })
  async findAll(@Query() query: QueryTemplateDto) {
    const result = await this.templatesService.findAll(query);
    return plainToInstance(PaginatedTemplateResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Lấy kịch bản theo chuỗi Slug URL (Phục vụ Frontend Next.js)',
  })
  @ApiParam({ name: 'slug', example: 'momo-pay-da-tab-by-admin' })
  @ApiResponse({ status: 200, type: TemplateResponseDto })
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.templatesService.findBySlug(slug);
    return plainToInstance(TemplateResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết kịch bản mẫu theo ID' })
  @ApiParam({ name: 'id', description: 'ID của kịch bản mẫu trong MongoDB' })
  @ApiResponse({ status: 200, type: TemplateResponseDto })
  async findOne(@Param('id') id: string) {
    return await this.templatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật kịch bản mẫu theo ID' })
  @ApiResponse({ status: 200, type: TemplateResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return await this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa kịch bản mẫu theo ID' })
  @ApiResponse({ status: 200, type: TemplateResponseDto })
  async remove(@Param('id') id: string) {
    return await this.templatesService.remove(id);
  }
}
