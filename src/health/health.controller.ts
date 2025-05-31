import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({ status: 503, description: 'Application is not healthy' })
  check() {
    const appUrl = this.configService.get<string>('APP_URL');
    
    return this.health.check([
      // Database health check
      () => this.db.pingCheck('database'),
      
      // Self-check
      () => this.http.pingCheck('self', `${appUrl}/api/health/ping`),
      
      // Memory usage check
      () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024), // 250MB
      
      // Disk space check
      () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }), // 90% threshold
    ]);
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping endpoint' })
  @ApiResponse({ status: 200, description: 'Pong' })
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
