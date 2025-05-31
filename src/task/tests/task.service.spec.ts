import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from '../task.service';
import { TaskRepository } from '../repositories/task.repository';
import { UserService } from '../../user/user.service';
import { Task, TaskPriority, TaskStatus } from '../entities/task.entity';
import { UserRole } from '../../user/entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: TaskRepository;
  let userService: UserService;

  const mockTaskRepository = {
    findAllWithFilters: jest.fn(),
    findTaskById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: TaskRepository,
          useValue: mockTaskRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<TaskRepository>(TaskRepository);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tasks for admin users', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Test Task',
          description: 'Test Description',
          assignedToId: 'user1',
          createdById: 'admin1',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      mockTaskRepository.findAllWithFilters.mockResolvedValue([mockTasks, 1]);
      
      const result = await service.findAll('admin1', UserRole.ADMIN);
      
      expect(result).toEqual([expect.any(Array), 1]);
      expect(mockTaskRepository.findAllWithFilters).toHaveBeenCalledWith(
        undefined, // filterUserId is undefined for admin
        undefined, // status
        undefined, // priority
        1, // page
        10, // limit
      );
    });

    it('should filter tasks for regular users', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Test Task',
          description: 'Test Description',
          assignedToId: 'user1',
          createdById: 'admin1',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      mockTaskRepository.findAllWithFilters.mockResolvedValue([mockTasks, 1]);
      
      const result = await service.findAll('user1', UserRole.USER);
      
      expect(result).toEqual([expect.any(Array), 1]);
      expect(mockTaskRepository.findAllWithFilters).toHaveBeenCalledWith(
        'user1', // filterUserId is set for regular users
        undefined, // status
        undefined, // priority
        1, // page
        10, // limit
      );
    });
  });

  describe('findOne', () => {
    it('should return a task if found and user is admin', async () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        assignedToId: 'user1',
        createdById: 'admin1',
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      
      const result = await service.findOne('1', 'admin1', UserRole.ADMIN);
      
      expect(result).toBeDefined();
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
    });

    it('should return a task if found and user is assigned to it', async () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        assignedToId: 'user1',
        createdById: 'admin1',
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      
      const result = await service.findOne('1', 'user1', UserRole.USER);
      
      expect(result).toBeDefined();
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(null);
      
      await expect(service.findOne('1', 'admin1', UserRole.ADMIN)).rejects.toThrow(NotFoundException);
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        assignedToId: 'user1',
        createdById: 'admin1',
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      
      await expect(service.findOne('1', 'user2', UserRole.USER)).rejects.toThrow(ForbiddenException);
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        assignedToId: 'user1',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
      };
      
      const mockTask = {
        id: '1',
        ...createTaskDto,
        createdById: 'admin1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserService.findOne.mockResolvedValue({ id: 'user1' });
      mockTaskRepository.create.mockResolvedValue(mockTask);
      
      const result = await service.create(createTaskDto, 'admin1');
      
      expect(result).toBeDefined();
      expect(mockUserService.findOne).toHaveBeenCalledWith(createTaskDto.assignedToId);
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        createdById: 'admin1',
      });
    });
  });

  describe('update', () => {
    it('should update a task if user is admin', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
      };
      
      const mockTask = {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        assignedToId: 'user1',
        createdById: 'admin1',
        status: TaskStatus.TODO,
      };
      
      const updatedMockTask = {
        ...mockTask,
        ...updateTaskDto,
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.update.mockResolvedValue(updatedMockTask);
      
      const result = await service.update('1', updateTaskDto, 'admin1', UserRole.ADMIN);
      
      expect(result).toBeDefined();
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.update).toHaveBeenCalledWith('1', updateTaskDto);
    });

    it('should update a task if user is assigned to it', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
      };
      
      const mockTask = {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        assignedToId: 'user1',
        createdById: 'admin1',
        status: TaskStatus.TODO,
      };
      
      const updatedMockTask = {
        ...mockTask,
        ...updateTaskDto,
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.update.mockResolvedValue(updatedMockTask);
      
      const result = await service.update('1', updateTaskDto, 'user1', UserRole.USER);
      
      expect(result).toBeDefined();
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.update).toHaveBeenCalledWith('1', updateTaskDto);
    });

    it('should set completedAt when status changes to COMPLETED', async () => {
      const updateTaskDto: UpdateTaskDto = {
        status: TaskStatus.COMPLETED,
      };
      
      const mockTask = {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        assignedToId: 'user1',
        createdById: 'admin1',
        status: TaskStatus.IN_PROGRESS,
      };
      
      const updatedMockTask = {
        ...mockTask,
        ...updateTaskDto,
        completedAt: expect.any(Date),
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.update.mockResolvedValue(updatedMockTask);
      
      const result = await service.update('1', updateTaskDto, 'user1', UserRole.USER);
      
      expect(result).toBeDefined();
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.update).toHaveBeenCalledWith('1', {
        ...updateTaskDto,
        completedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(null);
      
      await expect(service.update('1', updateTaskDto, 'admin1', UserRole.ADMIN)).rejects.toThrow(NotFoundException);
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
      };
      
      const mockTask = {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        assignedToId: 'user1',
        createdById: 'admin1',
        status: TaskStatus.TODO,
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      
      await expect(service.update('1', updateTaskDto, 'user2', UserRole.USER)).rejects.toThrow(ForbiddenException);
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a task if user is admin', async () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        assignedToId: 'user1',
        createdById: 'admin1',
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.softDelete.mockResolvedValue(undefined);
      
      await service.remove('1', 'admin1', UserRole.ADMIN);
      
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.softDelete).toHaveBeenCalledWith('1');
    });

    it('should remove a task if user is the creator', async () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        assignedToId: 'user1',
        createdById: 'user2',
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.softDelete.mockResolvedValue(undefined);
      
      await service.remove('1', 'user2', UserRole.USER);
      
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.softDelete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(null);
      
      await expect(service.remove('1', 'admin1', UserRole.ADMIN)).rejects.toThrow(NotFoundException);
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        assignedToId: 'user1',
        createdById: 'admin1',
      };
      
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      
      await expect(service.remove('1', 'user2', UserRole.USER)).rejects.toThrow(ForbiddenException);
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
