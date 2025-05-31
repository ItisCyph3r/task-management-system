import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaskRepository } from './repositories/task.repository';
import { UserService } from '../user/user.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { plainToInstance } from 'class-transformer';
import { TaskPriority, TaskStatus } from './entities/task.entity';
import { UserRole } from '../user/entities/user.entity';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userService: UserService,
  ) {}

  async findAll(
    userId: string,
    userRole: UserRole,
    status?: TaskStatus,
    priority?: TaskPriority,
    page: number = 1,
    limit: number = 10,
  ): Promise<[TaskResponseDto[], number]> {
    // Only admins can see all tasks, users can only see their own tasks
    const filterUserId = userRole === UserRole.ADMIN ? undefined : userId;
    
    const [tasks, count] = await this.taskRepository.findAllWithFilters(
      filterUserId,
      status,
      priority,
      page,
      limit,
    );
    
    const taskResponses = tasks.map(task => 
      plainToInstance(TaskResponseDto, task, { excludeExtraneousValues: true })
    );
    
    return [taskResponses, count];
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findTaskById(id);
    
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    // Check if user has permission to view this task
    if (userRole !== UserRole.ADMIN && 
        task.assignedToId !== userId && 
        task.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to view this task');
    }
    
    return plainToInstance(TaskResponseDto, task, { excludeExtraneousValues: true });
  }

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<TaskResponseDto> {
    // Verify that the assigned user exists
    await this.userService.findOne(createTaskDto.assignedToId);
    
    // Create the task with the current user as the creator
    const task = await this.taskRepository.create({
      ...createTaskDto,
      createdById: userId,
    });
    
    return plainToInstance(TaskResponseDto, task, { excludeExtraneousValues: true });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: UserRole): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findTaskById(id);
    
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    // Check if user has permission to update this task
    if (userRole !== UserRole.ADMIN && 
        task.assignedToId !== userId && 
        task.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to update this task');
    }
    
    // If status is being updated to COMPLETED, set the completedAt date
    if (updateTaskDto.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      updateTaskDto.completedAt = new Date();
    }
    
    // If assigned user is being changed, verify that the new user exists
    if (updateTaskDto.assignedToId && updateTaskDto.assignedToId !== task.assignedToId) {
      await this.userService.findOne(updateTaskDto.assignedToId);
    }
    
    const updatedTask = await this.taskRepository.update(id, updateTaskDto);
    return plainToInstance(TaskResponseDto, updatedTask, { excludeExtraneousValues: true });
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const task = await this.taskRepository.findTaskById(id);
    
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    // Only admins or the creator of the task can delete it
    if (userRole !== UserRole.ADMIN && task.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }
    
    await this.taskRepository.softDelete(id);
  }
}
