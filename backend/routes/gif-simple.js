const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const router = express.Router();
const execAsync = util.promisify(exec);

// Simple GIF export - Direct processing only
router.post('/', async (req, res) => {
  console.log('🆕 Simple GIF Export - Starting');
  
  try {
    const { sessionId, images, frameDurations = [] } = req.body;
    
    console.log('📦 Received payload:', {
      sessionId,
      imagesCount: images?.length,
      imageFilenames: images?.map(img => img.filename),
      durations: frameDurations
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

    // Generate output filename
    const timestamp = Date.now();
    const outputFile = path.join(__dirname, '../output', `simple_gif_${timestamp}.gif`);
    
    // Build simple FFmpeg command - concatenate images with durations
    let ffmpegInputs = [];
    let filterParts = [];
    
    console.log('🎬 Processing images:');
    for (let i = 0; i < images.length; i++) {
      const imagePath = path.join(uploadDir, images[i].filename);
      const duration = (frameDurations[i] || 2000) / 1000; // Default 2 seconds per frame
      
      console.log(`  [${i}] ${images[i].filename} - duration: ${duration}s`);
      
      ffmpegInputs.push(`-loop 1 -t ${duration} -i "${imagePath}"`);
      filterParts.push(`[${i}:v]scale=640:640:force_original_aspect_ratio=decrease,pad=640:640:(ow-iw)/2:(oh-ih)/2[v${i}]`);
    }
    
    const filterComplex = filterParts.join(';') + ';' + 
      filterParts.map((_, i) => `[v${i}]`).join('') + 
      `concat=n=${images.length}:v=1:a=0[out]`;
    
    const ffmpegCmd = `ffmpeg ${ffmpegInputs.join(' ')} -filter_complex "${filterComplex}" -map "[out]" -r 10 -loop 0 "${outputFile}"`;
    
    console.log('🎬 FFmpeg command:', ffmpegCmd);
    
    // Execute FFmpeg
    console.log('⚙️ Executing FFmpeg...');
    await execAsync(ffmpegCmd);
    
    console.log('✅ GIF created successfully:', outputFile);
    
    // Return success with download URL
    const filename = `simple_gif_${timestamp}.gif`;
    res.json({
      success: true,
      filename: filename,
      downloadUrl: `/download/${filename}`,
      message: 'GIF created successfully'
    });

  } catch (error) {
    console.error('❌ GIF export failed:', error);
    res.status(500).json({
      success: false,
      error: 'GIF export failed',
      details: error.message
    });
  }
});

module.exports = router;
