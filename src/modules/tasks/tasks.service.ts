import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { SchedulerService } from '../scheduler/scheduler.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly schedulerService: SchedulerService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<TaskDocument> {
    const createdTask = new this.taskModel(createTaskDto);
    const savedTask = await createdTask.save();

    if (savedTask.isActive) {
      await this.schedulerService.registerTask(savedTask);
    }

    return savedTask;
  }

  async findAll(query: QueryTaskDto) {
    const {
      page = 1,
      limit = 10,
      search,
      targetSiteCode,
      taskType,
      lastExecutionStatus,
      isActive,
    } = query;
    const skip = (page - 1) * limit;

    const filterOptions: any = {};

    if (targetSiteCode)
      filterOptions.targetSiteCode = targetSiteCode.toUpperCase();
    if (taskType) filterOptions.taskType = taskType.toUpperCase();
    if (lastExecutionStatus)
      filterOptions.lastExecutionStatus = lastExecutionStatus;
    if (isActive !== undefined) filterOptions.isActive = isActive;

    if (search) {
      filterOptions.jobName = { $regex: search, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      this.taskModel
        .find(filterOptions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        // .populate('updatedBy', 'name email')
        .lean()
        .exec(),
      this.taskModel.countDocuments(filterOptions).exec(),
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
    const task = await this.taskModel
      .findById(id)
      // .populate('updatedBy', 'name email')
      .lean()
      .exec();
    if (!task) {
      throw new NotFoundException(
        `Không tìm thấy con Bot (Task) có ID hệ thống là: ${id}`,
      );
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<any> {
    const oldTask = await this.taskModel.findById(id).exec();
    if (!oldTask) {
      throw new NotFoundException(
        `Mục tiêu cấu hình Bot ID ${id} không tồn tại`,
      );
    }

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true, runValidators: true })
      .lean()
      .exec();

    await this.schedulerService.unregisterTask(oldTask);

    if (updatedTask?.isActive) {
      await this.schedulerService.registerTask(updatedTask);
    }

    return updatedTask;
  }

  async remove(id: string): Promise<any> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(
        `Yêu cầu hạ tải thất bại, Bot ID ${id} không tồn tại`,
      );
    }

    await this.schedulerService.unregisterTask(task);

    await this.taskModel.findByIdAndDelete(id).exec();
    return { id, message: 'Hạ tải và xóa vết cấu hình Bot thành công' };
  }

  async triggerTestRun(id: string): Promise<any> {
    const task = await this.findOne(id);
    await this.schedulerService.triggerImmediateTestRun(task);
    return {
      taskId: id,
      message:
        'Lệnh chạy thử (Test Run) đã được phát hỏa thành công xuống hàng đợi khẩn cấp.',
    };
  }
}
