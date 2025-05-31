# Task Management Flow Diagrams

This document illustrates the key task management workflows in the system.

## Task Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant TaskController
    participant TaskService
    participant UserService
    participant TaskRepository
    participant Database

    Client->>TaskController: POST /tasks (createTaskDto)
    TaskController->>TaskService: create(createTaskDto, userId)
    TaskService->>UserService: findOne(assignedToId)
    UserService->>Database: Query user by ID
    Database-->>UserService: Return user data
    UserService-->>TaskService: Return user entity
    TaskService->>TaskRepository: create(taskData)
    TaskRepository->>Database: Insert task
    Database-->>TaskRepository: Return created task
    TaskRepository-->>TaskService: Return task entity
    TaskService-->>TaskController: Return task response
    TaskController-->>Client: Return created task
```

## Task Retrieval Flow

```mermaid
sequenceDiagram
    participant Client
    participant TaskController
    participant TaskService
    participant TaskRepository
    participant Database

    Client->>TaskController: GET /tasks (with filters & pagination)
    TaskController->>TaskService: findAll(userId, role, filters, pagination)
    TaskService->>TaskRepository: findAllWithFilters(...)
    TaskRepository->>Database: Query tasks with filters
    Database-->>TaskRepository: Return tasks & count
    TaskRepository-->>TaskService: Return tasks & count
    TaskService-->>TaskController: Return task responses
    TaskController-->>Client: Return paginated tasks
```

## Task Update Flow

```mermaid
sequenceDiagram
    participant Client
    participant TaskController
    participant TaskService
    participant UserService
    participant TaskRepository
    participant Database

    Client->>TaskController: PATCH /tasks/:id (updateTaskDto)
    TaskController->>TaskService: update(id, updateTaskDto, userId, role)
    TaskService->>TaskRepository: findTaskById(id)
    TaskRepository->>Database: Query task by ID
    Database-->>TaskRepository: Return task data
    TaskRepository-->>TaskService: Return task entity
    TaskService->>TaskService: Check user permissions
    
    alt Updating assignedTo
        TaskService->>UserService: findOne(newAssignedToId)
        UserService->>Database: Query user by ID
        Database-->>UserService: Return user data
        UserService-->>TaskService: Return user entity
    end
    
    TaskService->>TaskRepository: update(id, updateTaskDto)
    TaskRepository->>Database: Update task
    Database-->>TaskRepository: Return updated task
    TaskRepository-->>TaskService: Return task entity
    TaskService-->>TaskController: Return task response
    TaskController-->>Client: Return updated task
```

## Task Deletion Flow (Soft Delete)

```mermaid
sequenceDiagram
    participant Client
    participant TaskController
    participant TaskService
    participant TaskRepository
    participant Database

    Client->>TaskController: DELETE /tasks/:id
    TaskController->>TaskService: remove(id, userId, role)
    TaskService->>TaskRepository: findTaskById(id)
    TaskRepository->>Database: Query task by ID
    Database-->>TaskRepository: Return task data
    TaskRepository-->>TaskService: Return task entity
    TaskService->>TaskService: Check user permissions
    TaskService->>TaskRepository: softDelete(id)
    TaskRepository->>Database: Set deletedAt timestamp
    Database-->>TaskRepository: Confirm deletion
    TaskRepository-->>TaskService: Return success
    TaskService-->>TaskController: Return success
    TaskController-->>Client: Return 204 No Content
```
