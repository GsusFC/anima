require('dotenv').config();

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('⚠️ Server will continue running...');
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('⚠️ Server will continue running...');
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const { FilterGraph } = require('./FilterGraph');

// Job Queue System imports
const workerManager = require('./workers/workerManager');
const exportRoutes = require('./routes/export');
const { testRedisConnection } = require('./utils/redis');

const app = express();
const server = http.createServer(app);

// Set server timeout to 10 minutes for video processing
server.timeout = 10 * 60 * 1000; // 10 minutes
server.keepAliveTimeout = 5 * 60 * 1000; // 5 minutes
server.headersTimeout = 6 * 60 * 1000; // 6 minutes (must be greater than keepAliveTimeout)

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180"],
    methods: ["GET", "POST"]
  }
});

// Make Socket.IO available globally for routes
global.io = io;

// NEW: helper to forward progress updates to clients
const emitExportProgress = (type, status, progress, message, extra = {}) => {
  try {
    io.emit('export:progress', { type, status, progress, message, ...extra });
  } catch (e) {
    console.warn('Progress emit failed:', e.message);
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit

// Add request timeout middleware for export endpoints
app.use('/api/export', (req, res, next) => {
  // Set longer timeout for export endpoints (10 minutes)
  req.setTimeout(10 * 60 * 1000, () => {
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

app.use('/preview', (req, res, next) => {
  // Set timeout for preview endpoints (5 minutes)
  req.setTimeout(5 * 60 * 1000, () => {
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
app.use(express.static('public'));

// Favicon endpoint
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response for favicon
});

// Memory monitoring for debugging
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  const memInfo = {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100
  };
  console.log(`📊 Memory usage: RSS: ${memInfo.rss}MB, Heap: ${memInfo.heapUsed}/${memInfo.heapTotal}MB, External: ${memInfo.external}MB`);

  // Warn if memory usage is high
  if (memInfo.heapUsed > 500) {
    console.warn(`⚠️ High memory usage detected: ${memInfo.heapUsed}MB heap used`);
  }
};

// Log memory usage every 5 minutes
setInterval(logMemoryUsage, 5 * 60 * 1000);

// Monitor for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  logMemoryUsage();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  logMemoryUsage();
});

// Health check endpoint for Railway (early registration)
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3002,
    directories: {
      output: fs.existsSync(outputDir),
      uploads: fs.existsSync(tempDir),
      compositions: fs.existsSync(compositionsDir)
    }
  });
});

// File validation endpoint for video editor
app.get('/video-editor/validate/:sessionId/:filename', (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const filePath = path.join(tempDir, sessionId, filename);
    const exists = fs.existsSync(filePath);
    
    console.log(`🔍 File validation: ${filePath} exists: ${exists}`);
    
    res.json({
      exists,
      path: filePath,
      sessionId,
      filename,
      tempDir
    });
  } catch (error) {
    console.error('❌ File validation error:', error);
    res.status(500).json({ error: 'Validation failed', details: error.message });
  }
});

// Root endpoint to serve frontend
app.get('/', (req, res) => {
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
app.get('/debug', (req, res) => {
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
      output: fs.existsSync(outputDir),
      temp: fs.existsSync(tempDir),
      compositions: fs.existsSync(compositionsDir),
      public: fs.existsSync(path.join(__dirname, 'public'))
    }
  });
});

// Ensure output, temp, and compositions directories exist
const outputDir = path.join(__dirname, process.env.OUTPUT_DIR || 'output');
const tempDir = path.join(__dirname, process.env.TEMP_DIR || 'uploads'); // Changed from 'temp' to 'uploads' for persistence
const compositionsDir = path.join(__dirname, 'compositions');
const logsDir = path.join(__dirname, 'logs');

// Serve uploaded videos and processed files
app.use('/temp', express.static(tempDir));

// Serve output files with proper video headers for streaming
app.use('/output', (req, res, next) => {
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
}, express.static(outputDir));

// Serve logs directory read-only
app.use('/logs', express.static(logsDir));

console.log('🔧 Setting up directories...');
console.log('🔧 Output dir:', outputDir);
console.log('🔧 Temp dir:', tempDir);
console.log('🔧 Compositions dir:', compositionsDir);
console.log('🔧 Logs dir:', logsDir);

try {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('✅ Created output directory');
  }

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('✅ Created temp directory');
  }

  if (!fs.existsSync(compositionsDir)) {
    fs.mkdirSync(compositionsDir, { recursive: true });
    console.log('✅ Created compositions directory');
  }
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('✅ Created logs directory');
  }
  
  console.log('✅ All directories ready');
} catch (error) {
  console.error('❌ Failed to create directories:', error);
  process.exit(1);
}

// Initialize Job Queue System
async function initializeJobQueue() {
  try {
    console.log('🔧 Initializing job queue system...');
    
    // Test Redis connection
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      console.log('⚠️ Redis not available - job queue disabled. Install and start Redis for async processing.');
      return false;
    }

    // Start worker manager
    await workerManager.start();
    console.log('✅ Job queue system initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize job queue:', error.message);
    console.log('⚠️ Continuing without job queue - using synchronous processing');
    return false;
  }
}

// If job queue is enabled, forward BullMQ events to Socket.IO
const { QueueEvents } = require('bullmq');
let queueEvents;
function setupQueueEventForwarding() {
  try {
    const { createRedisConnection } = require('./utils/redis');
    const connection = createRedisConnection();
    queueEvents = new QueueEvents('video-processing', { connection });

    queueEvents.on('progress', ({ jobId, data }) => {
      emitExportProgress('job', 'processing', typeof data === 'number' ? data : 0, 'Job progress', { jobId });
    });

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      emitExportProgress('job', 'completed', 100, 'Job completed', { jobId, ...returnvalue });
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      emitExportProgress('job', 'error', 100, 'Job failed', { jobId, error: failedReason });
    });

    console.log('✅ QueueEvents forwarding to Socket.IO enabled');
  } catch (e) {
    console.warn('⚠️ Could not set up QueueEvents forwarding:', e.message);
  }
}

// Initialize job queue (non-blocking)
let jobQueueEnabled = false;
initializeJobQueue().then(enabled => {
  jobQueueEnabled = enabled;
  if (enabled) setupQueueEventForwarding();
}).catch(error => {
  console.error('❌ Job queue initialization error:', error);
  jobQueueEnabled = false;
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // sessionId should be extracted from query or headers since body isn't parsed yet
    const sessionId = req.query.sessionId || req.headers['x-session-id'] || Date.now().toString();
    const sessionDir = path.join(tempDir, sessionId);
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    // Store sessionId in req for later use
    req.sessionId = sessionId;
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
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
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB limit
    files: parseInt(process.env.MAX_FILES) || 50 // Max 50 files
  },
  fileFilter: (req, file, cb) => {
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

// Multer for videos (video editor)
const videoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    files: 1 // Single video file
  },
  fileFilter: (req, file, cb) => {
    const allowedVideoTypes = /mp4|mov|webm|avi|mkv/;
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

// Quality presets for different output formats
const qualityPresets = {
  web: { width: 720, height: 480, fps: parseInt(process.env.DEFAULT_FPS) || 24, bitrate: '1M', crf: 28 },
  standard: { width: 1280, height: 720, fps: parseInt(process.env.DEFAULT_FPS) || 30, bitrate: '2M', crf: 23 },
  high: { width: 1920, height: 1080, fps: parseInt(process.env.DEFAULT_FPS) || 30, bitrate: '4M', crf: 20 },
  premium: { width: 1920, height: 1080, fps: 60, bitrate: '8M', crf: 18 },
  ultra: { width: 3840, height: 2160, fps: 60, bitrate: '20M', crf: 16 }
};

// Transition effects mapping (using real FFmpeg xfade transitions)
const transitionEffects = {
  none: 'none',
  cut: 'none', // Handle cut transitions as no transition
  
  // Basic fades
  fade: 'fade',
  fadeblack: 'fadeblack',
  fadewhite: 'fadewhite',
  dissolve: 'dissolve',
  
  // Slide transitions
  slideleft: 'slideleft',
  slideright: 'slideright', 
  slideup: 'slideup',
  slidedown: 'slidedown',
  
  // Wipe transitions
  wipeleft: 'wipeleft',
  wiperight: 'wiperight',
  wipeup: 'wipeup',
  wipedown: 'wipedown',
  wipetl: 'wipetl',
  wipetr: 'wipetr',
  wipebl: 'wipebl',
  wipebr: 'wipebr',
  
  // Smooth transitions
  smoothleft: 'smoothleft',
  smoothright: 'smoothright',
  smoothup: 'smoothup',
  smoothdown: 'smoothdown',
  
  // Circle/Shape transitions
  circlecrop: 'circlecrop',
  rectcrop: 'rectcrop',
  circleopen: 'circleopen',
  circleclose: 'circleclose',
  
  // Open/Close transitions
  horzopen: 'horzopen',
  horzclose: 'horzclose',
  vertopen: 'vertopen',
  vertclose: 'vertclose',
  
  // Diagonal transitions
  diagbl: 'diagbl',
  diagbr: 'diagbr',
  diagtl: 'diagtl',
  diagtr: 'diagtr',
  
  // Advanced effects
  radial: 'radial',
  pixelize: 'pixelize',
  distance: 'distance',
  squeezev: 'squeezev',
  squeezeh: 'squeezeh',
  zoomin: 'zoomin',
  
  // Cover/Reveal transitions
  coverleft: 'coverleft',
  coverright: 'coverright',
  coverup: 'coverup',
  coverdown: 'coverdown',
  revealleft: 'revealleft',
  revealright: 'revealright',
  revealup: 'revealup',
  revealdown: 'revealdown',
  
  // Wind/Slice effects
  hlwind: 'hlwind',
  hrwind: 'hrwind',
  vuwind: 'vuwind',
  vdwind: 'vdwind',
  hlslice: 'hlslice',
  hrslice: 'hrslice',
  vuslice: 'vuslice',
  vdslice: 'vdslice',
  
  // Additional effects
  fadegrays: 'fadegrays',
  hblur: 'hblur',

  // Legacy compatibility mappings
  slide: 'slideleft', // Map legacy 'slide' to 'slideleft'
  zoom: 'zoomin'      // Map legacy 'zoom' to 'zoomin'
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve static frontend files in production FIRST
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'AnimaGen Backend Server',
    status: 'running',
    version: '1.0.0',
    jobQueue: {
      enabled: jobQueueEnabled,
      status: jobQueueEnabled ? workerManager.getStatus() : 'disabled'
    },
    endpoints: {
      upload: 'POST /upload',
      preview: 'POST /preview',
      exportGif: 'POST /export/gif',
      exportVideo: 'POST /export/video',
      download: 'GET /download/:filename',
      queuedExport: 'POST /api/export/{slideshow|video|gif|trim|convert}',
      jobStatus: 'GET /api/export/status/:jobId',
      jobDownload: 'GET /api/export/download/:jobId'
    }
  });
});

