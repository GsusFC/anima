/**
 * Feature Configuration
 * 
 * Controls which features are enabled in the AnimaGen backend.
 */

module.exports = {
  // Queue system configuration
  queue: {
    enabled: process.env.REDIS_URL ? true : false,
    redis: {
      url: process.env.REDIS_URL || null,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false
    },
    jobs: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  },

  // Export features
  export: {
    enabled: true,
    formats: {
      mp4: true,
      gif: true,
      webm: true,
      mov: true
    },
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxDuration: 300, // 5 minutes
    concurrent: 2 // Max concurrent exports
  },

  // Upload features
  upload: {
    enabled: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB per file
    maxFiles: 50, // Max files per upload
    allowedTypes: {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      videos: ['mp4', 'mov', 'avi', 'webm', 'mkv']
    }
  },

  // Preview features
  preview: {
    enabled: true,
    quality: 'medium',
    maxDuration: 30, // 30 seconds max for previews
    cacheEnabled: true,
    cacheTTL: 3600 // 1 hour
  },

  // Figma integration
  figma: {
    enabled: true,
    maxFrames: 100,
    defaultScale: 2,
    formats: ['png', 'jpg'],
    timeout: 30000 // 30 seconds
  },

  // Development features
  development: {
    mockMode: process.env.NODE_ENV === 'development',
    verboseLogging: process.env.NODE_ENV === 'development',
    skipValidation: false
  },

  // Performance monitoring
  monitoring: {
    enabled: true,
    memoryInterval: 300000, // 5 minutes
    diskSpaceCheck: true,
    performanceMetrics: process.env.NODE_ENV === 'production'
  }
};
