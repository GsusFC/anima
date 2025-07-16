/**
 * AnimaGen Backend - Video Editor Routes Module
 * 
 * This module provides endpoints for video editing functionality,
 * including video upload, trimming, and file validation.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { 
  RequestWithSessionId,
  JobType,
  VideoTrimJobData,
  QualityPreset,
  ExportFormat
} from '../types';
import config from '../config';
import { 
  asyncHandler,
  isVideoFile,
  generateUniqueFilename
} from '../utils';

// Create router
const router = express.Router();

// Multer configuration for video uploads
const storage = multer.diskStorage({
  destination: (req: RequestWithSessionId, file: Express.Multer.File, cb: Function) => {
    // sessionId should be extracted from query or headers since body isn't parsed yet
    const sessionId = req.query.sessionId as string || 
                     req.headers['x-session-id'] as string || 
                     `video_${Date.now()}`;
    
    const sessionDir = path.join(config.app.tempDir, sessionId);
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    // Store sessionId in req for later use
    req.sessionId = sessionId;
    cb(null, sessionDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: Function) => {
    // Keep original filename with timestamp prefix, sanitize for FFmpeg compatibility
    const uniqueFilename = generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  }
});

// Multer for video uploads
const videoUpload = multer({
  storage,
  limits: {
    fileSize: config.upload.videos.maxFileSize,
    files: config.upload.videos.maxFiles
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: Function) => {
    console.log(`🎥 Video filter check: file=${file.originalname}, mime=${file.mimetype}`);
    
    if (isVideoFile(file.originalname, file.mimetype)) {
      console.log('✅ Video file accepted');
      return cb(null, true);
    } else {
      console.log('❌ Video file rejected');
      cb(new Error('Only video files are allowed! Supported formats: MP4, MOV, WebM, AVI, MKV'));
    }
  }
});

/**
 * Video upload endpoint
 * POST /video-editor/upload
 */
router.post('/upload', videoUpload.single('video'), asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('🎬 VIDEO UPLOAD ENDPOINT HIT!');
    
    if (!req.file) {
      console.log('❌ No file received');
      return res.status(400).json({ 
        success: false,
        error: 'No video file uploaded' 
      });
    }
    
    console.log('📁 File received:', req.file.originalname, req.file.mimetype);
    
    const videoFile = {
      id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    };
    
    res.json({
      success: true,
      video: videoFile,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Video upload failed', 
      details: (error as Error).message 
    });
  }
}));

/**
 * Video trim endpoint
 * POST /video-editor/trim
 */
router.post('/trim', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { videoPath, startTime, endTime, outputName, sessionId } = req.body;
    
    // Basic validation
    if (!videoPath || startTime === undefined || endTime === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: videoPath, startTime, endTime' 
      });
    }
    
    if (startTime >= endTime) {
      return res.status(400).json({ 
        success: false,
        error: 'Start time must be less than end time' 
      });
    }
    
    // Resolve full path on server side
    const fullVideoPath = path.isAbsolute(videoPath)
      ? videoPath
      : path.join(config.app.tempDir, videoPath);
    
    // Create job data
    const jobData: VideoTrimJobData = {
      jobType: JobType.VIDEO_TRIM,
      videoPath: fullVideoPath,
      startTime,
      endTime,
      outputName: outputName || `trimmed_${Date.now()}.mp4`,
      sessionId: sessionId || `trim_${Date.now()}`,
      settings: {
        format: ExportFormat.MP4,
        quality: QualityPreset.HIGH
      }
    };
    
    // In this placeholder implementation, we'll just return success
    // In a real implementation, we would queue the job
    console.log(`🚀 VIDEO_TRIM job data prepared:`, jobData);
    
    res.json({
      success: true,
      jobId: `placeholder_${Date.now()}`,
      statusUrl: `/api/export/status/placeholder_${Date.now()}`,
      downloadUrl: `/api/export/download/placeholder_${Date.now()}`,
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
 * File validation endpoint
 * GET /video-editor/validate/:sessionId/:filename
 */
router.get('/validate/:sessionId/:filename', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { sessionId, filename } = req.params;
    const filePath = path.join(config.app.tempDir, sessionId, filename);
    const exists = fs.existsSync(filePath);
    
    console.log(`🔍 File validation: ${filePath} exists: ${exists}`);
    
    res.json({
      exists,
      path: filePath,
      sessionId,
      filename,
      tempDir: config.app.tempDir
    });
  } catch (error) {
    console.error('❌ File validation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Validation failed', 
      details: (error as Error).message 
    });
  }
}));

export default router;
