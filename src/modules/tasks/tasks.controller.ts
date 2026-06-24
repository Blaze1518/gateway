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
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { PaginatedTaskResponseDto } from './dto/paginated-task-response.dto';

@ApiTags('Automation Bots (Tasks)')
@Controller('tasks')
@UseInterceptors(ClassSerializerInterceptor)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Khởi tạo đúc mới một con Bot cấu hình chạy ngầm' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  async create(@Body() createTaskDto: CreateTaskDto) {
    const result = await this.tasksService.create(createTaskDto);
    return plainToInstance(
      TaskResponseDto,
      result.toObject ? result.toObject() : result,
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Post(':id/test')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Bắn lệnh cào thử khẩn cấp lập tức, bỏ qua chu kỳ đóng băng',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId của con Bot cần chạy thử',
  })
  @ApiResponse({ status: 200, description: 'Đã đẩy vào hàng đợi ưu tiên cao' })
  async triggerTestRun(@Param('id') id: string) {
    return await this.tasksService.triggerTestRun(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách Bot vận hành có phân trang & lọc nâng cao',
  })
  @ApiResponse({ status: 200, type: PaginatedTaskResponseDto })
  async findAll(@Query() query: QueryTaskDto) {
    const result = await this.tasksService.findAll(query);
    return plainToInstance(PaginatedTaskResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy trạng thái và cấu hình chi tiết của Bot theo ID',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId của con Bot' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async findOne(@Param('id') id: string) {
    const result = await this.tasksService.findOne(id);
    return plainToInstance(TaskResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật tham số hoặc đổi trạng thái kích hoạt Bot',
  })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const result = await this.tasksService.update(id, updateTaskDto);
    return plainToInstance(TaskResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hạ tải xóa bỏ vĩnh viễn con Bot khỏi luồng điều phối',
  })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async remove(@Param('id') id: string) {
    const result = await this.tasksService.remove(id);
    return plainToInstance(TaskResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
