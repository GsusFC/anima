const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Try to import queue functions, fallback if Redis not available
let queueFunctions;
let JobTypes;
try {
  queueFunctions = require('../queues/videoQueue');
  JobTypes = require('../queues/jobTypes').JobTypes;
} catch (error) {
  console.log('⚠️ Queue functions not available - Redis not connected');
  queueFunctions = null;
  JobTypes = null;
}

// Helper function to check if queue is available
function checkQueueAvailable(res, allowFallback = false) {
  if (!queueFunctions || !JobTypes) {
    if (allowFallback) {
      return false; // Caller will handle fallback
    }
    res.status(503).json({
      success: false,
      error: 'Job queue not available - Redis not connected',
      message: 'Please install and start Redis server to enable video exports'
    });
    return false;
  }
  return true;
}

// Get current queue statistics
router.get('/stats', async (req, res) => {
  try {
    if (!queueFunctions) {
      return res.json({
        success: true,
        stats: {
          queueEnabled: false,
          message: 'Queue disabled - Redis not available'
        }
      });
    }
    
    const stats = await queueFunctions.getQueueStats();
    res.json({
      success: true,
      stats: {
        queueEnabled: true,
        ...stats
      }
    });
  } catch (error) {
    console.error('❌ Failed to get queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics',
      details: error.message
    });
  }
});

// Queue slideshow export job
router.post('/slideshow', async (req, res) => {
  try {
    const {
      images,
      transitions = [],
      frameDurations = [],
      quality = 'standard',
      sessionId,
      format = 'mp4'
    } = req.body;

    console.log('🎬 Slideshow export job requested:', {
      imagesCount: images?.length,
      sessionId,
      quality,
      format
    });

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Force direct processing fallback in production environment
    const forceDirectProcessing = process.env.NODE_ENV === 'production' || process.env.FORCE_DIRECT_PROCESSING === 'true';
    
    if (forceDirectProcessing || !checkQueueAvailable(res, true)) {
      console.log(forceDirectProcessing ? 
        '🚀 Using direct processing mode (production)' : 
        '⚠️ Redis not available, using direct processing fallback');
      
      // Direct processing fallback without Redis
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      try {
        // Generate unique output filename
        const outputDir = path.join(__dirname, '../output');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const jobId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const outputFile = path.join(outputDir, `slideshow_${jobId}.${format}`);
        
        // Build FFmpeg command for slideshow with proper durations
        const inputFlags = [];
        const filterParts = [];
        
        images.forEach((img, index) => {
          const imagePath = path.join(__dirname, '../uploads', sessionId, img.filename);
          inputFlags.push(`-loop 1 -t ${(frameDurations[index] || 2000) / 1000} -i "${imagePath}"`);
        });
        
        // Simple concatenation for slideshow
        const concatList = images.map((_, index) => `[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[v${index}]`);
        const concatInputs = images.map((_, index) => `[v${index}]`).join('');
        
        const filterComplex = `${concatList.join(';')};${concatInputs}concat=n=${images.length}:v=1:a=0[out]`;
        
        // Set codec and options based on format
        let codecOptions;
        // Calculate resolution for 'auto' mode
        let targetResolution = null;
        if (resolution === 'auto') {
          targetResolution = await calculateAutoResolution(images, sessionId);
          console.log('🎯 Auto resolution calculated:', targetResolution);
        } else if (RESOLUTION_PRESETS[resolution]) {
          targetResolution = RESOLUTION_PRESETS[resolution];
        } else if (videoConfig.resolution && videoConfig.resolution.width && videoConfig.resolution.height) {
          targetResolution = { width: videoConfig.resolution.width, height: videoConfig.resolution.height };
        }

        if (format === 'webm') {
          // WebM with optimized VP9 settings
          const preset = WEBM_PRESETS[quality] || WEBM_PRESETS.standard;
          const finalFps = videoConfig.fps || fps;
          
          codecOptions = `-c:v libvpx-vp9 -deadline ${preset.preset} -crf ${preset.crf} -b:v 0 -maxrate ${preset.maxBitrate} -bufsize ${preset.maxBitrate} -threads ${preset.threads} -tile-columns 2 -frame-parallel 1 -auto-alt-ref 1 -lag-in-frames 25 -pix_fmt yuv420p`;
          
          // Apply resolution if calculated
          if (targetResolution) {
            codecOptions += ` -vf scale=${targetResolution.width}:${targetResolution.height}:force_original_aspect_ratio=decrease,pad=${targetResolution.width}:${targetResolution.height}:(ow-iw)/2:(oh-ih)/2`;
          }
        } else {
          // MP4 with optimized settings
          const preset = MP4_PRESETS[quality] || MP4_PRESETS.standard;
          const finalFps = videoConfig.fps || fps;
          
          codecOptions = `-c:v libx264 -preset ${preset.preset} -crf ${preset.crf} -maxrate ${preset.maxBitrate} -bufsize ${preset.maxBitrate} -pix_fmt yuv420p -movflags +faststart`;
          
          // Apply resolution if calculated
          if (targetResolution) {
            codecOptions += ` -vf scale=${targetResolution.width}:${targetResolution.height}:force_original_aspect_ratio=decrease,pad=${targetResolution.width}:${targetResolution.height}:(ow-iw)/2:(oh-ih)/2`;
          }
        }
        
        const ffmpegCmd = `ffmpeg ${inputFlags.join(' ')} -filter_complex "${filterComplex}" -map "[out]" ${codecOptions} -y "${outputFile}"`;
        
        console.log('🎬 Direct FFmpeg processing:', ffmpegCmd);
        
        // Execute FFmpeg
        await execAsync(ffmpegCmd);
        
        // Return immediate success with download URL
        return res.json({
          success: true,
          jobId: jobId,
          status: 'completed',
          message: 'Slideshow created successfully (direct processing)',
          downloadUrl: `/api/export/download/${jobId}`,
          isDirect: true
        });
        
      } catch (ffmpegError) {
        console.error('❌ Direct FFmpeg processing failed:', ffmpegError);
        return res.status(500).json({
          success: false,
          error: 'Direct processing failed',
          details: ffmpegError.message
        });
      }
    }

    // Normal Redis queue processing
    const job = await queueFunctions.addJob(JobTypes.SLIDESHOW_EXPORT, {
      images,
      transitions,
      frameDurations,
      quality,
      sessionId,
      format
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Slideshow export job queued successfully',
      statusUrl: `/api/export/status/${job.id}`,
      downloadUrl: `/api/export/download/${job.id}`
    });

  } catch (error) {
    console.error('❌ Failed to queue slideshow export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue slideshow export',
      details: error.message
    });
  }
});

