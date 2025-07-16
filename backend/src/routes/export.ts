/**
 * AnimaGen Backend - Export Routes Module
 * 
 * This module provides the export functionality endpoints for the AnimaGen backend.
 * It handles video, slideshow, GIF exports, as well as format conversion and trimming.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { 
  JobType, 
  JobData, 
  JobResult, 
  ExportResponse, 
  JobStatusResponse,
  SlideshowJobData,
  VideoTrimJobData,
  FormatConversionJobData,
  UnifiedExportJobData,
  ExportSettings,
  QualityPreset,
  ExportFormat,
  RequestWithSessionId
} from '../types';
import config from '../config';
import { 
  asyncHandler, 
  createError, 
  loadComposition, 
  emitExportProgress,
  createProgressCallback,
  getFileSize,
  formatFileSize
} from '../utils';

// Create router
const router = express.Router();

/**
 * Helper function to add a job to the queue
 * @param jobType Type of job
 * @param jobData Job data
 * @returns Promise resolving to job ID
 */
async function addJob(jobType: JobType, jobData: JobData): Promise<string> {
  try {
    // Dynamically import queue functions to avoid circular dependencies
    const { addJob: queueAddJob } = await import('../workers/queueFunctions');
    const job = await queueAddJob(jobType, jobData);

    /*  BullMQ typings declare Job.id as `string | undefined`.
        We promote it to `string` after an explicit check so the
        rest of the code can keep assuming a valid string. */
    if (!job?.id) {
      throw createError(`Queue returned invalid job id for ${jobType}`, 500);
    }

    return job.id as string;
  } catch (error) {
    console.error(`❌ Failed to add ${jobType} job to queue:`, error);
    throw createError(`Failed to queue ${jobType} job`, 500);
  }
}

/**
 * Helper function to get job status
 * @param jobId Job ID
 * @returns Promise resolving to job status
 */
async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  try {
    // Dynamically import queue functions to avoid circular dependencies
    const { getJobStatus: queueGetJobStatus } = await import('../workers/queueFunctions');
    return await queueGetJobStatus(jobId);
  } catch (error) {
    console.error('❌ Failed to get job status:', error);
    throw createError('Failed to get job status', 500);
  }
}

/**
 * Helper function to validate required fields
 * @param req Express request
 * @param requiredFields Array of required field names
 * @returns Error message or null if validation passes
 */
