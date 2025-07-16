/**
 * AnimaGen Backend - Unified Export Router
 * 
 * This module provides a simplified interface for all export operations.
 * It consolidates the export functionality into a single endpoint with standardized parameters.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { 
  JobType, 
  ExportFormat, 
  QualityPreset, 
  ExportSettings,
  UnifiedExportJobData,
  ExportResponse,
  RequestWithSessionId,
  CompositionImage
} from '../types';
import config from '../config';
import { 
  asyncHandler, 
  createError, 
  loadComposition, 
  saveComposition,
  generateCompositionId,
  calculateInputDurations,
  emitExportProgress
} from '../utils';

// Create router
const router = express.Router();

/**
 * Helper function to add a job to the queue
 * @param jobType Type of job
 * @param jobData Job data
 * @returns Promise resolving to job ID
 */
async function addJob(jobType: JobType, jobData: any): Promise<string> {
  try {
    // Dynamically import queue functions to avoid circular dependencies
    const { addJob: queueAddJob } = await import('../workers/queueFunctions');
    const job = await queueAddJob(jobType, jobData);

    // BullMQ typings make `id` optional, ensure we have a string before returning
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
 * Main unified export endpoint
 * POST /api/unified-export
 */
router.post('/', asyncHandler(async (req: RequestWithSessionId, res: Response) => {
  try {
    console.log('🚀 Unified export requested');
    
    // Validate required fields
    const validationError = validateRequiredFields(req, ['exportType', 'sessionId', 'images']);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }
    
    const { 
      exportType,
      sessionId, 
      images, 
      transitions, 
      frameDurations, 
      quality = QualityPreset.HIGH,
      format = ExportFormat.MP4,
      fps = config.app.defaultFps,
      width,
      height,
      audio,
      watermark,
      compositionId = generateCompositionId()
    } = req.body;
    
    // Validate export type
    if (!['slideshow', 'video', 'gif'].includes(exportType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export type. Supported types: slideshow, video, gif'
      });
    }
    
    // Validate images array
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Images array is required and must not be empty'
      });
    }
    
    // Calculate durations for FFmpeg processing
    const defaultDuration = 3000; // 3 seconds in ms
    const durationInfo = calculateInputDurations(
      images as CompositionImage[],
      transitions,
      frameDurations,
      defaultDuration
    );
    
    // Create or update composition
    let composition;
    try {
      // Try to load existing composition
      composition = loadComposition(compositionId);
      console.log(`📂 Loaded existing composition: ${compositionId}`);
      
      // Update composition with new data
      composition.images = images;
      composition.transitions = transitions;
      composition.frameDurations = frameDurations;
      
      // Save updated composition
      saveComposition(composition);
      console.log(`💾 Updated composition: ${compositionId}`);
    } catch (error) {
      // Create new composition if not found
      composition = {
        id: compositionId,
        sessionId,
        images,
        transitions,
        frameDurations,
        quality,
        type: exportType,
        metadata: {
          createdAt: new Date().toISOString(),
          framesCount: images.length,
          totalDuration: durationInfo.totalDuration,
          format,
          quality
        }
      };
      
      // Save new composition
      saveComposition(composition);
      console.log(`💾 Created new composition: ${compositionId}`);
    }
    
    // Determine output filename based on export type
    const timestamp = Date.now();
    let outputFilename: string;
    
    switch (exportType) {
      case 'gif':
        outputFilename = `animation_${timestamp}.gif`;
        break;
      case 'video':
        outputFilename = `video_${timestamp}.${format.toLowerCase()}`;
        break;
      case 'slideshow':
      default:
        outputFilename = `slideshow_${timestamp}.${format.toLowerCase()}`;
    }
    
    // Create export settings
    const exportSettings: ExportSettings = {
      format: format as ExportFormat,
      quality: quality as QualityPreset,
      fps,
      width,
      height,
      frameDurations,
      transitions,
      audio,
      watermark,
      outputFilename
    };
    
    // Create job data
    const jobData: UnifiedExportJobData = {
      jobType: JobType.UNIFIED_EXPORT,
      sessionId,
      compositionId,
      exportType,
      exportSettings,
      settings: exportSettings
    };
    
    // Add job to queue
    const jobId = await addJob(JobType.UNIFIED_EXPORT, jobData);
    console.log(`🚀 Unified export job queued: ${jobId}`);
    
    // Emit progress update
    emitExportProgress(
      exportType,
      'waiting',
      0,
      `${exportType} export job queued`,
      { jobId, compositionId }
    );
    
    // Return response
    const response: ExportResponse = {
      success: true,
      jobId: jobId,
      statusUrl: `/api/export/status/${jobId}`,
      downloadUrl: `/api/export/download/${jobId}`,
      message: `${exportType} export job queued successfully`
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Unified export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process unified export',
      details: (error as Error).message
    });
  }
}));

/**
 * Composition-based export endpoint
 * POST /api/unified-export/composition/:compositionId
 */
router.post('/composition/:compositionId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { compositionId } = req.params;
    console.log(`🚀 Composition-based export requested for: ${compositionId}`);
    
    // Validate required fields
    const validationError = validateRequiredFields(req, ['exportType']);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }
    
    const { 
      exportType,
      quality = QualityPreset.HIGH,
      format = ExportFormat.MP4,
      fps = config.app.defaultFps,
      width,
      height,
      audio,
      watermark
    } = req.body;
    
    // Validate export type
    if (!['slideshow', 'video', 'gif'].includes(exportType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export type. Supported types: slideshow, video, gif'
      });
    }
    
    // Load composition
    let composition;
    try {
      composition = loadComposition(compositionId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: `Composition not found: ${compositionId}`
      });
    }
    
    // Determine output filename based on export type
    const timestamp = Date.now();
    let outputFilename: string;
    
    switch (exportType) {
      case 'gif':
        outputFilename = `animation_${timestamp}.gif`;
        break;
      case 'video':
        outputFilename = `video_${timestamp}.${format.toLowerCase()}`;
        break;
      case 'slideshow':
      default:
        outputFilename = `slideshow_${timestamp}.${format.toLowerCase()}`;
    }
    
    // Create export settings
    const exportSettings: ExportSettings = {
      format: format as ExportFormat,
      quality: quality as QualityPreset,
      fps,
      width,
      height,
      frameDurations: composition.frameDurations,
      transitions: composition.transitions,
      audio,
      watermark,
      outputFilename
    };
    
    // Create job data
    const jobData: UnifiedExportJobData = {
      jobType: JobType.UNIFIED_EXPORT,
      sessionId: composition.sessionId,
      compositionId,
      exportType,
      exportSettings,
      settings: exportSettings
    };
    
    // Add job to queue
    const jobId = await addJob(JobType.UNIFIED_EXPORT, jobData);
    console.log(`🚀 Composition-based export job queued: ${jobId}`);
    
    // Emit progress update
    emitExportProgress(
      exportType,
      'waiting',
      0,
      `${exportType} export job queued for composition ${compositionId}`,
      { jobId, compositionId }
    );
    
    // Return response
    const response: ExportResponse = {
      success: true,
      jobId: jobId,
      statusUrl: `/api/export/status/${jobId}`,
      downloadUrl: `/api/export/download/${jobId}`,
      message: `${exportType} export job queued successfully for composition ${compositionId}`
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Composition-based export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process composition-based export',
      details: (error as Error).message
    });
  }
}));

export default router;
