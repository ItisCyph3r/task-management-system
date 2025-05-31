import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from '../entities/task.entity';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class TaskRepository extends BaseRepository<Task> {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {
    super(taskRepository);
  }

  async findAllWithFilters(
    userId?: string,
    status?: TaskStatus,
    priority?: TaskPriority,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Task[], number]> {
    const query = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.createdBy', 'createdBy');

    if (userId) {
      query.andWhere('(task.assignedToId = :userId OR task.createdById = :userId)', { userId });
    }

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }

    query.orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  async findTaskById(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy'],
    });
  }

  async findTasksByUserId(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: [
        { assignedToId: userId },
        { createdById: userId },
      ],
      relations: ['assignedTo', 'createdBy'],
    });
  }
}
