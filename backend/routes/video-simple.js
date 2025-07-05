const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const router = express.Router();
const execAsync = util.promisify(exec);

// Simple Video export - Direct processing only
router.post('/', async (req, res) => {
  console.log('🎬 Simple Video Export - Starting');
  
  try {
    const { sessionId, images, frameDurations = [], format = 'mp4', fps = 30, quality = 'standard', resolution } = req.body;
    
    console.log('📦 Received payload:', {
      sessionId,
      imagesCount: images?.length,
      imageFilenames: images?.map(img => img.filename),
      durations: frameDurations,
      format,
      fps,
      quality,
      resolution
    });

    // Validate input
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId required' });
    }
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, error: 'images array required' });
    }

    // Check if all image files exist
    const uploadDir = path.join(__dirname, '../temp', sessionId);
    const missingFiles = [];
    
    for (let i = 0; i < images.length; i++) {
      const imagePath = path.join(uploadDir, images[i].filename);
      if (!fs.existsSync(imagePath)) {
        missingFiles.push(images[i].filename);
      }
    }
    
    if (missingFiles.length > 0) {
      console.log('❌ Missing files:', missingFiles);
      return res.status(400).json({ 
        success: false, 
        error: 'Missing image files',
        missingFiles 
      });
    }

    // Determine resolution
    let videoResolution = { width: 1920, height: 1080 }; // Default 1080p
    
    if (resolution === 'custom' && req.body.videoConfig?.resolution) {
      videoResolution = req.body.videoConfig.resolution;
      console.log('📐 Custom resolution applied:', videoResolution);
    } else if (resolution === '480p') {
      videoResolution = { width: 854, height: 480 };
    } else if (resolution === '720p') {
      videoResolution = { width: 1280, height: 720 };
    } else if (resolution === '1080p') {
      videoResolution = { width: 1920, height: 1080 };
    }
    
    console.log('🎯 Final resolution:', videoResolution);

    // Generate output filename
    const timestamp = Date.now();
    const outputFile = path.join(__dirname, '../output', `simple_video_${timestamp}.${format}`);
    
    // Build FFmpeg command - concatenate images with durations
    let ffmpegInputs = [];
    let filterParts = [];
    
    console.log('🎬 Processing images:');
    for (let i = 0; i < images.length; i++) {
      const imagePath = path.join(uploadDir, images[i].filename);
      const duration = (frameDurations[i] || 2000) / 1000; // Default 2 seconds per frame
      
      console.log(`  [${i}] ${images[i].filename} - duration: ${duration}s`);
      
      ffmpegInputs.push(`-loop 1 -t ${duration} -i "${imagePath}"`);
      filterParts.push(`[${i}:v]scale=${videoResolution.width}:${videoResolution.height}:force_original_aspect_ratio=decrease,pad=${videoResolution.width}:${videoResolution.height}:(ow-iw)/2:(oh-ih)/2[v${i}]`);
    }
    
    const filterComplex = filterParts.join(';') + ';' + 
      filterParts.map((_, i) => `[v${i}]`).join('') + 
      `concat=n=${images.length}:v=1:a=0[out]`;
    
    // Quality settings
    const qualitySettings = {
      'low': { crf: 28, bitrate: '1M' },
      'standard': { crf: 23, bitrate: '3M' },
      'high': { crf: 18, bitrate: '8M' }
    };
    
    const selectedQuality = qualitySettings[quality] || qualitySettings.standard;
    
    // Build command based on format
    let codecOptions = '';
    if (format === 'mp4') {
      codecOptions = `-c:v libx264 -preset fast -crf ${selectedQuality.crf} -b:v ${selectedQuality.bitrate} -pix_fmt yuv420p -movflags +faststart`;
    } else if (format === 'webm') {
      codecOptions = `-c:v libvpx-vp9 -crf ${selectedQuality.crf} -b:v ${selectedQuality.bitrate} -pix_fmt yuv420p`;
    }
    
    const ffmpegCmd = `ffmpeg ${ffmpegInputs.join(' ')} -filter_complex "${filterComplex}" -map "[out]" -r ${fps} ${codecOptions} "${outputFile}"`;
    
    console.log('🎬 FFmpeg command:', ffmpegCmd);
    
    // Execute FFmpeg
    console.log('⚙️ Executing FFmpeg...');
    await execAsync(ffmpegCmd);
    
    console.log('✅ Video created successfully:', outputFile);
    
    // Return success with download URL
    const filename = `simple_video_${timestamp}.${format}`;
    res.json({
      success: true,
      filename: filename,
      downloadUrl: `/download/${filename}`,
      message: `${format.toUpperCase()} video created successfully`
    });

  } catch (error) {
    console.error('❌ Video export failed:', error);
    res.status(500).json({
      success: false,
      error: 'Video export failed',
      details: error.message
    });
  }
});

module.exports = router;
