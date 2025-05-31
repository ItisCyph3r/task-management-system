# Task Management System

## Overview

This is a RESTful API for a Task Management System built with NestJS, TypeORM, and PostgreSQL. The system allows users to create, update, and manage tasks with different statuses and priorities. It includes authentication, authorization, and comprehensive API documentation.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Setup](#project-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment Considerations](#deployment-considerations)
- [Architecture Decisions](#architecture-decisions)

## Features

- **User Management**: Create and manage users with different roles (ADMIN, USER)
- **Task Management**: Create, update, delete, and view tasks
- **Authentication**: JWT-based authentication with login/logout functionality
- **Authorization**: Role-based access control (RBAC) for different endpoints
- **Filtering and Pagination**: Filter tasks by status, priority, and paginate results
- **Swagger Documentation**: Comprehensive API documentation
- **Database Migrations**: Proper database schema migrations
- **Caching**: Redis integration for improved performance
- **Security**: Rate limiting, CORS configuration, and security headers

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **Modules**: AuthModule, UserModule, TaskModule
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Abstract data access layer
- **Entities**: Define database schema
- **DTOs**: Data Transfer Objects for request/response validation
- **Guards**: Handle authorization
- **Decorators**: Custom decorators for role-based access control

## Project Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker and Docker Compose

### Installation

1. Clone the repository

```bash
$ git clone <repository-url>
$ cd task-management-system
```

2. Install dependencies

```bash
$ npm install
```

3. Copy the environment file

```bash
$ cp .env.example .env
```

4. Start the PostgreSQL and Redis containers

```bash
$ docker-compose up -d
```

5. Run database migrations

```bash
$ npm run migration:run
```

6. Seed the database (optional)

```bash
$ npm run seed
```

7. Start the application

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Environment Configuration

The application uses environment variables for configuration. See `.env.example` for all required variables.

Key environment variables:

- `NODE_ENV`: Environment (development, production)
- `PORT`: Application port
- `API_PREFIX`: API route prefix
- `DB_*`: Database connection details
- `JWT_*`: JWT authentication configuration
- `REDIS_*`: Redis cache configuration
- `THROTTLE_*`: Rate limiting configuration

## Database Setup

### Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Store user information
- **Tasks**: Store task information with relations to users

### Migrations

Database migrations are managed using TypeORM:

```bash
# Generate a new migration
$ npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
$ npm run migration:run

# Revert migrations
$ npm run migration:revert
```

## API Documentation

The API is documented using Swagger. After starting the application, you can access the Swagger UI at:

```
http://localhost:3000/api/docs
```

### Main Endpoints

#### Authentication
- `POST /api/auth/login`: User login
- `POST /api/auth/logout`: User logout

#### Users
- `GET /api/users`: Get all users (ADMIN only)
- `GET /api/users/:id`: Get user by ID
- `POST /api/users`: Create a new user (ADMIN only)

#### Tasks
- `GET /api/tasks`: Get all tasks (paginated, filterable)
- `GET /api/tasks/:id`: Get task by ID
- `POST /api/tasks`: Create a new task
- `PATCH /api/tasks/:id`: Update a task
- `DELETE /api/tasks/:id`: Delete a task

## Testing

The application includes unit tests and integration tests:

```bash
# Run all tests
$ npm run test

# Run tests with coverage
$ npm run test:cov

# Run e2e tests
$ npm run test:e2e
```

## Deployment Considerations

### Production Deployment

For production deployment, consider the following:

1. Use a process manager like PM2 to manage the Node.js process
2. Set up a reverse proxy (Nginx, Apache) in front of the application
3. Configure SSL/TLS for secure communication
4. Set up proper logging and monitoring
5. Use a CI/CD pipeline for automated testing and deployment

### Scaling

The application can be scaled horizontally by:

1. Running multiple instances behind a load balancer
2. Using a shared Redis instance for caching and session management
3. Optimizing database queries and adding appropriate indexes
4. Implementing database connection pooling

## Architecture Decisions

### Repository Pattern

The application uses the Repository pattern to abstract data access logic. This provides several benefits:

- Separation of concerns
- Easier testing with mock repositories
- Consistent data access patterns
- Centralized query logic

### DTOs and Validation

Data Transfer Objects (DTOs) are used for request/response validation and transformation. This ensures:

- Input validation with meaningful error messages
- Consistent API responses
- Type safety throughout the application

### Role-Based Access Control

The application implements RBAC using custom decorators and guards. This allows:

- Fine-grained access control based on user roles
- Declarative permission checks using decorators
- Centralized authorization logic in guards

### Error Handling

The application uses a consistent error handling approach with:

- HTTP exception filters
- Proper HTTP status codes
- Meaningful error messages
- Validation error formatting

### Soft Delete

The application implements soft delete for tasks, which:

- Preserves data for auditing purposes
- Allows for data recovery if needed
- Maintains referential integrity

## License

This project is licensed under the MIT License.
