/**
 * ExportService.js
 * 
 * Service for handling media exports (GIF, MP4, WebM, MOV) with support for 
 * transitions, quality settings, and direct/queue processing.
 */

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const execAsync = promisify(require('child_process').exec);
const ffmpeg = require('fluent-ffmpeg');

// Quality presets for different formats
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
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '2k': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 }
};

// Import transition effects mapping
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

/**
 * ExportService - Handles the business logic for media exports
 */
class ExportService {
  constructor() {
    // Initialize directories
    this.outputDir = path.join(__dirname, '../output');
    this.tempDir = path.join(__dirname, '../uploads');
    
    // Ensure directories exist
    this._ensureDirectories();
  }
  
  /**
   * Ensure required directories exist
   * 
   * @private
   */
  _ensureDirectories() {
    [this.outputDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }
  
  /**
   * Create a unified export with complex transitions and effects
   * (Renamed from createExport for clarity)
   * 
   * @param {Object} options - Export configuration options
   * @param {Array} options.images - Array of image objects to process
   * @param {Array} [options.transitions=[]] - Array of transition objects between images
   * @param {Array} [options.frameDurations=[]] - Array of durations for each frame in milliseconds
   * @param {string} options.sessionId - Unique session identifier
   * @param {string} [options.format='mp4'] - Output format (gif, mp4, webm, mov)
   * @param {string} [options.quality='standard'] - Quality preset (web, standard, high, ultra)
   * @param {string} [options.resolution='1080p'] - Resolution preset or 'auto'
   * @param {number} [options.fps=30] - Frames per second for video formats
   * @returns {Promise<Object>} - Result object with job information
   */
  async createUnifiedExport(options) {
    console.log('🎬 ExportService.createUnifiedExport called with options:', JSON.stringify(options, null, 2));
    
    try {
      // Extract and validate options
      const {
        images,
        transitions = [],
        frameDurations = [],
        sessionId,
        format = 'mp4',
        quality = 'standard',
        resolution = '1080p',
        fps = format === 'gif' ? 15 : 30
      } = options;
      
      // Basic validation
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error('No images provided');
      }
      
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      // Generate unique output filename
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      const jobId = `direct_${Date.now()}_${uuidv4().substring(0, 8)}`;
      const outputFile = path.join(this.outputDir, `unified_${jobId}.${format}`);
      
      // Validate images exist
      const validImages = [];
      for (const img of images) {
        const imagePath = this._resolveImagePath(sessionId, img.filename);
        if (imagePath) {
          validImages.push({
            ...img,
            path: imagePath
          });
        }
      }
      
      if (validImages.length === 0) {
        throw new Error('No valid images found');
      }
      
      // Sort images by selection index if available
      const sortedImages = validImages.sort((a, b) => {
        const indexA = a.selectionIndex ?? 999999;
        const indexB = b.selectionIndex ?? 999999;
        return indexA - indexB;
      });
      
      console.log(`✅ Validated ${validImages.length}/${images.length} images`);
      console.log('🔢 Images sorted by selection order:', sortedImages.map(img => `${img.filename} (${img.selectionIndex})`));
      
      // Build and execute FFmpeg command
      const ffmpegCmd = this._buildFfmpegCommand({
        images: sortedImages,
        transitions,
        frameDurations,
        format,
        quality,
        resolution,
        fps,
        outputFile
      });
      
      console.log(`🎬 Executing FFmpeg command:`, ffmpegCmd);
      
      try {
        const { stdout, stderr } = await execAsync(ffmpegCmd);
        console.log(`✅ FFmpeg completed successfully`);
        if (stderr && !stderr.includes('frame=')) {
          console.log(`FFmpeg stderr: ${stderr}`);
        }
      } catch (execError) {
        console.error(`❌ FFmpeg execution failed:`, execError.message);
        console.error(`FFmpeg stderr:`, execError.stderr);
        throw execError;
      }
      
      // Return success response
      return {
        success: true,
        jobId: jobId,
        status: 'completed',
        message: `${format.toUpperCase()} created successfully`,
        downloadUrl: `/api/export/download/${jobId}`,
        isDirect: true
      };
      
    } catch (error) {
      console.error('❌ Export service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process export',
        details: error.stderr || 'No additional details available'
      };
    }
  }
  
