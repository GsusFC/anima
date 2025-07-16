/**
 * AnimaGen Backend - Queue Functions Module
 * 
 * This module provides functions for interacting with the job queue system.
 * It handles job creation, status checking, and management operations.
 */

import { Queue, Job } from 'bullmq';
import { 
  JobType, 
  JobData, 
  JobStatus, 
  JobStatusResponse,
  JobResult,
  WorkerManagerStatus
} from '../types';
import config from '../config';
import { createError, logError } from '../utils';
import { createQueueConnection } from '../utils/redis';

// Queue instance
let videoProcessingQueue: Queue | null = null;

/**
 * Initialize the queue
 * @returns Promise resolving to the queue instance
 */
export async function initializeQueue(): Promise<Queue> {
  try {
    if (!videoProcessingQueue) {
      // Create Redis connection
      const connection = createQueueConnection();
      
      // Create queue
      videoProcessingQueue = new Queue(config.jobQueue.queueName, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          removeOnComplete: config.jobQueue.removeOnComplete,
          removeOnFail: config.jobQueue.removeOnFail
        }
      });
      
      console.log(`✅ Queue '${config.jobQueue.queueName}' initialized`);
    }
    
    return videoProcessingQueue;
  } catch (error) {
    logError(error as Error, 'initializeQueue');
    throw createError('Failed to initialize queue', 500);
  }
}

/**
 * Get the queue instance, creating it if necessary
 * @returns Promise resolving to the queue instance
 */
export async function getQueue(): Promise<Queue> {
  if (!videoProcessingQueue) {
    return initializeQueue();
  }
  return videoProcessingQueue;
}

/**
 * Add a job to the queue
 * @param jobType Type of job
 * @param jobData Job data
 * @returns Promise resolving to the created job
 */
export async function addJob(jobType: JobType, jobData: JobData): Promise<Job> {
  try {
    const queue = await getQueue();
    
    // Add job to queue
    const job = await queue.add(jobType, {
      ...jobData,
      jobType,
      createdAt: new Date().toISOString()
    }, {
      // Job options
      priority: getJobPriority(jobType),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });
    
    console.log(`✅ Job added to queue: ${job.id} (${jobType})`);
    return job;
  } catch (error) {
    logError(error as Error, 'addJob');
    throw createError(`Failed to add job to queue: ${(error as Error).message}`, 500);
  }
}

/**
 * Get a job by ID
 * @param jobId Job ID
 * @returns Promise resolving to the job
 */
export async function getJob(jobId: string): Promise<Job | null> {
  try {
    const queue = await getQueue();
    // BullMQ typings return `Job | undefined`; normalize to `Job | null`
    const job = await queue.getJob(jobId);
    return job ?? null;
  } catch (error) {
    logError(error as Error, 'getJob');
    throw createError(`Failed to get job: ${(error as Error).message}`, 500);
  }
}

/**
 * Get job status
 * @param jobId Job ID
 * @returns Promise resolving to job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  try {
    const queue = await getQueue();
    const job = await queue.getJob(jobId);
    
    if (!job) {
      throw createError(`Job not found: ${jobId}`, 404);
    }
    
    // Get job state
    const state = await job.getState();
    
    // Map BullMQ state to our JobStatus enum
    let status: JobStatus;
    switch (state) {
      case 'completed':
        status = JobStatus.COMPLETED;
        break;
      case 'failed':
        status = JobStatus.FAILED;
        break;
      case 'active':
        status = JobStatus.ACTIVE;
        break;
      case 'waiting':
        status = JobStatus.WAITING;
        break;
      case 'delayed':
        status = JobStatus.DELAYED;
        break;
      default:
        status = JobStatus.WAITING;
    }
    
    // Get job progress
    const progress = typeof job.progress === 'number' ? job.progress : 0;
    
    // Get job result or error
    const result = job.returnvalue as JobResult;
    const error = job.failedReason;
    
    // Create response
    const response: JobStatusResponse = {
      success: true,
      jobId,
      status,
      progress,
      createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : new Date().toISOString()
    };
    
    // Add processing time if available
    if (job.processedOn) {
      response.processedAt = new Date(job.processedOn).toISOString();
    }
    
    // Add completion time if available
    if (job.finishedOn) {
      response.finishedAt = new Date(job.finishedOn).toISOString();
    }
    
    // Add result if completed
    if (status === JobStatus.COMPLETED && result) {
      response.result = result;
    }
    
    // Add error if failed
    if (status === JobStatus.FAILED && error) {
      response.error = error;
    }
    
    return response;
  } catch (error) {
    // If job not found, return appropriate status
    if ((error as any).statusCode === 404) {
      return {
        success: false,
        jobId,
        status: JobStatus.FAILED,
        progress: 0,
        error: `Job not found: ${jobId}`,
        createdAt: new Date().toISOString()
      };
    }
    
    logError(error as Error, 'getJobStatus');
    throw createError(`Failed to get job status: ${(error as Error).message}`, 500);
  }
}

/**
 * Remove a job from the queue
 * @param jobId Job ID
 * @returns Promise resolving to true if job was removed
 */
export async function removeJob(jobId: string): Promise<boolean> {
  try {
    const queue = await getQueue();
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return false;
    }
    
    await job.remove();
    console.log(`✅ Job removed from queue: ${jobId}`);
    return true;
  } catch (error) {
    logError(error as Error, 'removeJob');
    throw createError(`Failed to remove job: ${(error as Error).message}`, 500);
  }
}

/**
 * Get queue status
 * @returns Promise resolving to queue status
 */
export async function getQueueStatus(): Promise<WorkerManagerStatus> {
  try {
    const queue = await getQueue();
    
    // Get counts
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);
    
    return {
      running: true,
      workers: 0, // This would be updated by worker manager
      activeJobs: active,
      waitingJobs: waiting + delayed,
      completedJobs: completed,
      failedJobs: failed
    };
  } catch (error) {
    logError(error as Error, 'getQueueStatus');
    
    // Return offline status on error
    return {
      running: false,
      workers: 0,
      activeJobs: 0,
      waitingJobs: 0,
      completedJobs: 0,
      failedJobs: 0
    };
  }
}

/**
 * Get job priority based on job type
 * @param jobType Type of job
 * @returns Priority value (lower is higher priority)
 */
function getJobPriority(jobType: JobType): number {
  switch (jobType) {
    case JobType.VIDEO_TRIM:
      return 1; // Highest priority
    case JobType.FORMAT_CONVERSION:
      return 2;
    case JobType.UNIFIED_EXPORT:
      return 3;
    case JobType.SLIDESHOW:
      return 4;
    case JobType.VIDEO:
      return 5;
    case JobType.GIF:
      return 6; // Lowest priority
    default:
      return 10;
  }
}

/**
 * Clean up queue resources
 */
export async function closeQueue(): Promise<void> {
  if (videoProcessingQueue) {
    await videoProcessingQueue.close();
    videoProcessingQueue = null;
    console.log('✅ Queue closed');
  }
}

export default {
  initializeQueue,
  getQueue,
  addJob,
  getJob,
  getJobStatus,
  removeJob,
  getQueueStatus,
  closeQueue
};
