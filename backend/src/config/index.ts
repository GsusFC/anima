/**
 * AnimaGen Backend - Configuration Module
 * 
 * This module centralizes all configuration settings for the AnimaGen backend application.
 * It handles environment variables, application settings, quality presets, and transition effects.
 */

import path from 'path';
import dotenv from 'dotenv';
import { 
  AppConfig, 
  QualityPresetsMap, 
  TransitionEffectsMap, 
  QualityPreset,
  ExportFormat
} from '../types';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable helper with type safety and default values
 * @param key Environment variable name
 * @param defaultValue Default value if not set
 * @returns The environment variable value or default
 */
const env = <T>(key: string, defaultValue: T): T => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  
  // Type conversion based on default value type
  if (typeof defaultValue === 'number') {
    return Number(value) as unknown as T;
  } else if (typeof defaultValue === 'boolean') {
    return (value.toLowerCase() === 'true') as unknown as T;
  }
  
  return value as unknown as T;
};

/**
 * Base directory for the application
 * This ensures paths are relative to the src directory in development
 * and relative to the dist directory in production
 */
export const BASE_DIR = path.resolve(__dirname, '..');

/**
 * Application configuration
 */
export const config: AppConfig = {
  // Server settings
  port: env<number>('PORT', 3002),
  env: env<string>('NODE_ENV', 'development'),
  
  // Directory paths
  outputDir: path.resolve(BASE_DIR, env<string>('OUTPUT_DIR', 'output')),
  tempDir: path.resolve(BASE_DIR, env<string>('TEMP_DIR', 'uploads')),
  compositionsDir: path.resolve(BASE_DIR, 'compositions'),
  logsDir: path.resolve(BASE_DIR, 'logs'),
  
  // File upload limits
  maxFileSize: env<number>('MAX_FILE_SIZE', 50 * 1024 * 1024), // 50MB
  maxFiles: env<number>('MAX_FILES', 50),
  
  // Video settings
  defaultFps: env<number>('DEFAULT_FPS', 30),
  
  // CORS settings
  corsOrigins: env<string>('CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:5178,http://localhost:5179,http://localhost:5180').split(','),
};

/**
 * Server timeout settings
 */
export const serverTimeouts = {
  // Server timeouts (in milliseconds)
  requestTimeout: 10 * 60 * 1000, // 10 minutes
  keepAliveTimeout: 5 * 60 * 1000, // 5 minutes
  headersTimeout: 6 * 60 * 1000, // 6 minutes (must be greater than keepAliveTimeout)
  
  // Endpoint-specific timeouts
  exportTimeout: 10 * 60 * 1000, // 10 minutes
  previewTimeout: 5 * 60 * 1000, // 5 minutes
};

/**
 * Quality presets for different output formats
 */
export const qualityPresets: QualityPresetsMap = {
  web: { 
    width: 720, 
    height: 480, 
    fps: config.defaultFps, 
    bitrate: '1M', 
    crf: 28 
  },
  standard: { 
    width: 1280, 
    height: 720, 
    fps: config.defaultFps, 
    bitrate: '2M', 
    crf: 23 
  },
  high: { 
    width: 1920, 
    height: 1080, 
    fps: config.defaultFps, 
    bitrate: '4M', 
    crf: 20 
  },
  premium: { 
    width: 1920, 
    height: 1080, 
    fps: 60, 
    bitrate: '8M', 
    crf: 18 
  },
  ultra: { 
    width: 3840, 
    height: 2160, 
    fps: 60, 
    bitrate: '20M', 
    crf: 16 
  }
};

/**
 * Transition effects mapping (using real FFmpeg xfade transitions)
 */
export const transitionEffects: TransitionEffectsMap = {
  none: 'none',
  cut: 'none', // Handle cut transitions as no transition
  
  // Basic fades
  fade: 'fade',
  fadeblack: 'fadeblack',
  fadewhite: 'fadewhite',
  dissolve: 'dissolve',
  
  // Slide transitions
  slideleft: 'slideleft',
  slideright: 'slideright',
  slideup: 'slideup',
  slidedown: 'slidedown',
  
  // Wipe transitions
  wipeleft: 'wipeleft',
  wiperight: 'wiperight',
  wipeup: 'wipeup',
  wipedown: 'wipedown',
  wipetl: 'wipetl',
  wipetr: 'wipetr',
  wipebl: 'wipebl',
  wipebr: 'wipebr',
  
  // Smooth transitions
  smoothleft: 'smoothleft',
  smoothright: 'smoothright',
  smoothup: 'smoothup',
  smoothdown: 'smoothdown',
  
  // Circle/Shape transitions
  circlecrop: 'circlecrop',
  rectcrop: 'rectcrop',
  circleopen: 'circleopen',
  circleclose: 'circleclose',
  
  // Open/Close transitions
  horzopen: 'horzopen',
  horzclose: 'horzclose',
  vertopen: 'vertopen',
  vertclose: 'vertclose',
  
  // Diagonal transitions
  diagbl: 'diagbl',
  diagbr: 'diagbr',
  diagtl: 'diagtl',
  diagtr: 'diagtr',
  
  // Advanced effects
  radial: 'radial',
  pixelize: 'pixelize',
  distance: 'distance',
  squeezev: 'squeezev',
  squeezeh: 'squeezeh',
  zoomin: 'zoomin',
  
  // Cover/Reveal transitions
  coverleft: 'coverleft',
  coverright: 'coverright',
  coverup: 'coverup',
  coverdown: 'coverdown',
  revealleft: 'revealleft',
  revealright: 'revealright',
  revealup: 'revealup',
  revealdown: 'revealdown',
  
  // Wind/Slice effects
  hlwind: 'hlwind',
  hrwind: 'hrwind',
  vuwind: 'vuwind',
  vdwind: 'vdwind',
  hlslice: 'hlslice',
  hrslice: 'hrslice',
  vuslice: 'vuslice',
  vdslice: 'vdslice',
  
  // Additional effects
  fadegrays: 'fadegrays',
  hblur: 'hblur',
  
  // Legacy compatibility mappings
  slide: 'slideleft', // Map legacy 'slide' to 'slideleft'
  zoom: 'zoomin' // Map legacy 'zoom' to 'zoomin'
};

