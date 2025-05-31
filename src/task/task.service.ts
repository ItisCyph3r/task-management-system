import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { TaskRepository } from './repositories/task.repository';
import { UserService } from '../user/user.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { plainToInstance } from 'class-transformer';
import { TaskPriority, TaskStatus } from './entities/task.entity';
import { UserRole } from '../user/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class TaskService {
  private redisClient;

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    // Initialize Redis client for pattern-based operations
    this.initRedisClient();
  }
  
  private async initRedisClient() {
    this.redisClient = createClient({
      socket: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      }
    });
    
    this.redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await this.redisClient.connect();
  }

  async findAll(
    userId: string,
    userRole: UserRole,
    status?: TaskStatus,
    priority?: TaskPriority,
    page: number = 1,
    limit: number = 10,
  ): Promise<[TaskResponseDto[], number]> {
    // Create a cache key based on the parameters
    const cacheKey = `tasks:${userId}:${userRole}:${status || 'all'}:${priority || 'all'}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedData = await this.cacheManager.get<[TaskResponseDto[], number]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch from database
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
    
    const result: [TaskResponseDto[], number] = [taskResponses, count];
    
    // Store in cache for 5 minutes (300 seconds)
    await this.cacheManager.set(cacheKey, result, 300);
    
    return result;
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<TaskResponseDto> {
    // Create a cache key for this specific task and user
    const cacheKey = `task:${id}:${userId}:${userRole}`;
    
    // Try to get from cache first
    const cachedTask = await this.cacheManager.get<TaskResponseDto>(cacheKey);
    if (cachedTask) {
      return cachedTask;
    }
    
    // If not in cache, fetch from database
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
    
    const taskResponse = plainToInstance(TaskResponseDto, task, { excludeExtraneousValues: true });
    
    // Store in cache for 5 minutes (300 seconds)
    await this.cacheManager.set(cacheKey, taskResponse, 300);
    
    return taskResponse;
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
    
    // Invalidate specific task cache
    await this.invalidateTaskCache(id);
    
    // Invalidate list cache for all involved users
    await this.invalidateTaskListCache(task.createdById);
    await this.invalidateTaskListCache(task.assignedToId);
    if (updateTaskDto.assignedToId && updateTaskDto.assignedToId !== task.assignedToId) {
      await this.invalidateTaskListCache(updateTaskDto.assignedToId);
    }
    
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
    
    // Invalidate specific task cache
    await this.invalidateTaskCache(id);
    
    // Invalidate list cache for both the creator and assignee
    await this.invalidateTaskListCache(task.createdById);
    await this.invalidateTaskListCache(task.assignedToId);
  }
  
  /**
   * Helper method to invalidate task cache by ID
   */
  private async invalidateTaskCache(taskId: string): Promise<void> {
    try {
      const pattern = `task:${taskId}:*`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        // Delete all matching keys in a single operation
        await this.redisClient.del(keys);
      }
    } catch (error) {
      console.error('Error invalidating task cache:', error);
      // Fallback to direct deletion of known keys
      await this.cacheManager.del(`task:${taskId}:${UserRole.ADMIN}`);
      await this.cacheManager.del(`task:${taskId}:${UserRole.USER}`);
    }
  }
  
  /**
   * Helper method to invalidate task list cache for a user
   */
  private async invalidateTaskListCache(userId: string): Promise<void> {
    try {
      // Delete all keys matching the pattern
      const pattern = `tasks:${userId}:*`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        // Delete all matching keys in a single operation
        await this.redisClient.del(keys);
      }
    } catch (error) {
      console.error('Error invalidating task list cache:', error);
      // Fallback to direct deletion of a few common keys
      await this.cacheManager.del(`tasks:${userId}:${UserRole.ADMIN}:all:all:1:10`);
      await this.cacheManager.del(`tasks:${userId}:${UserRole.USER}:all:all:1:10`);
    }
  }
}
