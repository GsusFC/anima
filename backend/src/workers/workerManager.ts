/**
 * AnimaGen Backend - Worker Manager Module
 * 
 * This module manages the worker processes for the job queue system.
 * It handles worker initialization, shutdown, and status monitoring.
 */

import { Worker, Processor } from 'bullmq';
import { 
  JobType, 
  JobData, 
  JobResult, 
  WorkerManagerStatus,
  WorkerConfig
} from '../types';
import config from '../config';
import { createQueueConnection } from '../utils/redis';
import { logError, emitExportProgress } from '../utils';

// Track active workers
const workers: Worker[] = [];
let isRunning = false;

/**
 * Create a worker for a specific job type
 * @param jobType Type of job to process
 * @param processor Function to process jobs
 * @param workerConfig Worker configuration
 * @returns Created worker
 */
function createWorker(
  jobType: JobType, 
  processor: Processor<JobData, JobResult>,
  workerConfig?: Partial<WorkerConfig>
): Worker {
  // Create Redis connection
  const connection = createQueueConnection();
  
  // Default worker config
  const defaultConfig: WorkerConfig = {
    concurrency: config.jobQueue.concurrency,
    connection,
    limiter: config.jobQueue.limiter
  };
  
  // Merge default config with provided config
  const mergedConfig = { ...defaultConfig, ...workerConfig };
  
  // Create worker
  const worker = new Worker(
    config.jobQueue.queueName,
    async (job) => {
      try {
        // Only process jobs of the specified type
        if (job.name !== jobType) {
          return { skipped: true, reason: `Worker for ${jobType} received job of type ${job.name}` };
        }
        
        console.log(`🏗️ Worker processing ${jobType} job: ${job.id}`);
        
        // Update progress
        await job.updateProgress(0);
        emitExportProgress('job', 'processing', 0, `Starting ${jobType} job`, { jobId: job.id });
        
        // This is a placeholder implementation
        // In a real implementation, we would process the job here
        console.log(`🔄 Processing job ${job.id} (${jobType})...`);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update progress
        await job.updateProgress(100);
        emitExportProgress('job', 'completed', 100, `Completed ${jobType} job`, { jobId: job.id });
        
        // Return placeholder result
        return {
          success: true,
          outputPath: `/output/placeholder_${job.id}.mp4`,
          downloadUrl: `/api/export/download/${job.id}`,
          message: `${jobType} job completed successfully`
        };
      } catch (error) {
        // Log error
        logError(error as Error, `Worker.${jobType}`);
        
        // Update progress
        emitExportProgress('job', 'error', 0, `Error processing ${jobType} job: ${(error as Error).message}`, { jobId: job.id });
        
        // Rethrow to let BullMQ handle it
        throw error;
      }
    },
    mergedConfig
  );
  
  // Set up event handlers
  worker.on('completed', (job) => {
    console.log(`✅ Job completed: ${job.id} (${jobType})`);
  });
  
  worker.on('failed', (job, error) => {
    console.error(`❌ Job failed: ${job?.id} (${jobType})`, error);
  });
  
  worker.on('error', (error) => {
    console.error(`❌ Worker error (${jobType}):`, error);
  });
  
  console.log(`✅ Worker created for ${jobType} jobs (concurrency: ${mergedConfig.concurrency})`);
  
  return worker;
}

/**
 * Create a placeholder processor function
 * @param jobType Type of job to process
 * @returns Processor function
 */
