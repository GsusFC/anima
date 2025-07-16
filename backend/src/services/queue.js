// Queue service wrapper - simplified version without Redis dependency
const features = require('../config/features');

// Mock queue functions when Redis is not available
const mockQueue = {
  async add(jobType, data, options = {}) {
    console.log(`📝 Mock queue: Would add ${jobType} job`);
    return { id: `mock_${Date.now()}`, data };
  },
  
  async getJob(jobId) {
    console.log(`🔍 Mock queue: Would get job ${jobId}`);
    return null;
  },
  
  async removeJob(jobId) {
    console.log(`🗑️ Mock queue: Would remove job ${jobId}`);
    return true;
  }
};

let queueInstance = null;

// Initialize queue if Redis is available
async function initializeQueue() {
  if (!features.QUEUE_ENABLED) {
    console.log('⚠️ Queue disabled - using mock queue');
    return mockQueue;
  }
  
  try {
    // Try to import and initialize BullMQ
    const { Queue } = require('bullmq');
    const { createRedisConnection } = require('../utils/redis');
    
    const connection = createRedisConnection();
    queueInstance = new Queue('video-processing', { connection });
    
    console.log('✅ Queue initialized with Redis');
    return queueInstance;
  } catch (error) {
    console.log('⚠️ Queue initialization failed, using mock:', error.message);
    return mockQueue;
  }
}

// Export queue functions
module.exports = {
  async add(jobType, data, options = {}) {
    if (!queueInstance) {
      queueInstance = await initializeQueue();
    }
    return queueInstance.add(jobType, data, options);
  },
  
  async getJob(jobId) {
    if (!queueInstance) return null;
    return queueInstance.getJob ? queueInstance.getJob(jobId) : null;
  },
  
  async removeJob(jobId) {
    if (!queueInstance) return true;
    return queueInstance.removeJob ? queueInstance.removeJob(jobId) : true;
  },

  async getJobStatus(jobId) {
    if (!queueInstance) return null;
    try {
      const job = await queueInstance.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress || 0;

      return {
        id: job.id,
        state: state,
        progress: progress,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn
      };
    } catch (error) {
      console.error('Error getting job status:', error);
      return null;
    }
  },

  isAvailable() {
    return features.QUEUE_ENABLED && queueInstance && queueInstance !== mockQueue;
  }
};