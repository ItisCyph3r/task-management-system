import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TaskModule } from './task/task.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('DB_HOST');
        const port = configService.get('DB_PORT');
        const username = configService.get('DB_USERNAME');
        const password = configService.get('DB_PASSWORD');
        const database = configService.get('DB_DATABASE');
        
        console.log(`Configuring database connection with host=${host}, port=${port}, database=${database}`);
        
        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
          logging: configService.get('NODE_ENV') === 'development',
          poolSize: 10,
          connectTimeoutMS: 20000,
          maxQueryExecutionTime: 10000,
          // Add retry logic for connection
          retryAttempts: 10,
          retryDelay: 3000,
          keepConnectionAlive: true,
          // Add SSL configuration if needed
          // ssl: configService.get('NODE_ENV') === 'production',
          extra: {
            // Additional PostgreSQL client options
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
            connectionTimeoutMillis: 20000, // Maximum time to wait for a connection from the pool
          },
        };
      },
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ([
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60),
          limit: configService.get<number>('THROTTLE_LIMIT', 10),
        },
      ]),
    }),
    
    // Redis cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        try {
          const host = configService.get<string>('REDIS_HOST');
          const port = configService.get<number>('REDIS_PORT');
          const ttl = configService.get<number>('REDIS_TTL', 3600);
          
          console.log(`Configuring Redis cache with host=${host}, port=${port}, ttl=${ttl}`);
          
          // Create Redis store with more explicit configuration
          const store = await redisStore({
            socket: {
              host,
              port,
              reconnectStrategy: (retries) => {
                console.log(`Redis reconnection attempt ${retries}`);
                return Math.min(retries * 50, 2000);
              }
            },
            ttl,
            disableReconnecting: false,
            retryStrategy: (times) => {
              console.log(`Redis retry attempt ${times}`);
              return Math.min(times * 50, 2000);
            },
            // Add event handlers for the Redis client
            // These will be attached to the underlying Redis client
            onClientCreated: (client) => {
              client.on('error', (err) => {
                console.error('Redis client error:', err);
              });
              client.on('connect', () => {
                console.log('Redis client connected');
              });
              client.on('reconnecting', () => {
                console.log('Redis client reconnecting');
              });
            }
          });
          
          return {
            store,
            ttl,
          };
        } catch (error) {
          console.error('Error configuring Redis cache:', error);
          // Return a fallback configuration that won't crash the app
          // This allows the app to start even if Redis is unavailable
          return {
            ttl: 300, // 5 minutes default TTL
            // No store means it will use memory cache as fallback
          };
        }
      },
    }),
    
    // Application modules
    AuthModule,
    UserModule,
    TaskModule,
    HealthModule,
  ],
})
export class AppModule {}