  /**
   * Create a simple slideshow without complex transitions
   * 
   * @param {Object} options - Export configuration options
   * @param {Array} options.images - Array of image objects to process
   * @param {Array} [options.frameDurations=[]] - Array of durations for each frame in milliseconds
   * @param {string} options.sessionId - Unique session identifier
   * @param {string} [options.format='mp4'] - Output format (gif, mp4, webm, mov)
   * @param {string} [options.quality='standard'] - Quality preset (web, standard, high, ultra)
   * @param {number} [options.fps=30] - Frames per second for video formats
   * @returns {Promise<Object>} - Result object with job information
   */
  async createSimpleSlideshow(options) {
    console.log('🎬 ExportService.createSimpleSlideshow called with options:', JSON.stringify(options, null, 2));
    
    try {
      // Extract and validate options
      const {
        images,
        frameDurations = [],
        sessionId,
        format = 'mp4',
        quality = 'standard',
        fps = format === 'gif' ? 15 : 30
      } = options;
      
      // Basic validation
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error('No images provided');
      }
      
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      // Generate unique output filename
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      const jobId = `direct_${Date.now()}_${uuidv4().substring(0, 8)}`;
      const outputFile = path.join(this.outputDir, `slideshow_${jobId}.${format}`);
      
      // Validate images exist
      const validImages = [];
      for (const img of images) {
        const imagePath = this._resolveImagePath(sessionId, img.filename);
        if (imagePath) {
          validImages.push({
            ...img,
            path: imagePath
          });
        }
      }
      
      if (validImages.length === 0) {
        throw new Error('No valid images found');
      }
      
      // Get quality settings
      const settings = format === 'mp4' || format === 'mov' 
        ? MP4_PRESETS[quality] || MP4_PRESETS.standard
        : WEBM_PRESETS[quality] || WEBM_PRESETS.standard;
      
      // Use fluent-ffmpeg for simpler processing
      return new Promise((resolve, reject) => {
        try {
          let command = ffmpeg();
          let complexFilter = [];
          const defaultDuration = 1000; // 1 second default
          
          // Add inputs with durations
          validImages.forEach((image, index) => {
            const duration = (frameDurations[index] || defaultDuration) / 1000;
            command.input(image.path).inputOptions(['-loop', '1', '-t', String(duration)]);
            
            // Scale filter for each input
            const targetRes = RESOLUTION_PRESETS['1080p']; // Default to 1080p for simple slideshow
            complexFilter.push(`[${index}:v]scale=${targetRes.width}:${targetRes.height}:force_original_aspect_ratio=decrease,pad=${targetRes.width}:${targetRes.height}:(ow-iw)/2:(oh-ih)/2[v${index}]`);
          });
          
          // Simple concat filter (no transitions)
          let concatInputs = '';
          for (let i = 0; i < validImages.length; i++) {
            concatInputs += `[v${i}]`;
          }
          complexFilter.push(`${concatInputs}concat=n=${validImages.length}:v=1:a=0[out]`);
          
          // Set output options based on format
          const outputOptions = format === 'gif' 
            ? ['-loop', '0'] 
            : [
                '-c:v', format === 'webm' ? 'libvpx-vp9' : 'libx264',
                '-preset', settings.preset || 'medium',
                '-crf', settings.crf.toString(),
                '-pix_fmt', 'yuv420p'
              ];
          
          if (format === 'mp4' || format === 'mov') {
            outputOptions.push('-movflags', '+faststart');
          }
          
          command
            .complexFilter(complexFilter)
            .outputOptions(outputOptions)
            .fps(fps)
            .output(outputFile)
            .on('start', (cmd) => {
              console.log(`🚀 FFmpeg started:`, cmd);
            })
            .on('progress', (progress) => {
              console.log(`⏳ FFmpeg progress: ${Math.round(progress.percent || 0)}%`);
            })
            .on('end', () => {
              console.log(`✅ Slideshow created successfully: ${outputFile}`);
              
              const stats = fs.statSync(outputFile);
              resolve({
                success: true,
                jobId: jobId,
                filename: path.basename(outputFile),
                outputPath: outputFile,
                size: stats.size,
                format: format,
                downloadUrl: `/api/export/download/${jobId}`
              });
            })
            .on('error', (err) => {
              console.error(`❌ FFmpeg error:`, err);
              reject(err);
            })
            .run();
            
        } catch (error) {
          reject(error);
        }
      });
      
    } catch (error) {
      console.error('❌ Simple slideshow error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create slideshow',
        details: error.stderr || 'No additional details available'
      };
    }
  }
  
  /**
   * Trim a video to specified start and end times
   * 
   * @param {Object} options - Trim configuration options
   * @param {string} options.videoPath - Path to the video file
   * @param {number} options.startTime - Start time in seconds
   * @param {number} options.endTime - End time in seconds
   * @param {string} [options.outputName] - Custom output filename
   * @param {string} options.sessionId - Unique session identifier
   * @returns {Promise<Object>} - Result object with job information
   */
  async createVideoTrim(options) {
    console.log('🎬 ExportService.createVideoTrim called with options:', JSON.stringify(options, null, 2));
    
    try {
      const { videoPath, startTime, endTime, outputName, sessionId } = options;
      
      // Validate inputs
      if (!videoPath || startTime === undefined || endTime === undefined) {
        throw new Error('Missing required fields: videoPath, startTime, endTime');
      }
      
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      // Check if video file exists
      const fullVideoPath = path.isAbsolute(videoPath) 
        ? videoPath 
        : path.join(__dirname, '..', videoPath);
      
      if (!fs.existsSync(fullVideoPath)) {
        throw new Error('Video file not found');
      }
      
      if (startTime >= endTime) {
        throw new Error('Start time must be less than end time');
      }
      
      // Create session directory if it doesn't exist
      const sessionDir = path.join(this.tempDir, sessionId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      
      // Generate output filename
      const trimmedName = outputName || `trimmed_${Date.now()}.mp4`;
      const outputPath = path.join(sessionDir, trimmedName);
      
      console.log(`🎬 Trimming video: ${fullVideoPath}`);
      console.log(`⏰ From ${startTime}s to ${endTime}s`);
      console.log(`💾 Output: ${outputPath}`);
      
      // Use fluent-ffmpeg for trimming
      return new Promise((resolve, reject) => {
        ffmpeg(fullVideoPath)
          .setStartTime(startTime)
          .setDuration(endTime - startTime)
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .on('start', (cmd) => {
            console.log(`🚀 FFmpeg started:`, cmd);
          })
          .on('progress', (progress) => {
            console.log(`⏳ Trim progress: ${Math.round(progress.percent || 0)}%`);
          })
          .on('end', () => {
            console.log(`✅ Video trimmed successfully`);
            
            // Get file stats
            const stats = fs.statSync(outputPath);
            
            resolve({
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
            console.error(`❌ Trim error:`, err);
            reject(err);
          })
          .run();
      });
      
    } catch (error) {
      console.error('❌ Video trim error:', error);
      return {
        success: false,
        error: error.message || 'Failed to trim video',
        details: error.stderr || 'No additional details available'
      };
    }
  }
  
  /**
   * Convert a video from one format to another
   * 
   * @param {Object} options - Conversion configuration options
   * @param {string} options.inputPath - Path to the input file
   * @param {string} options.outputFormat - Target format (mp4, webm, mov, gif)
   * @param {string} [options.quality='standard'] - Quality preset (web, standard, high, ultra)
   * @param {number} [options.fps=30] - Frames per second for output
   * @returns {Promise<Object>} - Result object with job information
   */
  async createFormatConversion(options) {
    console.log('🎬 ExportService.createFormatConversion called with options:', JSON.stringify(options, null, 2));
    
    try {
      const { inputPath, outputFormat, quality = 'standard', fps = 30 } = options;
      
      // Validate inputs
      if (!inputPath || !outputFormat) {
        throw new Error('Input path and output format are required');
      }
      
      // Check if input file exists
      const fullInputPath = path.isAbsolute(inputPath) 
        ? inputPath 
        : path.join(__dirname, '..', inputPath);
      
      if (!fs.existsSync(fullInputPath)) {
        throw new Error('Input file not found');
      }
      
      // Generate output filename
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      const jobId = `convert_${Date.now()}_${uuidv4().substring(0, 8)}`;
      const outputFile = path.join(this.outputDir, `converted_${jobId}.${outputFormat}`);
      
      // Get quality settings based on format
      const settings = outputFormat === 'webm'
        ? WEBM_PRESETS[quality] || WEBM_PRESETS.standard
        : MP4_PRESETS[quality] || MP4_PRESETS.standard;
      
      // Use fluent-ffmpeg for conversion
      return new Promise((resolve, reject) => {
        let command = ffmpeg(fullInputPath);
        
        // Set output options based on format
        if (outputFormat === 'gif') {
          // Special handling for GIF
          command
            .outputOptions([
              '-vf', `fps=${fps},scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
              '-loop', '0'
            ]);
        } else if (outputFormat === 'webm') {
          command
            .videoCodec('libvpx-vp9')
            .outputOptions([
              '-crf', settings.crf.toString(),
              '-b:v', settings.maxBitrate,
              '-pix_fmt', 'yuv420p'
            ]);
        } else {
          // MP4 or MOV
          command
            .videoCodec('libx264')
            .outputOptions([
              '-preset', settings.preset,
              '-crf', settings.crf.toString(),
              '-pix_fmt', 'yuv420p',
              '-movflags', '+faststart'
            ]);
        }
        
        command
          .fps(fps)
          .output(outputFile)
          .on('start', (cmd) => {
            console.log(`🚀 FFmpeg started:`, cmd);
          })
          .on('progress', (progress) => {
            console.log(`⏳ Conversion progress: ${Math.round(progress.percent || 0)}%`);
          })
          .on('end', () => {
            console.log(`✅ Format conversion completed successfully`);
            
            // Get file stats
            const stats = fs.statSync(outputFile);
            
            resolve({
              success: true,
              jobId: jobId,
              filename: path.basename(outputFile),
              outputPath: outputFile,
              size: stats.size,
              format: outputFormat,
              downloadUrl: `/api/export/download/${jobId}`
            });
          })
          .on('error', (err) => {
            console.error(`❌ Conversion error:`, err);
            reject(err);
          })
          .run();
      });
      
    } catch (error) {
      console.error('❌ Format conversion error:', error);
      return {
        success: false,
        error: error.message || 'Failed to convert format',
        details: error.stderr || 'No additional details available'
      };
    }
  }

  /**
   * Build the complete FFmpeg command for the export
   * 
   * @private
   * @param {Object} options - Export configuration options
   * @returns {string} - Complete FFmpeg command string
   */
  _buildFfmpegCommand(options) {
    const {
      images,
      transitions,
      frameDurations,
      format,
      quality,
      resolution,
      fps,
      outputFile
    } = options;
    
    // Generate input flags for all images
    const inputFlags = [];
    images.forEach((img, index) => {
      const duration = (frameDurations[index] || 1000) / 1000; // Convert to seconds
      inputFlags.push(`-loop 1 -t ${duration} -i "${img.path}"`);
    });
    
    // Build filter complex
    const filterComplex = this._buildFilterComplex(options);
    
    // Determine output options based on format
    let outputOptions;
    if (format === 'gif') {
      outputOptions = `-map "[outgif]" -r ${fps} -loop 0`;
    } else if (format === 'mp4' || format === 'mov') {
      outputOptions = `-map "[out]" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -movflags +faststart -r ${fps}`;
    } else if (format === 'webm') {
      outputOptions = `-map "[out]" -c:v libvpx-vp9 -crf 23 -b:v 0 -pix_fmt yuv420p -r ${fps}`;
    }
    
    // Return complete command
    return `ffmpeg ${inputFlags.join(' ')} -filter_complex "${filterComplex}" ${outputOptions} -y "${outputFile}"`;
  }

  /**
   * Build the FFmpeg filter_complex string for the export
   * 
   * @private
   * @param {Object} options - Export configuration options
   * @returns {string} - FFmpeg filter_complex string
   */
  _buildFilterComplex(options) {
    const {
      images,
      transitions,
      frameDurations,
      format,
      resolution
    } = options;
    
    // Determine target resolution
    const targetResolution = this._calculateResolution(resolution, format);
    
    // Generate scale filters for each input
    const scaleFilters = images.map((_, index) =>
      `[${index}:v]scale=${targetResolution.width}:${targetResolution.height}:force_original_aspect_ratio=decrease,pad=${targetResolution.width}:${targetResolution.height}:(ow-iw)/2:(oh-ih)/2[v${index}]`
    );
    
    // Start with scale filters
    let complexFilterArray = [...scaleFilters];
    
    // Build transition chain
    const lastOutput = this._buildUnifiedTransitionChain(
      images,
      transitions,
      frameDurations,
      1000, // Default duration in ms
      complexFilterArray
    );
    
    // Map the output to '[out]' for consistency
    if (lastOutput === '[outv]') {
      // Replace [outv] with [out] in the last filter
      const lastFilterIndex = complexFilterArray.length - 1;
      if (lastFilterIndex >= 0 && complexFilterArray[lastFilterIndex].includes('[outv]')) {
        complexFilterArray[lastFilterIndex] = complexFilterArray[lastFilterIndex].replace('[outv]', '[out]');
      } else {
        // If no filter contains [outv], add a simple null filter
        complexFilterArray.push(`${lastOutput}null[out]`);
      }
    } else if (lastOutput !== '[out]') {
      // If the function returned a different label, add a null filter to map to '[out]'
      complexFilterArray.push(`${lastOutput}null[out]`);
    }
    
    // Add GIF-specific filters if needed
    if (format === 'gif') {
      complexFilterArray.push(`[out]split[s0][s1]`);
      complexFilterArray.push(`[s0]palettegen[p]`);
      complexFilterArray.push(`[s1][p]paletteuse[outgif]`);
    }
    
    // Join all filters with semicolons
    return complexFilterArray.join(';');
  }

  /**
   * Build unified transition chain for consistent transition processing
   * 
   * @private
   * @param {Array} validImages - Array of validated image objects
   * @param {Array} transitions - Array of transition objects
   * @param {Array} frameDurations - Array of frame durations in milliseconds
   * @param {number} defaultDuration - Default duration in milliseconds
   * @param {Array} complexFilter - Array of filter strings to append to
   * @returns {string} - Label of the last output in the chain
   */
  _buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter) {
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

    console.log(`🎞️ Starting transition chain for ${validImages.length} images`);
    console.log(`🎞️ Frame durations:`, frameDurations.map((d, i) => `${i}: ${d}ms`));

    for (let i = 0; i < validImages.length - 1; i++) {
      const currentFrameDuration = (frameDurations[i] || defaultDuration) / 1000;
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

      // Add current frame duration to total time
      totalVideoTime += currentFrameDuration;

      // Correct offset calculation: transition starts at end of current frame minus transition duration
      const offset = Math.max(totalVideoTime - transitionDuration, 0);

      const xfadeFilter = `${lastOutput}${nextInput}xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset}${outputLabel}`;
      console.log(`🎞️ Frame ${i}->${i+1}: duration=${currentFrameDuration}s, total=${totalVideoTime}s, transition=${transitionDuration}s, offset=${offset}s`);
      console.log(`🎞️ XFade filter: ${xfadeFilter}`);
      complexFilter.push(xfadeFilter);
      lastOutput = outputLabel;
    }
    
    console.log(`Total xfade transitions processed: ${validImages.length - 1}, final output: ${lastOutput}`);
    return lastOutput;
  }

  /**
   * Calculate target resolution based on format and resolution setting
   * 
   * @private
   * @param {string} resolution - Resolution preset or 'auto'
   * @param {string} format - Output format
   * @returns {Object} - Width and height object
   */
  _calculateResolution(resolution, format) {
    // For GIF, use smaller resolution by default
    if (format === 'gif') {
      return { width: 800, height: 600 };
    }
    
    // Use preset if available
    if (RESOLUTION_PRESETS[resolution]) {
      return RESOLUTION_PRESETS[resolution];
    }
    
    // Default to 1080p
    return { width: 1920, height: 1080 };
  }

  /**
   * Resolve image paths safely
   * 
   * @private
   * @param {string} sessionId - Session identifier
   * @param {string} filename - Image filename
   * @returns {string|null} - Full path to the image or null if not found
   */
  _resolveImagePath(sessionId, filename) {
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
}

module.exports = new ExportService();
