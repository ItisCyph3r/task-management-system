import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;
    
    // Debug logging
    this.logger.debug(`JWT Auth Guard - Request path: ${path}`);
    this.logger.debug(`JWT Auth Guard - Request cookies: ${JSON.stringify(request.cookies)}`);
    
    try {
      // Call the parent canActivate method
      const result = await super.canActivate(context);
      this.logger.debug(`JWT Auth Guard - Authentication successful for path: ${path}`);
      return result as boolean;
    } catch (error) {
      this.logger.error(`JWT Auth Guard - Authentication error: ${error.message}`);
      
      // Detailed error logging
      if (error instanceof UnauthorizedException) {
        this.logger.error(`JWT Auth Guard - Unauthorized: ${error.message}`);
      } else {
        this.logger.error(`JWT Auth Guard - Unexpected error: ${error.message}`);
      }
      
      throw error;
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      this.logger.error(`JWT Auth Guard - Error: ${err.message}`);
      throw new UnauthorizedException(`Authentication error: ${err.message}`);
    }
    
    if (!user) {
      this.logger.error('JWT Auth Guard - No user found');
      throw new UnauthorizedException('Invalid or expired token');
    }
    
    this.logger.debug(`JWT Auth Guard - User authenticated: ${user.id}`);
    return user;
  }
}
