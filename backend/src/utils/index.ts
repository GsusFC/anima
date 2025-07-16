/**
 * AnimaGen Backend - Utility Module
 * 
 * This module provides utility functions for the AnimaGen backend application,
 * centralizing all helper functions that were previously scattered throughout the codebase.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import type { FfmpegCommand } from 'fluent-ffmpeg';
import { FilterGraph } from '../FilterGraph';
import config from '../config';
import {
  GlobalWithIO,
  InputDurationCalculation,
  CompositionImage,
  Transition,
  APIKeysStore,
  APIKey,
  SocketIOProgressEvent,
  Composition,
  CompositionExport,
  TransitionType
} from '../types';

// Type cast global to include Socket.IO instance
declare const global: GlobalWithIO;

// Minimal progress interface (fluent-ffmpeg does not export it)
interface FFmpegProgress {
  percent?: number;
  // other fields are ignored for now
}

// =========================================
// 1. Memory Monitoring Utilities
// =========================================

/**
 * Logs current memory usage information
 * @returns Memory usage information in MB
 */
export const logMemoryUsage = (): Record<string, number> => {
  const used = process.memoryUsage();
  const memInfo = {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100
  };

  console.log(`📊 Memory usage: RSS: ${memInfo.rss}MB, Heap: ${memInfo.heapUsed}/${memInfo.heapTotal}MB, External: ${memInfo.external}MB`);
  
  // Warn if memory usage is high
  if (memInfo.heapUsed > config.memoryMonitoring.warningThreshold) {
    console.warn(`⚠️ High memory usage detected: ${memInfo.heapUsed}MB heap used`);
  }

  return memInfo;
};

/**
 * Sets up periodic memory usage monitoring
 * @param interval Interval in milliseconds
 * @returns Timer ID
 */
export const setupMemoryMonitoring = (interval = config.memoryMonitoring.interval): NodeJS.Timeout => {
  return setInterval(logMemoryUsage, interval);
};

// =========================================
// 2. FFmpeg Helper Functions
// =========================================

/**
 * Builds a unified transition chain for both GIF and Video exports
 * @param validImages Array of valid images
 * @param transitions Array of transitions
 * @param frameDurations Array of frame durations in milliseconds
 * @param defaultDuration Default duration in milliseconds
 * @param complexFilter Array to store complex filter commands
 * @returns The output label for the filter chain
 */
export const buildUnifiedTransitionChain = (
  validImages: CompositionImage[],
  transitions: Transition[] | undefined,
  frameDurations: number[] | undefined,
  defaultDuration: number,
  complexFilter: string[]
): string => {
  console.log(`buildUnifiedTransitionChain: ${validImages.length} images, ${transitions?.length || 0} transitions`);
  
  // Handle single image case
  if (validImages.length === 1) {
    console.log('Single image, returning [v0]');
    return '[v0]';
  }

  // Check if all transitions are missing or are cut/none types
  const hasAnyRealTransitions = transitions && transitions.some(t => 
    t && t.type && t.type !== 'cut' && t.type !== 'none' && (t.duration || 0) > 0
  );

  if (!transitions || validImages.length < 2 || !hasAnyRealTransitions) {
    // No transitions or all are cut/none - use simple concat
    console.log('No real transitions detected, using concat');
    let concatVideo = "";
    for (let i = 0; i < validImages.length; i++) {
      concatVideo += `[v${i}]`;
    }
    complexFilter.push(`${concatVideo}concat=n=${validImages.length}[outv]`);
    console.log(`Concat filter: ${concatVideo}concat=n=${validImages.length}[outv]`);
    return '[outv]';
  }

  // Build transition chain with xfade
  console.log('Using xfade transition chain');
  let lastOutput = '[v0]';
  let totalVideoTime = 0;
  
  console.log(`🎞️ Starting transition chain for ${validImages.length} images`);
  console.log(`🎞️ Frame durations:`, frameDurations?.map((d, i) => `${i}: ${d}ms`) || 'Using default duration');
  
  for (let i = 0; i < validImages.length - 1; i++) {
    const currentFrameDuration = (frameDurations?.[i] || defaultDuration) / 1000;
    const transition = transitions?.[i] || { type: 'fade' as TransitionType, duration: 500 };
    
    // transition.duration comes in milliseconds from frontend, convert to seconds for FFmpeg
    let transitionDuration = (transition.type && !['none', 'cut'].includes(transition.type))
      ? Math.max(transition.duration / 1000, 0.1)
      : 0.001;
    
    let transitionType = config.transitions[transition.type] || 'fade';
    
    // Always use a real effect, even for cuts (with minimal duration)
    if (['none', 'cut'].includes(transition.type)) {
      transitionType = 'fade';
    }
    
    const nextInput = `[v${i + 1}]`;
    const outputLabel = (i === validImages.length - 2) ? '[outv]' : `[t${i}]`;
    
    // Add current frame duration to total time
    totalVideoTime += currentFrameDuration;
    
    // Correct offset calculation: transition starts at end of current frame minus transition duration
    const offset = Math.max(totalVideoTime - transitionDuration, 0);
    
    const xfadeFilter = `${lastOutput}${nextInput}xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset}${outputLabel}`;
    
    console.log(`🎞️ Frame ${i}->${i + 1}: duration=${currentFrameDuration}s, total=${totalVideoTime}s, transition=${transitionDuration}s, offset=${offset}s`);
    
    // Push filter into graph and prepare for next iteration
    complexFilter.push(xfadeFilter);
    lastOutput = outputLabel;
  }
  
  console.log(`🎞️ Transition chain complete. Processed ${validImages.length - 1} transitions. Final label: ${lastOutput}`);
  return lastOutput;
};

