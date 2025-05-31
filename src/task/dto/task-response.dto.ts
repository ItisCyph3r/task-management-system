import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { TaskPriority, TaskStatus } from '../entities/task.entity';
import { UserResponseDto } from '../../user/dto/user-response.dto';

@Exclude()
export class TaskResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Task ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Task title',
    example: 'Implement API',
  })
  title: string;

  @Expose()
  @ApiProperty({
    description: 'Task description',
    example: 'Implement the REST API for the task management system',
  })
  description: string;

  @Expose()
  @ApiProperty({
    description: 'User ID assigned to the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  assignedToId: string;

  @Expose()
  @ApiProperty({
    description: 'User assigned to the task',
    type: UserResponseDto,
  })
  @Type(() => UserResponseDto)
  assignedTo: UserResponseDto;

  @Expose()
  @ApiProperty({
    description: 'User ID who created the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  createdById: string;

  @Expose()
  @ApiProperty({
    description: 'User who created the task',
    type: UserResponseDto,
  })
  @Type(() => UserResponseDto)
  createdBy: UserResponseDto;

  @Expose()
  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Expose()
  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Expose()
  @ApiProperty({
    description: 'Task due date',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  dueDate: Date;

  @Expose()
  @ApiProperty({
    description: 'Task completion date',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  completedAt: Date;

  @Expose()
  @ApiProperty({
    description: 'Task creation date',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'Task last update date',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<TaskResponseDto>) {
    Object.assign(this, partial);
  }
}
