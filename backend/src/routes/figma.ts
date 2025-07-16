/**
 * AnimaGen Backend - Figma Routes Module
 * 
 * This module provides endpoints for Figma plugin integration,
 * including frame import, file upload, and slideshow data retrieval.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { 
  RequestWithSessionId,
  FigmaImportRequest,
  FigmaFrame,
  CompositionImage,
  BatchInfo,
  SlideshowResponse,
  Composition,
  Transition,
  TransitionType,
  UploadedFile
} from '../types';
import type { NextFunction } from 'express';
import config from '../config';
import { 
  asyncHandler,
  generateUniqueFilename,
  sanitizeFilename,
  saveComposition,
  loadComposition,
  generateCompositionId
} from '../utils';
import { QualityPreset } from '../types';

// Create router
const router = express.Router();

// Multer configuration specifically for Figma plugin uploads
const storage = multer.diskStorage({
  destination: (req: RequestWithSessionId, file: Express.Multer.File, cb: Function) => {
    // sessionId should be extracted from query or headers since body isn't parsed yet
    const sessionId = req.query.sessionId as string || 
                     req.headers['x-session-id'] as string || 
                     `figma_${Date.now()}`;
    
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

// Multer for Figma image uploads
const figmaUpload = multer({
  storage,
  limits: {
    fileSize: config.app.maxFileSize,
    files: config.app.maxFiles
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: Function) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware to handle both FormData and JSON for Figma import
const handleFigmaUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('multipart/form-data')) {
    // Use multer for FormData
    figmaUpload.array('images', config.app.maxFiles)(req, res, next);
  } else {
    // Skip multer for JSON
    next();
  }
};

/**
 * Figma Upload Endpoint - mimics /upload behavior for Figma compatibility
 * POST /api/figma/upload
 */