// MP4 Quality presets
const MP4_PRESETS = {
  web: { crf: 28, preset: 'fast', maxBitrate: '1M' },
  standard: { crf: 23, preset: 'medium', maxBitrate: '2M' },
  high: { crf: 18, preset: 'slow', maxBitrate: '4M' },
  ultra: { crf: 15, preset: 'veryslow', maxBitrate: '8M' }
};

// WebM Quality presets (VP9 codec)
const WEBM_PRESETS = {
  web: { crf: 35, preset: 'good', maxBitrate: '800k', threads: 4 },
  standard: { crf: 30, preset: 'good', maxBitrate: '1.5M', threads: 6 },
  high: { crf: 25, preset: 'best', maxBitrate: '3M', threads: 8 },
  ultra: { crf: 20, preset: 'best', maxBitrate: '6M', threads: 8 }
};

// Resolution presets
const RESOLUTION_PRESETS = {
  auto: null, // Will be calculated from first image aspect ratio
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 }
};

// Helper function to get image dimensions
const getImageDimensions = (imagePath) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = require('fluent-ffmpeg');
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
    const firstImagePath = path.join(__dirname, '../uploads', sessionId, images[0].filename);
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

// Queue video export job
router.post('/video', async (req, res) => {
  try {
    const {
      videoPath,
      startTime,
      endTime,
      quality = 'standard',
      resolution = 'auto',
      fps = 30,
      format = 'mp4',
      videoConfig = {}
    } = req.body;

    console.log('🎬 Video export job requested:', {
      videoPath,
      startTime,
      endTime,
      quality,
      format,
      fps,
      resolution,
      videoConfig
    });

    if (!videoPath) {
      return res.status(400).json({
        success: false,
        error: 'Video path is required'
      });
    }

    // Resolve full path
    const fullVideoPath = path.isAbsolute(videoPath) 
      ? videoPath 
      : path.join(__dirname, '..', videoPath);

    if (!fs.existsSync(fullVideoPath)) {
      return res.status(400).json({
        success: false,
        error: 'Video file not found'
      });
    }

    if (!checkQueueAvailable(res)) return;

    // Add job to queue
    const job = await queueFunctions.addJob(JobTypes.VIDEO_EXPORT, {
      videoPath: fullVideoPath,
      startTime,
      endTime,
      quality,
      resolution,
      fps,
      format
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Video export job queued successfully',
      statusUrl: `/api/export/status/${job.id}`,
      downloadUrl: `/api/export/download/${job.id}`
    });

  } catch (error) {
    console.error('❌ Failed to queue video export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue video export',
      details: error.message
    });
  }
});

