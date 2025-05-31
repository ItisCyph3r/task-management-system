import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Task } from '../../task/entities/task.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @Column({ unique: true })
  @Index()
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Column()
  lastName: string;

  @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.USER })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @ApiProperty({ description: 'User active status', example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'User creation date', example: '2023-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'User last update date', example: '2023-01-01T00:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.assignedTo)
  assignedTasks: Task[];

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
