import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpException, 
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    
    const errorResponse = exception.getResponse();
    const errorMessage = typeof errorResponse === 'object' && 'message' in errorResponse
      ? errorResponse['message']
      : exception.message;
    
    const path = request.url;
    const timestamp = new Date().toISOString();
    const method = request.method;
    
    const responseBody = {
      statusCode: status,
      timestamp,
      path,
      method,
      message: errorMessage,
    };
    
    this.logger.error(
      `${method} ${path} ${status} - ${JSON.stringify(errorMessage)}`,
      exception.stack,
    );
    
    response.status(status).json(responseBody);
  }
}
