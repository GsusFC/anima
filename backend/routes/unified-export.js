const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const execAsync = promisify(require('child_process').exec);
const { JobTypes } = require('../queues/jobTypes');
const { addJob } = require('../queues/videoQueue');

// Import transition effects mapping and helper functions
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

// Build unified transition chain for consistent transition processing
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

// Helper para resolución automática (placeholder, puedes mejorar)
async function calculateAutoResolution(images, sessionId, maxDimension = 1920) {
  return { width: maxDimension, height: maxDimension };
}

// Helper function to safely resolve file paths (Node.js Best Practice)
function resolveImagePath(sessionId, filename) {
  // Sanitize inputs to prevent directory traversal attacks
  const sanitizedSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');

  // Define possible directories where images might be stored
  const possibleDirs = [
    path.join(__dirname, '..', 'temp', sanitizedSessionId),
    path.join(__dirname, '..', 'uploads', sanitizedSessionId),
    path.join(__dirname, '..', 'uploads', 'temp', sanitizedSessionId)
  ];

  // Try to find the file in each directory
  for (const dir of possibleDirs) {
    const fullPath = path.join(dir, sanitizedFilename);
    if (fs.existsSync(fullPath)) {
      console.log(`🔍 Found image: ${sanitizedFilename} in ${dir}`);
      return fullPath;
    }
  }

  console.log(`❌ Image not found: ${sanitizedFilename} in any directory`);
  return null;
}

