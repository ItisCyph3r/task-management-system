import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskPriority, TaskStatus } from '../entities/task.entity';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement API',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Implement the REST API for the task management system',
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({
    description: 'User ID assigned to the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Assigned user ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Assigned user ID is required' })
  assignedToId: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.TODO,
    default: TaskStatus.TODO,
  })
  @IsEnum(TaskStatus, { message: 'Status must be a valid task status' })
  @IsOptional()
  status?: TaskStatus = TaskStatus.TODO;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
    default: TaskPriority.MEDIUM,
  })
  @IsEnum(TaskPriority, { message: 'Priority must be a valid task priority' })
  @IsOptional()
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @ApiProperty({
    description: 'Task due date',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDate({ message: 'Due date must be a valid date' })
  @Type(() => Date)
  dueDate?: Date;
}
