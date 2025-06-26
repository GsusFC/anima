require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure output and temp directories exist
const outputDir = path.join(__dirname, process.env.OUTPUT_DIR || 'output');
const tempDir = path.join(__dirname, process.env.TEMP_DIR || 'temp');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

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
    // Keep original filename with timestamp prefix
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}_${originalName}`);
  }
});

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

// Quality presets for different output formats
const qualityPresets = {
  web: { width: 720, height: 480, fps: parseInt(process.env.DEFAULT_FPS) || 24, bitrate: '1M', crf: 28 },
  standard: { width: 1280, height: 720, fps: parseInt(process.env.DEFAULT_FPS) || 30, bitrate: '2M', crf: 23 },
  high: { width: 1920, height: 1080, fps: parseInt(process.env.DEFAULT_FPS) || 30, bitrate: '4M', crf: 20 },
  premium: { width: 1920, height: 1080, fps: 60, bitrate: '8M', crf: 18 },
  ultra: { width: 3840, height: 2160, fps: 60, bitrate: '20M', crf: 16 }
};

// Transition effects mapping
const transitionEffects = {
  none: 'none',
  fade: 'fade',
  crossfade: 'crossfade', 
  dissolve: 'dissolve',
  slideLeft: 'slideleft',
  slideRight: 'slideright',
  slideUp: 'slideup',
  slideDown: 'slidedown',
  zoomIn: 'zoomin',
  zoomOut: 'zoomout',
  rotateLeft: 'rotateleft',
  rotateRight: 'rotateright'
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'AnimaGen Backend Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /upload',
      exportGif: 'POST /export/gif',
      exportVideo: 'POST /export/video',
      download: 'GET /download/:filename'
    }
  });
});

// File upload endpoint
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

// GIF Export endpoint
app.post('/export/gif', async (req, res) => {
  try {
    const { images, transitions, duration = parseInt(process.env.DEFAULT_DURATION) || 1, quality = process.env.DEFAULT_QUALITY || 'standard', sessionId } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Validate that all images exist before processing
    const validImages = [];
    for (const image of images) {
      const imagePath = path.join(tempDir, sessionId, image.filename);
      if (fs.existsSync(imagePath)) {
        validImages.push({ ...image, path: imagePath });
      } else {
        console.warn(`Image not found: ${imagePath}`);
      }
    }

    if (validImages.length === 0) {
      return res.status(400).json({ error: 'No valid images found for session' });
    }

    console.log(`Processing ${validImages.length} images for GIF generation`);

    const outputFilename = `animagen_${Date.now()}.gif`;
    const outputPath = path.join(outputDir, outputFilename);

    // Get quality settings
    const qualitySettings = qualityPresets[quality] || qualityPresets.standard;
    
    // Create FFmpeg command
    let command = ffmpeg();

    // Add input images (only valid ones)
    validImages.forEach((image, index) => {
      command = command.input(image.path);
    });

    // Configure GIF output
    command
      .complexFilter([
        `[0:v] scale=${qualitySettings.width}:${qualitySettings.height}:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse`
      ])
      .outputOptions([
        `-r ${qualitySettings.fps}`,
        `-t ${duration * validImages.length}`
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('GIF generation started:', commandLine);
        io.emit('export:progress', { 
          type: 'gif',
          status: 'started', 
          progress: 0,
          message: 'Starting GIF generation...' 
        });
      })
      .on('progress', (progress) => {
        const percent = Math.round(progress.percent || 0);
        io.emit('export:progress', { 
          type: 'gif',
          status: 'processing', 
          progress: percent,
          message: `Generating GIF: ${percent}%` 
        });
      })
      .on('end', () => {
        console.log('GIF generation completed');
        io.emit('export:progress', { 
          type: 'gif',
          status: 'completed', 
          progress: 100,
          message: 'GIF generation completed!',
          filename: outputFilename
        });
        res.json({
          success: true,
          filename: outputFilename,
          downloadUrl: `/download/${outputFilename}`,
          message: 'GIF generated successfully'
        });
      })
      .on('error', (error) => {
        console.error('GIF generation error:', error);
        io.emit('export:progress', { 
          type: 'gif',
          status: 'error', 
          progress: 0,
          message: 'GIF generation failed',
          error: error.message
        });
        res.status(500).json({ error: 'GIF generation failed', details: error.message });
      })
      .run();

  } catch (error) {
    console.error('GIF export error:', error);
    res.status(500).json({ error: 'GIF export failed', details: error.message });
  }
});

// Video Export endpoint
app.post('/export/video', async (req, res) => {
  try {
    const { 
      images, 
      transitions, 
      duration = parseInt(process.env.DEFAULT_DURATION) || 1, 
      quality = process.env.DEFAULT_QUALITY || 'standard',
      format = 'mp4',
      sessionId,
      customSettings = {}
    } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Validate that all images exist before processing
    const validImages = [];
    for (const image of images) {
      const imagePath = path.join(tempDir, sessionId, image.filename);
      if (fs.existsSync(imagePath)) {
        validImages.push({ ...image, path: imagePath });
      } else {
        console.warn(`Image not found: ${imagePath}`);
      }
    }

    if (validImages.length === 0) {
      return res.status(400).json({ error: 'No valid images found for session' });
    }

    console.log(`Processing ${validImages.length} images for ${format.toUpperCase()} generation`);

    const outputFilename = `animagen_${Date.now()}.${format}`;
    const outputPath = path.join(outputDir, outputFilename);

    // Get quality settings and merge with custom settings
    const qualitySettings = { ...qualityPresets[quality] || qualityPresets.standard, ...customSettings };
    
    // Create FFmpeg command
    let command = ffmpeg();

    // Add input images (only valid ones)
    validImages.forEach((image, index) => {
      command = command.input(image.path);
    });

    // Build filter complex for transitions
    let filterComplex = [];
    let lastOutput = '[0:v]';

    // Scale all inputs first
    for (let i = 0; i < validImages.length; i++) {
      filterComplex.push(`[${i}:v] scale=${qualitySettings.width}:${qualitySettings.height}:force_original_aspect_ratio=decrease,pad=${qualitySettings.width}:${qualitySettings.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${qualitySettings.fps} [v${i}]`);
    }

    // Handle transitions
    if (transitions && transitions.length > 0 && validImages.length > 1) {
      // Check if all transitions are 'none' - use simple concatenation
      const allNoneTransitions = transitions.every(t => t.type === 'none');
      
      if (allNoneTransitions) {
        // Simple concatenation without xfade
        let concatInputs = '';
        for (let i = 0; i < validImages.length; i++) {
          concatInputs += `[v${i}]`;
        }
        filterComplex.push(`${concatInputs}concat=n=${validImages.length}:v=1:a=0[outv]`);
      } else {
        // Use xfade transitions
        lastOutput = '[v0]';
        
        for (let i = 0; i < transitions.length && i < validImages.length - 1; i++) {
          const transition = transitions[i];
          const transitionType = transitionEffects[transition.type] || 'fade';
          const transitionDuration = transition.duration || 0.5;
          
          if (transitionType === 'none') {
            // For 'none' transitions, just concatenate without xfade
            continue;
          }
          
          const nextInput = `[v${i + 1}]`;
          const outputLabel = i === transitions.length - 1 || i === validImages.length - 2 ? '[outv]' : `[t${i}]`;
          
          filterComplex.push(`${lastOutput}${nextInput}xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${duration * (i + 1) - transitionDuration}${outputLabel}`);
          lastOutput = outputLabel;
        }
      }
    } else {
      // No transitions, simple concatenation
      let concatInputs = '';
      for (let i = 0; i < validImages.length; i++) {
        concatInputs += `[v${i}]`;
      }
      filterComplex.push(`${concatInputs}concat=n=${validImages.length}:v=1:a=0[outv]`);
    }

    // Configure output based on format
    const outputOptions = [];
    
    if (format === 'mp4') {
      outputOptions.push(
        '-c:v libx264',
        '-preset medium',
        '-profile:v high',
        `-crf ${qualitySettings.crf}`,
        `-b:v ${qualitySettings.bitrate}`,
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      );
    } else if (format === 'webm') {
      outputOptions.push(
        '-c:v libvpx-vp9',
        '-preset medium',
        `-crf ${qualitySettings.crf}`,
        `-b:v ${qualitySettings.bitrate}`,
        '-pix_fmt yuv420p'
      );
    }

    command
      .complexFilter(filterComplex)
      .outputOptions(outputOptions)
      .outputOptions([`-r ${qualitySettings.fps}`])
      .map('[outv]')
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('Video generation started:', commandLine);
        io.emit('export:progress', { 
          type: format,
          status: 'started', 
          progress: 0,
          message: `Starting ${format.toUpperCase()} generation...` 
        });
      })
      .on('progress', (progress) => {
        const percent = Math.round(progress.percent || 0);
        io.emit('export:progress', { 
          type: format,
          status: 'processing', 
          progress: percent,
          message: `Generating ${format.toUpperCase()}: ${percent}%` 
        });
      })
      .on('end', () => {
        console.log('Video generation completed');
        io.emit('export:progress', { 
          type: format,
          status: 'completed', 
          progress: 100,
          message: `${format.toUpperCase()} generation completed!`,
          filename: outputFilename
        });
        res.json({
          success: true,
          filename: outputFilename,
          downloadUrl: `/download/${outputFilename}`,
          message: `${format.toUpperCase()} generated successfully`
        });
      })
      .on('error', (error) => {
        console.error('Video generation error:', error);
        io.emit('export:progress', { 
          type: format,
          status: 'error', 
          progress: 0,
          message: `${format.toUpperCase()} generation failed`,
          error: error.message
        });
        res.status(500).json({ error: `${format.toUpperCase()} generation failed`, details: error.message });
      })
      .run();

  } catch (error) {
    console.error('Video export error:', error);
    res.status(500).json({ error: 'Video export failed', details: error.message });
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
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Regular download
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`
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
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
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

// Export app for testing
module.exports = app; 