import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

// Import configuration
import { SERVER_CONFIG, PATHS } from './config/server';
import { initializeDirectories } from './config/directories';

// Import middleware
import errorHandler from './middleware/errorHandler';

// Import routes
import healthRouter from './routes/healthRoutes';
import uploadRouter from './routes/uploadRoutes';

// Import types
import { SocketEvents } from './types';

/**
 * Creates and configures the Express application
 */
export function createApp() {
  // Initialize Express app
  const app = express();
  const server = http.createServer(app);

  // Set server timeout to 10 minutes for video processing
  server.timeout = SERVER_CONFIG.timeouts.server;
  server.keepAliveTimeout = SERVER_CONFIG.timeouts.keepAlive;
  server.headersTimeout = SERVER_CONFIG.timeouts.headers;

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: SERVER_CONFIG.cors.origins,
      methods: SERVER_CONFIG.cors.methods
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

  // Helper to forward progress updates to clients
  const emitExportProgress: SocketEvents['emitExportProgress'] = (type, status, progress, message, extra = {}) => {
    try {
      io.emit('export:progress', { type, status, progress, message, ...extra });
    } catch (e: any) {
      console.warn('Progress emit failed:', e.message);
    }
  };

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
  app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit

  // Add request timeout middleware for export endpoints
  app.use('/api/export', (req: Request, res: Response, next: NextFunction) => {
    // Set longer timeout for export endpoints (10 minutes)
    req.setTimeout(SERVER_CONFIG.timeouts.exportRequest, () => {
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

  app.use('/preview', (req: Request, res: Response, next: NextFunction) => {
    // Set timeout for preview endpoints (5 minutes)
    req.setTimeout(SERVER_CONFIG.timeouts.previewRequest, () => {
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

  // Static file serving
  app.use(express.static('public'));
  app.use('/temp', express.static(PATHS.tempDir));
  app.use('/uploads', express.static(PATHS.tempDir));
  app.use('/output', express.static(PATHS.outputDir));
  app.use('/logs', express.static(PATHS.logsDir));

  // Mount routers
  app.use(healthRouter);
  app.use(uploadRouter);

  // Debug logger for export requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url.includes('export') || req.url.includes('video')) {
      console.log(`🌐 REQUEST: ${req.method} ${req.url}`);
    }
    next();
  });

  // Mount the export routes
  // app.use('/api/export', exportRoutes);

  // Mount the unified export route (replaces simple endpoints)
  // const unifiedExportRouter = require('./routes/unified-export');
  // app.use('/api/unified-export', unifiedExportRouter);

  // Centralised error-handling middleware (should be last)
  app.use(errorHandler);

  return { app, server, io, emitExportProgress };
}

/**
 * Initializes the application
 */
export async function initializeApp() {
  console.log('🚀 Initializing AnimaGen backend...');

  // Initialize directories
  const directoriesInitialized = initializeDirectories();
  if (!directoriesInitialized) {
    throw new Error('Failed to initialize directories');
  }

  // Initialize job queue (to be implemented)
  // await initializeJobQueue();

  return createApp();
}

export default { createApp, initializeApp };
