const { Queue } = require('bullmq');
const { createRedisConnection } = require('../utils/redis');
const { JobTypes, jobConfigs } = require('./jobTypes');
const path = require('path');
const fs = require('fs');

// Create Redis connection for the queue
const queueConnection = createRedisConnection();

// Video processing queue
const videoQueue = new Queue('video-processing', {
  connection: queueConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    delay: 1000
  }
});

// Add job to queue with type-specific configuration
async function addJob(jobType, data, options = {}) {
  try {
    const config = jobConfigs[jobType];
    if (!config) {
      throw new Error(`Unknown job type: ${jobType}`);
    }

    const jobOptions = {
      ...config,
      ...options
    };

    // Generate job ID if configured
    if (config.jobId && typeof config.jobId === 'function') {
      jobOptions.jobId = config.jobId(data);
    }

    const job = await videoQueue.add(jobType, data, jobOptions);
    console.log(`✅ Job added to queue: ${job.id} (${jobType})`);
    return job;
  } catch (error) {
    console.error(`❌ Failed to add job to queue: ${error.message}`);
    throw error;
  }
}

// Get job status and progress
async function getJobStatus(jobId) {
  try {
    const job = await videoQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    
    const logDir = path.join(__dirname, '..', 'logs');
    let logUrl = null;
    const logPath = path.join(logDir, `job_${job.id}.log`);
    if (fs.existsSync(logPath)) {
      logUrl = `/logs/job_${job.id}.log`;
    }

    // Generate download URL if job is completed and has result
    let downloadUrl = null;
    if (state === 'completed' && job.returnvalue && job.returnvalue.outputPath) {
      downloadUrl = `/api/export/download/${job.id}`;
    }

    return {
      id: job.id,
      type: job.name,
      status: state,
      progress: job.progress || 0,
      data: job.data,
      result: job.returnvalue,
      downloadUrl,
      error: job.failedReason,
      logUrl,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      completedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts
    };
  } catch (error) {
    console.error(`❌ Failed to get job status: ${error.message}`);
    throw error;
  }
}

// Cancel/remove job
async function cancelJob(jobId) {
  try {
    const job = await videoQueue.getJob(jobId);
    if (!job) {
      return false;
    }

    const state = await job.getState();
    
    if (state === 'active') {
      // Job is currently processing - request cancellation
      await job.remove();
      console.log(`🚫 Active job cancelled: ${jobId}`);
    } else {
      // Job is waiting or completed - just remove it
      await job.remove();
      console.log(`🗑️ Job removed: ${jobId}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to cancel job: ${error.message}`);
    throw error;
  }
}

// Get queue statistics
async function getQueueStats() {
  try {
    const waiting = await videoQueue.getWaiting();
    const active = await videoQueue.getActive();
    const completed = await videoQueue.getCompleted();
    const failed = await videoQueue.getFailed();
    
    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  } catch (error) {
    console.error(`❌ Failed to get queue stats: ${error.message}`);
    throw error;
  }
}

// Clean up old jobs
async function cleanQueue() {
  try {
    // Clean completed jobs older than 1 hour
    await videoQueue.clean(3600 * 1000, 'completed');
    
    // Clean failed jobs older than 24 hours
    await videoQueue.clean(24 * 3600 * 1000, 'failed');
    
    console.log('✅ Queue cleanup completed');
  } catch (error) {
    console.error(`❌ Queue cleanup failed: ${error.message}`);
  }
}

// Graceful shutdown
async function closeQueue() {
  try {
    await videoQueue.close();
    await queueConnection.disconnect();
    console.log('✅ Video queue closed');
  } catch (error) {
    console.error(`❌ Failed to close queue: ${error.message}`);
  }
}

module.exports = {
  videoQueue,
  addJob,
  getJobStatus,
  cancelJob,
  getQueueStats,
  cleanQueue,
  closeQueue
};
