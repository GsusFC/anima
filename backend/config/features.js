// Feature flags for AnimaGen
module.exports = {
  QUEUE_ENABLED: process.env.REDIS_URL ? true : false,
  PROCESSING_ENABLED: process.env.ENABLE_PROCESSING !== 'false',
  MOCK_MODE: process.env.MOCK_MODE === 'true',
  
  // Limits
  MAX_CONCURRENT_JOBS: parseInt(process.env.MAX_CONCURRENT_JOBS) || 3,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB
  MAX_DURATION: parseInt(process.env.MAX_DURATION) || 300, // 5 minutes
  
  // FFmpeg settings
  FFMPEG_THREAD_LIMIT: parseInt(process.env.FFMPEG_THREADS) || 4,
  PREVIEW_QUALITY: process.env.PREVIEW_QUALITY || 'fast'
};