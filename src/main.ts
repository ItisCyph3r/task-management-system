import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  
  app.setGlobalPrefix(apiPrefix);
  
  // Configure CORS to allow credentials (cookies)
  app.enableCors({
    origin: true, // Allow requests from any origin in development
    credentials: true, // Allow cookies to be sent with requests
  });
  
  app.use(helmet());
  
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('RESTful API for a task management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  
  // Start the server
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
