// Job type definitions for video processing queue

const JobTypes = {
  SLIDESHOW_EXPORT: 'slideshow_export',
  VIDEO_EXPORT: 'video_export',
  VIDEO_TRIM: 'video_trim',
  GIF_EXPORT: 'gif_export',
  FORMAT_CONVERSION: 'format_conversion',
  // 👇 Añadido para exportaciones unificadas
  UNIFIED_EXPORT: 'unified_export'
};

const JobPriorities = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 15
};

const JobStatus = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DELAYED: 'delayed',
  PAUSED: 'paused'
};

// Default job options
const defaultJobOptions = {
  removeOnComplete: { count: 50 },  // Keep last 50 completed jobs
  removeOnFail: { count: 100 },     // Keep last 100 failed jobs
  attempts: 3,           // Retry up to 3 times
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  delay: 0,
  priority: JobPriorities.NORMAL
};

// Job-specific configurations
const jobConfigs = {
  [JobTypes.SLIDESHOW_EXPORT]: {
    ...defaultJobOptions,
    jobId: (data) => `slideshow_${data.sessionId}_${Date.now()}`,
    priority: JobPriorities.NORMAL,
    attempts: 2
  },
  
  [JobTypes.VIDEO_EXPORT]: {
    ...defaultJobOptions,
    jobId: (data) => `video_${data.sessionId}_${Date.now()}`,
    priority: JobPriorities.HIGH,
    attempts: 3
  },
  
  [JobTypes.VIDEO_TRIM]: {
    ...defaultJobOptions,
    jobId: (data) => `trim_${data.sessionId}_${Date.now()}`,
    priority: JobPriorities.HIGH,
    attempts: 2
  },
  
  [JobTypes.GIF_EXPORT]: {
    ...defaultJobOptions,
    jobId: (data) => `gif_${data.sessionId}_${Date.now()}`,
    priority: JobPriorities.NORMAL,
    attempts: 2
  },
  
  [JobTypes.FORMAT_CONVERSION]: {
    ...defaultJobOptions,
    jobId: (data) => `convert_${data.sessionId}_${Date.now()}`,
    priority: JobPriorities.LOW,
    attempts: 2
  },
  // 👇 Configuración para UNIFIED_EXPORT
  [JobTypes.UNIFIED_EXPORT]: {
    ...defaultJobOptions,
    jobId: (data) => `unified_${data.sessionId || 'noSession'}_${Date.now()}`,
    priority: JobPriorities.HIGH,
    attempts: 2
  }
};

module.exports = {
  JobTypes,
  JobPriorities,
  JobStatus,
  defaultJobOptions,
  jobConfigs
};
