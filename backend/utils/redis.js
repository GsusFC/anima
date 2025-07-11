const Redis = require('ioredis');

// Redis connection configuration
let redisConfig;

if (process.env.REDIS_URL) {
  // Railway/cloud Redis URL format: redis://user:pass@host:port
  redisConfig = process.env.REDIS_URL;
} else {
  // Local Redis configuration
  redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null, // Fix BullMQ deprecation warning
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 120000, // Increased to 120 seconds for heavy operations
    family: 4 // Force IPv4
  };
}

// Create Redis connection for BullMQ
const createRedisConnection = () => {
  const redis = new Redis(redisConfig);
  
  redis.on('connect', () => {
    console.log('✅ Redis connected');
    if (process.env.NODE_ENV === 'production') {
      console.log('🌐 Redis connection established in production');
    }
  });
  
  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production Redis error - job queue may be disabled');
    }
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
