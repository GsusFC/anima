const express = require('express');
const path = require('path');
const fs = require('fs');
const queueFunctions = require('../services/queue');
const { JobTypes } = require('../queues/jobTypes');

const router = express.Router();

// Helper function to check if queue is available
function checkQueueAvailable(res) {
  if (!queueFunctions || !JobTypes) {
    res.status(503).json({
      success: false,
      error: 'Job queue not available - Redis not connected',
      message: 'Please install and start Redis server to enable exports'
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

    if (!checkQueueAvailable(res)) return;

    // Add job to queue
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
      format = 'mp4'
    } = req.body;

    console.log('🎬 Video export job requested:', {
      videoPath,
      startTime,
      endTime,
      quality,
      format,
      fps,
      resolution
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

    // Log payload received
    console.log('🟢 [GIF EXPORT] Payload received:');
    console.log('  - sessionId:', sessionId);
    console.log('  - imagesCount:', images?.length);
    
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

    if (!checkQueueAvailable(res)) return;

    // Add job to queue
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

// Unified endpoint for exporting GIF/MP4/WebM with transitions
router.post('/unified-export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const {
      images,
      transitions = [],
      frameDurations = [],
      sessionId,
      fps = 30,
      quality = 'standard',
      resolution = '1080p'
    } = req.body;

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

    if (!checkQueueAvailable(res)) return;

    // Queue processing path
    const jobData = {
      images,
      transitions,
      frameDurations,
      sessionId,
      format,
      fps,
      quality,
      resolution
    };

    // Use JobTypes.UNIFIED_EXPORT
    const job = await queueFunctions.addJob(JobTypes.UNIFIED_EXPORT, jobData);

    if (!job) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add job to queue'
      });
    }

    res.json({
      success: true,
      jobId: job.id,
      statusUrl: `/api/export/status/${job.id}`,
      downloadUrl: `/api/export/download/${job.id}`
    });
  } catch (error) {
    console.error('❌ Failed to process unified export:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process unified export'
    });
  }
});

// Get job status and progress
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if this is a direct processing job (fallback_ or direct_)
    if (jobId.startsWith('fallback_') || jobId.startsWith('direct_')) {
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
    
    // Check if this is a direct processing job (fallback_ or direct_)
    if (jobId.startsWith('fallback_') || jobId.startsWith('direct_')) {
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

      console.log('📥 Serving direct processing file:', fileName);

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

// Debug endpoint for troubleshooting
router.get('/debug/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`🔍 [DEBUG] Checking job: ${jobId}`);
    
    // Check if this is a direct processing job (fallback_ or direct_)
    if (jobId.startsWith('fallback_') || jobId.startsWith('direct_')) {
      const outputDir = path.join(__dirname, '../output');
      const files = fs.readdirSync(outputDir).filter(f => f.includes(jobId));

      return res.json({
        success: true,
        debug: {
          jobType: jobId.startsWith('fallback_') ? 'fallback' : 'direct',
          jobId,
          outputDir,
          filesFound: files,
          allFiles: fs.readdirSync(outputDir)
        }
      });
    }
    
    // Normal Redis queue processing
    if (!checkQueueAvailable(res, true)) {
      return res.json({
        success: false,
        debug: {
          jobType: 'redis',
          queueAvailable: false,
          message: 'Redis queue not available'
        }
      });
    }
    
    const status = await queueFunctions.getJobStatus(jobId);
    
    return res.json({
      success: true,
      debug: {
        jobType: 'redis',
        jobId,
        status: status ? {
          id: status.id,
          status: status.status,
          progress: status.progress,
          result: status.result,
          hasResult: !!status.result,
          hasOutputPath: !!(status.result && status.result.outputPath),
          outputPath: status.result ? status.result.outputPath : null,
          fileExists: status.result && status.result.outputPath ? fs.existsSync(status.result.outputPath) : false
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
    res.status(500).json({
      success: false,
      error: 'Debug failed',
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
