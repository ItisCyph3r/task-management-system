import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    
    const httpStatus =
      exception instanceof Error
        ? HttpStatus.INTERNAL_SERVER_ERROR
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const path = httpAdapter.getRequestUrl(ctx.getRequest());
    const method = httpAdapter.getRequestMethod(ctx.getRequest());
    const timestamp = new Date().toISOString();
    
    const responseBody = {
      statusCode: httpStatus,
      timestamp,
      path,
      method,
      message: 'Internal server error',
    };

    if (exception instanceof Error) {
      responseBody.message = exception.message;
      this.logger.error(
        `${method} ${path} ${httpStatus} - ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `${method} ${path} ${httpStatus} - Unknown error`,
        JSON.stringify(exception),
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
