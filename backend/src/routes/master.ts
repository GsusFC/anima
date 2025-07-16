/**
 * AnimaGen Backend - Master Generation Routes Module
 * 
 * This module provides endpoints for generating high-quality master videos
 * that can be used for further processing and format conversions.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { 
  RequestWithSessionId,
  CompositionImage,
  Transition,
  QualityPreset,
  ExportFormat
} from '../types';
import config from '../config';
import { 
  asyncHandler,
  createError,
  buildUnifiedTransitionChain,
  calculateInputDurations,
  createFFmpegCommand,
  emitExportProgress,
  createProgressCallback,
  sanitizeFilename,
  getFileExtension,
  logError
} from '../utils';

// Create router
const router = express.Router();

/**
 * Generate a high-quality master video from images
 * POST /generate-master
 */
router.post('/', asyncHandler(async (req: RequestWithSessionId, res: Response) => {
  try {
    console.log('🎬 Master video generation requested');
    console.log('📝 Master request payload:', JSON.stringify(req.body, null, 2));
    
    const { 
      sessionId, 
      images, 
      transitions, 
      frameDurations, 
      width = 3840, // 4K UHD width
      height = 2160, // 4K UHD height
      fps = 60, // High frame rate for smooth transitions
      format = ExportFormat.MP4,
      duration = 3000 // Default 3 seconds per frame
    } = req.body;
    
    // Validate required fields with detailed logging
    console.log(`🔍 Validating request: sessionId=${sessionId}, images=${images ? images.length : 'none'}`);
    if (!sessionId) {
      console.warn('❌ Missing sessionId in master generation request');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sessionId'
      });
    }
    
    if (!images || !Array.isArray(images)) {
      console.warn('❌ Missing or invalid images array in master generation request');
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid images array'
      });
    }
    
    if (images.length === 0) {
      console.warn('❌ Empty images array in master generation request');
      return res.status(400).json({
        success: false,
        error: 'Images array cannot be empty'
      });
    }
    
    // Create a unique ID for this master video
    const masterId = `master_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`🆔 Generated masterId: ${masterId}`);
    
    // Prepare output path
    const outputFilename = `master_${masterId}.${format.toLowerCase()}`;
    const outputPath = path.join(config.app.outputDir, outputFilename);
    console.log(`📂 Output path: ${outputPath}`);
    
    // Ensure output directory exists
    if (!fs.existsSync(config.app.outputDir)) {
      console.log(`📁 Creating output directory: ${config.app.outputDir}`);
      fs.mkdirSync(config.app.outputDir, { recursive: true });
    }
    
    // Log the session directory for debugging
    const sessionDir = path.join(config.app.tempDir, sessionId);
    console.log(`📁 Session directory: ${sessionDir}`);
    if (!fs.existsSync(sessionDir)) {
      console.warn(`⚠️ Session directory does not exist: ${sessionDir}`);
    } else {
      // List files in session directory for debugging
      const files = fs.readdirSync(sessionDir);
      console.log(`📋 Files in session directory: ${files.join(', ')}`);
    }
    
    // Prepare images array with full paths
    console.log('🖼️ Resolving image paths...');
    const validImages: CompositionImage[] = images.map((img: any, index: number) => {
      const imgPath = path.join(config.app.tempDir, sessionId, img.filename);
      console.log(`🔍 Image ${index}: ${img.filename} → ${imgPath}`);
      return {
        id: img.id || `img_${index}`,
        filename: img.filename,
        originalName: img.originalName || img.filename,
        path: imgPath,
        order: index
      };
    });
    
    // Ensure all images exist with detailed logging
    const missingImages = validImages.filter(img => {
      const exists = img.path && fs.existsSync(img.path as string);
      if (!exists) {
        console.warn(`⚠️ Image not found: ${img.path}`);
      }
      return !exists;
    });
    
    if (missingImages.length > 0) {
      console.error(`❌ Missing ${missingImages.length} images:`, missingImages.map(img => img.filename));
      return res.status(400).json({
        success: false,
        error: `Missing ${missingImages.length} images`,
        details: missingImages.map(img => img.filename)
      });
    }
    
    console.log(`✅ All ${validImages.length} images exist and are ready for processing`);
    
    // Define high-quality master settings
    const masterQualitySettings = {
      width: width,
      height: height,
      fps: fps,
      crf: 16, // Lower CRF means higher quality (16-18 range for high quality)
      bitrate: '15M', // High bitrate for master video
      preset: 'slow', // Slower preset for better compression
      pixelFormat: 'yuv420p10le' // 10-bit color depth for better quality
    };
    
    console.log(`🎛️ Using master quality settings:`, masterQualitySettings);
    
    // Calculate durations for FFmpeg processing
    const defaultDuration = duration; // in ms
    console.log(`⏱️ Using default frame duration: ${defaultDuration}ms`);
    
    const durationInfo = calculateInputDurations(
      validImages,
      transitions as Transition[],
      frameDurations as number[],
      defaultDuration
    );
    console.log(`⏱️ Calculated total duration: ${durationInfo.totalDuration}s`);
    
    // Create progress tracking callback
    const progressCallback = createProgressCallback(masterId, 'master');
    
    // Start progress tracking
    emitExportProgress(
      'master',
      'processing',
      0,
      `Starting master generation for ${validImages.length} images`,
      { masterId, outputPath }
    );
    
    // Generate master video
    console.log('🚀 Starting master video generation process');
    try {
      await generateMasterVideo(
        validImages,
        transitions as Transition[],
        frameDurations as number[],
        outputPath,
        {
          width: masterQualitySettings.width,
          height: masterQualitySettings.height,
          fps: masterQualitySettings.fps,
          format: format as ExportFormat,
          duration: defaultDuration,
          crf: masterQualitySettings.crf,
          bitrate: masterQualitySettings.bitrate,
          preset: masterQualitySettings.preset,
          pixelFormat: masterQualitySettings.pixelFormat
        },
        progressCallback
      );
      
      console.log('✅ Master video generation completed successfully');
    } catch (genError) {
      console.error('❌ Master video generation failed:', genError);
      console.error('Stack trace:', (genError as Error).stack);
      throw genError; // Re-throw to be caught by the outer catch block
    }
    
    // Create response URL
    const masterUrl = `/output/${outputFilename}`;
    console.log(`🔗 Master URL: ${masterUrl}`);
    
    // Verify the output file exists
    if (!fs.existsSync(outputPath)) {
      console.error(`❌ Output file not found: ${outputPath}`);
      throw createError(`Output file not found: ${outputPath}`, 500);
    }
    
    const fileStats = fs.statSync(outputPath);
    console.log(`📊 Output file size: ${fileStats.size} bytes`);
    
    // Return success response
    res.json({
      success: true,
      masterId,
      filename: outputFilename,
      masterUrl,
      outputPath: masterUrl,
      message: 'Master video generated successfully',
      settings: {
        width: masterQualitySettings.width,
        height: masterQualitySettings.height,
        fps: masterQualitySettings.fps,
        format,
        crf: masterQualitySettings.crf,
        bitrate: masterQualitySettings.bitrate,
        duration: durationInfo.totalDuration * 1000 // Convert to ms
      },
      fileSize: fileStats.size
    });
  } catch (error) {
    // Log the full error with stack trace
    console.error('❌ Master video generation error:', error);
    console.error('Stack trace:', (error as Error).stack);
    
    // Log additional error details if available
    if ((error as any).details) {
      console.error('Error details:', (error as any).details);
    }
    
    // Log memory usage when errors occur
    try {
      const used = process.memoryUsage();
      console.error('📊 Memory usage at error:', {
        rss: Math.round(used.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB'
      });
    } catch (memError) {
      console.error('Failed to log memory usage:', memError);
    }
    
    // Use logError utility if available
    try {
      logError(error as Error, 'master-endpoint');
    } catch (logError) {
      console.error('Failed to use logError utility:', logError);
    }
    
    // Send error response
    res.status((error as any).statusCode || 500).json({
      success: false,
      error: 'Failed to generate master video',
      details: (error as Error).message,
      path: req.body?.sessionId ? path.join(config.app.tempDir, req.body.sessionId) : 'unknown'
    });
  }
}));

/**
 * Generate a high-quality master video from images using FFmpeg
 * @param images Array of image objects
 * @param transitions Array of transition objects
 * @param frameDurations Array of frame durations in milliseconds
 * @param outputPath Output file path
 * @param options Master video generation options
 * @param progressCallback Progress callback function
 * @returns Promise resolving when master video is generated
 */
async function generateMasterVideo(
  images: CompositionImage[],
  transitions: Transition[] | undefined,
  frameDurations: number[] | undefined,
  outputPath: string,
  options: {
    width: number;
    height: number;
    fps: number;
    format: ExportFormat;
    duration: number;
    crf: number;
    bitrate: string;
    preset: string;
    pixelFormat: string;
  },
  progressCallback?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🎬 Setting up FFmpeg command for master video');
      
      // Create FFmpeg command with progress tracking
      const command = createFFmpegCommand(progressCallback);
      
      // Prepare complex filter array
      const complexFilter: string[] = [];
      
      // Add each image as input
      console.log('🔄 Adding input images to FFmpeg command:');
      images.forEach((image, index) => {
        if (!image.path) {
          console.error(`❌ Image path is undefined for image index ${index}`);
          reject(createError(`Image path is undefined for image index ${index}`, 400));
          return;
        }
        
        // Verify file exists before adding to command
        if (!fs.existsSync(image.path)) {
          console.error(`❌ Image file not found: ${image.path}`);
          reject(createError(`Image file not found: ${image.path}`, 400));
          return;
        }
        
        console.log(`📥 Adding input #${index}: ${image.path}`);
        command.addInput(image.path);
        
        // Calculate duration based on frameDurations or default
        const frameDuration = (frameDurations && frameDurations[index]) 
          ? frameDurations[index] / 1000 
          : options.duration / 1000;
        
        console.log(`⏱️ Frame ${index} duration: ${frameDuration}s`);
        
        // Add scale filter for each input
        // For master video, we preserve as much quality as possible
        const scaleFilter = `[${index}:v]scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2,setsar=1,setpts=PTS-STARTPTS+${index}*${frameDuration}/TB[v${index}]`;
        console.log(`🔍 Filter for input #${index}: ${scaleFilter}`);
        complexFilter.push(scaleFilter);
      });
      
      // Build transition chain
      console.log('🔄 Building transition chain');
      const outputLabel = buildUnifiedTransitionChain(
        images,
        transitions,
        frameDurations,
        options.duration,
        complexFilter
      );
      console.log(`✅ Transition chain built, final output label: ${outputLabel}`);
      
      // Add complex filter to command
      console.log(`🔄 Adding ${complexFilter.length} complex filters to FFmpeg command`);
      command.complexFilter(complexFilter);
      
      // Set output options for high-quality master
      const outputOptions: string[] = [];
      
      // Add format-specific options optimized for high-quality master
      console.log(`🎛️ Configuring high-quality output options for master video`);
      
      switch (options.format) {
        case ExportFormat.MOV:
          console.log('🎛️ Using MOV (ProRes) output settings for master');
          outputOptions.push(
            '-c:v', 'prores_ks',
            '-profile:v', '3', // ProRes HQ
            '-pix_fmt', options.pixelFormat,
            '-r', options.fps.toString()
          );
          break;
        case ExportFormat.MP4:
        default:
          console.log('🎛️ Using MP4 (H.264) output settings for master');
          outputOptions.push(
            '-c:v', 'libx264',
            '-preset', options.preset,
            '-crf', options.crf.toString(),
            '-b:v', options.bitrate,
            '-pix_fmt', options.pixelFormat,
            '-r', options.fps.toString(),
            '-movflags', '+faststart'
          );
      }
      
      // Add common output options
      outputOptions.push(
        '-map', outputLabel,
        '-y' // Overwrite output file if exists
      );
      
      // Add output options to command
      console.log(`🔄 Adding output options:`, outputOptions);
      command.outputOptions(outputOptions);
      
      // Set output path
      console.log(`📤 Setting output path: ${outputPath}`);
      command.save(outputPath);
      
      // Add event handlers
      command.on('start', (commandLine) => {
        console.log(`🚀 FFmpeg command started: ${commandLine}`);
      });
      
      command.on('progress', (progress) => {
        console.log(`📊 FFmpeg progress: ${JSON.stringify(progress)}`);
      });
      
      command.on('end', () => {
        console.log(`✅ FFmpeg processing finished: ${outputPath}`);
        
        // Verify the output file exists and has content
        try {
          if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`📊 Output file size: ${stats.size} bytes`);
            if (stats.size === 0) {
              console.error('❌ Output file is empty');
              reject(createError('Generated output file is empty', 500));
              return;
            }
          } else {
            console.error('❌ Output file not found after FFmpeg completion');
            reject(createError('Output file not found after processing', 500));
            return;
          }
        } catch (statError) {
          console.error('❌ Error checking output file:', statError);
        }
        
        resolve();
      });
      
      command.on('error', (err, stdout, stderr) => {
        console.error('❌ FFmpeg error:', err);
        console.error('FFmpeg stderr:', stderr);
        console.error('FFmpeg stdout:', stdout);
        reject(createError(`FFmpeg error: ${err.message}`, 500));
      });
      
      // Execute command
      console.log('🎬 Starting FFmpeg master video generation');
      
    } catch (error) {
      console.error('❌ Master video generation setup error:', error);
      console.error('Stack trace:', (error as Error).stack);
      reject(createError(`Failed to set up master video generation: ${(error as Error).message}`, 500));
    }
  });
}

// Check if FFmpeg is available
try {
  const { spawnSync } = require('child_process');
  const ffmpegCheck = spawnSync('ffmpeg', ['-version']);
  if (ffmpegCheck.error) {
    console.error('⚠️ FFmpeg not found or not executable. Master video generation will fail!');
    console.error('Error details:', ffmpegCheck.error);
  } else {
    const version = ffmpegCheck.stdout.toString().split('\n')[0];
    console.log(`✅ FFmpeg available: ${version}`);
  }
} catch (error) {
  console.error('⚠️ Error checking FFmpeg availability:', error);
}

export default router;