/**
 * Calculate optimal input durations for exports with transitions
 * @param validImages Array of valid images
 * @param transitions Array of transitions
 * @param frameDurations Array of frame durations in milliseconds
 * @param defaultDuration Default duration in milliseconds
 * @returns Object with calculated durations
 */
export const calculateInputDurations = (
  validImages: CompositionImage[],
  transitions: Transition[] | undefined,
  frameDurations: number[] | undefined,
  defaultDuration: number
): InputDurationCalculation => {
  // Ensure transitions is always an array to avoid runtime errors when no transitions are supplied
  if (!Array.isArray(transitions)) {
    transitions = [];
  }
  
  const results: InputDurationCalculation = {
    totalDuration: 0,
    inputDurations: [],
    maxTransitionDuration: 0
  };
  
  // For slideshow with cuts/no transitions, use exact frame durations
  // Only apply buffers when there are actual transitions
  const hasRealTransitions = transitions && transitions.some(t => 
    t && t.type && t.type !== 'cut' && t.type !== 'none'
  );
  
  if (!hasRealTransitions) {
    // Simple case: no transitions, use exact durations
    for (let i = 0; i < validImages.length; i++) {
      const frameDuration = (frameDurations?.[i] || defaultDuration) / 1000;
      results.inputDurations.push(frameDuration);
      results.totalDuration += frameDuration;
    }
    console.log('📏 Using exact durations (no transitions)');
  } else {
    // Complex case: has transitions, apply buffer logic
    console.log('📏 Using buffered durations (has transitions)');
    
    // Calculate total duration needed and max transition duration
    for (let i = 0; i < validImages.length; i++) {
      const frameDuration = (frameDurations?.[i] || defaultDuration) / 1000;
      results.totalDuration += frameDuration;
      
      if (i < transitions.length && transitions[i] && 
          transitions[i].type !== 'cut' && transitions[i].type !== 'none') {
        const transitionDuration = Math.min(transitions[i].duration / 1000, frameDuration * 0.9);
        results.maxTransitionDuration = Math.max(results.maxTransitionDuration, transitionDuration);
        results.totalDuration += transitionDuration * 0.3;
      }
    }
    
    // Calculate individual input durations with buffer for transitions
    const bufferMultiplier = 1.5 + (results.maxTransitionDuration / results.totalDuration);
    for (let i = 0; i < validImages.length; i++) {
      const baseDuration = (frameDurations?.[i] || defaultDuration) / 1000;
      const inputDuration = Math.max(baseDuration, results.totalDuration / validImages.length * bufferMultiplier);
      results.inputDurations.push(inputDuration);
    }
  }
  
  return results;
};

/**
 * Creates an FFmpeg command with progress tracking
 * @param progressCallback Optional callback function for progress updates
 * @returns Configured FFmpeg command
 */