// Debug logger for export requests
app.use((req, res, next) => {
  if (req.url.includes('export') || req.url.includes('video')) {
    console.log(`🌐 REQUEST: ${req.method} ${req.url}`);
  }
  next();
});

// Mount the export routes
app.use('/api/export', exportRoutes);

// Mount the unified export route (replaces simple endpoints)
const unifiedExportRouter = require('./routes/unified-export');
app.use('/api/unified-export', unifiedExportRouter);

// File upload endpoint (preferred)
app.post('/upload', upload.array('images', 50), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Use the sessionId that was stored by multer
    const sessionId = req.sessionId || Date.now().toString();
    const uploadedFiles = req.files.map(file => ({
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

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Legacy endpoint for compatibility with old plugin bundles
app.post('/api/upload', upload.array('images', 50), (req, res) => {
  // Reuse the same logic by calling the primary handler's body.
  // Instead of duplicating, wrap logic in inline function.
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const sessionId = req.sessionId || Date.now().toString();
    const uploadedFiles = req.files.map(file => ({
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
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Video Editor upload endpoint
app.post('/video-editor/upload', videoUpload.single('video'), (req, res) => {
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

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Video upload failed', details: error.message });
  }
});

// Video Editor: Trim video endpoint
app.post('/video-editor/trim', (req, res) => {
  try {
    const { videoPath, startTime, endTime, outputName } = req.body;
    
    console.log('🎬 Video trim request received');
    console.log('Video path:', videoPath);
    console.log('Temp dir:', tempDir);
    
    if (!videoPath || startTime === undefined || endTime === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: videoPath, startTime, endTime' 
      });
    }

    // Check if video file exists
    const fullVideoPath = path.isAbsolute(videoPath) 
      ? videoPath 
      : path.join(__dirname, videoPath);
    console.log('Checking video at:', fullVideoPath);
    
    if (!fs.existsSync(fullVideoPath)) {
      console.error('❌ Video file not found:', fullVideoPath);
      return res.status(400).json({ 
        error: 'Original video path not available. Please re-upload video.',
        videoPath: fullVideoPath,
        exists: false
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ 
        error: 'Start time must be less than end time' 
      });
    }

    const sessionId = req.body.sessionId || Date.now().toString();
    const sessionDir = path.join(tempDir, sessionId);
    const trimmedName = outputName || `trimmed_${Date.now()}.mp4`;
    const outputPath = path.join(sessionDir, trimmedName);

    // Ensure session directory exists
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    console.log(`🎬 Trimming video: ${fullVideoPath}`);
    console.log(`⏰ From ${startTime}s to ${endTime}s`);
    console.log(`💾 Output: ${outputPath}`);

    ffmpeg(fullVideoPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .on('start', (commandLine) => {
        console.log('🚀 FFmpeg command:', commandLine);
        io.emit('trim-progress', { 
          sessionId, 
          status: 'started',
          message: 'Video trimming started...'
        });
      })
      .on('progress', (progress) => {
        console.log(`⏳ Trim progress: ${progress.percent}%`);
        io.emit('trim-progress', { 
          sessionId, 
          status: 'processing', 
          percent: progress.percent,
          message: `Trimming video: ${Math.round(progress.percent || 0)}%`
        });
      })
      .on('end', () => {
        console.log('✅ Video trimmed successfully');
        
        // Get file stats
        const stats = fs.statSync(outputPath);
        
        io.emit('trim-progress', { 
          sessionId, 
          status: 'completed',
          message: 'Video trimmed successfully!'
        });

        res.json({
          success: true,
          trimmedVideo: {
            path: outputPath,
            filename: trimmedName,
            size: stats.size,
            duration: endTime - startTime
          },
          message: 'Video trimmed successfully'
        });
      })
      .on('error', (err) => {
        console.error('❌ Trim error:', err);
        io.emit('trim-progress', { 
          sessionId, 
          status: 'error',
          message: `Trim failed: ${err.message}`
        });
        
        res.status(500).json({ 
          error: 'Video trim failed', 
          details: err.message 
        });
      })
      .run();

  } catch (error) {
    console.error('❌ Trim endpoint error:', error);
    res.status(500).json({ 
      error: 'Video trim failed', 
      details: error.message 
    });
  }
});

// HELPER FUNCTION: Calculate optimal input duration for export with transitions
// CONSOLIDATED HELPER: Calculate optimal input durations for exports with transitions
function calculateInputDurations(validImages, transitions, frameDurations, defaultDuration) {
  // Ensure transitions is always an array to avoid runtime errors when no transitions are supplied
  if (!Array.isArray(transitions)) {
    transitions = [];
  }
  const results = {
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
      const frameDuration = (frameDurations[i] || defaultDuration) / 1000;
      results.inputDurations.push(frameDuration);
      results.totalDuration += frameDuration;
    }
    console.log('📏 Using exact durations (no transitions)');
  } else {
    // Complex case: has transitions, apply buffer logic
    console.log('📏 Using buffered durations (has transitions)');
    
    // Calculate total duration needed and max transition duration
    for (let i = 0; i < validImages.length; i++) {
      const frameDuration = (frameDurations[i] || defaultDuration) / 1000;
      results.totalDuration += frameDuration;
      
      if (i < transitions.length && transitions[i] && transitions[i].type !== 'cut' && transitions[i].type !== 'none') {
        const transitionDuration = Math.min(transitions[i].duration / 1000, frameDuration * 0.9);
        results.maxTransitionDuration = Math.max(results.maxTransitionDuration, transitionDuration);
        results.totalDuration += transitionDuration * 0.3;
      }
    }
    
    // Calculate individual input durations with buffer for transitions
    const bufferMultiplier = 1.5 + (results.maxTransitionDuration / results.totalDuration);
    
    for (let i = 0; i < validImages.length; i++) {
      const baseDuration = (frameDurations[i] || defaultDuration) / 1000;
      const inputDuration = Math.max(
        baseDuration,
        results.totalDuration / validImages.length * bufferMultiplier
      );
      results.inputDurations.push(inputDuration);
    }
  }
  
  return results;
}

// COMPOSITION HELPERS: Manage persistent compositions for re-export
function generateCompositionId() {
  return `comp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function saveComposition(composition) {
  const compositionPath = path.join(compositionsDir, `${composition.id}.json`);
  const compositionDataDir = path.join(compositionsDir, composition.id);
  
  // Create composition directory
  if (!fs.existsSync(compositionDataDir)) {
    fs.mkdirSync(compositionDataDir, { recursive: true });
  }
  
  // Copy images from temp to composition directory
  const copiedImages = composition.images.map((img, index) => {
    const originalPath = path.join(tempDir, composition.sessionId, img.filename);
    const newFilename = `image_${index}_${img.filename}`;
    const newPath = path.join(compositionDataDir, newFilename);
    
    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, newPath);
      return { ...img, filename: newFilename, originalFilename: img.filename };
    }
    return img;
  });
  
  // Save composition metadata
  const compositionData = {
    ...composition,
    images: copiedImages,
    createdAt: new Date().toISOString(),
    exports: [] // Track export history
  };
  
  fs.writeFileSync(compositionPath, JSON.stringify(compositionData, null, 2));
  
  console.log(`✅ Composition saved: ${composition.id}`);
  return compositionData;
}

function loadComposition(compositionId) {
  const compositionPath = path.join(compositionsDir, `${compositionId}.json`);
  
  if (!fs.existsSync(compositionPath)) {
    throw new Error(`Composition not found: ${compositionId}`);
  }
  
  const compositionData = JSON.parse(fs.readFileSync(compositionPath, 'utf8'));
  
  // Update image paths to point to composition directory
  compositionData.images = compositionData.images.map(img => ({
    ...img,
    path: path.join(compositionsDir, compositionId, img.filename)
  }));
  
  console.log(`📂 Composition loaded: ${compositionId}`);
  return compositionData;
}

function addExportToComposition(compositionId, exportData) {
  const compositionPath = path.join(compositionsDir, `${compositionId}.json`);
  
  if (!fs.existsSync(compositionPath)) {
    throw new Error(`Composition not found: ${compositionId}`);
  }
  
  const compositionData = JSON.parse(fs.readFileSync(compositionPath, 'utf8'));
  compositionData.exports.push({
    ...exportData,
    timestamp: new Date().toISOString()
  });
  
  fs.writeFileSync(compositionPath, JSON.stringify(compositionData, null, 2));
  console.log(`📝 Export added to composition: ${compositionId}`);
}

// HELPER FUNCTION: Build unified transition chain for both GIF and Video
function buildUnifiedTransitionChain(validImages, transitions, frameDurations, duration, complexFilter) {
  console.log(`buildUnifiedTransitionChain: ${validImages.length} images, ${transitions?.length || 0} transitions`);
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
    for(let i = 0; i < validImages.length; i++){
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
  for (let i = 0; i < validImages.length - 1; i++) {
    const currentFrameDuration = (frameDurations[i] || duration) / 1000;
    const transition = transitions[i] || { type: 'fade', duration: 500 };
    // transition.duration comes in milliseconds from frontend, convert to seconds for FFmpeg
    let transitionDuration = (transition.type && !['none', 'cut'].includes(transition.type))
      ? Math.max(transition.duration / 1000, 0.1)
      : 0.001;
    let transitionType = transitionEffects[transition.type] || 'fade';
    // Always use a real effect, even for cuts (with minimal duration)
    if (['none', 'cut'].includes(transition.type)) {
      transitionType = 'fade';
    }
    const nextInput = `[v${i + 1}]`;
    const outputLabel = (i === validImages.length - 2) ? '[outv]' : `[t${i}]`;
    // Offset should be at the END of the current frame, not beginning + duration
    const offset = totalVideoTime + currentFrameDuration - transitionDuration;
    totalVideoTime += currentFrameDuration;
    const xfadeFilter = `${lastOutput}${nextInput}xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset}${outputLabel}`;
    console.log(`Frame ${i}->${i+1}: duration=${currentFrameDuration}s, offset=${offset}s, transition=${transitionDuration}s`);
    console.log(`XFade filter: ${xfadeFilter}`);
    complexFilter.push(xfadeFilter);
    lastOutput = outputLabel;
  }
  console.log(`Total xfade transitions processed: ${validImages.length - 1}, final output: ${lastOutput}`);
  return lastOutput;
}

// Helper function to detect image dimensions
const getImageDimensions = (imagePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(imagePath, (err, metadata) => {
      if (err) return reject(err);
      const stream = metadata.streams.find(s => s.codec_type === 'video');
      if (stream) {
        resolve({ width: stream.width, height: stream.height });
      } else {
        reject(new Error('No video stream found'));
      }
    });
  });
};

// Calculate auto resolution based on first image aspect ratio
const calculateAutoResolution = async (images, sessionId, maxHeight = 1080) => {
  if (!images || images.length === 0) return { width: 1920, height: 1080 };
  
  try {
    const firstImagePath = path.join(__dirname, 'uploads', sessionId, images[0].filename);
    const dims = await getImageDimensions(firstImagePath);
    
    // Calculate aspect ratio
    const aspectRatio = dims.width / dims.height;
    
    // Scale to fit maxHeight while maintaining aspect ratio
    const height = Math.min(dims.height, maxHeight);
    const width = Math.round(height * aspectRatio);
    
    // Ensure even numbers for better encoding
    return {
      width: width % 2 === 0 ? width : width + 1,
      height: height % 2 === 0 ? height : height + 1
    };
  } catch (error) {
    console.error('Error calculating auto resolution:', error);
    return { width: 1920, height: 1080 }; // Fallback
  }
};

// Helper function to convert master MP4 to other formats
const convertMasterToFormat = async (masterPath, format, quality = 'standard', sessionId) => {
  const outputFilename = `animagen_${Date.now()}.${format}`;
  const outputPath = path.join(outputDir, outputFilename);

  console.log(`🔄 Converting master to ${format.toUpperCase()}: ${masterPath} -> ${outputPath}`);

  return new Promise((resolve, reject) => {
    let command = ffmpeg(masterPath);

    if (format === 'gif') {
      // GIF conversion with dynamic quality settings
      const gifSettings = {
        low: {
          fps: 10,
          scale: '480:-1',
          colors: 64,
          dither: 'none',
          bayerScale: 0
        },
        standard: {
          fps: 15,
          scale: '720:-1',
          colors: 128,
          dither: 'bayer',
          bayerScale: 3
        },
        high: {
          fps: 20,
          scale: '1080:-1',
          colors: 256,
          dither: 'bayer',
          bayerScale: 5
        },
        ultra: {
          fps: 25,
          scale: '1440:-1',
          colors: 256,
          dither: 'floyd_steinberg',
          bayerScale: 5
        }
      };

      const settings = gifSettings[quality] || gifSettings.standard;
      console.log(`🎨 GIF Settings for ${quality}:`, settings);

      // First pass: Generate optimized palette
      const paletteFilter = `fps=${settings.fps},scale=${settings.scale}:flags=lanczos,palettegen=max_colors=${settings.colors}:stats_mode=diff`;

      command
        .outputOptions([
          '-vf', paletteFilter,
          '-y'
        ])
        .output(outputPath.replace('.gif', '_palette.png'))
        .on('end', () => {
          // Second pass: Apply palette with quality settings
          const ditherOption = settings.dither === 'floyd_steinberg'
            ? 'floyd_steinberg'
            : settings.dither === 'none'
              ? 'none'
              : `bayer:bayer_scale=${settings.bayerScale}`;

          const finalFilter = `fps=${settings.fps},scale=${settings.scale}:flags=lanczos[v];[v][1:v]paletteuse=dither=${ditherOption}`;

          console.log(`🎨 GIF Final filter: ${finalFilter}`);

          ffmpeg(masterPath)
            .input(outputPath.replace('.gif', '_palette.png'))
            .outputOptions([
              '-filter_complex', finalFilter,
              '-y'
            ])
            .output(outputPath)
            .on('end', () => {
              // Cleanup palette file
              fs.unlinkSync(outputPath.replace('.gif', '_palette.png'));
              console.log(`✅ GIF created with ${quality} quality: ${outputFilename}`);
              resolve({ filename: outputFilename, outputPath });
            })
            .on('error', reject)
            .run();
        })
        .on('error', reject)
        .run();
    } else if (format === 'webm') {
      // WebM conversion
      const qualitySettings = {
        low: { crf: 35, bitrate: '1M' },
        standard: { crf: 30, bitrate: '2M' },
        high: { crf: 25, bitrate: '4M' },
        ultra: { crf: 20, bitrate: '6M' }
      };
      const settings = qualitySettings[quality] || qualitySettings.standard;

      command
        .outputOptions([
          '-c:v libvpx-vp9',
          '-cpu-used 2',
          '-deadline realtime',
          `-crf ${settings.crf}`,
          `-b:v ${settings.bitrate}`,
          '-pix_fmt yuv420p',
          '-row-mt 1',
          '-y'
        ])
        .output(outputPath)
        .on('end', () => resolve({ filename: outputFilename, outputPath }))
        .on('error', reject)
        .run();
    } else if (format === 'mov') {
      // MOV conversion (same as MP4 but with MOV container)
      const qualitySettings = {
        low: { crf: 28, bitrate: '2M' },
        standard: { crf: 23, bitrate: '4M' },
        high: { crf: 20, bitrate: '6M' },
        ultra: { crf: 18, bitrate: '8M' }
      };
      const settings = qualitySettings[quality] || qualitySettings.standard;

      command
        .outputOptions([
          '-c:v libx264',
          '-preset medium',
          '-profile:v high',
          `-crf ${settings.crf}`,
          `-b:v ${settings.bitrate}`,
          '-pix_fmt yuv420p',
          '-movflags +faststart',
          '-y'
        ])
        .output(outputPath)
        .on('end', () => resolve({ filename: outputFilename, outputPath }))
        .on('error', reject)
        .run();
    } else {
      // MP4 - just copy the master file with potential quality adjustment
      if (quality === 'ultra' || quality === 'high') {
        // For high quality, just copy the master (it's already high quality)
        fs.copyFileSync(masterPath, outputPath);
        resolve({ filename: outputFilename, outputPath });
      } else {
        // For lower quality, re-encode with lower settings
        const qualitySettings = {
          low: { crf: 28, bitrate: '2M' },
          standard: { crf: 25, bitrate: '3M' }
        };
        const settings = qualitySettings[quality] || qualitySettings.standard;

        command
          .outputOptions([
            '-c:v libx264',
            '-preset fast',
            '-profile:v high',
            `-crf ${settings.crf}`,
            `-b:v ${settings.bitrate}`,
            '-pix_fmt yuv420p',
            '-movflags +faststart',
            '-y'
          ])
          .output(outputPath)
          .on('end', () => resolve({ filename: outputFilename, outputPath }))
          .on('error', reject)
          .run();
      }
    }
  });
};

// MASTER VIDEO ENDPOINT - Generate high-quality master video for export base
app.post('/generate-master', async (req, res) => {
  try {
    const { images, transitions, sessionId } = req.body;
    const frameDurations = req.body.frameDurations || [];
    const defaultDuration = 1000; // Match frontend default (1s per frame)

    console.log(`🔍 Master video request received:`, {
      imagesCount: images?.length,
      imageFilenames: images?.map(img => img.filename),
      transitionsCount: transitions?.length,
      frameDurationsCount: frameDurations?.length,
      sessionId
    });

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

    // Debug: List all files in session directory
    const sessionDir = path.join(tempDir, sessionId);
    console.log(`🔍 Session directory: ${sessionDir}`);
    if (fs.existsSync(sessionDir)) {
      const filesInDir = fs.readdirSync(sessionDir);
      console.log(`🔍 Files in session directory:`, filesInDir);
    } else {
      console.log(`❌ Session directory does not exist: ${sessionDir}`);
    }

    const validImages = images.map(img => {
      const imagePath = path.join(tempDir, sessionId, img.filename);
      const exists = fs.existsSync(imagePath);
      console.log(`🔍 Checking image: ${img.filename} → ${imagePath} → ${exists ? 'EXISTS' : 'NOT FOUND'}`);
      
      // If exact filename doesn't exist, try to find a match with timestamp prefix
      if (!exists && fs.existsSync(sessionDir)) {
        const filesInDir = fs.readdirSync(sessionDir);
        const matchingFile = filesInDir.find(file => file.includes(img.filename) || file.endsWith(img.filename));
        if (matchingFile) {
          const matchingPath = path.join(sessionDir, matchingFile);
          console.log(`🔍 Found matching file: ${img.filename} → ${matchingFile}`);
          return { ...img, path: matchingPath, filename: matchingFile };
        }
      }
      
      return exists ? { ...img, path: imagePath } : null;
    }).filter(Boolean);

    if (validImages.length === 0) return res.status(400).json({ error: 'No valid images found' });
    
    // Detect dimensions from first image for master video
    let masterSettings;
    try {
      if (!validImages[0].path) {
        console.error('❌ First valid image has no path:', validImages[0]);
        return res.status(400).json({ error: 'First image path is undefined' });
      }
      const firstImageDims = await getImageDimensions(validImages[0].path);
      // Use ultra-high-quality dimensions for preview (4K-ready)
      const maxWidth = 3840;  // Increased to 4K for maximum quality
      const maxHeight = 2160; // Increased to 4K for maximum quality

      let { width, height } = firstImageDims;

      // Scale down if necessary while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const scaleRatio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * scaleRatio);
        height = Math.round(height * scaleRatio);
      }

      // Ensure dimensions are even (required for H.264)
      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      // Ultra-high-quality settings for 4K-ready master video
      masterSettings = {
        width,
        height,
        fps: 30,
        bitrate: width > 1920 ? '15M' : '8M',  // Higher bitrate for 4K
        crf: width > 1920 ? 16 : 18            // Better quality for 4K
      };
      console.log(`Master: Auto-detected dimensions ${firstImageDims.width}x${firstImageDims.height}, using ${width}x${height}`);
    } catch (error) {
      console.log('Master: Could not detect dimensions, using 4K default');
      masterSettings = {
        width: 3840,    // Default to 4K
        height: 2160,   // Default to 4K
        fps: 30,
        bitrate: '15M', // 4K bitrate
        crf: 16         // 4K quality
      };
    }
    
    console.log(`Master: Processing ${validImages.length} images with transitions`);
    console.log(`Master: Frame durations (ms):`, frameDurations);
    console.log(`Master: Transitions:`, transitions?.map(t => `${t.type}:${t.duration}ms`));
    console.log(`Master: Default duration (ms):`, defaultDuration);
    console.log(`🎬 Generating master video with settings:`, masterSettings);
    
    // Write detailed log to file for debugging
    const logData = {
      timestamp: new Date().toISOString(),
      validImages: validImages.length,
      frameDurations,
      transitions,
      defaultDuration
    };
    fs.appendFileSync('preview_debug.log', JSON.stringify(logData) + '\n');

    const outputFilename = `master_${sessionId}_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);
    
    let command = ffmpeg();
    let complexFilter = [];

    // Calculate optimal input durations using consolidated helper
    const durationCalc = calculateInputDurations(validImages, transitions, frameDurations, defaultDuration);
    console.log(`Preview: Total duration: ${durationCalc.totalDuration.toFixed(2)}s, Max transition: ${durationCalc.maxTransitionDuration.toFixed(2)}s`);

    // Add inputs with optimized durations
    validImages.forEach((image, index) => {
      const inputDuration = durationCalc.inputDurations[index];
      const baseDuration = (frameDurations[index] || defaultDuration) / 1000;
      
      console.log(`Master: Image ${index + 1}/${validImages.length} - Base: ${baseDuration.toFixed(2)}s, Input: ${inputDuration.toFixed(2)}s`);
      command.input(image.path).inputOptions(['-loop', '1', '-t', String(inputDuration)]);
      complexFilter.push(`[${index}:v]scale=${masterSettings.width}:${masterSettings.height}:force_original_aspect_ratio=decrease,pad=${masterSettings.width}:${masterSettings.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${masterSettings.fps}[v${index}]`);
    });

    // Use unified transition chain - pass frameDurations directly as they're already processed
    const lastOutput = buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter);
    
    command
      .complexFilter(complexFilter)
      .outputOptions([
        '-c:v libx264',
        '-preset medium',     // Changed from ultrafast to medium (better quality)
        '-profile:v high',    // Changed from baseline to high (better compression)
        `-crf ${masterSettings.crf}`,
        `-b:v ${masterSettings.bitrate}`,
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      ])
      .map(lastOutput)
      .output(outputPath)
      .on('start', cmd => {
        console.log('FFmpeg started for Preview:', cmd);
        fs.appendFileSync('preview_debug.log', `FFmpeg command: ${cmd}\n`);
      })
      .on('end', () => {
        if (!res.headersSent) {
          res.json({
            success: true,
            filename: outputFilename,
            masterUrl: `/download/${outputFilename}`,
            masterPath: outputPath, // Include full path for export conversion
            message: 'High-quality master video generated successfully'
          });
        }
      })
      .on('error', (err) => {
        console.error('Preview Generation Error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Preview generation failed', details: err.message });
        }
      })
      .run();
  } catch (error) {
    console.error('Preview Error:', error.message);
    if (!res.headersSent) res.status(500).json({ error: 'Preview failed', details: error.message });
  }
});