router.post('/upload', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('📤 Figma upload request received');
    
    const { sessionId, files, source, batchInfo } = req.body;
    
    // Log batch information if provided
    if (batchInfo) {
      console.log(`📦 Processing batch ${batchInfo.current}/${batchInfo.total} (${files.length} files)`);
    }
    
    if (!sessionId || !files || !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'Missing sessionId or files'
      });
    }
    
    // Create session directory
    const sessionDir = path.join(config.app.tempDir, sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    // Sort files by selection index to preserve user's intended order
    const sortedFiles = files.sort((a: any, b: any) => {
      const indexA = a.selectionIndex ?? 999999;
      const indexB = b.selectionIndex ?? 999999;
      return indexA - indexB;
    });
    
    console.log('🔢 Files sorted by selection order:', sortedFiles.map((f: any) => `${f.originalname} (${f.selectionIndex})`));
    
    const uploadedFiles: UploadedFile[] = [];
    
    // Process each file in selection order
    for (let i = 0; i < sortedFiles.length; i++) {
      const fileData = sortedFiles[i];
      
      if (fileData.buffer && Array.isArray(fileData.buffer)) {
        try {
          // Convert array back to buffer and save
          const imageBuffer = Buffer.from(fileData.buffer);
          const filename = fileData.filename || `image_${i}.jpg`;
          const filepath = path.join(sessionDir, filename);
          
          // Save file to disk
          fs.writeFileSync(filepath, imageBuffer);
          console.log(`💾 Saved file: ${filename} (${imageBuffer.length} bytes)`);
          
          // Create file object that matches multer's structure
          uploadedFiles.push({
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            fieldname: 'images',
            originalname: fileData.originalname || filename,
            encoding: '7bit',
            mimetype: fileData.mimetype || 'image/jpeg',
            destination: sessionDir,
            filename: filename,
            path: filepath,
            size: imageBuffer.length,
            selectionIndex: fileData.selectionIndex ?? i // Preserve selection order
          });
        } catch (error) {
          console.error(`❌ Failed to save file ${i}:`, (error as Error).message);
        }
      }
    }
    
    // Return same response format as /upload endpoint with batch info
    const response = {
      success: true,
      sessionId: sessionId,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} files`
    };
    
    // Add batch information if provided
    if (batchInfo) {
      response.message = `Successfully uploaded batch ${batchInfo.current}/${batchInfo.total} (${uploadedFiles.length} files)`;
      
      if ((batchInfo as BatchInfo).isLastBatch) {
        console.log(`✅ Final batch ${batchInfo.current}/${batchInfo.total} completed for session ${sessionId}`);
      }
    }
    
    res.json(response);
  } catch (error) {
    console.error('❌ Figma upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      details: (error as Error).message
    });
  }
}));

/**
 * Figma Import Endpoint (supports both FormData and JSON for compatibility)
 * POST /api/figma/import
 */
router.post('/import', handleFigmaUpload, asyncHandler(async (req: RequestWithSessionId, res: Response) => {
  try {
    console.log('🎨 Figma import requested');
    console.log('📋 Body data:', req.body);
    console.log('📁 Files received:', req.files ? (req.files as Express.Multer.File[]).length : 0);
    
    // Handle both FormData (with files) and JSON (legacy) formats
    let frames: CompositionImage[] = [];
    let sessionId = req.body.sessionId;
    const source = req.body.source || 'figma-plugin';
    const pluginVersion = req.body.pluginVersion || '2.0.0';
    
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      // FormData format - process uploaded files
      console.log('📤 Processing FormData upload with', (req.files as Express.Multer.File[]).length, 'files');
      
      frames = (req.files as Express.Multer.File[]).map((file, index) => {
        // Try to parse metadata if provided
        let metadata = {};
        try {
          const metadataKey = `metadata[${index}]`;
          if (req.body[metadataKey]) {
            metadata = JSON.parse(req.body[metadataKey]);
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse metadata for file', index);
        }
        
        return {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          filename: file.filename,
          originalName: file.originalname || (metadata as any).originalName || `frame_${index}`,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          metadata: metadata,
          order: index
        };
      });
      
      sessionId = sessionId || req.sessionId || `figma_${Date.now()}`;
    } else if (req.body.frames) {
      // JSON format - process image data and save as files
      console.log('📋 Processing JSON format with', req.body.frames.length, 'frames');
      
      sessionId = sessionId || `figma_${Date.now()}`;
      const sessionDir = path.join(config.app.tempDir, sessionId);
      
      // Create session directory
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      
      frames = [];
      
      for (let i = 0; i < req.body.frames.length; i++) {
        const frameData = req.body.frames[i] as FigmaFrame;
        
        if (frameData.imageData && Array.isArray(frameData.imageData)) {
          try {
            // Convert array back to Uint8Array
            const imageBuffer = Buffer.from(frameData.imageData);
            const format = frameData.metadata?.format || 'jpg';
            const filename = `frame_${i}.${format.toLowerCase()}`;
            
            // For Railway compatibility: store as base64 instead of file
            const base64Data = imageBuffer.toString('base64');
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            
            console.log(`💾 Processing frame ${i}: ${filename} (${imageBuffer.length} bytes)`);
            
            frames.push({
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              filename: filename,
              originalName: frameData.name || `frame_${i}`,
              base64Data: base64Data, // Store base64 data instead of file path
              size: imageBuffer.length,
              mimetype: mimeType,
              metadata: frameData.metadata,
              order: i
            });
          } catch (error) {
            console.error(`❌ Failed to save frame ${i}:`, (error as Error).message);
          }
        } else {
          console.warn(`⚠️ Frame ${i} has no valid image data`);
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'No frames or files provided'
      });
    }
    
    console.log('📊 Processing', frames.length, 'frames from Figma');
    
    // Create slideshow URL
    const slideshowId = `slideshow_${sessionId || Date.now()}`;
    const projectUrl = `${req.protocol}://${req.get('host')}/slideshow/${slideshowId}`;
    
    // Save composition using existing system
    const compositionId = slideshowId;
    const composition: Composition = {
      id: compositionId,
      sessionId: sessionId,
      images: frames,
      transitions: frames.map((_, index) => ({
        type: 'fade' as TransitionType,
        duration: 1000,
        fromFrameId: index > 0 ? `frame_${index - 1}` : null,
        toFrameId: `frame_${index}`
      })),
      frameDurations: new Array(frames.length).fill(3000), // 3 seconds per frame
      quality: QualityPreset.HIGH,
      type: 'figma-import',
      metadata: {
        source: source,
        pluginVersion: pluginVersion,
        createdAt: new Date().toISOString(),
        framesCount: frames.length
      }
    };
    
    console.log('💾 Saving composition:', compositionId);
    const savedComposition = saveComposition(composition);
    
    // Process frames - handle both file uploads and JSON data
    const processedFrames = frames.map((frame, index) => {
      // For uploaded files
      if (frame.path) {
        return {
          id: frame.id || `frame_${index}`,
          filename: frame.filename,
          originalName: frame.originalName,
          path: frame.path,
          size: frame.size,
          mimetype: frame.mimetype,
          order: frame.order || index,
          dimensions: {
            width: frame.metadata?.dimensions?.width || 1920,
            height: frame.metadata?.dimensions?.height || 1080
          },
          format: frame.metadata?.format || (frame.mimetype?.includes('jpeg') ? 'JPG' : 'PNG')
        };
      } else {
        // For JSON data (legacy)
        return {
          id: `frame_${index}`,
          name: frame.originalName,
          order: frame.order || index,
          dimensions: {
            width: frame.metadata?.dimensions?.width || 1920,
            height: frame.metadata?.dimensions?.height || 1080
          },
          format: frame.metadata?.format || 'PNG'
        };
      }
    });
    
    // Prepare response
    const response = {
      success: true,
      sessionId: sessionId || `figma_${Date.now()}`,
      projectId: slideshowId,
      projectUrl: projectUrl,
      framesImported: frames.length,
      files: processedFrames,
      defaultSettings: {
        transitions: frames.map((_, index) => ({
          type: 'fade',
          duration: 1000,
          fromFrameId: index > 0 ? `frame_${index - 1}` : null,
          toFrameId: `frame_${index}`
        })),
        frameDurations: new Array(frames.length).fill(3000), // 3 seconds per frame
        exportSettings: {
          quality: QualityPreset.HIGH,
          resolution: '1920x1080',
          fps: 30,
          format: 'mp4'
        }
      },
      message: `Successfully imported ${frames.length} frames from Figma`
    };
    
    console.log('✅ Figma import completed successfully');
    console.log('🔗 Project URL:', projectUrl);
    
    res.json(response);
  } catch (error) {
    console.error('❌ Figma import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import frames from Figma',
      details: (error as Error).message
    });
  }
}));

