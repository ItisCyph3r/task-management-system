import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    const apiPrefix = this.configService.get<string>('API_PREFIX', 'api');
    const swaggerUrl = `/${apiPrefix}/docs`;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Management System</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
          }
          .card {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .feature-list {
            list-style-type: none;
            padding-left: 0;
          }
          .feature-list li {
            margin-bottom: 10px;
            padding-left: 25px;
            position: relative;
          }
          .feature-list li:before {
            content: '✓';
            color: #27ae60;
            position: absolute;
            left: 0;
            font-weight: bold;
          }
          .btn {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            transition: background-color 0.3s;
          }
          .btn:hover {
            background-color: #2980b9;
          }
        </style>
      </head>
      <body>
        <h1>Task Management System</h1>
        
        <div class="card">
          <h2>About This Project</h2>
          <p>
            This is a RESTful API for a task management system built with NestJS.
            It provides endpoints for user authentication, task management, and more.
          </p>
        </div>
        
        <div class="card">
          <h2>Key Features</h2>
          <ul class="feature-list">
            <li>User authentication with JWT</li>
            <li>Task CRUD operations with filtering and pagination</li>
            <li>Role-based access control</li>
            <li>API versioning for backward compatibility</li>
            <li>Health check endpoints for monitoring</li>
          </ul>
        </div>
        
        <div class="card">
          <h2>API Documentation</h2>
          <p>
            Explore the API endpoints and test the functionality using our Swagger documentation.
          </p>
          <a href="${swaggerUrl}" class="btn">View API Docs</a>
        </div>
      </body>
      </html>
    `;
  }
}