/**
 * Default export settings
 */
export const defaultExportSettings = {
  format: ExportFormat.MP4,
  quality: QualityPreset.HIGH,
  fps: config.defaultFps,
  duration: 3000, // 3 seconds per frame (in milliseconds)
  loop: false,
  transitionDuration: 1000, // 1 second (in milliseconds)
  transitionType: 'fade',
  audio: {
    enabled: false,
    volume: 1.0,
    loop: true,
    fadeIn: 500, // 0.5 seconds (in milliseconds)
    fadeOut: 500 // 0.5 seconds (in milliseconds)
  },
  watermark: {
    enabled: false,
    position: 'bottomRight',
    opacity: 0.7,
    size: 0.1 // 10% of the frame size
  }
};

/**
 * File upload configuration
 */
export const uploadConfig = {
  // Image uploads
  images: {
    allowedTypes: /jpeg|jpg|png|gif|bmp|webp/,
    maxFileSize: config.maxFileSize,
    maxFiles: config.maxFiles
  },
  
  // Video uploads
  videos: {
    allowedTypes: /mp4|mov|webm|avi|mkv/,
    allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska', 'application/octet-stream'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 1
  }
};

/**
 * Redis configuration
 */
export const redisConfig = {
  host: env<string>('REDIS_HOST', 'localhost'),
  port: env<number>('REDIS_PORT', 6379),
  password: env<string>('REDIS_PASSWORD', ''),
  db: env<number>('REDIS_DB', 0),
  maxRetriesPerRequest: env<number>('REDIS_MAX_RETRIES', 10),
  enableOfflineQueue: env<boolean>('REDIS_ENABLE_OFFLINE_QUEUE', true)
};

/**
 * Job queue configuration
 */
export const jobQueueConfig = {
  queueName: 'video-processing',
  concurrency: env<number>('QUEUE_CONCURRENCY', 2),
  limiter: {
    max: env<number>('QUEUE_RATE_LIMIT_MAX', 5),
    duration: env<number>('QUEUE_RATE_LIMIT_DURATION', 60000) // 1 minute
  },
  removeOnComplete: {
    age: 24 * 60 * 60, // 24 hours (in seconds)
    count: 100 // Keep last 100 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60 // 7 days (in seconds)
  }
};

/**
 * Memory monitoring configuration
 */
export const memoryMonitoringConfig = {
  enabled: env<boolean>('MEMORY_MONITORING', true),
  interval: 5 * 60 * 1000, // 5 minutes (in milliseconds)
  warningThreshold: env<number>('MEMORY_WARNING_THRESHOLD', 500) // 500MB
};

/**
 * Export all configuration
 */
export default {
  app: config,
  server: serverTimeouts,
  quality: qualityPresets,
  transitions: transitionEffects,
  export: defaultExportSettings,
  upload: uploadConfig,
  redis: redisConfig,
  jobQueue: jobQueueConfig,
  memoryMonitoring: memoryMonitoringConfig,
  
  // Helper methods
  /**
   * Returns the quality settings for a given preset.
   * Falls back to HIGH if the preset is not found.
   */
  getQualityPreset: (preset: QualityPreset) => {
    /*  Explicitly cast the map so the enum literal can be used
        as an index without TS7053 complaints. */
    const map = qualityPresets as Record<QualityPreset, (typeof qualityPresets)[QualityPreset.HIGH]>;
    return map[preset] ?? map[QualityPreset.HIGH];
  },
  getTransitionEffect: (type: string) => transitionEffects[type] || transitionEffects.fade,
  
  // Environment helpers
  isDevelopment: () => config.env === 'development',
  isProduction: () => config.env === 'production',
  isTest: () => config.env === 'test'
};