export const createFFmpegCommand = (
  progressCallback?: (progress: number) => void
): FfmpegCommand => {
  const command = ffmpeg();
  
  // Add progress event handler if callback provided
  if (progressCallback) {
    command.on('progress', (progress: FFmpegProgress) => {
      if (progress && progress.percent !== undefined) {
        progressCallback(Math.min(Math.round(progress.percent), 100));
      }
    });
  }
  
  // Add standard event handlers
  command.on('start', (commandLine) => {
    console.log('🎬 FFmpeg started with command:', commandLine);
  });
  
  command.on('end', () => {
    console.log('✅ FFmpeg processing finished');
    if (progressCallback) {
      progressCallback(100);
    }
  });
  
  return command;
};

// =========================================
// 3. File System Utilities
// =========================================

/**
 * Ensures that required directories exist
 * @param dirs Array of directory paths
 * @returns Object with results for each directory
 */
export const ensureDirectoriesExist = (dirs: string[]): Record<string, boolean> => {
  const results: Record<string, boolean> = {};
  
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
        results[dir] = true;
      } else {
        results[dir] = true;
      }
    } catch (error) {
      console.error(`❌ Failed to create directory ${dir}:`, error);
      results[dir] = false;
    }
  }
  
  return results;
};

/**
 * Generates a unique composition ID
 * @returns Unique composition ID
 */
export const generateCompositionId = (): string => {
  return `comp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

/**
 * Saves a composition to disk
 * @param composition Composition object
 * @returns Saved composition data
 */
export const saveComposition = (composition: Composition): Composition => {
  const compositionPath = path.join(config.app.compositionsDir, `${composition.id}.json`);
  const compositionDataDir = path.join(config.app.compositionsDir, composition.id);
  
  // Create composition directory
  if (!fs.existsSync(compositionDataDir)) {
    fs.mkdirSync(compositionDataDir, { recursive: true });
  }
  
  // Copy images from temp to composition directory
  const copiedImages = composition.images.map((img, index) => {
    const originalPath = path.join(config.app.tempDir, composition.sessionId, img.filename);
    const newFilename = `image_${index}_${img.filename}`;
    const newPath = path.join(compositionDataDir, newFilename);
    
    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, newPath);
      return { ...img, filename: newFilename, originalFilename: img.filename };
    }
    
    return img;
  });
  
  // Save composition metadata
  const compositionData: Composition = {
    ...composition,
    images: copiedImages,
    createdAt: new Date().toISOString(),
    exports: []
  };
  
  fs.writeFileSync(compositionPath, JSON.stringify(compositionData, null, 2));
  console.log(`✅ Composition saved: ${composition.id}`);
  
  return compositionData;
};

/**
 * Loads a composition from disk
 * @param compositionId Composition ID
 * @returns Loaded composition data
 */
export const loadComposition = (compositionId: string): Composition => {
  const compositionPath = path.join(config.app.compositionsDir, `${compositionId}.json`);
  
  if (!fs.existsSync(compositionPath)) {
    throw new Error(`Composition not found: ${compositionId}`);
  }
  
  const compositionData: Composition = JSON.parse(fs.readFileSync(compositionPath, 'utf8'));
  
  // Update image paths to point to composition directory
  compositionData.images = compositionData.images.map(img => ({
    ...img,
    path: path.join(config.app.compositionsDir, compositionId, img.filename)
  }));
  
  console.log(`📂 Composition loaded: ${compositionId}`);
  return compositionData;
};

/**
 * Adds an export record to a composition
 * @param compositionId Composition ID
 * @param exportData Export data
 */
export const addExportToComposition = (
  compositionId: string,
  exportData: Omit<CompositionExport, 'timestamp'>
): void => {
  const compositionPath = path.join(config.app.compositionsDir, `${compositionId}.json`);
  
  if (!fs.existsSync(compositionPath)) {
    throw new Error(`Composition not found: ${compositionId}`);
  }
  
  const compositionData: Composition = JSON.parse(fs.readFileSync(compositionPath, 'utf8'));
  
  if (!compositionData.exports) {
    compositionData.exports = [];
  }
  
  compositionData.exports.push({
    ...exportData,
    timestamp: new Date().toISOString()
  });
  
  fs.writeFileSync(compositionPath, JSON.stringify(compositionData, null, 2));
  console.log(`📝 Export added to composition: ${compositionId}`);
};

/**
 * Safely deletes a file if it exists
 * @param filePath Path to the file
 * @returns True if file was deleted or didn't exist, false if deletion failed
 */
export const safeDeleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete file ${filePath}:`, error);
    return false;
  }
};

