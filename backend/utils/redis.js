const Redis = require('ioredis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000
};

// Create Redis connection for BullMQ
const createRedisConnection = () => {
  const redis = new Redis(redisConfig);
  
  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });
  
  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });
  
  redis.on('close', () => {
    console.log('🔌 Redis connection closed');
  });
  
  return redis;
};

// Test Redis connection
const testRedisConnection = async () => {
  const redis = createRedisConnection();
  try {
    await redis.ping();
    console.log('✅ Redis connection test successful');
    await redis.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    await redis.disconnect();
    return false;
  }
};

module.exports = {
  redisConfig,
  createRedisConnection,
  testRedisConnection
};
