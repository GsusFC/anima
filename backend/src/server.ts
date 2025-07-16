/**
 * AnimaGen Backend - Server Module
 * 
 * This module sets up the Express application with all necessary middleware,
 * configurations, and routes. It provides a clean, modular approach to server setup.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';

// Import configuration
import config, { serverTimeouts } from './config';
import { RequestWithSessionId, GlobalWithIO } from './types';

// Import middleware
import errorHandler from './middleware/errorHandler';

// Import utilities
import { 
  ensureDirectoriesExist, 
  emitExportProgress, 
  testRedisConnection,
  sanitizeFilename,
  isImageFile,
  isVideoFile
} from './utils';

// Declare global io variable for Socket.IO
declare const global: GlobalWithIO;

/**
 * Creates and configures the Express server
 * @returns Promise resolving to server instance and port
 */
export async function createServer(): Promise<{ app: Express; server: http.Server; port: number }> {
  // Create Express application
  const app = express();
  const server = http.createServer(app);
  
  // Set server timeout to 10 minutes for video processing
  server.timeout = serverTimeouts.requestTimeout;
  server.keepAliveTimeout = serverTimeouts.keepAliveTimeout;
  server.headersTimeout = serverTimeouts.headersTimeout;
  
  // Set up Socket.IO with CORS configuration
  const io = new SocketIOServer(server, {
    cors: {
      origin: config.app.corsOrigins,
      methods: ["GET", "POST"]
    }
  });
  
  // Make Socket.IO available globally for routes
  global.io = io;
  
  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
  app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit
  
  // Add request timeout middleware for export endpoints
  app.use('/api/export', (req: Request, res: Response, next: NextFunction) => {
    // Set longer timeout for export endpoints
    req.setTimeout(serverTimeouts.exportTimeout, () => {
      console.error('❌ Export request timeout');
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Export request timeout. Please try with fewer images or shorter durations.'
        });
      }
    });
    next();
  });
  
  // Add request timeout middleware for preview endpoints
  app.use('/preview', (req: Request, res: Response, next: NextFunction) => {
    // Set timeout for preview endpoints
    req.setTimeout(serverTimeouts.previewTimeout, () => {
      console.error('❌ Preview request timeout');
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Preview generation timeout. Please try with fewer images.'
        });
      }
    });
    next();
  });
  
  // Serve static files
  app.use(express.static('public'));
  
  // Favicon endpoint
  app.get('/favicon.ico', (_req: Request, res: Response) => {
    res.status(204).end(); // No content response for favicon
  });
  
  // Ensure required directories exist
  const requiredDirs = [
    config.app.outputDir,
    config.app.tempDir,
    config.app.compositionsDir,
    config.app.logsDir
  ];
  
  console.log('🔧 Setting up directories...');
  requiredDirs.forEach(dir => console.log(`🔧 ${path.basename(dir)} dir: ${dir}`));
  
  const dirResults = ensureDirectoriesExist(requiredDirs);
  
  // Check if all directories were created successfully
  const allDirsCreated = Object.values(dirResults).every(result => result);
  if (!allDirsCreated) {
    throw new Error('Failed to create required directories');
  }
  
  console.log('✅ All directories ready');
  
  // Multer configuration for file uploads
  const storage = multer.diskStorage({
    destination: (req: RequestWithSessionId, file: Express.Multer.File, cb: Function) => {
      // sessionId should be extracted from query or headers since body isn't parsed yet
      const sessionId = req.query.sessionId as string || 
                        req.headers['x-session-id'] as string || 
                        Date.now().toString();
      
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
      const timestamp = Date.now();
      const originalName = sanitizeFilename(file.originalname);
      cb(null, `${timestamp}_${originalName}`);
    }
  });
  
  // Multer for images (slideshow)
  const upload = multer({
    storage,
    limits: {
      fileSize: config.app.maxFileSize,
      files: config.app.maxFiles
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: Function) => {
      if (isImageFile(file.originalname, file.mimetype)) {
        return cb(null, true);
      }
      cb(new Error('Only image files are allowed!'));
    }
  });
  
  // Multer for videos (video editor)
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
  
  // Initialize Job Queue System
  async function initializeJobQueue(): Promise<boolean> {
    try {
      console.log('🔧 Initializing job queue system...');
      
      // Test Redis connection
      const redisConnected = await testRedisConnection();
      
      if (!redisConnected) {
        console.log('⚠️ Redis not available - job queue disabled. Install and start Redis for async processing.');
        return false;
      }
      
      // Start worker manager
      const workerManager = await import('./workers/workerManager');
      await workerManager.start();
      
      console.log('✅ Job queue system initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize job queue:', (error as Error).message);
      console.log('⚠️ Continuing without job queue - using synchronous processing');
      return false;
    }
  }
  
  // If job queue is enabled, forward BullMQ events to Socket.IO
  async function setupQueueEventForwarding(): Promise<void> {
    try {
      const { QueueEvents } = await import('bullmq');
      const { createRedisConnection } = await import('./utils/redis');
      
      const connection = createRedisConnection();
      const queueEvents = new QueueEvents('video-processing', { connection });
      
      queueEvents.on('progress', ({ jobId, data }) => {
        emitExportProgress('job', 'processing', typeof data === 'number' ? data : 0, 'Job progress', { jobId });
      });
      
      queueEvents.on('completed', ({ jobId, returnvalue }) => {
        // BullMQ `returnvalue` puede ser cualquier cosa; el spread requiere un objeto
        const extra =
          returnvalue && typeof returnvalue === 'object' ? (returnvalue as Record<string, unknown>) : {};
        emitExportProgress('job', 'completed', 100, 'Job completed', { jobId, ...extra });
      });
      
      queueEvents.on('failed', ({ jobId, failedReason }) => {
        emitExportProgress('job', 'error', 100, 'Job failed', { jobId, error: failedReason });
      });
      
      console.log('✅ QueueEvents forwarding to Socket.IO enabled');
    } catch (e) {
      console.warn('⚠️ Could not set up QueueEvents forwarding:', (e as Error).message);
    }
  }
  
  // Initialize job queue (non-blocking)
  let jobQueueEnabled = false;
  
  initializeJobQueue()
    .then(enabled => {
      jobQueueEnabled = enabled;
      if (enabled) {
        return setupQueueEventForwarding();
      }
    })
    .catch(error => {
      console.error('❌ Job queue initialization error:', error);
      jobQueueEnabled = false;
    });
  
  // Basic routes
  
  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    console.log('🏥 Health check requested');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3002,
      directories: {
        output: fs.existsSync(config.app.outputDir),
        uploads: fs.existsSync(config.app.tempDir),
        compositions: fs.existsSync(config.app.compositionsDir)
      }
    });
  });
  
  // API status endpoint
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({
      message: 'AnimaGen Backend Server',
      status: 'running',
      version: '1.0.1',
      jobQueue: {
        enabled: jobQueueEnabled,
        status: jobQueueEnabled ? 'running' : 'disabled'
      },
      endpoints: {
        upload: 'POST /upload',
        preview: 'POST /preview',
        exportGif: 'POST /export/gif',
        exportVideo: 'POST /export/video',
        download: 'GET /download/:filename',
        queuedExport: 'POST /api/export/{slideshow|video|gif|trim|convert}',
        jobStatus: 'GET /api/export/status/:jobId',
        jobDownload: 'GET /api/export/download/:jobId',
        authValidate: 'POST /api/auth/validate',
        figmaImport: 'POST /api/figma/import',
        generateKey: 'POST /api/auth/generate-key',
        keyManager: 'GET /api/keys',
        slideshowViewer: 'GET /api/slideshow/:id'
      }
    });
  });
  
  // Root endpoint to serve frontend
  app.get('/', (_req: Request, res: Response) => {
    console.log('🏠 Root endpoint requested');
    try {
      const indexPath = path.join(__dirname, 'public', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.log('❌ index.html not found, serving basic response');
        res.send(`
          <html>
            <body>
              <h1>AnimaGen Server</h1>
              <p>Status: Running</p>
              <p>Time: ${new Date().toISOString()}</p>
              <p><a href="/api/health">Health Check</a></p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('❌ Error serving root:', error);
      res.status(500).send('Server Error');
    }
  });
  
  // Debug endpoint
  app.get('/debug', (_req: Request, res: Response) => {
    console.log('🔍 Debug endpoint requested');
    res.json({
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
      port: process.env.PORT || 3002,
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      directories: {
        output: fs.existsSync(config.app.outputDir),
        temp: fs.existsSync(config.app.tempDir),
        compositions: fs.existsSync(config.app.compositionsDir),
        public: fs.existsSync(path.join(__dirname, 'public'))
      }
    });
  });
  
  // Serve uploaded videos and processed files
  app.use('/temp', express.static(config.app.tempDir));
  
  // Serve uploaded files statically for Figma plugin
  app.use('/uploads', express.static(config.app.tempDir));
  
  // Serve output files with proper video headers for streaming
  app.use('/output', (req: Request, res: Response, next: NextFunction) => {
    const filename = path.basename(req.path);
    const ext = path.extname(filename).toLowerCase();
    
    // Set proper MIME type for video files
    if (['.mp4', '.webm', '.mov'].includes(ext)) {
      const mimeType = ext === '.webm' ? 'video/webm' :
                      ext === '.mov' ? 'video/quicktime' :
                      'video/mp4';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');
      
      // For preview files, serve inline; for exports, force download
      if (filename.includes('preview_') || filename.includes('master_')) {
        res.setHeader('Content-Disposition', 'inline');
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
    } else if (ext === '.gif') {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      // For other files, force download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    
    next();
  }, express.static(config.app.outputDir));
  
  // Serve logs directory read-only
  app.use('/logs', express.static(config.app.logsDir));
  
  // Mount route modules
  async function mountRoutes(): Promise<void> {
    try {
      // Import route modules
      const exportRoutes = await import('./routes/export');
      const unifiedExportRouter = await import('./routes/unified-export');
      const authRoutes = await import('./routes/auth');
      const figmaRoutes = await import('./routes/figma');
      const videoEditorRoutes = await import('./routes/video-editor');
      const previewRoutes = await import('./routes/preview');
      // NEW: High-quality master generation routes
      const masterRoutes = await import('./routes/master');
      
      // Mount routes
      app.use('/api/export', exportRoutes.default);
      app.use('/api/unified-export', unifiedExportRouter.default);
      app.use('/api/auth', authRoutes.default);
      app.use('/api/figma', figmaRoutes.default);
      app.use('/video-editor', videoEditorRoutes.default);
      app.use('/preview', previewRoutes.default);
      // Expose master generation endpoint (used by frontend export workflow)
      app.use('/generate-master', masterRoutes.default);
      
      // File upload endpoint (preferred)
      app.post('/upload', upload.array('images', config.app.maxFiles), (req: RequestWithSessionId, res: Response) => {
        try {
          if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
          }
          
          // Use the sessionId that was stored by multer
          const sessionId = req.sessionId || Date.now().toString();
          const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
        } catch (error) {
          console.error('Upload error:', error);
          res.status(500).json({ error: 'Upload failed', details: (error as Error).message });
        }
      });
      
      // Legacy endpoint for compatibility with old plugin bundles
      app.post('/api/upload', upload.array('images', config.app.maxFiles), (req: RequestWithSessionId, res: Response) => {
        try {
          if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
          }
          
          const sessionId = req.sessionId || Date.now().toString();
          const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
        } catch (error) {
          console.error('Upload error:', error);
          res.status(500).json({ error: 'Upload failed', details: (error as Error).message });
        }
      });
      
      console.log('✅ All routes mounted successfully');
    } catch (error) {
      console.error('❌ Failed to mount routes:', error);
      throw error;
    }
  }
  
  // Mount routes (will be implemented asynchronously)
  await mountRoutes();
  
  // Debug logger for export requests
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url.includes('export') || req.url.includes('video')) {
      console.log(`🌐 REQUEST: ${req.method} ${req.url}`);
    }
    next();
  });
  
  // Register error handling middleware last
  app.use(errorHandler);
  
  // Determine port
  const port = config.app.port;
  
  return { app, server, port };
}

/**
 * Starts the server on the specified port
 * @param port Port number
 * @returns Promise resolving to server instance
 */
export async function startServer(port: number = config.app.port): Promise<http.Server> {
  const { server } = await createServer();
  
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`🚀 Server started on port ${port}`);
      resolve(server);
    });
  });
}

export default { createServer, startServer };
