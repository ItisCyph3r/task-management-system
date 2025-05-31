import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('tasks')
export class Task {
  @ApiProperty({ description: 'Unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Task title', example: 'Implement API' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Task description', example: 'Implement the REST API for the task management system' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'User ID assigned to the task', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column()
  @Index()
  assignedToId: string;

  @ApiProperty({ description: 'User assigned to the task' })
  @ManyToOne(() => User, (user) => user.assignedTasks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @ApiProperty({ description: 'User ID who created the task', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column()
  @Index()
  createdById: string;

  @ApiProperty({ description: 'User who created the task' })
  @ManyToOne(() => User, (user) => user.createdTasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ApiProperty({ description: 'Task status', enum: TaskStatus, example: TaskStatus.TODO })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  @Index()
  status: TaskStatus;

  @ApiProperty({ description: 'Task priority', enum: TaskPriority, example: TaskPriority.MEDIUM })
  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @Index()
  priority: TaskPriority;

  @ApiProperty({ description: 'Task due date', example: '2023-01-01T00:00:00Z', required: false })
  @Column({ nullable: true })
  dueDate: Date;

  @ApiProperty({ description: 'Task completion date', example: '2023-01-01T00:00:00Z', required: false })
  @Column({ nullable: true })
  completedAt: Date;

  @ApiProperty({ description: 'Task creation date', example: '2023-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Task last update date', example: '2023-01-01T00:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Task deletion date', example: '2023-01-01T00:00:00Z', required: false })
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
