import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { SiteResponseDto } from './dto/site-response.dto';

@ApiTags('Sites')
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  private serialize(data: any) {
    return plainToInstance(SiteResponseDto, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới một trang web (Site)' })
  @ApiResponse({ status: 201, type: SiteResponseDto })
  async create(@Body() createSiteDto: CreateSiteDto) {
    const result = await this.sitesService.create(createSiteDto);
    return this.serialize(result);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các trang web' })
  @ApiResponse({ status: 200, type: [SiteResponseDto] })
  async findAll() {
    const result = await this.sitesService.findAll();
    return this.serialize(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một trang web theo ID' })
  @ApiParam({ name: 'id', description: 'ID của trang web cần tìm' })
  @ApiResponse({ status: 200, type: SiteResponseDto })
  async findOne(@Param('id') id: string) {
    const result = await this.sitesService.findOne(id);
    return this.serialize(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin trang web theo ID' })
  @ApiParam({ name: 'id', description: 'ID của trang web cần cập nhật' })
  @ApiResponse({ status: 200, type: SiteResponseDto })
  async update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
    const result = await this.sitesService.update(id, updateSiteDto);
    return this.serialize(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một trang web theo ID' })
  @ApiParam({ name: 'id', description: 'ID của trang web cần xóa' })
  @ApiResponse({ status: 200, type: SiteResponseDto })
  async remove(@Param('id') id: string) {
    const result = await this.sitesService.remove(id);
    return this.serialize(result);
  }
}
