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

// Ensure output, temp, and compositions directories exist
const outputDir = path.join(__dirname, process.env.OUTPUT_DIR || 'output');
const tempDir = path.join(__dirname, process.env.TEMP_DIR || 'temp');
const compositionsDir = path.join(__dirname, 'compositions');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

if (!fs.existsSync(compositionsDir)) {
  fs.mkdirSync(compositionsDir, { recursive: true });
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

// Transition effects mapping (using real FFmpeg xfade transitions)
const transitionEffects = {
  none: 'none',
  
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
  hblur: 'hblur'
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
    endpoints: {
      upload: 'POST /upload',
      preview: 'POST /preview',
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

// HELPER FUNCTION: Calculate optimal input duration for export with transitions
// CONSOLIDATED HELPER: Calculate optimal input durations for exports with transitions
function calculateInputDurations(validImages, transitions, frameDurations, defaultDuration) {
  const results = {
    totalDuration: 0,
    inputDurations: [],
    maxTransitionDuration: 0
  };
  
  // Calculate total duration needed and max transition duration
  for (let i = 0; i < validImages.length; i++) {
    const frameDuration = (frameDurations[i] || defaultDuration) / 1000;
    results.totalDuration += frameDuration;
    
    if (i < transitions.length && transitions[i]) {
      const transitionDuration = Math.min(transitions[i].duration / 1000, frameDuration * 0.9);
      results.maxTransitionDuration = Math.max(results.maxTransitionDuration, transitionDuration);
      // Add buffer for overlapping transitions - more precise calculation
      results.totalDuration += transitionDuration * 0.3; // Reduced buffer, more accurate
    }
  }
  
  // Calculate individual input durations with sufficient buffer
  const bufferMultiplier = 1.5 + (results.maxTransitionDuration / results.totalDuration); // Dynamic buffer
  
  for (let i = 0; i < validImages.length; i++) {
    const baseDuration = (frameDurations[i] || defaultDuration) / 1000;
    const inputDuration = Math.max(
      baseDuration,
      results.totalDuration / validImages.length * bufferMultiplier
    );
    results.inputDurations.push(inputDuration);
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
    // Single image - no transitions needed
    console.log('Single image, returning [v0]');
    return '[v0]';
  }

  if (!transitions || validImages.length < 2) {
    // No transitions - use simple concat
    console.log('No transitions, using concat');
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
    let transitionDuration = Math.min(transition.duration / 1000, currentFrameDuration * 0.9);
    let transitionType = transitionEffects[transition.type] || 'fade';

    // Treat 'none' as a near-instant fade to avoid breaking the filter chain
    if (transitionType === 'none') {
      transitionType = 'fade';
      transitionDuration = 0.001;
    }

    const nextInput = `[v${i + 1}]`;
    const outputLabel = (i === validImages.length - 2) ? '[outv]' : `[t${i}]`;
    
    // FIXED: Offset should be at the END of the current frame, not beginning + duration
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

// PREVIEW ENDPOINT - Generate quick video preview with transitions
app.post('/preview', async (req, res) => {
  try {
    const { images, transitions, sessionId } = req.body;
    const frameDurations = req.body.frameDurations || [];
    const defaultDuration = 1500; // Reasonable duration for preview (1.5s per frame)

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

    const validImages = images.map(img => {
      const imagePath = path.join(tempDir, sessionId, img.filename);
      return fs.existsSync(imagePath) ? { ...img, path: imagePath } : null;
    }).filter(Boolean);

    if (validImages.length === 0) return res.status(400).json({ error: 'No valid images found' });
    
    console.log(`Preview: Processing ${validImages.length} images with transitions`);
    console.log(`Preview: Frame durations (ms):`, frameDurations);
    console.log(`Preview: Transitions:`, transitions?.map(t => `${t.type}:${t.duration}ms`));
    console.log(`Preview: Default duration (ms):`, defaultDuration);
    
    // Write detailed log to file for debugging
    const logData = {
      timestamp: new Date().toISOString(),
      validImages: validImages.length,
      frameDurations,
      transitions,
      defaultDuration
    };
    fs.appendFileSync('preview_debug.log', JSON.stringify(logData) + '\n');

    const outputFilename = `preview_${sessionId}_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // Use preview quality settings (smaller, faster)
    const previewSettings = { width: 640, height: 480, fps: 30, bitrate: '1M', crf: 28 };
    
    let command = ffmpeg();
    let complexFilter = [];

    // Calculate optimal input durations using consolidated helper
    const durationCalc = calculateInputDurations(validImages, transitions, frameDurations, defaultDuration);
    console.log(`Preview: Total duration: ${durationCalc.totalDuration.toFixed(2)}s, Max transition: ${durationCalc.maxTransitionDuration.toFixed(2)}s`);

    // Add inputs with optimized durations
    validImages.forEach((image, index) => {
      const inputDuration = durationCalc.inputDurations[index];
      const baseDuration = (frameDurations[index] || defaultDuration) / 1000;
      
      console.log(`Preview: Image ${index + 1}/${validImages.length} - Base: ${baseDuration.toFixed(2)}s, Input: ${inputDuration.toFixed(2)}s`);
      command.input(image.path).inputOptions(['-loop', '1', '-t', String(inputDuration)]);
      complexFilter.push(`[${index}:v]scale=${previewSettings.width}:${previewSettings.height}:force_original_aspect_ratio=decrease,pad=${previewSettings.width}:${previewSettings.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${previewSettings.fps}[v${index}]`);
    });

    // Use unified transition chain - pass frameDurations directly as they're already processed
    const lastOutput = buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter);
    
    command
      .complexFilter(complexFilter)
      .outputOptions([
        '-c:v libx264', 
        '-preset ultrafast', // Fast encoding for preview
        '-profile:v baseline', 
        `-crf ${previewSettings.crf}`, 
        `-b:v ${previewSettings.bitrate}`, 
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
            previewUrl: `/download/${outputFilename}`,
            message: 'Preview generated successfully' 
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

// CORRECTED GIF EXPORT ENDPOINT
app.post('/export/gif', async (req, res) => {
  try {
    const { images, transitions, duration = 1, quality = 'standard', sessionId } = req.body;
    const frameDurations = req.body.frameDurations || [];

    if (!images || !Array.isArray(images) || images.length === 0) return res.status(400).json({ error: 'No images provided' });
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

    const validImages = images.map(img => {
      const imagePath = path.join(tempDir, sessionId, img.filename);
      return fs.existsSync(imagePath) ? { ...img, path: imagePath } : null;
    }).filter(Boolean);

    if (validImages.length === 0) return res.status(400).json({ error: 'No valid images found' });
    
    console.log(`GIF Export: Processing ${validImages.length} images with transitions. Durations: ${JSON.stringify(frameDurations)}`);

    const outputFilename = `animagen_${Date.now()}.gif`;
    const outputPath = path.join(outputDir, outputFilename);
    const qualitySettings = qualityPresets[quality] || qualityPresets.standard;
    
    let command = ffmpeg();
    let complexFilter = [];

    // Calculate optimal input durations using consolidated helper
    const durationCalc = calculateInputDurations(validImages, transitions, frameDurations, duration * 1000);
    console.log(`GIF Export: Total duration: ${durationCalc.totalDuration.toFixed(2)}s, Max transition: ${durationCalc.maxTransitionDuration.toFixed(2)}s`);

    // Add inputs and scale/normalize each frame with optimized durations
    validImages.forEach((image, index) => {
      const inputDuration = durationCalc.inputDurations[index];
      const baseDuration = (frameDurations[index] || duration * 1000) / 1000;
      
      console.log(`GIF Export: Image ${index + 1}/${validImages.length} - Base: ${baseDuration.toFixed(2)}s, Input: ${inputDuration.toFixed(2)}s`);
      command.input(image.path).inputOptions(['-loop', '1', '-t', String(inputDuration)]);
      complexFilter.push(`[${index}:v]scale=${qualitySettings.width}:${qualitySettings.height}:force_original_aspect_ratio=decrease,pad=${qualitySettings.width}:${qualitySettings.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${qualitySettings.fps}[v${index}]`);
    });

    // Use unified transition chain (convert duration to ms for consistency)
    const durationMs = duration * 1000;
    const lastOutput = buildUnifiedTransitionChain(validImages, transitions, frameDurations, durationMs, complexFilter);
    
    // Add GIF-specific palette generation and optimization
    complexFilter.push(`${lastOutput}split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse[gif]`);

    command
      .complexFilter(complexFilter)
      .map('[gif]')
      .outputOptions([`-r ${qualitySettings.fps}`])
      .output(outputPath)
      .on('start', cmd => console.log('FFmpeg started for GIF:', cmd))
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
  try {
    const { images, transitions, duration = 1, quality = 'standard', format = 'mp4', sessionId, customSettings = {} } = req.body;
    const frameDurations = req.body.frameDurations || [];

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
        complexFilter.push(`[${index}:v]scale=${qualitySettings.width}:${qualitySettings.height}:force_original_aspect_ratio=decrease,pad=${qualitySettings.width}:${qualitySettings.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${qualitySettings.fps}[v${index}]`);
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
      .on('start', cmd => console.log('FFmpeg started for Video:', cmd))
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

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Export app for testing
module.exports = app; 