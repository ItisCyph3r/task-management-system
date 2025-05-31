import { Injectable, NotFoundException, ForbiddenException, Inject, Logger } from '@nestjs/common';
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

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.log('TaskService initialized with Redis caching');
  }

  async findAll(
    userId: string,
    userRole: UserRole,
    status?: TaskStatus,
    priority?: TaskPriority,
    page: number = 1,
    limit: number = 10,
  ): Promise<[TaskResponseDto[], number]> {
    try {
      // Create a more descriptive cache key
      const cacheKey = `tms:tasks:list:user:${userId}:role:${userRole}:status:${status || 'all'}:priority:${priority || 'all'}:page:${page}:limit:${limit}`;
      
      this.logger.debug(`Checking cache for key: ${cacheKey}`);
      
      // Try to get from cache first
      let cachedData: [TaskResponseDto[], number] | undefined | null;
      try {
        cachedData = await this.cacheManager.get<[TaskResponseDto[], number]>(cacheKey);
      } catch (cacheError) {
        this.logger.error(`Cache retrieval error: ${cacheError.message}`);
        // Continue execution without cache
      }
      
      if (cachedData) {
        this.logger.debug(`Cache HIT for ${cacheKey}`);
        return cachedData;
      }
      
      this.logger.debug(`Cache MISS for ${cacheKey}, fetching from database`);
      
      // If not in cache, fetch from database
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
      
      const result: [TaskResponseDto[], number] = [taskResponses, count];
      
      // Store in cache for 5 minutes (300 seconds)
      try {
        this.logger.debug(`Storing in cache: ${cacheKey} (TTL: 300s)`);
        await this.cacheManager.set(cacheKey, result, 300);
      } catch (cacheError) {
        this.logger.error(`Cache storage error: ${cacheError.message}`);
        // Continue execution even if cache storage fails
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<TaskResponseDto> {
    try {
      // Create a more descriptive cache key for this specific task and user
      const cacheKey = `tms:task:detail:id:${id}:user:${userId}:role:${userRole}`;
      
      this.logger.debug(`Checking cache for key: ${cacheKey}`);
      
      // Try to get from cache first
      let cachedTask: TaskResponseDto | undefined | null;
      try {
        cachedTask = await this.cacheManager.get<TaskResponseDto>(cacheKey);
      } catch (cacheError) {
        this.logger.error(`Cache retrieval error: ${cacheError.message}`);
        // Continue execution without cache
      }
      
      if (cachedTask) {
        this.logger.debug(`Cache HIT for ${cacheKey}`);
        return cachedTask;
      }
      
      this.logger.debug(`Cache MISS for ${cacheKey}, fetching from database`);
      
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
      try {
        this.logger.debug(`Storing in cache: ${cacheKey} (TTL: 300s)`);
        await this.cacheManager.set(cacheKey, taskResponse, 300);
      } catch (cacheError) {
        this.logger.error(`Cache storage error: ${cacheError.message}`);
        // Continue execution even if cache storage fails
      }
      
      return taskResponse;
    } catch (error) {
      this.logger.error(`Error in findOne: ${error.message}`);
      throw error;
    }
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
    this.logger.debug(`Invalidating cache for task ID: ${taskId}`);
    
    // Get all users from the database to invalidate their specific cache keys
    try {
      // Get all users to invalidate their specific cache keys
      const [users, _] = await this.userService.findAll();
      
      for (const user of users) {
        for (const role of Object.values(UserRole)) {
          // Create the specific cache key format we used in findOne
          const cacheKey = `tms:task:detail:id:${taskId}:user:${user.id}:role:${role}`;
          this.logger.debug(`Invalidating cache key: ${cacheKey}`);
          await this.cacheManager.del(cacheKey);
        }
      }
    } catch (error) {
      this.logger.error(`Error invalidating task cache: ${error.message}`);
    }
  }
  
  /**
   * Helper method to invalidate task list cache for a user
   */
  private async invalidateTaskListCache(userId: string): Promise<void> {
    this.logger.debug(`Invalidating task list cache for user ID: ${userId}`);
    
    try {
      // Invalidate the most common combinations of cache keys
      for (const role of Object.values(UserRole)) {
        // Common page sizes
        const pageSizes = [10, 20, 50];
        const pages = [1, 2, 3]; // Most common pages
        
        // Invalidate combinations of status, priority, page and limit
        for (const page of pages) {
          for (const limit of pageSizes) {
            // All tasks (no filters)
            await this.cacheManager.del(`tms:tasks:list:user:${userId}:role:${role}:status:all:priority:all:page:${page}:limit:${limit}`);
            
            // Tasks by status
            for (const status of Object.values(TaskStatus)) {
              await this.cacheManager.del(`tms:tasks:list:user:${userId}:role:${role}:status:${status}:priority:all:page:${page}:limit:${limit}`);
              
              // Tasks by status and priority
              for (const priority of Object.values(TaskPriority)) {
                await this.cacheManager.del(`tms:tasks:list:user:${userId}:role:${role}:status:${status}:priority:${priority}:page:${page}:limit:${limit}`);
              }
            }
            
            // Tasks by priority only
            for (const priority of Object.values(TaskPriority)) {
              await this.cacheManager.del(`tms:tasks:list:user:${userId}:role:${role}:status:all:priority:${priority}:page:${page}:limit:${limit}`);
            }
          }
        }
      }
      
      this.logger.debug(`Task list cache invalidation completed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating task list cache: ${error.message}`);
    }
  }
}