// NEW: Export from master endpoint - Convert high-quality master video to any format
app.post('/export/from-master', async (req, res) => {
  try {
    const { masterFilename, format, quality = 'standard', sessionId } = req.body;

    console.log(`🎬 Export from master requested: ${masterFilename} -> ${format.toUpperCase()}`);

    if (!masterFilename || !format) {
      return res.status(400).json({
        error: 'Master filename and format are required'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    // Locate the master file
    const masterPath = path.join(outputDir, masterFilename);

    if (!fs.existsSync(masterPath)) {
      return res.status(400).json({
        error: 'Master file not found. Please generate master video first.',
        masterPath
      });
    }

    console.log(`🔍 Converting master: ${masterPath}`);

    // Convert master to requested format
    const result = await convertMasterToFormat(masterPath, format, quality, sessionId);

    console.log(`✅ Export completed: ${result.filename}`);

    res.json({
      success: true,
      filename: result.filename,
      downloadUrl: `/download/${result.filename}`,
      message: `${format.toUpperCase()} export completed from master`,
      sourceMaster: masterFilename,
      quality: quality
    });

  } catch (error) {
    console.error('❌ Export from master failed:', error);
    res.status(500).json({
      error: 'Export from master failed',
      details: error.message
    });
  }
});

// COMPATIBILITY: Legacy preview endpoint - simplified implementation
app.post('/preview', async (req, res) => {
  console.log('⚠️  Legacy /preview endpoint called - implementing preview generation directly');

  try {
    const { images, transitions, sessionId } = req.body;
    const frameDurations = req.body.frameDurations || [];
    const defaultDuration = 1000; // Match frontend default (1s per frame)

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({
        error: 'No images provided'
      });
    }

    // Validate images exist in session directory
    const sessionDir = path.join(tempDir, sessionId);
    const validImages = [];

    for (const image of images) {
      const imagePath = path.join(sessionDir, image.filename);
      if (fs.existsSync(imagePath)) {
        validImages.push({ ...image, path: imagePath });
      } else {
        console.warn(`⚠️  Image not found: ${imagePath}`);
      }
    }

    if (validImages.length === 0) {
      return res.status(400).json({
        error: 'No valid images found in session directory'
      });
    }

    console.log(`🎬 Preview: Processing ${validImages.length} images`);

    const outputFilename = `master_${sessionId}_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    let command = ffmpeg();
    let complexFilter = [];

    // Calculate optimal input durations using consolidated helper
    const inputDurations = validImages.map((_, index) => {
      const frameDuration = (frameDurations[index] || defaultDuration) / 1000; // Convert to seconds
      return frameDuration + 0.5; // Add buffer for transitions
    });

    // Add inputs with calculated durations
    validImages.forEach((image, index) => {
      const inputDuration = inputDurations[index];
      command.input(image.path).inputOptions(['-loop', '1', '-t', String(inputDuration)]);
      complexFilter.push(`[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=30[v${index}]`);
    });

    // Use unified transition chain
    const lastOutput = buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter);

    command
      .complexFilter(complexFilter)
      .outputOptions([
        '-c:v libx264',
        '-preset medium',
        '-profile:v high',
        '-crf 23',
        '-b:v 4M',
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      ])
      .map(lastOutput)
      .output(outputPath)
      .on('start', cmd => {
        console.log('FFmpeg started for Preview:', cmd);
      })
      .on('end', () => {
        if (!res.headersSent) {
          res.json({
            success: true,
            filename: outputFilename,
            previewUrl: `/download/${outputFilename}`,  // Legacy field name
            masterUrl: `/download/${outputFilename}`,
            masterPath: outputPath,
            message: 'Preview video generated successfully'
          });
        }
      })
      .on('error', (err) => {
        console.error('❌ Preview generation failed:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Preview generation failed',
            details: err.message
          });
        }
      })
      .run();

  } catch (error) {
    console.error('❌ Legacy preview endpoint failed:', error);
    res.status(500).json({
      error: 'Legacy preview endpoint failed',
      details: error.message
    });
  }
});

// COMPATIBILITY: Legacy export from preview endpoint
app.post('/export/from-preview', async (req, res) => {
  console.log('⚠️  Legacy /export/from-preview endpoint called - redirecting to /export/from-master');

  try {
    // Transform request body
    const transformedBody = {
      ...req.body,
      masterFilename: req.body.previewFilename || req.body.masterFilename
    };

    // Forward the request to the new endpoint
    const response = await fetch(`http://localhost:3001/export/from-master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformedBody)
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    console.error('❌ Legacy export from preview endpoint failed:', error);
    res.status(500).json({
      error: 'Legacy export from preview endpoint failed',
      details: error.message
    });
  }
});

// Debug endpoint to list output files
app.get('/debug/output-files', (req, res) => {
  try {
    const files = fs.readdirSync(outputDir);
    res.json({
      outputDir,
      files: files.map(file => ({
        name: file,
        path: path.join(outputDir, file),
        url: `/output/${file}`,
        size: fs.statSync(path.join(outputDir, file)).size
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CORRECTED GIF EXPORT ENDPOINT
// Video Editor Export Endpoints
app.post('/export/mp4', async (req, res) => {
  try {
    console.log('🎬 MP4 Export request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { videoPath, startTime, endTime, quality = 'standard', resolution, fps = 30 } = req.body;
    
    console.log('Video path received:', videoPath);
    console.log('Temp dir:', tempDir);
    
    if (!videoPath) {
      return res.status(400).json({ error: 'Video path is required' });
    }

    const inputPath = path.isAbsolute(videoPath) 
      ? videoPath 
      : path.join(__dirname, videoPath);
    console.log('Checking video at:', inputPath);
    
    if (!fs.existsSync(inputPath)) {
      console.error('❌ Video file not found:', inputPath);
      return res.status(400).json({ 
        error: 'Original video path not available. Please re-upload video.',
        videoPath: inputPath,
        exists: false,
        tempDir: tempDir
      });
    }

    console.log(`🎬 Exporting MP4: ${inputPath}`);
    
    const outputFilename = `exported_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // Quality settings
    const qualityMap = {
      web: { crf: 28, preset: 'fast', scale: '1280:720' },
      standard: { crf: 23, preset: 'medium', scale: '1920:1080' },
      high: { crf: 18, preset: 'slow', scale: '1920:1080' },
      ultra: { crf: 15, preset: 'veryslow', scale: '3840:2160' }
    };
    
    const settings = qualityMap[quality] || qualityMap.standard;
    
    let command = ffmpeg(inputPath);
    
    // Apply trimming if specified
    if (typeof startTime === 'number' && typeof endTime === 'number') {
      const duration = endTime - startTime;
      console.log(`🎬 Trimming MP4: ${startTime.toFixed(3)}s to ${endTime.toFixed(3)}s (${duration.toFixed(3)}s duration)`);
      command.seekInput(startTime).duration(duration);
    }
    
    // Apply resolution if custom
    if (resolution && resolution.width && resolution.height) {
      command.size(`${resolution.width}x${resolution.height}`);
    } else if (settings.scale) {
      command.size(settings.scale);
    }
    
    command
      .fps(fps)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset', settings.preset,
        '-crf', settings.crf.toString(),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('end', () => {
        console.log('✅ MP4 export completed');
        res.json({
          success: true,
          downloadUrl: `/output/${path.basename(outputPath)}`,
          filename: outputFilename
        });
      })
      .on('error', (err) => {
        console.error('❌ MP4 export failed:', err);
        res.status(500).json({ error: 'Export failed: ' + err.message });
      })
      .run();
      
  } catch (error) {
    console.error('❌ MP4 export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/export/webm', async (req, res) => {
  try {
    console.log('🎬 WebM Export request received');
    const { videoPath, startTime, endTime, quality = 'standard', resolution, fps = 30 } = req.body;
    
    console.log('Video path received:', videoPath);
    
    if (!videoPath) {
      return res.status(400).json({ error: 'Video path is required' });
    }

    const inputPath = path.isAbsolute(videoPath) 
      ? videoPath 
      : path.join(__dirname, videoPath);
    console.log('Checking video at:', inputPath);
    
    if (!fs.existsSync(inputPath)) {
      console.error('❌ Video file not found:', inputPath);
      return res.status(400).json({ 
        error: 'Original video path not available. Please re-upload video.',
        videoPath: inputPath,
        exists: false
      });
    }

    console.log(`🎬 Exporting WebM: ${inputPath}`);
    
    const outputFilename = `exported_${Date.now()}.webm`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // Quality settings for WebM
    const qualityMap = {
      web: { crf: 35, cpu: 5, scale: '1280:720' },
      standard: { crf: 30, cpu: 3, scale: '1920:1080' },
      high: { crf: 23, cpu: 2, scale: '1920:1080' },
      ultra: { crf: 18, cpu: 1, scale: '3840:2160' }
    };
    
    const settings = qualityMap[quality] || qualityMap.standard;
    
    let command = ffmpeg(inputPath);
    
    // Apply trimming if specified
    if (typeof startTime === 'number' && typeof endTime === 'number') {
      const duration = endTime - startTime;
      console.log(`🎬 Trimming WebM: ${startTime.toFixed(3)}s to ${endTime.toFixed(3)}s (${duration.toFixed(3)}s duration)`);
      command.seekInput(startTime).duration(duration);
    }
    
    // Apply resolution if custom
    if (resolution && resolution.width && resolution.height) {
      command.size(`${resolution.width}x${resolution.height}`);
    } else if (settings.scale) {
      command.size(settings.scale);
    }
    
    command
      .fps(fps)
      .videoCodec('libvpx-vp9')
      .audioCodec('libopus')
      .outputOptions([
        '-cpu-used', settings.cpu.toString(),
        '-crf', settings.crf.toString(),
        '-b:v', '0', // Variable bitrate
        '-pix_fmt', 'yuv420p',
        '-row-mt', '1'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('end', () => {
        console.log('✅ WebM export completed');
        res.json({
          success: true,
          downloadUrl: `/output/${path.basename(outputPath)}`,
          filename: outputFilename
        });
      })
      .on('error', (err) => {
        console.error('❌ WebM export failed:', err);
        res.status(500).json({ error: 'Export failed: ' + err.message });
      })
      .run();
      
  } catch (error) {
    console.error('❌ WebM export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/export/mov', async (req, res) => {
  try {
    console.log('🎬 MOV Export request received');
    const { videoPath, startTime, endTime, quality = 'standard', resolution, fps = 30 } = req.body;
    
    console.log('Video path received:', videoPath);
    
    if (!videoPath) {
      return res.status(400).json({ error: 'Video path is required' });
    }

    const inputPath = path.isAbsolute(videoPath) 
      ? videoPath 
      : path.join(__dirname, videoPath);
    console.log('Checking video at:', inputPath);
    
    if (!fs.existsSync(inputPath)) {
      console.error('❌ Video file not found:', inputPath);
      return res.status(400).json({ 
        error: 'Original video path not available. Please re-upload video.',
        videoPath: inputPath,
        exists: false
      });
    }

    console.log(`🎬 Exporting MOV: ${inputPath}`);
    
    const outputFilename = `exported_${Date.now()}.mov`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // Quality settings for MOV (similar to MP4 but with higher quality defaults)
    const qualityMap = {
      web: { crf: 25, preset: 'fast', scale: '1280:720' },
      standard: { crf: 20, preset: 'medium', scale: '1920:1080' },
      high: { crf: 15, preset: 'slow', scale: '1920:1080' },
      ultra: { crf: 12, preset: 'veryslow', scale: '3840:2160' }
    };
    
    const settings = qualityMap[quality] || qualityMap.standard;
    
    let command = ffmpeg(inputPath);
    
    // Apply trimming if specified
    if (typeof startTime === 'number' && typeof endTime === 'number') {
      const duration = endTime - startTime;
      console.log(`🎬 Trimming MOV: ${startTime.toFixed(3)}s to ${endTime.toFixed(3)}s (${duration.toFixed(3)}s duration)`);
      command.seekInput(startTime).duration(duration);
    }
    
    // Apply resolution if custom
    if (resolution && resolution.width && resolution.height) {
      command.size(`${resolution.width}x${resolution.height}`);
    } else if (settings.scale) {
      command.size(settings.scale);
    }
    
    command
      .fps(fps)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset', settings.preset,
        '-crf', settings.crf.toString(),
        '-pix_fmt', 'yuv420p'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('end', () => {
        console.log('✅ MOV export completed');
        res.json({
          success: true,
          downloadUrl: `/output/${path.basename(outputPath)}`,
          filename: outputFilename
        });
      })
      .on('error', (err) => {
        console.error('❌ MOV export failed:', err);
        res.status(500).json({ error: 'Export failed: ' + err.message });
      })
      .run();
      
  } catch (error) {
    console.error('❌ MOV export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/export/gif', async (req, res) => {
  console.log('🎬 GIF Export Request received');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Check if this is a video editor export (has videoPath) or image-to-animation export (has images)
    if (req.body.videoPath) {
      // Video Editor GIF Export
      const { videoPath, startTime, endTime, fps = 15, gif = {} } = req.body;
      
      if (!videoPath) {
        return res.status(400).json({ error: 'Video path is required' });
      }

      const inputPath = path.isAbsolute(videoPath) 
      ? videoPath 
      : path.join(__dirname, videoPath);
      console.log('Checking video at:', inputPath);
      
      if (!fs.existsSync(inputPath)) {
        console.error('❌ Video file not found:', inputPath);
        return res.status(400).json({ 
          error: 'Original video path not available. Please re-upload video.',
          videoPath: inputPath,
          exists: false
        });
      }

      console.log(`🎨 Exporting GIF from video: ${inputPath}`);
      
      const outputFilename = `exported_${Date.now()}.gif`;
      const outputPath = path.join(outputDir, outputFilename);
      
      const colors = gif.colors || 256;
      const loopOption = gif.loop === 'infinite' ? '0' : (gif.loop || '0');
      const dither = gif.dither !== false ? 'bayer:bayer_scale=5' : 'none';
      
      // GIF generation with proper two-pass process
      const palettePath = path.join(outputDir, `palette_${Date.now()}.png`);
      
      // Step 1: Generate palette
      let paletteCommand = ffmpeg(inputPath);
      
      // Apply trimming for palette generation
      if (typeof startTime === 'number' && typeof endTime === 'number') {
        const duration = endTime - startTime;
        console.log(`🎨 Trimming GIF palette: ${startTime.toFixed(3)}s to ${endTime.toFixed(3)}s (${duration.toFixed(3)}s duration)`);
        paletteCommand.seekInput(startTime).duration(duration);
      }
      
      paletteCommand
        .fps(fps)
        .videoFilter(`scale=640:-1:flags=lanczos,palettegen=max_colors=${colors}`)
        .output(palettePath)
        .on('end', () => {
          console.log('✅ Palette generated, creating GIF...');
          
          // Step 2: Create GIF using palette
          let gifCommand = ffmpeg(inputPath);
          
          // Apply trimming for GIF generation
          if (typeof startTime === 'number' && typeof endTime === 'number') {
            const duration = endTime - startTime;
            console.log(`🎨 Trimming GIF generation: ${startTime.toFixed(3)}s to ${endTime.toFixed(3)}s (${duration.toFixed(3)}s duration)`);
            gifCommand.seekInput(startTime).duration(duration);
          }
          
          gifCommand
            .input(palettePath)
            .fps(fps)
            .complexFilter([
              `[0:v]scale=640:-1:flags=lanczos[v]`,
              `[v][1:v]paletteuse=dither=${dither}`
            ])
            .outputOptions([
              `-loop ${loopOption}`
            ])
            .output(outputPath)
            .on('start', (commandLine) => {
              console.log('FFmpeg GIF command:', commandLine);
              emitExportProgress('gif', 'started', 0, 'GIF export started');
            })
            .on('progress', prog => {
              const percent = Math.min((prog.percent || 0), 99);
              emitExportProgress('gif', 'processing', percent, 'Exporting GIF...');
            })
            .on('end', () => {
              // Cleanup palette file
              try {
                fs.unlinkSync(palettePath);
              } catch (e) {
                console.warn('Could not delete palette file:', e.message);
              }
              
              console.log('✅ GIF export completed');
              res.json({
                success: true,
                downloadUrl: `/output/${path.basename(outputPath)}`,
                filename: outputFilename
              });
              emitExportProgress('gif', 'completed', 100, 'GIF export completed', { filename: outputFilename });
            })
            .on('error', (err) => {
              console.error('❌ GIF export failed:', err);
              emitExportProgress('gif', 'error', 100, 'GIF export failed', { error: err.message });
              res.status(500).json({ error: 'Export failed: ' + err.message });
            })
            .run();
        })
        .on('error', (err) => {
          console.error('❌ Palette generation failed:', err);
          res.status(500).json({ error: 'Palette generation failed: ' + err.message });
        })
        .run();
        
      return;
    }
    
    // Original Image-to-Animation GIF Export
    const { images, transitions, duration = 1, sessionId, exportSettings: userExportSettings = {} } = req.body;
    const frameDurations = req.body.frameDurations || [];
    
    // Extract settings from exportSettings object or fallback to defaults
    const quality = userExportSettings.quality || 'medium';
    const fps = userExportSettings.fps || 30;
    const preset = userExportSettings.preset || 'medium';
    const bitrate = userExportSettings.bitrate;
    const optimizeSize = userExportSettings.optimizeSize || false;
    const fastStart = userExportSettings.fastStart || false;
    const resolution = userExportSettings.resolution || { width: 1920, height: 1080 };
    
    // GIF-specific settings
    const gifSettings = userExportSettings.gif || {};
    const dither = gifSettings.dither || 'bayer'; // Use basic bayer instead of floyd_steinberg for compatibility
    const maxColors = gifSettings.colors || 256; // Maximum colors by default
    const loop = userExportSettings.loop !== undefined ? userExportSettings.loop : true; // Default to infinite loop
    
    // Build custom settings from advanced options
    const customSettings = {};
    if (bitrate) customSettings.bitrate = `${bitrate}M`;
    if (optimizeSize) customSettings.crf = Math.min((customSettings.crf || 23) + 5, 51);
    
    const qualitySettings = { ...qualityPresets[quality] || qualityPresets.standard, ...customSettings };

    if (!images || !Array.isArray(images) || images.length === 0) return res.status(400).json({ error: 'No images provided' });
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

    const validImages = images.map(img => {
      const imagePath = path.join(tempDir, sessionId, img.filename);
      return fs.existsSync(imagePath) ? { ...img, path: imagePath } : null;
    }).filter(Boolean);

    if (validImages.length === 0) return res.status(400).json({ error: 'No valid images found' });
    
    // Use user-specified resolution or auto-detect
    let exportSettings;
    if (resolution && resolution.width && resolution.height) {
      exportSettings = {
        width: resolution.width,
        height: resolution.height,
        fps: fps
      };
      console.log(`GIF Export: Using user resolution ${resolution.width}x${resolution.height}`);
    } else {
      try {
        const firstImageDims = await getImageDimensions(validImages[0].path);
        exportSettings = {
          width: firstImageDims.width,
          height: firstImageDims.height,
          fps: fps
        };
        console.log(`GIF Export: Auto-detected dimensions ${firstImageDims.width}x${firstImageDims.height}`);
      } catch (error) {
        console.log('GIF Export: Could not detect dimensions, using defaults');
        exportSettings = {
          width: 1920,
          height: 1080,
          fps: fps
        };
      }
    }
    
    console.log(`GIF Export: Processing ${validImages.length} images with transitions. Durations: ${JSON.stringify(frameDurations)}`);
    console.log(`🎨 GIF Options: Dither=${dither}, Colors=${maxColors}, Quality=${quality}`);

    const outputFilename = `animagen_${Date.now()}.gif`;
    const outputPath = path.join(outputDir, outputFilename);
    
    let command = ffmpeg();
    let complexFilter = [];

    // Simple multi-image GIF export
    console.log('🎨 Creating GIF with all images using simple approach');
    
    // Use user-specified resolution but limit for GIF performance
    let gifWidth = exportSettings.width;
    let gifHeight = exportSettings.height;
    let gifFps = Math.min(fps, 15); // Limit FPS for GIF
    
    // For ultra quality, use full resolution; for others, scale down appropriately
    if (quality === 'ultra') {
      // Keep full resolution for ultra
      console.log(`GIF Export (ULTRA): Using full resolution ${gifWidth}x${gifHeight}`);
    } else if (quality === 'high' || quality === 'premium') {
      // Scale down slightly for performance
      gifWidth = Math.min(gifWidth, 1280);
      gifHeight = Math.min(gifHeight, 720);
      console.log(`GIF Export (${quality.toUpperCase()}): Using ${gifWidth}x${gifHeight}`);
    } else {
      // Standard/web quality - more aggressive scaling
      gifWidth = Math.min(gifWidth, 640);
      gifHeight = Math.min(gifHeight, 480);
      console.log(`GIF Export (${quality.toUpperCase()}): Using ${gifWidth}x${gifHeight}`);
    }
    
    console.log(`GIF Export: Final settings ${gifWidth}x${gifHeight} at ${gifFps}fps`);
    
    // Use new FilterGraph system for scalable filter generation
    console.log(`🎨 GIF Settings: Dither=${dither}, Colors=${maxColors}, Quality=${quality}`);
    
    // Create FilterGraph from current images and transitions
    const filterGraph = FilterGraph.fromLegacyImages(
      validImages, 
      transitions || [], 
      frameDurations, 
      duration * 1000
    );
    
    // Configure target output settings
    filterGraph.targetWidth = gifWidth;
    filterGraph.targetHeight = gifHeight;
    filterGraph.targetFps = gifFps;
    
    // Generate optimized filter chain
    const filterChain = filterGraph.generateFilterChain();
    console.log(`📊 FilterGraph Debug:`, filterGraph.getDebugInfo());
    
    // Add images as inputs using FilterGraph information
    const ffmpegComponents = filterGraph.getFFmpegComponents();
    command = ffmpeg(); // Reset command
    
    ffmpegComponents.inputs.forEach((input, index) => {
      command.input(input.path).inputOptions(input.options);
    });

    command
      .complexFilter(filterChain)
      .map('[outv]')
      .outputOptions([
        '-pix_fmt', 'rgb24', // Standard RGB for compatibility
        '-loop', loop ? '0' : '-1' // 0 = infinite loop, -1 = play once
      ])
      .output(outputPath)
      .on('start', cmd => {
        console.log('FFmpeg started for multi-image GIF:', cmd);
        emitExportProgress('gif', 'started', 0, 'GIF export started');
      })
      .on('progress', prog => {
        const percent = Math.min((prog.percent || 0), 99);
        emitExportProgress('gif', 'processing', percent, 'Exporting GIF...');
      })
      .on('end', async () => {
        // Auto-save composition for future re-exports
        try {
          const compositionId = generateCompositionId();
          const composition = {
            id: compositionId,
            sessionId,
            images,
            transitions: transitions || [],
            frameDurations: frameDurations || [],
            quality: quality || 'standard',
            type: 'auto-saved'
          };
          
          saveComposition(composition);
          addExportToComposition(compositionId, {
            format: 'gif',
            filename: outputFilename,
            settings: { quality }
          });
          
          console.log(`🎯 Auto-saved composition ${compositionId} for GIF: ${outputFilename}`);
          
          if (!res.headersSent) res.json({ 
            success: true, 
            filename: outputFilename, 
            downloadUrl: `/download/${outputFilename}`, 
            message: 'GIF generated successfully',
            compositionId // Include composition ID for re-exports
          });
        } catch (autoSaveError) {
          console.error('Auto-save failed:', autoSaveError.message);
          // Still return success for the GIF generation, even if auto-save fails
          if (!res.headersSent) res.json({ 
            success: true, 
            filename: outputFilename, 
            downloadUrl: `/download/${outputFilename}`, 
            message: 'GIF generated successfully (auto-save failed)'
          });
        }
      })
      .on('error', (err) => {
        console.error('GIF Generation Error:', err.message);
        if (!res.headersSent) res.status(500).json({ error: 'GIF generation failed', details: err.message });
      })
      .run();
  } catch (error) {
    console.error('GIF Export Error:', error.message);
    if (!res.headersSent) res.status(500).json({ error: 'GIF export failed', details: error.message });
  }
});

// CORRECTED VIDEO EXPORT ENDPOINT
app.post('/export/video', async (req, res) => {
  console.log('🚨🚨🚨 /export/video endpoint hit!', req.body?.format, req.body?.sessionId);
  console.log('📦 Full request body:', JSON.stringify(req.body, null, 2));
  try {
    const { 
      images, 
      transitions, 
      duration = 1, 
      sessionId, 
      exportSettings: userExportSettings = {},
      resolution: resolutionMode = 'auto',
      videoConfig = {},
      fps: requestFps,
      quality: requestQuality,
      format = 'mp4'
    } = req.body;
    const frameDurations = req.body.frameDurations || [];
    
    // Extract settings from exportSettings object or direct params
    const quality = requestQuality || userExportSettings.quality || 'standard';
    const fps = requestFps || videoConfig.fps || userExportSettings.fps || 30;
    const preset = userExportSettings.preset || 'medium';
    const bitrate = userExportSettings.bitrate;
    const optimizeSize = userExportSettings.optimizeSize || false;
    const fastStart = userExportSettings.fastStart || false;
    
    // Calculate resolution based on mode
    let resolution;
    console.log('🔍 Debug params:', { resolutionMode, videoConfig, requestFps, requestQuality, format });
    
    if (resolutionMode === 'custom' && videoConfig.resolution && videoConfig.resolution.width && videoConfig.resolution.height) {
      resolution = { width: videoConfig.resolution.width, height: videoConfig.resolution.height };
      console.log('📐 Custom resolution applied:', resolution);
    } else if (resolutionMode === 'auto') {
      resolution = await calculateAutoResolution(images, sessionId);
      console.log('🎯 Auto resolution calculated:', resolution);
    } else {
      // Use preset resolutions
      const presets = {
        '480p': { width: 854, height: 480 },
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 }
      };
      resolution = presets[resolutionMode] || { width: 1920, height: 1080 };
      console.log('📏 Preset resolution applied:', resolution);
    }
    
    console.log('🎬 Final resolution for export:', resolution);
    
    // Build custom settings from advanced options
    const customSettings = {};
    if (bitrate) customSettings.bitrate = `${bitrate}M`;
    if (optimizeSize) customSettings.crf = Math.min((customSettings.crf || 23) + 5, 51);

    if (!images || !Array.isArray(images) || images.length === 0) return res.status(400).json({ error: 'No images provided' });
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

    const validImages = images.map(img => {
      const imagePath = path.join(tempDir, sessionId, img.filename);
      return fs.existsSync(imagePath) ? { ...img, path: imagePath } : null;
    }).filter(Boolean);

    if (validImages.length === 0) return res.status(400).json({ error: 'No valid images found' });

    console.log(`Video Export: Processing ${validImages.length} images for ${format.toUpperCase()}. Durations: ${JSON.stringify(frameDurations)}`);
    
    const outputFilename = `animagen_${Date.now()}.${format}`;
    const outputPath = path.join(outputDir, outputFilename);
    const qualitySettings = { ...qualityPresets[quality] || qualityPresets.standard, ...customSettings };
    
    let command = ffmpeg();
    let complexFilter = [];

    // Calculate optimal input durations using consolidated helper
    const durationCalc = calculateInputDurations(validImages, transitions, frameDurations, duration * 1000);
    console.log(`Video Export: Total duration: ${durationCalc.totalDuration.toFixed(2)}s, Max transition: ${durationCalc.maxTransitionDuration.toFixed(2)}s`);

    // Add inputs and scale/normalize each frame with optimized durations
    validImages.forEach((image, index) => {
        const inputDuration = durationCalc.inputDurations[index];
        const baseDuration = (frameDurations[index] || duration * 1000) / 1000;
        
        console.log(`Video Export: Image ${index + 1}/${validImages.length} - Base: ${baseDuration.toFixed(2)}s, Input: ${inputDuration.toFixed(2)}s`);
        command.input(image.path).inputOptions(['-loop', '1', '-t', String(inputDuration)]);
        complexFilter.push(`[${index}:v]scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${fps}[v${index}]`);
    });

    // Use unified transition chain (convert duration to ms for consistency)
    const durationMs = duration * 1000;
    const lastOutput = buildUnifiedTransitionChain(validImages, transitions, frameDurations, durationMs, complexFilter);

    const outputOptions = format === 'mp4'
      ? ['-c:v libx264', '-preset fast', '-profile:v high', `-crf ${qualitySettings.crf}`, `-b:v ${qualitySettings.bitrate}`, '-pix_fmt yuv420p', '-movflags +faststart']
      : ['-c:v libvpx-vp9', '-cpu-used 2', '-deadline realtime', `-crf ${qualitySettings.crf}`, `-b:v ${qualitySettings.bitrate}`, '-pix_fmt yuv420p', '-row-mt 1'];

    command
      .complexFilter(complexFilter)
      .outputOptions(outputOptions)
      .map(lastOutput)
      .output(outputPath)
      .on('start', cmd => {
        console.log('FFmpeg started for Video:', cmd);
        emitExportProgress('video', 'started', 0, 'Video export started');
      })
      // Emit real-time progress
      .on('progress', prog => {
        const percent = Math.min((prog.percent || 0), 99);
        emitExportProgress('video', 'processing', percent, 'Exporting video...');
      })
      .on('end', async () => {
        // Auto-save composition for future re-exports
        try {
          const compositionId = generateCompositionId();
          const composition = {
            id: compositionId,
            sessionId,
            images,
            transitions: transitions || [],
            frameDurations: frameDurations || [],
            quality: quality || 'standard',
            type: 'auto-saved'
          };
          
          saveComposition(composition);
          addExportToComposition(compositionId, {
            format,
            filename: outputFilename,
            settings: { quality }
          });
          
          console.log(`🎯 Auto-saved composition ${compositionId} for ${format.toUpperCase()}: ${outputFilename}`);
          
          if (!res.headersSent) res.json({ 
            success: true, 
            filename: outputFilename, 
            downloadUrl: `/download/${outputFilename}`, 
            message: `${format.toUpperCase()} generated successfully`,
            compositionId // Include composition ID for re-exports
          });
          emitExportProgress('video', 'completed', 100, 'Video export completed', { filename: outputFilename });
        } catch (autoSaveError) {
          console.error('Auto-save failed:', autoSaveError.message);
          // Still return success for the video generation, even if auto-save fails
          if (!res.headersSent) res.json({ 
            success: true, 
            filename: outputFilename, 
            downloadUrl: `/download/${outputFilename}`, 
            message: `${format.toUpperCase()} generated successfully (auto-save failed)`
          });
        }
      })
      .on('error', (err) => {
        console.error('Video Generation Error:', err.message);
        emitExportProgress('video', 'error', 100, 'Video export failed', { error: err.message });
        if (!res.headersSent) res.status(500).json({ error: `${format.toUpperCase()} generation failed`, details: err.message });
      })
      .run();
  } catch (error) {
    console.error('Video Export Error:', error.message);
    if (!res.headersSent) res.status(500).json({ error: 'Video export failed', details: error.message });
  }
});

// COMPOSITION ENDPOINTS: Auto-save and re-export system

// Auto-save composition after successful export
app.post('/compositions/auto-save', async (req, res) => {
  try {
    const { sessionId, images, transitions, frameDurations, quality, exportResult } = req.body;
    
    if (!sessionId || !images || !exportResult) {
      return res.status(400).json({ error: 'Missing required fields for composition save' });
    }
    
    const compositionId = generateCompositionId();
    
    const composition = {
      id: compositionId,
      sessionId,
      images,
      transitions: transitions || [],
      frameDurations: frameDurations || [],
      quality: quality || 'standard',
      type: 'auto-saved'
    };
    
    const savedComposition = saveComposition(composition);
    
    // Add the first export to history
    addExportToComposition(compositionId, {
      format: exportResult.format,
      filename: exportResult.filename,
      filesize: exportResult.filesize || 0,
      settings: { quality }
    });
    
    console.log(`🎯 Auto-saved composition: ${compositionId} for export: ${exportResult.filename}`);
    
    res.json({ 
      success: true, 
      compositionId,
      message: 'Composition auto-saved successfully',
      exports: savedComposition.exports 
    });
    
  } catch (error) {
    console.error('Auto-save Error:', error.message);
    res.status(500).json({ error: 'Failed to auto-save composition', details: error.message });
  }
});

// Re-export existing composition in different format
app.post('/compositions/:id/export', async (req, res) => {
  try {
    const { id: compositionId } = req.params;
    const { format, quality } = req.body;
    
    if (!format || !['gif', 'mp4', 'webm'].includes(format)) {
      return res.status(400).json({ error: 'Invalid or missing format. Must be gif, mp4, or webm' });
    }
    
    console.log(`🔄 Re-exporting composition ${compositionId} as ${format.toUpperCase()}`);
    
    // Load composition data
    const compositionData = loadComposition(compositionId);
    
    // Use stored images (they're already in composition directory)
    const validImages = compositionData.images.filter(img => fs.existsSync(img.path));
    
    if (validImages.length === 0) {
      return res.status(400).json({ error: 'No valid images found in composition' });
    }
    
    const outputFilename = `animagen_${Date.now()}.${format}`;
    const outputPath = path.join(outputDir, outputFilename);
    const qualitySettings = qualityPresets[quality || compositionData.quality] || qualityPresets.standard;
    
    let command = ffmpeg();
    let complexFilter = [];
    
    // Calculate optimal input durations using consolidated helper
    const durationCalc = calculateInputDurations(validImages, compositionData.transitions, compositionData.frameDurations, 1000);
    console.log(`Re-export: Total duration: ${durationCalc.totalDuration.toFixed(2)}s, Max transition: ${durationCalc.maxTransitionDuration.toFixed(2)}s`);
    
    // Add inputs and scale/normalize each frame with optimized durations
    validImages.forEach((image, index) => {
      const inputDuration = durationCalc.inputDurations[index];
      const baseDuration = (compositionData.frameDurations[index] || 1000) / 1000;
      
      console.log(`Re-export: Image ${index + 1}/${validImages.length} - Base: ${baseDuration.toFixed(2)}s, Input: ${inputDuration.toFixed(2)}s`);
      command.input(image.path).inputOptions(['-loop', '1', '-t', String(inputDuration)]);
      
      if (format === 'gif') {
        complexFilter.push(`[${index}:v]scale=${qualitySettings.width}:${qualitySettings.height}:force_original_aspect_ratio=decrease,pad=${qualitySettings.width}:${qualitySettings.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${qualitySettings.fps}[v${index}]`);
      } else {
        complexFilter.push(`[${index}:v]scale=${qualitySettings.width}:${qualitySettings.height}:force_original_aspect_ratio=decrease,pad=${qualitySettings.width}:${qualitySettings.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${qualitySettings.fps}[v${index}]`);
      }
    });
    
    // Use unified transition chain
    const lastOutput = buildUnifiedTransitionChain(validImages, compositionData.transitions, compositionData.frameDurations, 1000, complexFilter);
    
    if (format === 'gif') {
      // GIF-specific processing
      complexFilter.push(`${lastOutput}split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse[gif]`);
      
      command
        .complexFilter(complexFilter)
        .map('[gif]')
        .outputOptions([`-r ${qualitySettings.fps}`])
        .output(outputPath)
        .on('start', cmd => console.log('FFmpeg re-export started for GIF:', cmd))
        .on('end', () => {
          // Add export to composition history
          addExportToComposition(compositionId, {
            format,
            filename: outputFilename,
            settings: { quality: quality || compositionData.quality }
          });
          
          if (!res.headersSent) res.json({ 
            success: true, 
            filename: outputFilename, 
            downloadUrl: `/download/${outputFilename}`, 
            message: 'GIF re-exported successfully',
            compositionId 
          });
        })
        .on('error', (err) => {
          console.error('GIF Re-export Error:', err.message);
          if (!res.headersSent) res.status(500).json({ error: 'GIF re-export failed', details: err.message });
        })
        .run();
    } else {
      // Video processing (MP4/WebM)
      const outputOptions = format === 'mp4'
        ? ['-c:v libx264', '-preset fast', '-profile:v high', `-crf ${qualitySettings.crf}`, `-b:v ${qualitySettings.bitrate}`, '-pix_fmt yuv420p', '-movflags +faststart']
        : ['-c:v libvpx-vp9', '-cpu-used 2', '-deadline realtime', `-crf ${qualitySettings.crf}`, `-b:v ${qualitySettings.bitrate}`, '-pix_fmt yuv420p', '-row-mt 1'];
      
      command
        .complexFilter(complexFilter)
        .outputOptions(outputOptions)
        .map(lastOutput)
        .output(outputPath)
        .on('start', cmd => console.log(`FFmpeg re-export started for ${format.toUpperCase()}:`, cmd))
        .on('end', () => {
          // Add export to composition history
          addExportToComposition(compositionId, {
            format,
            filename: outputFilename,
            settings: { quality: quality || compositionData.quality }
          });
          
          if (!res.headersSent) res.json({ 
            success: true, 
            filename: outputFilename, 
            downloadUrl: `/download/${outputFilename}`, 
            message: `${format.toUpperCase()} re-exported successfully`,
            compositionId 
          });
        })
        .on('error', (err) => {
          console.error(`${format.toUpperCase()} Re-export Error:`, err.message);
          if (!res.headersSent) res.status(500).json({ error: `${format.toUpperCase()} re-export failed`, details: err.message });
        })
        .run();
    }
    
  } catch (error) {
    console.error('Re-export Error:', error.message);
    res.status(500).json({ error: 'Re-export failed', details: error.message });
  }
});

// Get composition details
app.get('/compositions/:id', (req, res) => {
  try {
    const { id: compositionId } = req.params;
    const compositionData = loadComposition(compositionId);
    
    res.json({ 
      success: true, 
      composition: compositionData 
    });
    
  } catch (error) {
    console.error('Get Composition Error:', error.message);
    res.status(404).json({ error: 'Composition not found', details: error.message });
  }
});

// Download endpoint
app.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(outputDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Support range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      // Determine MIME type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.webm' ? 'video/webm' : 
                         ext === '.mp4' ? 'video/mp4' : 
                         ext === '.gif' ? 'image/gif' : 
                         'application/octet-stream';
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range'
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Determine MIME type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      let contentDisposition = `attachment; filename="${filename}"`;
      
      // For preview files, serve as video instead of download
      if (filename.includes('preview_')) {
        contentType = ext === '.webm' ? 'video/webm' : 
                     ext === '.mp4' ? 'video/mp4' : 
                     ext === '.gif' ? 'image/gif' : 
                     'application/octet-stream';
        contentDisposition = `inline; filename="${filename}"`;
      }
      
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range'
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed', details: error.message });
  }
});

// Cleanup endpoint
app.delete('/cleanup/:sessionId', (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const sessionDir = path.join(tempDir, sessionId);

    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      res.json({ success: true, message: 'Session files cleaned up' });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed', details: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: error.message 
  });
});

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3002;
  
  console.log('🔧 Starting server...');
  console.log('🔧 Environment:', process.env.NODE_ENV);
  console.log('🔧 Port:', PORT);
  console.log('🔧 FFmpeg: Using native binary');
  
  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop other instances or use a different port.`);
        console.error('💡 Try: lsof -ti:3001 | xargs kill -9');
      } else {
        console.error('❌ Failed to start server:', err);
      }
      process.exit(1);
    }
    
    console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);
console.log('🔧 Redis URL configured:', process.env.REDIS_URL ? 'Yes' : 'No');
    console.log(`🏥 Health check available at http://0.0.0.0:${PORT}/api/health`);
    console.log(`🌐 Public URL: ${process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'Not set'}`);
    if (jobQueueEnabled) {
      console.log(`🔄 Job queue: Enabled with Redis`);
    } else {
      console.log(`⚠️ Job queue: Disabled (Redis not available)`);
    }
    console.log('AnimaGen Backend Server is ready!');
    console.log('Supported formats: GIF, MP4, WebM');
    console.log('Quality presets:', Object.keys(qualityPresets).join(', '));
    console.log('Transition effects:', Object.keys(transitionEffects).join(', '));
  });

  // Graceful shutdown to avoid port locking when nodemon restarts
  const shutdown = () => {
    console.log('\n📉  Shutting down HTTP server...');
    server.close(() => {
      console.log('✅  HTTP server closed. Bye!');
      process.exit(0);
    });

    // Force-exit if it takes too long
    setTimeout(() => {
      console.error('⏱️  Forced shutdown after 10s');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Serve React app for all non-API routes (catch-all route)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/upload') || req.path.startsWith('/download') || req.path.startsWith('/compositions')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Health check endpoint moved to top of file

// Graceful shutdown handling
async function gracefulShutdown(signal) {
  console.log(`📡 Received ${signal}, shutting down gracefully...`);
  
  try {
    // Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed');
    });

    // Stop job queue workers if enabled
    if (jobQueueEnabled) {
      await workerManager.stop();
    }

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export app for testing
module.exports = app;