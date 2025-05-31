import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskPriority, TaskStatus } from '../entities/task.entity';
import { Type } from 'class-transformer';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement API',
    required: false,
  })
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Implement the REST API for the task management system',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'User ID assigned to the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID('4', { message: 'Assigned user ID must be a valid UUID' })
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
    required: false,
  })
  @IsEnum(TaskStatus, { message: 'Status must be a valid task status' })
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
    required: false,
  })
  @IsEnum(TaskPriority, { message: 'Priority must be a valid task priority' })
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Task due date',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDate({ message: 'Due date must be a valid date' })
  @Type(() => Date)
  dueDate?: Date;

  @ApiProperty({
    description: 'Task completion date',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDate({ message: 'Completed at must be a valid date' })
  @Type(() => Date)
  completedAt?: Date;
}
