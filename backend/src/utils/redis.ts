/**
 * AnimaGen Backend - Redis Utility Module
 * 
 * This module provides Redis connection utilities for the AnimaGen backend application.
 * It handles connection creation, testing, and error handling.
 */

import Redis, { Redis as RedisClient } from 'ioredis';
import config from '../config';

// Redis connection options type
interface RedisConnectionOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number | null;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  retryStrategy?: (times: number) => number | null;
  // BullMQ specific
  enableReadyCheck?: boolean;
}

/**
 * Default Redis connection options
 */
const defaultRedisOptions: RedisConnectionOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  db: config.redis.db,
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
  enableOfflineQueue: config.redis.enableOfflineQueue,
  connectTimeout: 10000, // 10 seconds
  retryStrategy: (times: number) => {
    // Exponential backoff with max 30 seconds
    const delay = Math.min(Math.pow(2, times) * 1000, 30000);
    console.log(`⏱️ Redis connection retry in ${delay}ms (attempt ${times})`);
    return delay;
  }
};

/**
 * Creates a Redis connection with the specified options
 * @param options Redis connection options (optional, uses defaults if not provided)
 * @returns Redis client instance
 */
export function createRedisConnection(options?: Partial<RedisConnectionOptions>): RedisClient {
  try {
    const connectionOptions = { ...defaultRedisOptions, ...options };
    const redis: RedisClient = new Redis(connectionOptions);
    
    // Set up event handlers
    redis.on('connect', () => {
      console.log('🔌 Redis connected');
    });
    
    redis.on('ready', () => {
      console.log('✅ Redis ready');
    });
    
    redis.on('error', (err: Error) => {
      console.error('❌ Redis error:', err.message);
      // Don't crash the application on Redis errors
    });
    
    redis.on('close', () => {
      console.log('🔌 Redis connection closed');
    });
    
    redis.on('reconnecting', (delay: number) => {
      console.log(`⏱️ Redis reconnecting in ${delay}ms`);
    });
    
    return redis;
  } catch (error) {
    console.error('❌ Failed to create Redis connection:', (error as Error).message);
    throw error;
  }
}

/**
 * Tests if Redis is available
 * @returns Promise resolving to true if Redis is available, false otherwise
 */
export async function testRedisConnection(): Promise<boolean> {
  let redis: RedisClient | null = null;
  
  try {
    // Create a connection with shorter timeout for testing
    redis = createRedisConnection({
      connectTimeout: 5000, // 5 seconds
      retryStrategy: () => null // No retries for testing
    });
    
    // Test connection with a simple ping
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    console.warn('⚠️ Redis connection test failed:', (error as Error).message);
    return false;
  } finally {
    // Always close the connection after testing
    if (redis) {
      try {
        await redis.quit();
      } catch (error) {
        console.warn('⚠️ Error closing Redis test connection:', (error as Error).message);
      }
    }
  }
}

/**
 * Creates a Redis connection for BullMQ
 * @returns Redis client instance configured for BullMQ
 */
export function createQueueConnection(): RedisClient {
  return createRedisConnection({
    // BullMQ specific options
    maxRetriesPerRequest: null, // BullMQ handles retries itself
    enableReadyCheck: false // Recommended for BullMQ
  });
}

/**
 * Safely closes a Redis connection
 * @param redis Redis client instance
 * @returns Promise resolving when connection is closed
 */
export async function closeRedisConnection(redis: RedisClient): Promise<void> {
  try {
    await redis.quit();
    console.log('✅ Redis connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing Redis connection:', (error as Error).message);
    // Force disconnect if quit fails
    redis.disconnect();
  }
}

export default {
  createRedisConnection,
  testRedisConnection,
  createQueueConnection,
  closeRedisConnection
};