/**
 * Gets file size in bytes
 * @param filePath Path to the file
 * @returns File size in bytes or null if file doesn't exist
 */
export const getFileSize = (filePath: string): number | null => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.size;
    }
    return null;
  } catch (error) {
    console.error(`❌ Failed to get file size for ${filePath}:`, error);
    return null;
  }
};

// Promisified fs functions
export const fsAsync = {
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
  mkdir: promisify(fs.mkdir),
  stat: promisify(fs.stat),
  readdir: promisify(fs.readdir),
  unlink: promisify(fs.unlink),
  copyFile: promisify(fs.copyFile),
  exists: (path: string): Promise<boolean> => 
    new Promise(resolve => fs.exists(path, exists => resolve(exists)))
};

// =========================================
// 4. API Key Generation and Validation
// =========================================

/**
 * Generates a secure API key
 * @returns Generated API key
 */
export const generateAPIKey = (): string => {
  return crypto.randomBytes(24).toString('hex');
};

/**
 * Loads API keys from disk
 * @returns Object with API keys
 */
export const loadAPIKeys = (): APIKeysStore => {
  const apiKeysFile = path.join(config.app.logsDir, 'api-keys.json');
  
  try {
    if (fs.existsSync(apiKeysFile)) {
      return JSON.parse(fs.readFileSync(apiKeysFile, 'utf8'));
    }
  } catch (error) {
    console.error('❌ Error loading API keys:', error);
  }
  
  return {};
};

/**
 * Saves API keys to disk
 * @param keys Object with API keys
 * @returns True if keys were saved successfully
 */