router.post('/:format', async (req, res) => {
  try {
    console.log('🎬 [UNIFIED EXPORT] Request received:', JSON.stringify(req.body, null, 2));
    const format = req.params.format.toLowerCase();
    const supportedFormats = ['mp4', 'webm', 'mov', 'gif'];
    if (!supportedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported format: ${format}. Supported: ${supportedFormats.join(', ')}`
      });
    }
    const {
      images,
      transitions = [],
      frameDurations = [],
      sessionId,
      fps = format === 'gif' ? 15 : 30,
      quality = 'standard'
    } = req.body;
    console.log(`🎬 [UNIFIED EXPORT] Request for ${format}, images: ${images?.length}, sessionId: ${sessionId}`);
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, error: 'No images provided' });
    }
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }
    // Force direct processing for all image counts (eliminates queue processing bottleneck)
    console.log(`🎬 [UNIFIED EXPORT] Using direct processing for ${images.length} images (forced for reliability)`);
    console.log(`🎬 [UNIFIED EXPORT] Session: ${sessionId}, Format: ${format}, Quality: ${quality}`);
    console.log(`🎬 [UNIFIED EXPORT] Transitions: ${JSON.stringify(transitions)}`);
    console.log(`🎬 [UNIFIED EXPORT] Frame durations: ${JSON.stringify(frameDurations)}`);

    if (process.env.ENABLE_DIRECT_PROCESSING !== 'false') {
      try {
        const outputDir = path.join(__dirname, '../output');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        const jobId = `direct_${Date.now()}_${uuidv4().substring(0, 8)}`;
        const outputFile = path.join(outputDir, `unified_${jobId}.${format}`);
        const inputFlags = [];
        const targetResolution = await calculateAutoResolution(images, sessionId, format === 'gif' ? 720 : 1920);
        images.forEach((img, index) => {
          const imagePath = resolveImagePath(sessionId, img.filename);
          if (!imagePath) {
            throw new Error(`Image not found: ${img.filename}`);
          }
          const duration = (frameDurations[index] || 1000) / 1000;
          inputFlags.push(`-loop 1 -t ${duration} -i "${imagePath}"`);
        });
        const scaleFilters = images.map((_, index) =>
          `[${index}:v]scale=${targetResolution.width}:${targetResolution.height}:force_original_aspect_ratio=decrease,pad=${targetResolution.width}:${targetResolution.height}:(ow-iw)/2:(oh-ih)/2[v${index}]`
        );
        let filterComplex;
        let outputOptions;
        if (format === 'gif') {
          // Use the same robust transition processing for GIFs
          let complexFilterArray = [...scaleFilters];
          const lastOutput = buildUnifiedTransitionChain(
            images.map((_, index) => ({ path: `input_${index}` })), // Mock image objects for the function
            transitions,
            frameDurations,
            1000, // Default duration in ms
            complexFilterArray
          );

          // Map the output to '[out]' and add GIF palette generation
          let videoOutput = lastOutput;
          if (lastOutput === '[outv]') {
            // Replace [outv] with [out] in the last filter
            const lastFilterIndex = complexFilterArray.length - 1;
            if (lastFilterIndex >= 0 && complexFilterArray[lastFilterIndex].includes('[outv]')) {
              complexFilterArray[lastFilterIndex] = complexFilterArray[lastFilterIndex].replace('[outv]', '[out]');
              videoOutput = '[out]';
            } else {
              // If no filter contains [outv], add a simple null filter
              complexFilterArray.push(`${lastOutput}null[out]`);
              videoOutput = '[out]';
            }
          } else if (lastOutput !== '[out]') {
            // If the function returned a different label, add a null filter to map to '[out]'
            complexFilterArray.push(`${lastOutput}null[out]`);
            videoOutput = '[out]';
          }

          // Add GIF palette generation and application
          complexFilterArray.push(`${videoOutput}split[s0][s1]`);
          complexFilterArray.push(`[s0]palettegen[p]`);
          complexFilterArray.push(`[s1][p]paletteuse[outgif]`);

          filterComplex = complexFilterArray.join(';');
          outputOptions = `-map "[outgif]" -r ${fps} -loop 0`;
        } else {
          // Use the same robust transition processing as preview and worker
          let complexFilterArray = [...scaleFilters];
          const lastOutput = buildUnifiedTransitionChain(
            images.map((_, index) => ({ path: `input_${index}` })), // Mock image objects for the function
            transitions,
            frameDurations,
            1000, // Default duration in ms
            complexFilterArray
          );

          // The buildUnifiedTransitionChain function modifies complexFilterArray and returns the final output label
          // Map the output to '[out]' for consistency with the rest of the code
          if (lastOutput === '[outv]') {
            // Replace [outv] with [out] in the last filter
            const lastFilterIndex = complexFilterArray.length - 1;
            if (lastFilterIndex >= 0 && complexFilterArray[lastFilterIndex].includes('[outv]')) {
              complexFilterArray[lastFilterIndex] = complexFilterArray[lastFilterIndex].replace('[outv]', '[out]');
            } else {
              // If no filter contains [outv], add a simple copy filter
              complexFilterArray.push(`${lastOutput}null[out]`);
            }
          } else if (lastOutput !== '[out]') {
            // If the function returned a different label, add a null filter to map to '[out]'
            complexFilterArray.push(`${lastOutput}null[out]`);
          }
          filterComplex = complexFilterArray.join(';');
          if (format === 'mp4' || format === 'mov') {
            outputOptions = `-map "[out]" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -movflags +faststart -r ${fps}`;
          } else if (format === 'webm') {
            outputOptions = `-map "[out]" -c:v libvpx-vp9 -crf 23 -b:v 0 -pix_fmt yuv420p -r ${fps}`;
          }
        }
        // Validate filter complex before execution
        if (!filterComplex || filterComplex.trim() === '') {
          throw new Error('Empty filter complex generated');
        }

        // Validate that the filter complex ends with the expected output
        const expectedOutput = format === 'gif' ? '[outgif]' : '[out]';
        if (!filterComplex.includes(expectedOutput)) {
          console.warn(`⚠️ Filter complex doesn't contain expected output ${expectedOutput}`);
        }

        const ffmpegCmd = `ffmpeg ${inputFlags.join(' ')} -filter_complex "${filterComplex}" ${outputOptions} -y "${outputFile}"`;
        console.log(`🎬 Direct FFmpeg processing command:`, ffmpegCmd);
        console.log(`🎬 Filter complex breakdown:`);
        const complexParts = filterComplex.split(';');
        complexParts.forEach((part, index) => {
          console.log(`   ${index + 1}: ${part}`);
        });

        try {
          const { stdout, stderr } = await execAsync(ffmpegCmd);
          console.log(`✅ FFmpeg completed successfully`);
          if (stderr) {
            console.log(`FFmpeg stderr: ${stderr}`);
          }
        } catch (execError) {
          console.error(`❌ FFmpeg execution failed:`, execError.message);
          console.error(`FFmpeg stderr:`, execError.stderr);
          throw execError;
        }
        return res.json({
          success: true,
          jobId: jobId,
          status: 'completed',
          message: `${format.toUpperCase()} created successfully (direct processing)`,
          downloadUrl: `/api/export/download/${jobId}`,
          isDirect: true
        });
      } catch (ffmpegError) {
        console.error(`❌ Direct ${format} processing failed:`, ffmpegError.message);
        console.error(`❌ FFmpeg stderr:`, ffmpegError.stderr || 'No stderr');
        console.error(`❌ FFmpeg stdout:`, ffmpegError.stdout || 'No stdout');

        // Log memory usage when FFmpeg fails
        const used = process.memoryUsage();
        console.log(`📊 Memory at failure: RSS: ${Math.round(used.rss / 1024 / 1024)}MB, Heap: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);

        // Return error instead of falling back to queue processing
        return res.status(500).json({
          success: false,
          error: `Failed to process ${format.toUpperCase()} export: ${ffmpegError.message}`,
          details: ffmpegError.stderr || 'No additional details available'
        });
      }
    } else {
      // Direct processing is disabled
      return res.status(503).json({
        success: false,
        error: 'Direct processing is disabled and queue processing has been removed for reliability',
        message: 'Please enable direct processing by setting ENABLE_DIRECT_PROCESSING=true'
      });
    }
  } catch (error) {
    console.error('❌ Failed to process unified export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process export',
      details: error.message
    });
  }
});

module.exports = router; 