function validateRequiredFields(req: Request, requiredFields: string[]): string | null {
  const missingFields = requiredFields.filter(field => !req.body[field]);
  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(', ')}`;
  }
  return null;
}

/**
 * Slideshow export endpoint
 * POST /api/export/slideshow
 */
router.post('/slideshow', asyncHandler(async (req: RequestWithSessionId, res: Response) => {
  try {
    console.log('🎬 Slideshow export requested');
    
    // Validate required fields
    const validationError = validateRequiredFields(req, ['sessionId', 'images']);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }
    
    const { 
      sessionId, 
      images, 
      transitions, 
      frameDurations, 
      quality = QualityPreset.HIGH,
      format = ExportFormat.MP4,
      audio,
      outputFilename = `slideshow_${Date.now()}.${format}`
    } = req.body;
    
    // Create job data
    const jobData: SlideshowJobData = {
      jobType: JobType.SLIDESHOW,
      sessionId,
      images,
      transitions,
      frameDurations,
      audio,
      outputFilename,
      settings: {
        format,
        quality,
        frameDurations,
        transitions,
        audio
      }
    };
    
    // Add job to queue
    const jobId = await addJob(JobType.SLIDESHOW, jobData);
    console.log(`🚀 Slideshow job queued: ${jobId}`);
    
    // Return response
    const response: ExportResponse = {
      success: true,
      jobId,
      statusUrl: `/api/export/status/${jobId}`,
      downloadUrl: `/api/export/download/${jobId}`,
      message: 'Slideshow export job queued successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Slideshow export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export slideshow',
      details: (error as Error).message
    });
  }
}));

/**
 * Video export endpoint
 * POST /api/export/video
 */
router.post('/video', asyncHandler(async (req: RequestWithSessionId, res: Response) => {
  try {
    console.log('🎬 Video export requested');
    
    // Validate required fields
    const validationError = validateRequiredFields(req, ['sessionId', 'compositionId']);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }
    
    const { 
      sessionId, 
      compositionId,
      quality = QualityPreset.HIGH,
      format = ExportFormat.MP4,
      audio,
      outputFilename = `video_${Date.now()}.${format}`
    } = req.body;
    
    // Create export settings
    const exportSettings: ExportSettings = {
      format,
      quality,
      audio,
      outputFilename
    };
    
    // Create job data
    const jobData: UnifiedExportJobData = {
      jobType: JobType.UNIFIED_EXPORT,
      sessionId,
      compositionId,
      exportType: 'video',
      exportSettings,
      settings: exportSettings
    };
    
    // Add job to queue
    const jobId = await addJob(JobType.UNIFIED_EXPORT, jobData);
    console.log(`🚀 Video export job queued: ${jobId}`);
    
    // Return response
    const response: ExportResponse = {
      success: true,
      jobId,
      statusUrl: `/api/export/status/${jobId}`,
      downloadUrl: `/api/export/download/${jobId}`,
      message: 'Video export job queued successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Video export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export video',
      details: (error as Error).message
    });
  }
}));

/**
 * GIF export endpoint
 * POST /api/export/gif
 */
router.post('/gif', asyncHandler(async (req: RequestWithSessionId, res: Response) => {
  try {
    console.log('🎬 GIF export requested');
    
    // Validate required fields
    const validationError = validateRequiredFields(req, ['sessionId', 'compositionId']);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }
    
    const { 
      sessionId, 
      compositionId,
      quality = QualityPreset.STANDARD,
      outputFilename = `animation_${Date.now()}.gif`
    } = req.body;
    
    // Create export settings
    const exportSettings: ExportSettings = {
      format: ExportFormat.GIF,
      quality,
      outputFilename
    };
    
    // Create job data
    const jobData: UnifiedExportJobData = {
      jobType: JobType.UNIFIED_EXPORT,
      sessionId,
      compositionId,
      exportType: 'gif',
      exportSettings,
      settings: exportSettings
    };
    
    // Add job to queue
    const jobId = await addJob(JobType.UNIFIED_EXPORT, jobData);
    console.log(`🚀 GIF export job queued: ${jobId}`);
    
    // Return response
    const response: ExportResponse = {
      success: true,
      jobId,
      statusUrl: `/api/export/status/${jobId}`,
      downloadUrl: `/api/export/download/${jobId}`,
      message: 'GIF export job queued successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ GIF export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export GIF',
      details: (error as Error).message
    });
  }
}));

/**
 * Video trim endpoint
 * POST /api/export/trim
 */
router.post('/trim', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('✂️ Video trim requested');
    
    // Validate required fields
    const validationError = validateRequiredFields(req, ['videoPath', 'startTime', 'endTime']);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }
    
    const { 
      videoPath, 
      startTime, 
      endTime, 
      outputName = `trimmed_${Date.now()}.mp4`,
      sessionId = `trim_${Date.now()}`
    } = req.body;
    
    // Basic validation
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be less than end time'
      });
    }
    
    // Resolve full path on server side (worker will validate again)
    const fullVideoPath = path.isAbsolute(videoPath)
      ? videoPath
      : path.join(config.app.tempDir, videoPath);
    
    // Create job data
    const jobData: VideoTrimJobData = {
      jobType: JobType.VIDEO_TRIM,
      videoPath: fullVideoPath,
      startTime,
      endTime,
      outputName,
      sessionId,
      settings: {
        format: ExportFormat.MP4,
        quality: QualityPreset.HIGH
      }
    };
    
    // Add job to queue
    const jobId = await addJob(JobType.VIDEO_TRIM, jobData);
    console.log(`🚀 VIDEO_TRIM job queued: ${jobId}`);
    
    // Return response
    res.json({
      success: true,
      jobId,
      statusUrl: `/api/export/status/${jobId}`,
      downloadUrl: `/api/export/download/${jobId}`,
      message: 'Video trim job queued successfully'
    });
  } catch (error) {
    console.error('❌ Trim endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Video trim failed',
      details: (error as Error).message
    });
  }
}));

/**
 * Format conversion endpoint
 * POST /api/export/convert
 */
router.post('/convert', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('🔄 Format conversion requested');
    
    // Validate required fields
    const validationError = validateRequiredFields(req, ['inputPath', 'outputFormat']);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }
    
    const { 
      inputPath, 
      outputFormat, 
      quality = QualityPreset.HIGH,
      sessionId = `convert_${Date.now()}`
    } = req.body;
    
    // Resolve full path on server side (worker will validate again)
    const fullInputPath = path.isAbsolute(inputPath)
      ? inputPath
      : path.join(config.app.tempDir, inputPath);
    
    // Create output filename
    const inputFileName = path.basename(fullInputPath);
    const outputName = `converted_${Date.now()}.${outputFormat.toLowerCase()}`;
    
    // Create job data
    const jobData: FormatConversionJobData = {
      jobType: JobType.FORMAT_CONVERSION,
      inputPath: fullInputPath,
      outputFormat,
      quality,
      sessionId,
      outputFilename: outputName,
      settings: {
        format: outputFormat as ExportFormat,
        quality: quality as QualityPreset
      }
    };
    
    // Add job to queue
    const jobId = await addJob(JobType.FORMAT_CONVERSION, jobData);
    console.log(`🚀 FORMAT_CONVERSION job queued: ${jobId}`);
    
    // Return response
    res.json({
      success: true,
      jobId,
      statusUrl: `/api/export/status/${jobId}`,
      downloadUrl: `/api/export/download/${jobId}`,
      message: 'Format conversion job queued successfully'
    });
  } catch (error) {
    console.error('❌ Format conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Format conversion failed',
      details: (error as Error).message
    });
  }
}));

/**
 * Job status endpoint
 * GET /api/export/status/:jobId
 */
router.get('/status/:jobId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }
    
    // Get job status
    const jobStatus = await getJobStatus(jobId);
    
    // `jobStatus` already contains its own `success` flag – spreading first
    // avoids the duplicate-property TypeScript error.
    res.json({ ...jobStatus });
  } catch (error) {
    console.error('❌ Job status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
      details: (error as Error).message
    });
  }
}));

/**
 * Job download endpoint
 * GET /api/export/download/:jobId
 */
router.get('/download/:jobId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }
    
    // Get job status
    const jobStatus = await getJobStatus(jobId);
    
    // Check if job is completed
    if (jobStatus.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: `Job is not completed yet. Current status: ${jobStatus.status}`,
        jobStatus
      });
    }
    
    // Check if result has outputPath
    if (!jobStatus.result || !jobStatus.result.outputPath) {
      return res.status(404).json({
        success: false,
        error: 'Job result does not contain output path',
        jobStatus
      });
    }
    
    const outputPath = jobStatus.result.outputPath;
    
    // Check if file exists
    if (!fs.existsSync(outputPath)) {
      return res.status(404).json({
        success: false,
        error: 'Output file not found',
        path: outputPath
      });
    }
    
    // Get file info
    const filename = path.basename(outputPath);
    const fileSize = getFileSize(outputPath);
    const fileSizeFormatted = fileSize ? formatFileSize(fileSize) : 'Unknown';
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    if (fileSize) {
      res.setHeader('Content-Length', fileSize);
    }
    
    // Log download
    console.log(`📥 Sending file: ${filename} (${fileSizeFormatted})`);
    
    // Stream file to response
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('❌ Job download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download job result',
      details: (error as Error).message
    });
  }
}));

export default router;