function createPlaceholderProcessor(jobType: JobType): Processor<JobData, JobResult> {
  return async (job) => {
    try {
      console.log(`🏗️ Processing ${jobType} job: ${job.id}`);
      
      // Update progress at various points
      await job.updateProgress(0);
      emitExportProgress('job', 'processing', 0, `Starting ${jobType} job`, { jobId: job.id });
      
      // Simulate processing steps
      await new Promise(resolve => setTimeout(resolve, 500));
      await job.updateProgress(30);
      emitExportProgress('job', 'processing', 30, `Processing ${jobType} job`, { jobId: job.id });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await job.updateProgress(60);
      emitExportProgress('job', 'processing', 60, `Finalizing ${jobType} job`, { jobId: job.id });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await job.updateProgress(100);
      emitExportProgress('job', 'completed', 100, `Completed ${jobType} job`, { jobId: job.id });
      
      // Return placeholder result
      return {
        success: true,
        outputPath: `/output/placeholder_${job.id}.mp4`,
        downloadUrl: `/api/export/download/${job.id}`,
        message: `${jobType} job completed successfully`
      };
    } catch (error) {
      // Log error
      logError(error as Error, `Processor.${jobType}`);
      
      // Update progress
      emitExportProgress('job', 'error', 0, `Error processing ${jobType} job: ${(error as Error).message}`, { jobId: job.id });
      
      // Rethrow to let BullMQ handle it
      throw error;
    }
  };
}

/**
 * Start the worker manager
 * @returns Promise resolving when workers are started
 */
export async function start(): Promise<void> {
  try {
    console.log('🚀 Starting worker manager...');
    
    if (isRunning) {
      console.log('⚠️ Worker manager already running');
      return;
    }
    
    // Create workers for each job type
    const slideshowWorker = createWorker(JobType.SLIDESHOW, createPlaceholderProcessor(JobType.SLIDESHOW));
    const videoWorker = createWorker(JobType.VIDEO, createPlaceholderProcessor(JobType.VIDEO));
    const gifWorker = createWorker(JobType.GIF, createPlaceholderProcessor(JobType.GIF));
    const videoTrimWorker = createWorker(JobType.VIDEO_TRIM, createPlaceholderProcessor(JobType.VIDEO_TRIM));
    const formatConversionWorker = createWorker(JobType.FORMAT_CONVERSION, createPlaceholderProcessor(JobType.FORMAT_CONVERSION));
    const unifiedExportWorker = createWorker(JobType.UNIFIED_EXPORT, createPlaceholderProcessor(JobType.UNIFIED_EXPORT));
    
    // Add workers to tracking array
    workers.push(
      slideshowWorker,
      videoWorker,
      gifWorker,
      videoTrimWorker,
      formatConversionWorker,
      unifiedExportWorker
    );
    
    isRunning = true;
    console.log(`✅ Worker manager started with ${workers.length} workers`);
  } catch (error) {
    console.error('❌ Failed to start worker manager:', error);
    throw error;
  }
}

/**
 * Stop the worker manager
 * @returns Promise resolving when workers are stopped
 */
export async function stop(): Promise<void> {
  try {
    console.log('🛑 Stopping worker manager...');
    
    if (!isRunning) {
      console.log('⚠️ Worker manager not running');
      return;
    }
    
    // Close all workers
    await Promise.all(workers.map(worker => worker.close()));
    
    // Clear workers array
    workers.length = 0;
    
    isRunning = false;
    console.log('✅ Worker manager stopped');
  } catch (error) {
    console.error('❌ Failed to stop worker manager:', error);
    throw error;
  }
}

/**
 * Get worker manager status
 * @returns Worker manager status
 */
export function getStatus(): WorkerManagerStatus {
  return {
    running: isRunning,
    workers: workers.length,
    activeJobs: 0, // This would be updated with real counts in a full implementation
    waitingJobs: 0,
    completedJobs: 0,
    failedJobs: 0
  };
}

/**
 * Restart the worker manager
 * @returns Promise resolving when workers are restarted
 */
export async function restart(): Promise<void> {
  try {
    console.log('🔄 Restarting worker manager...');
    
    await stop();
    await start();
    
    console.log('✅ Worker manager restarted');
  } catch (error) {
    console.error('❌ Failed to restart worker manager:', error);
    throw error;
  }
}

export default {
  start,
  stop,
  getStatus,
  restart
};