// Queue video trim job
router.post('/trim', async (req, res) => {
  try {
    const {
      videoPath,
      startTime,
      endTime,
      outputName,
      sessionId
    } = req.body;

    console.log('🎬 Video trim job requested:', {
      videoPath,
      startTime,
      endTime,
      sessionId
    });

    if (!videoPath || startTime === undefined || endTime === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: videoPath, startTime, endTime'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Resolve full path
    const fullVideoPath = path.isAbsolute(videoPath) 
      ? videoPath 
      : path.join(__dirname, '..', videoPath);

    if (!fs.existsSync(fullVideoPath)) {
      return res.status(400).json({
        success: false,
        error: 'Video file not found'
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be less than end time'
      });
    }

    if (!checkQueueAvailable(res)) return;

    // Add job to queue
    const job = await queueFunctions.addJob(JobTypes.VIDEO_TRIM, {
      videoPath: fullVideoPath,
      startTime,
      endTime,
      outputName,
      sessionId
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Video trim job queued successfully',
      statusUrl: `/api/export/status/${job.id}`,
      downloadUrl: `/api/export/download/${job.id}`
    });

  } catch (error) {
    console.error('❌ Failed to queue video trim:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue video trim',
      details: error.message
    });
  }
});

// Queue GIF export job
router.post('/gif', async (req, res) => {
  try {
    const {
      images,
      transitions = [],
      frameDurations = [],
      sessionId,
      fps = 24,
      quality = 'standard'
    } = req.body;

    // LOG: Payload recibido
    console.log('🟢 [GIF EXPORT] Payload recibido:');
    console.log('  - sessionId:', sessionId);
    console.log('  - imagesCount:', images?.length);
    if (Array.isArray(images)) {
      images.forEach((img, idx) => {
        console.log(`    [${idx}] filename:`, img.filename, 'id:', img.id);
      });
    }
    console.log('  - frameDurations:', frameDurations);
    console.log('  - transitions:', transitions);
    console.log('  - fps:', fps, 'quality:', quality);

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // LOG: Rutas de archivos esperadas
    const uploadsDir = path.join(__dirname, '../uploads', sessionId);
    console.log('🟢 [GIF EXPORT] Directorio de uploads esperado:', uploadsDir);
    images.forEach((img, idx) => {
      const imgPath = path.join(uploadsDir, img.filename);
      const exists = fs.existsSync(imgPath);
      console.log(`    [${idx}] Ruta esperada: ${imgPath}  (existe: ${exists})`);
    });

    // Force direct processing fallback in production environment
    const forceDirectProcessing = process.env.NODE_ENV === 'production' || process.env.FORCE_DIRECT_PROCESSING === 'true';
    
    if (forceDirectProcessing || !checkQueueAvailable(res, true)) {
      console.log(forceDirectProcessing ? 
        '🚀 Using direct GIF processing mode (production)' : 
        '⚠️ Redis not available for GIF, using direct processing fallback');
      
      // Direct processing fallback without Redis for GIF
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      try {
        // Generate unique output filename
        const outputDir = path.join(__dirname, '../output');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const jobId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const outputFile = path.join(outputDir, `gif_${jobId}.gif`);
        
        // Build FFmpeg command for GIF with proper timing
        const inputFlags = [];
        
        images.forEach((img, index) => {
          const imagePath = path.join(__dirname, '../uploads', sessionId, img.filename);
          const duration = (frameDurations[index] || 1000) / 1000; // Convert to seconds  
          inputFlags.push(`-loop 1 -t ${duration} -i "${imagePath}"`);
        });
        
        // Calculate auto resolution for GIF too
        const gifResolution = await calculateAutoResolution(images, sessionId, 720); // Max 720p for GIFs
        console.log('🎨 GIF auto resolution calculated:', gifResolution);
        
        // Simple concatenation for GIF with calculated resolution
        const concatList = images.map((_, index) => `[${index}:v]scale=${gifResolution.width}:${gifResolution.height}:force_original_aspect_ratio=decrease,pad=${gifResolution.width}:${gifResolution.height}:(ow-iw)/2:(oh-ih)/2[v${index}]`);
        const concatInputs = images.map((_, index) => `[v${index}]`).join('');
        
        const filterComplex = `${concatList.join(';')};${concatInputs}concat=n=${images.length}:v=1:a=0[out]`;
        
        const ffmpegCmd = `ffmpeg ${inputFlags.join(' ')} -filter_complex "${filterComplex}" -map "[out]" -r ${fps} -y "${outputFile}"`;
        
        console.log('🎬 Direct GIF FFmpeg processing:', ffmpegCmd);
        console.log('🎬 Images being processed:', images.map((img, idx) => ({
          index: idx,
          filename: img.filename,
          duration: frameDurations[idx] || 1000,
          path: path.join(__dirname, '../uploads', sessionId, img.filename)
        })));
        
        // Execute FFmpeg
        await execAsync(ffmpegCmd);
        
        // Return immediate success with download URL
        return res.json({
          success: true,
          jobId: jobId,
          status: 'completed',
          message: 'GIF created successfully (direct processing)',
          downloadUrl: `/api/export/download/${jobId}`,
          isDirect: true
        });
        
      } catch (ffmpegError) {
        console.error('❌ Direct GIF FFmpeg processing failed:', ffmpegError);
        return res.status(500).json({
          success: false,
          error: 'Direct GIF processing failed',
          details: ffmpegError.message
        });
      }
    }

    // Normal Redis queue processing
    const job = await queueFunctions.addJob(JobTypes.GIF_EXPORT, {
      images,
      transitions,
      frameDurations,
      sessionId,
      fps,
      quality
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'GIF export job queued successfully',
      statusUrl: `/api/export/status/${job.id}`,
      downloadUrl: `/api/export/download/${job.id}`
    });

  } catch (error) {
    console.error('❌ Failed to queue GIF export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue GIF export',
      details: error.message
    });
  }
});

