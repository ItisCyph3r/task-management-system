import { DataSource } from 'typeorm';
import { User, UserRole } from '../../user/entities/user.entity';
import { Task, TaskPriority, TaskStatus } from '../../task/entities/task.entity';
import * as bcrypt from 'bcrypt';

export async function seed(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const taskRepository = dataSource.getRepository(Task);

  // Clear existing data
  try {
    // Use query builder to delete all records
    await dataSource.createQueryBuilder()
      .delete()
      .from(Task)
      .execute();
    
    await dataSource.createQueryBuilder()
      .delete()
      .from(User)
      .execute();
      
    console.log('Existing data cleared successfully');
  } catch (error) {
    console.error('Error clearing existing data:', error);
  }

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await userRepository.save({
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    password: adminPassword,
    role: UserRole.ADMIN,
    isActive: true,
  });

  // Create regular users
  const userPassword = await bcrypt.hash('User123!', 10);
  const user1 = await userRepository.save({
    email: 'user1@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: userPassword,
    role: UserRole.USER,
    isActive: true,
  });

  const user2 = await userRepository.save({
    email: 'user2@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    password: userPassword,
    role: UserRole.USER,
    isActive: true,
  });

  // Create tasks
  const tasks = [
    {
      title: 'Implement Authentication',
      description: 'Implement JWT authentication for the API',
      assignedToId: user1.id,
      createdById: admin.id,
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-06-05'),
      completedAt: new Date('2025-05-28'),
    },
    {
      title: 'Create User Management',
      description: 'Implement user CRUD operations',
      assignedToId: user1.id,
      createdById: admin.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2025-06-10'),
    },
    {
      title: 'Design Database Schema',
      description: 'Create database schema for the application',
      assignedToId: user2.id,
      createdById: admin.id,
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-05-25'),
      completedAt: new Date('2025-05-23'),
    },
    {
      title: 'Implement Task API',
      description: 'Create REST API for task management',
      assignedToId: user2.id,
      createdById: user1.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2025-06-15'),
    },
    {
      title: 'Write Unit Tests',
      description: 'Create unit tests for all services',
      assignedToId: user1.id,
      createdById: user2.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: new Date('2025-06-20'),
    },
  ];

  for (const taskData of tasks) {
    await taskRepository.save(taskData);
  }

  console.log('Seed data created successfully');
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5029'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'task_management',
    entities: [User, Task],
    synchronize: false,
  });

  dataSource.initialize()
    .then(() => seed(dataSource))
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during seeding:', error);
      process.exit(1);
    });
}
