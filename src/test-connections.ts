import { createClient } from 'redis';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRedisConnection() {
  console.log('Testing Redis connection...');
  
  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6029'),
    }
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis Error:', err);
  });
  
  redisClient.on('connect', () => {
    console.log('Successfully connected to Redis!');
  });
  
  try {
    await redisClient.connect();
    
    // Test setting and getting a value
    await redisClient.set('test-key', 'Connection test successful');
    const value = await redisClient.get('test-key');
    console.log('Redis test value:', value);
    
    await redisClient.quit();
    console.log('Redis connection test completed successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
}

async function testPostgresConnection() {
  console.log('Testing PostgreSQL connection...');
  
  const pgClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5029'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'task_management',
    connectionTimeoutMillis: 5000,
  });
  
  try {
    await pgClient.connect();
    console.log('Successfully connected to PostgreSQL!');
    
    const result = await pgClient.query('SELECT NOW() as current_time');
    console.log('PostgreSQL current time:', result.rows[0].current_time);
    
    await pgClient.end();
    console.log('PostgreSQL connection test completed successfully');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
  }
}

async function runTests() {
  console.log('Starting connection tests...');
  console.log('Environment variables:');
  console.log(`REDIS_HOST: ${process.env.REDIS_HOST}`);
  console.log(`REDIS_PORT: ${process.env.REDIS_PORT}`);
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_PORT: ${process.env.DB_PORT}`);
  
  await testRedisConnection();
  await testPostgresConnection();
  
  console.log('All connection tests completed');
}

runTests().catch(console.error);
