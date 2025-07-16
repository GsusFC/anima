import { Router, Request, Response } from 'express';
import * as multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Req, ImageFile } from '../types';
import { UPLOAD_CONFIG } from '../config/server';
import { createSessionDirectory } from '../config/directories';

// Router for file upload endpoints
const uploadRouter = Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req: Req, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // sessionId should be extracted from query or headers since body isn't parsed yet
    const sessionId = req.query.sessionId || req.headers['x-session-id'] || Date.now().toString();
    const sessionDir = createSessionDirectory(sessionId as string);
    
    // Store sessionId in req for later use
    req.sessionId = sessionId as string;
    cb(null, sessionDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Keep original filename with timestamp prefix, sanitize for FFmpeg compatibility
    const timestamp = Date.now();
    const originalName = file.originalname
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/[^\w\.-]/g, '') // Remove special characters except dots, dashes, underscores
      .replace(/_+/g, '_'); // Replace multiple underscores with single
    cb(null, `${timestamp}_${originalName}`);
  }
});

// Multer for images (slideshow)
const imageUpload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_CONFIG.limits.fileSize,
    files: UPLOAD_CONFIG.limits.files
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = UPLOAD_CONFIG.allowedTypes.images;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Only image files are allowed!'));
  }
});

// Multer for videos (video editor)
const videoUpload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_CONFIG.limits.videoSize,
    files: 1 // Single video file
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedVideoTypes = UPLOAD_CONFIG.allowedTypes.videos;
    const extname = allowedVideoTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /video\//.test(file.mimetype);
    
    console.log(`🎥 Video filter check: file=${file.originalname}, mime=${file.mimetype}, ext=${path.extname(file.originalname)}, extOk=${extname}, mimeOk=${mimetype}`);
    
    // Accept if either extension OR mimetype matches (more flexible)
    if (mimetype || extname) {
      console.log('✅ Video file accepted');
      return cb(null, true);
    } else {
      console.log('❌ Video file rejected');
      cb(new Error('Only video files are allowed! Supported formats: MP4, MOV, WebM, AVI, MKV'));
    }
  }
});

// Multer configuration specifically for Figma plugin uploads
const figmaUpload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_CONFIG.limits.fileSize,
    files: UPLOAD_CONFIG.limits.files
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = UPLOAD_CONFIG.allowedTypes.images;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// File upload endpoint (preferred)
uploadRouter.post('/upload', imageUpload.array('images', 50), (req: Req, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Use the sessionId that was stored by multer
    const sessionId = req.sessionId || Date.now().toString();
    const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      sessionId: sessionId,
      files: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Legacy endpoint for compatibility with old plugin bundles
uploadRouter.post('/api/upload', imageUpload.array('images', 50), (req: Req, res: Response) => {
  // Reuse the same logic by calling the primary handler's body.
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const sessionId = req.sessionId || Date.now().toString();
    const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      sessionId,
      files: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Video Editor upload endpoint
uploadRouter.post('/video-editor/upload', videoUpload.single('video'), (req: Request, res: Response) => {
  console.log('🎬 VIDEO UPLOAD ENDPOINT HIT!');
  try {
    if (!req.file) {
      console.log('❌ No file received');
      return res.status(400).json({ error: 'No video file uploaded' });
    }
    console.log('📁 File received:', req.file.originalname, req.file.mimetype);

    // Validate video file type - rely primarily on file extension since mimetype can be unreliable
    const videoMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska', 'application/octet-stream'];
    const videoExtensions = /\.(mp4|mov|webm|avi|mkv)$/i;
    
    if (!videoMimeTypes.includes(req.file.mimetype) && !videoExtensions.test(req.file.originalname)) {
      console.log(`❌ Invalid video type: mime=${req.file.mimetype}, file=${req.file.originalname}`);
      return res.status(400).json({ error: 'Invalid video file type' });
    }

    const videoFile = {
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  } catch (error: any) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Video upload failed', details: error.message });
  }
});

// File validation endpoint for video editor
uploadRouter.get('/video-editor/validate/:sessionId/:filename', (req: Request, res: Response) => {
  try {
    const { sessionId, filename } = req.params;
    const filePath = path.join(process.env.TEMP_DIR || 'uploads', sessionId, filename);
    const exists = fs.existsSync(filePath);
    
    console.log(`🔍 File validation: ${filePath} exists: ${exists}`);
    
    res.json({
      exists,
      path: filePath,
      sessionId,
      filename,
      tempDir: process.env.TEMP_DIR || 'uploads'
    });
  } catch (error: any) {
    console.error('❌ File validation error:', error);
    res.status(500).json({ error: 'Validation failed', details: error.message });
  }
});

// Debug endpoint to check uploaded files
uploadRouter.get('/api/debug/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const sessionDir = path.join(process.env.TEMP_DIR || 'uploads', sessionId);

    if (!fs.existsSync(sessionDir)) {
      return res.json({
        exists: false,
        sessionId: sessionId,
        path: sessionDir,
        message: 'Session directory does not exist'
      });
    }

    const files = fs.readdirSync(sessionDir);
    const fileDetails = files.map(filename => {
      const filepath = path.join(sessionDir, filename);
      const stats = fs.statSync(filepath);
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });

    res.json({
      exists: true,
      sessionId: sessionId,
      path: sessionDir,
      fileCount: files.length,
      files: fileDetails
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to check session',
      details: error.message
    });
  }
});

export { imageUpload, videoUpload, figmaUpload };
export default uploadRouter;