export const saveAPIKeys = (keys: APIKeysStore): boolean => {
  const apiKeysFile = path.join(config.app.logsDir, 'api-keys.json');
  
  try {
    fs.writeFileSync(apiKeysFile, JSON.stringify(keys, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving API keys:', error);
    return false;
  }
};

/**
 * Validates an API key
 * @param apiKey API key to validate
 * @returns Validation result with user data if valid
 */
export const validateAPIKey = (apiKey: string): { valid: boolean; keyData?: APIKey } => {
  // Load API keys and validate
  const apiKeys = loadAPIKeys();
  const keyData = apiKeys[apiKey];
  
  if (!keyData) {
    return { valid: false };
  }
  
  if (!keyData.active) {
    return { valid: false };
  }
  
  // Update last used timestamp
  keyData.lastUsed = new Date().toISOString();
  apiKeys[apiKey] = keyData;
  saveAPIKeys(apiKeys);
  
  return { valid: true, keyData };
};

// =========================================
// 5. Progress Emission Helpers
// =========================================

/**
 * Emits progress updates to connected clients via Socket.IO
 * @param type Progress event type
 * @param status Current status
 * @param progress Progress percentage (0-100)
 * @param message Status message
 * @param extra Additional data
 */
export const emitExportProgress = (
  type: SocketIOProgressEvent['type'],
  status: SocketIOProgressEvent['status'],
  progress: number,
  message: string,
  extra: Record<string, any> = {}
): void => {
  try {
    if (global.io) {
      global.io.emit('export:progress', { 
        type, 
        status, 
        progress, 
        message, 
        ...extra 
      });
    }
  } catch (e) {
    console.warn('Progress emit failed:', (e as Error).message);
  }
};

/**
 * Creates a progress callback function that emits progress updates
 * @param jobId Job ID
 * @param type Progress event type
 * @returns Progress callback function
 */
export const createProgressCallback = (
  jobId: string,
  type: SocketIOProgressEvent['type'] = 'job'
): (progress: number, message?: string) => void => {
  return (progress: number, message?: string) => {
    emitExportProgress(
      type,
      progress < 100 ? 'processing' : 'completed',
      progress,
      message || `Processing: ${progress}%`,
      { jobId }
    );
  };
};

// =========================================
// 6. Error Handling Utilities
// =========================================

/**
 * Creates a standardized error object
 * @param message Error message
 * @param statusCode HTTP status code
 * @param details Additional error details
 * @returns Standardized error object
 */
export const createError = (
  message: string,
  statusCode: number = 500,
  details?: any
): Error & { statusCode: number; details?: any } => {
  const error = new Error(message) as Error & { statusCode: number; details?: any };
  error.statusCode = statusCode;
  if (details) {
    error.details = details;
  }
  return error;
};

/**
 * Handles async errors in Express route handlers
 * @param fn Async route handler function
 * @returns Express route handler with error handling
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Logs an error with detailed information
 * @param error Error object
 * @param source Source of the error
 */
export const logError = (error: Error, source: string): void => {
  console.error(`❌ Error in ${source}:`, error.message);
  console.error('Stack trace:', error.stack);
  
  // Log additional details if available
  const anyError = error as any;
  if (anyError.details) {
    console.error('Error details:', anyError.details);
  }
  
  // Log memory usage when errors occur to help diagnose memory-related issues
  logMemoryUsage();
};

// =========================================
// 7. General Utility Functions
// =========================================

/**
 * Sanitizes a filename for FFmpeg compatibility
 * @param filename Original filename
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w\.-]/g, '') // Remove special characters except dots, dashes, underscores
    .replace(/_+/g, '_'); // Replace multiple underscores with single
};

/**
 * Generates a unique filename with timestamp
 * @param originalName Original filename
 * @returns Unique filename
 */
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const sanitizedName = sanitizeFilename(originalName);
  return `${timestamp}_${sanitizedName}`;
};

/**
 * Gets file extension from filename
 * @param filename Filename
 * @returns File extension (lowercase, without dot)
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().replace('.', '');
};

/**
 * Checks if a file is an image
 * @param filename Filename
 * @param mimetype MIME type
 * @returns True if file is an image
 */
export const isImageFile = (filename: string, mimetype: string): boolean => {
  const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
  const extname = allowedTypes.test(path.extname(filename).toLowerCase());
  const mimeCheck = allowedTypes.test(mimetype);
  return extname && mimeCheck;
};

/**
 * Checks if a file is a video
 * @param filename Filename
 * @param mimetype MIME type
 * @returns True if file is a video
 */
export const isVideoFile = (filename: string, mimetype: string): boolean => {
  const allowedVideoTypes = /\.mp4|\.mov|\.webm|\.avi|\.mkv$/i;
  const allowedMimeTypes = /video\//;
  const extname = allowedVideoTypes.test(filename);
  const mimeCheck = allowedMimeTypes.test(mimetype);
  // Accept if either extension OR mimetype matches (more flexible)
  return extname || mimeCheck;
};

/**
 * Formats a duration in seconds to a human-readable string (MM:SS)
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generates a random string
 * @param length Length of the string
 * @returns Random string
 */
export const randomString = (length: number = 8): string => {
  return Math.random().toString(36).substring(2, 2 + length);
};

/**
 * Checks if Redis is available
 * @returns Promise resolving to true if Redis is available
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    // Dynamically import Redis to avoid dependency issues
    const { createRedisConnection } = await import('./redis');
    const connection = createRedisConnection();

    // Simple ping – promise form is properly typed
    const result = await connection.ping();
    const ok = result === 'PONG';

    // Close connection
    await connection.quit();

    if (!ok) throw new Error('Unexpected PING response');

    console.log('✅ Redis connection test successful');
    return true;
  } catch (error) {
    console.log('⚠️ Redis connection test failed:', (error as Error).message);
    return false;
  }
};

// Export all utilities
export default {
  // Memory monitoring
  logMemoryUsage,
  setupMemoryMonitoring,
  
  // FFmpeg helpers
  buildUnifiedTransitionChain,
  calculateInputDurations,
  createFFmpegCommand,
  
  // File system
  ensureDirectoriesExist,
  generateCompositionId,
  saveComposition,
  loadComposition,
  addExportToComposition,
  safeDeleteFile,
  getFileSize,
  fsAsync,
  
  // API keys
  generateAPIKey,
  loadAPIKeys,
  saveAPIKeys,
  validateAPIKey,
  
  // Progress emission
  emitExportProgress,
  createProgressCallback,
  
  // Error handling
  createError,
  asyncHandler,
  logError,
  
  // General utilities
  sanitizeFilename,
  generateUniqueFilename,
  getFileExtension,
  isImageFile,
  isVideoFile,
  formatDuration,
  formatFileSize,
  randomString,
  testRedisConnection
};