// Queue format conversion job
router.post('/convert', async (req, res) => {
  try {
    const {
      inputPath,
      outputFormat,
      quality = 'standard',
      fps = 30
    } = req.body;

    console.log('🎬 Format conversion job requested:', {
      inputPath,
      outputFormat,
      quality,
      fps
    });

    if (!inputPath || !outputFormat) {
      return res.status(400).json({
        success: false,
        error: 'Input path and output format are required'
      });
    }

    // Resolve full path
    const fullInputPath = path.isAbsolute(inputPath) 
      ? inputPath 
      : path.join(__dirname, '..', inputPath);

    if (!fs.existsSync(fullInputPath)) {
      return res.status(400).json({
        success: false,
        error: 'Input file not found'
      });
    }

    if (!checkQueueAvailable(res)) return;

    // Add job to queue
    const job = await queueFunctions.addJob(JobTypes.FORMAT_CONVERSION, {
      inputPath: fullInputPath,
      outputFormat,
      quality,
      fps
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Format conversion job queued successfully',
      statusUrl: `/api/export/status/${job.id}`,
      downloadUrl: `/api/export/download/${job.id}`
    });

  } catch (error) {
    console.error('❌ Failed to queue format conversion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue format conversion',
      details: error.message
    });
  }
});

// Get job status and progress
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if this is a direct fallback job
    if (jobId.startsWith('fallback_')) {
      const outputDir = path.join(__dirname, '../output');
      const files = fs.readdirSync(outputDir).filter(f => f.includes(jobId));
      
      if (files.length > 0) {
        return res.json({
          success: true,
          job: {
            id: jobId,
            status: 'completed',
            progress: 100,
            result: {
              outputPath: path.join(outputDir, files[0]),
              filename: files[0]
            },
            downloadUrl: `/api/export/download/${jobId}`
          }
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }
    }
    
    // Normal Redis queue processing
    if (!checkQueueAvailable(res)) return;
    
    const status = await queueFunctions.getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      job: status
    });

  } catch (error) {
    console.error('❌ Failed to get job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
      details: error.message
    });
  }
});

// Download completed export
router.get('/download/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if this is a direct fallback job
    if (jobId.startsWith('fallback_')) {
      const outputDir = path.join(__dirname, '../output');
      const files = fs.readdirSync(outputDir).filter(f => f.includes(jobId));
      
      if (files.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Export file not found'
        });
      }
      
      const filePath = path.join(outputDir, files[0]);
      const fileName = files[0];
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Export file not available'
        });
      }

      console.log('📥 Serving direct fallback file:', fileName);
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }
    
    // Normal Redis queue processing
    if (!checkQueueAvailable(res)) return;
    
    const status = await queueFunctions.getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (status.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Job not completed yet',
        status: status.status,
        progress: status.progress
      });
    }

    if (!status.result || !status.result.outputPath) {
      return res.status(500).json({
        success: false,
        error: 'Export file not available'
      });
    }

    const filePath = status.result.outputPath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Export file not found'
      });
    }

    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename="${status.result.filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream file to client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Failed to download export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download export',
      details: error.message
    });
  }
});

// Cancel/cleanup job
router.delete('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!checkQueueAvailable(res)) return;
    
    const cancelled = await queueFunctions.cancelJob(jobId);
    
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or could not be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Failed to cancel job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel job',
      details: error.message
    });
  }
});

module.exports = router;