/**
 * Slideshow Viewer Endpoint
 * GET /api/figma/slideshow/:id
 */
router.get('/slideshow/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🎬 Slideshow data requested for ID:', id);
    
    try {
      // Try to load real composition data
      const composition = loadComposition(id);
      console.log('✅ Loaded composition:', id);
      
      // Convert composition to slideshow format
      const sourceStr = composition.metadata?.source ?? 'unknown';
      const metadata = {
        source: sourceStr,
        framesCount: composition.images.length,
        ...composition.metadata
      };
      const slideshowData = {
        id: id,
        title: `Slideshow ${id}`,
        description: sourceStr === 'figma-plugin' 
          ? 'Generated from Figma frames' 
          : 'AnimaGen Slideshow',
        createdAt: composition.metadata?.createdAt || new Date().toISOString(),
        frames: composition.images.map((img, index) => ({
          id: img.id || `frame_${index}`,
          name: img.originalName || img.filename || `Frame ${index + 1}`,
          order: index,
          duration: composition.frameDurations?.[index] || 3000,
          transition: composition.transitions?.[index]?.type || 'fade',
          imageUrl: img.base64Data 
            ? `/api/image/${composition.sessionId}/${img.filename}` 
            : `/uploads/${composition.sessionId}/${img.filename}`,
          dimensions: {
            width: img.metadata?.dimensions?.width || 1920,
            height: img.metadata?.dimensions?.height || 1080
          }
        })),
        settings: {
          totalDuration: (composition.frameDurations || []).reduce((sum, duration) => sum + duration, 0),
          autoPlay: true,
          loop: true,
          quality: composition.quality || 'high',
          format: 'slideshow'
        },
        metadata
      };
      
      const response: SlideshowResponse = {
        success: true,
        slideshow: slideshowData
      };
      
      res.json(response);
    } catch (loadError) {
      console.warn('⚠️ Could not load composition, using fallback data:', (loadError as Error).message);
      
      // Fallback to mock data if composition not found
      const slideshowData = {
        id: id,
        title: `Slideshow ${id}`,
        description: 'Generated slideshow',
        createdAt: new Date().toISOString(),
        frames: [
          {
            id: 'frame_0',
            name: 'Frame 1',
            order: 0,
            duration: 3000,
            transition: 'fade',
            imageUrl: '/api/placeholder-image/1920/1080?text=Frame+1',
            dimensions: { width: 1920, height: 1080 }
          }
        ],
        settings: {
          totalDuration: 3000,
          autoPlay: true,
          loop: true,
          quality: 'high',
          format: 'slideshow'
        },
        metadata: {
          /* Fallback always provides a defined `source` string */
          source: 'unknown',
          framesCount: 1
        }
      };
      
      const response: SlideshowResponse = {
        success: true,
        slideshow: slideshowData
      };
      
      res.json(response);
    }
  } catch (error) {
    console.error('❌ Failed to get slideshow data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve slideshow data',
      details: (error as Error).message
    });
  }
}));

/**
 * Placeholder image endpoint for testing
 * GET /api/figma/placeholder-image/:width/:height
 */
router.get('/placeholder-image/:width/:height', (req: Request, res: Response) => {
  const { width, height } = req.params;
  const text = req.query.text || 'Placeholder';
  
  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a1b"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="#ec4899" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

/**
 * Serve image from base64 data
 * GET /api/figma/image/:sessionId/:filename
 */
router.get('/image/:sessionId/:filename', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { sessionId, filename } = req.params;
    
    // Load composition to get base64 data
    const compositionId = `slideshow_${sessionId}`;
    
    try {
      const composition = loadComposition(compositionId);
      
      if (!composition || !composition.images) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Find the image by filename
      const image = composition.images.find(img => img.filename === filename);
      
      if (!image || !image.base64Data) {
        return res.status(404).json({ error: 'Image data not found' });
      }
      
      // Convert base64 back to buffer and serve
      const imageBuffer = Buffer.from(image.base64Data, 'base64');
      
      res.setHeader('Content-Type', image.mimetype || 'image/jpeg');
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      res.send(imageBuffer);
    } catch (error) {
      // Try to load from file system as fallback
      const imagePath = path.join(config.app.tempDir, sessionId, filename);
      
      if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
      } else {
        throw new Error('Image not found in composition or filesystem');
      }
    }
  } catch (error) {
    console.error('❌ Error serving image:', error);
    res.status(404).json({ error: 'Failed to serve image' });
  }
}));

export default router;
