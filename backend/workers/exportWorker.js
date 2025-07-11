const { Worker } = require('bullmq');
// const ffmpegWasm = require('../utils/ffmpeg-wasm'); // Disabled - using native FFmpeg
const path = require('path');
const fs = require('fs');
const { createRedisConnection } = require('../utils/redis');
const { JobTypes } = require('../queues/jobTypes');
const ffmpeg = require('fluent-ffmpeg');

// Note: FilterGraph import removed - implementing GIF export directly

async function processUnifiedExport(job, data) {
  try {
    console.log(`🎬 [WORKER] processUnifiedExport: Job ${job.id}`);
    console.log('�� Data:', data);
    const {
      images,
      transitions = [],
      frameDurations = [],
      sessionId,
      format = 'mp4',
      fps = 30,
      quality = 'standard'
    } = data;
    job.updateProgress(5);
    console.log(`🎬 [UNIFIED EXPORT] Processing ${images?.length} images to ${format}, quality: ${quality}`);
    console.log(`🎬 [UNIFIED EXPORT] Transitions:`, transitions);
    console.log(`🎬 [UNIFIED EXPORT] Frame durations:`, frameDurations);

    // Buscar imágenes en uploads y, si no existen, en temp
    const validImages = images.map(img => {
      const uploadPath = path.join(__dirname, '../uploads', sessionId, img.filename);
      const tempPath = path.join(__dirname, '../temp', sessionId, img.filename);
      if (fs.existsSync(uploadPath)) {
        return { ...img, path: uploadPath };
      } else if (fs.existsSync(tempPath)) {
        return { ...img, path: tempPath };
      } else {
        console.error(`❌ Image not found in uploads or temp: ${img.filename}`);
        return null;
      }
    }).filter(Boolean);
    if (validImages.length === 0) throw new Error('No valid images found for export');

    // Verificar que las imágenes existen
    for (let i = 0; i < validImages.length; i++) {
      if (!fs.existsSync(validImages[i].path)) {
        console.error(`❌ Image not found: ${validImages[i].path}`);
      }
    }

    const outputFilename = `unified_${job.id}_${Date.now()}.${format}`;
    const outputPath = path.join(__dirname, '../output', outputFilename);
    const defaultDuration = 1000;
    const qualityMap = {
      web: { crf: 28, preset: 'fast', bitrate: '1M' },
      standard: { crf: 23, preset: 'medium', bitrate: '2M' },
      high: { crf: 18, preset: 'slow', bitrate: '4M' },
      ultra: { crf: 15, preset: 'veryslow', bitrate: '8M' }
    };
    const settings = qualityMap[quality] || qualityMap.standard;
    const width = format === 'gif' ? 720 : 1920;
    const height = format === 'gif' ? 720 : 1080;
    job.updateProgress(10);
    return new Promise((resolve, reject) => {
      try {
        let command = ffmpeg();
        let complexFilter = [];
        // Duraciones de entrada
        const durationCalc = frameDurations.length === validImages.length
          ? { inputDurations: frameDurations.map(d => d / 1000) }
          : { inputDurations: Array(validImages.length).fill(defaultDuration / 1000) };
        job.updateProgress(20);
        validImages.forEach((image, index) => {
          const inputDuration = durationCalc.inputDurations[index];
          command.input(image.path).inputOptions(['-loop', '1', '-t', String(inputDuration)]);
          complexFilter.push(`[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${fps}[v${index}]`);
        });
        job.updateProgress(30);
        let lastOutput;
        if (format === 'gif') {
          // Always use transition logic for GIFs regardless of image count
          lastOutput = buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter);
        } else {
          // Use transition logic for videos
          lastOutput = buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter);
        }
        job.updateProgress(40);
        let outputOptions;
        if (format === 'gif') {
          complexFilter.push(`${lastOutput}split[s0][s1]`);
          complexFilter.push('[s0]palettegen=max_colors=256[p]');
          complexFilter.push('[s1][p]paletteuse=dither=bayer:bayer_scale=5[outgif]');
          lastOutput = '[outgif]';
          outputOptions = ['-loop', '0'];
        } else if (format === 'mp4' || format === 'mov') {
          outputOptions = [
            '-c:v', 'libx264',
            '-preset', settings.preset,
            '-crf', settings.crf,
            '-b:v', settings.bitrate,
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart'
          ];
        } else if (format === 'webm') {
          outputOptions = [
            '-c:v', 'libvpx-vp9',
            '-crf', settings.crf,
            '-b:v', settings.bitrate,
            '-pix_fmt', 'yuv420p'
          ];
        }
        job.updateProgress(50);
        command
          .complexFilter(complexFilter)
          .map(lastOutput)
          .outputOptions(outputOptions)
          .output(outputPath)
          .on('start', (cmd) => {
            console.log(`🚀 FFmpeg started for job ${job.id}:`, cmd);
          })
          .on('progress', async (progress) => {
            const percent = Math.min(50 + (progress.percent || 0) * 0.5, 99);
            job.updateProgress(percent);
          })
          .on('end', async () => {
            job.updateProgress(100);
            const stats = fs.statSync(outputPath);
            // Solo guardar el resultado vía resolve, BullMQ lo almacena como returnvalue
            resolve({
              success: true,
              filename: outputFilename,
              outputPath,
              size: stats.size,
              format
            });
          })
          .on('error', (error) => {
            console.error(`❌ FFmpeg error for job ${job.id}:`, error);
            reject(error);
          })
          .run();
      } catch (error) {
        reject(error);
      }
    });
  } catch (err) {
    console.error(`❌ [WORKER] Error in processUnifiedExport (Job ${job.id}):`);
    console.error(err && err.stack ? err.stack : err);
    throw err;
  }
}

// Lógica de transición robusta (mejorada para procesar todas las imágenes)
function buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter) {
  if (validImages.length === 1) return '[v0]';
  
  console.log('🎞️ Building transition chain:', {
    images: validImages.length,
    transitions: transitions.map((t, i) => `${i}: ${t?.type || 'cut'}:${t?.duration || 0}ms`),
    frameDurations
  });
  
  // Check if we have any real transitions
  const hasRealTransitions = transitions.some(t => 
    t && t.type && t.type !== 'none' && t.type !== 'cut' && (t.duration || 0) > 0);
  
  // If no real transitions, use simple concat
  if (!hasRealTransitions) {
    let concatInputs = '';
    for (let i = 0; i < validImages.length; i++) {
      concatInputs += `[v${i}]`;
    }
    const concatFilter = `${concatInputs}concat=n=${validImages.length}:v=1:a=0[outv]`;
    complexFilter.push(concatFilter);
    console.log(`🎞️ Using simple concat: ${concatFilter}`);
    return '[outv]';
  }
  
  // Build transition chain with xfade
  let lastLabel = '[v0]';
  let cumulativeTime = (frameDurations[0] || defaultDuration) / 1000;
  
  console.log(`🎞️ Starting with cumulativeTime: ${cumulativeTime}s`);
  
  for (let i = 0; i < validImages.length - 1; i++) {
    const nextLabel = `[v${i + 1}]`;
    const trans = transitions[i] || { type: 'cut', duration: 0 };
    
    // Ensure minimum duration for transitions
    const transDurSec = (trans.type && !['none', 'cut'].includes(trans.type))
      ? Math.max((trans.duration || 0) / 1000, 0.2)
      : 0.001;
    
    const effect = (trans.type && transitionEffects[trans.type])
      ? transitionEffects[trans.type]
      : 'fade';
    
    // Fix offset calculation to ensure all frames are included
    const offset = Math.max(cumulativeTime - transDurSec, 0);
    const outLabel = i === validImages.length - 2 ? '[outv]' : `[x${i}]`;
    
    console.log(`🎞️ Transition ${i}: ${trans.type} -> ${effect}, duration: ${transDurSec}s, offset: ${offset}s`);
    
    const filterCommand = `${lastLabel}${nextLabel}xfade=transition=${effect}:duration=${transDurSec}:offset=${offset}${outLabel}`;
    complexFilter.push(filterCommand);
    
    lastLabel = outLabel;
    
    // Update cumulative time correctly
    if (i + 1 < frameDurations.length) {
      const nextDuration = (frameDurations[i + 1] || defaultDuration) / 1000;
      cumulativeTime += nextDuration;
      console.log(`🎞️ Added duration for frame ${i+1}: ${nextDuration}s, new cumulativeTime: ${cumulativeTime}s`);
    }
  }
  
  return lastLabel;
}

// Unificar el mapa de transiciones global
const transitionEffects = {
  none: 'fade',
  cut: 'fade',
  fade: 'fade',
  fadeblack: 'fadeblack',
  fadewhite: 'fadewhite',
  dissolve: 'dissolve',
  slideleft: 'slideleft',
  slideright: 'slideright',
  slideup: 'slideup',
  slidedown: 'slidedown',
  wipeleft: 'wipeleft',
  wiperight: 'wiperight',
  wipeup: 'wipeup',
  wipedown: 'wipedown',
  wipetl: 'wipetl',
  wipetr: 'wipetr',
  wipebl: 'wipebl',
  wipebr: 'wipebr',
  smoothleft: 'smoothleft',
  smoothright: 'smoothright',
  smoothup: 'smoothup',
  smoothdown: 'smoothdown',
  circlecrop: 'circlecrop',
  rectcrop: 'rectcrop',
  circleopen: 'circleopen',
  circleclose: 'circleclose',
  zoomin: 'zoomin',
  zoomout: 'zoomin', // fallback
  radial: 'circleclose', // fallback
  pixelize: 'pixelize',
  hblur: 'hblur',
  vblur: 'hblur', // fallback
  distance: 'distance',
  fadefast: 'fade',
  fadeslow: 'fade',
  diagtl: 'diagtl',
  diagtr: 'diagtr',
  diagbl: 'diagbl',
  diagbr: 'diagbr',
  hlslice: 'hlslice',
  hrslice: 'hrslice',
  vuslice: 'vuslice',
  vdslice: 'vdslice'
};

class ExportWorker {
  constructor() {
    this.connection = createRedisConnection();
    this.outputDir = path.join(__dirname, '..', process.env.OUTPUT_DIR || 'output');
    this.tempDir = path.join(__dirname, '..', process.env.TEMP_DIR || 'uploads');
    this.compositionsDir = path.join(__dirname, '..', 'compositions');
    this.logsDir = path.join(__dirname, '..', 'logs');
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Quality presets
    this.qualityPresets = {
      web: { width: 720, height: 480, fps: 24, bitrate: '1M', crf: 28 },
      standard: { width: 1280, height: 720, fps: 30, bitrate: '2M', crf: 23 },
      high: { width: 1920, height: 1080, fps: 30, bitrate: '4M', crf: 20 },
      premium: { width: 1920, height: 1080, fps: 60, bitrate: '8M', crf: 18 },
      ultra: { width: 3840, height: 2160, fps: 60, bitrate: '20M', crf: 16 }
    };

    // Transition effects mapping (FFmpeg xfade compatible)
    this.transitionEffects = {
      none: 'fade',  // Use fade with minimal duration instead of 'none'
      cut: 'fade',   // Use fade with minimal duration instead of 'none'
      fade: 'fade',
      fadeblack: 'fadeblack',
      fadewhite: 'fadewhite', 
      dissolve: 'dissolve',
      slideleft: 'slideleft',
      slideright: 'slideright',
      slideup: 'slideup',
      slidedown: 'slidedown',
      wipeleft: 'wipeleft',
      wiperight: 'wiperight',
      wipeup: 'wipeup',
      wipedown: 'wipedown',
      wipetl: 'wipetl',
      wipetr: 'wipetr',
      wipebl: 'wipebl',
      wipebr: 'wipebr',
      smoothleft: 'smoothleft',
      smoothright: 'smoothright',
      smoothup: 'smoothup',
      smoothdown: 'smoothdown',
      circlecrop: 'circlecrop',
      rectcrop: 'rectcrop',
      circleopen: 'circleopen',
      circleclose: 'circleclose',
      horzopen: 'horzopen',
      horzclose: 'horzclose',
      vertopen: 'vertopen',
      vertclose: 'vertclose',
      diagbl: 'diagbl',
      diagbr: 'diagbr',
      diagtl: 'diagtl',
      diagtr: 'diagtr',
      radial: 'radial',
      pixelize: 'pixelize',
      distance: 'distance',
      squeezev: 'squeezev',
      squeezeh: 'squeezeh',
      zoomin: 'zoomin',
      coverleft: 'coverleft',
      coverright: 'coverright',
      coverup: 'coverup',
      coverdown: 'coverdown',
      revealleft: 'revealleft',
      revealright: 'revealright',
      revealup: 'revealup',
      revealdown: 'revealdown',
      hlwind: 'hlwind',
      hrwind: 'hrwind',
      vuwind: 'vuwind',
      vdwind: 'vdwind',
      hlslice: 'hlslice',
      hrslice: 'hrslice',
      vuslice: 'vuslice',
      vdslice: 'vdslice',
      fadegrays: 'fadegrays',
      hblur: 'hblur',

      // Legacy compatibility mappings
      slide: 'slideleft', // Map legacy 'slide' to 'slideleft'
      zoom: 'zoomin'      // Map legacy 'zoom' to 'zoomin'
    };

    this.worker = new Worker('video-processing', this.processJob.bind(this), {
      connection: this.connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 2,
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 }
    });

    this.setupEventHandlers();

    // Ensure logs directory
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  ensureDirectories() {
    [this.outputDir, this.tempDir, this.compositionsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }

  setupEventHandlers() {
    this.worker.on('ready', () => {
      console.log('✅ Export worker ready');
    });

    this.worker.on('error', (error) => {
      console.error('❌ Export worker error:', error);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`❌ Job ${job.id} failed:`, error.message);
    });

    this.worker.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed:`, result.filename);
    });
    this.worker.on('active', (job) => {
      console.log(`🚀 [WORKER] Job started: ${job.id}, type: ${job.name}`);
      console.log('🔍 Job data:', job.data);
    });
    this.worker.on('error', (err) => {
      console.error('❌ [WORKER] Uncaught worker error:');
      console.error(err && err.stack ? err.stack : err);
    });
  }

  async processJob(job) {
    const type = job.name;
    const data = job.data;
    
    try {
      console.log(`🔄 Processing job ${job.id}: ${type}`);
      
      job.updateProgress(20);
      
      switch (type) {
        case JobTypes.SLIDESHOW_EXPORT:
          return await this.processSlideshowExport(job, data);
        
        case JobTypes.VIDEO_EXPORT:
          return await this.processVideoExport(job, data);
        
        case JobTypes.VIDEO_TRIM:
          return await this.processVideoTrim(job, data);
        
        case JobTypes.GIF_EXPORT:
          return await this.processGifExport(job, data);
        
        case JobTypes.FORMAT_CONVERSION:
          return await this.processFormatConversion(job, data);
        
        case 'unified_export':
        case JobTypes.UNIFIED_EXPORT:
          return await processUnifiedExport(job, data);
        
        default:
          throw new Error(`Unknown job type: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Job ${job.id} processing failed:`, error.message);
      // Write error log
      try {
        const logPath = path.join(this.logsDir, `job_${job.id}.log`);
        fs.writeFileSync(logPath, `[${new Date().toISOString()}] ${error.stack || error.message}`);
      } catch (logErr) {
        console.warn('Could not write job error log:', logErr.message);
      }
      await job.moveToFailed({ message: error.message });
      throw error;
    }
  }

  async processSlideshowExport(job, data) {
    const {
      images,
      transitions = [],
      frameDurations = [],
      quality = 'standard',
      sessionId,
      format = 'mp4'
    } = data;

    job.updateProgress(5);

    // Validate images
    const validImages = this.validateImages(images, sessionId);
    if (validImages.length === 0) {
      throw new Error('No valid images found');
    }

    const outputFilename = `slideshow_${job.id}_${Date.now()}.${format}`;
    const outputPath = path.join(this.outputDir, outputFilename);
    const settings = this.qualityPresets[quality] || this.qualityPresets.standard;
    const defaultDuration = 1000;

    job.updateProgress(10);

    return new Promise((resolve, reject) => {
      try {
        let command = ffmpeg();
        let complexFilter = [];

        // Calculate input durations
        const durationCalc = this.calculateInputDurations(validImages, transitions, frameDurations, defaultDuration);
        
        job.updateProgress(20);

        // Add inputs with optimized durations
        validImages.forEach((image, index) => {
          const inputDuration = durationCalc.inputDurations[index];
          command.input(image.path).inputOptions(['-loop', '1', '-t', String(inputDuration)]);
          complexFilter.push(`[${index}:v]scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${settings.fps}[v${index}]`);
        });

        job.updateProgress(30);

        // Build transition chain
        const lastOutput = this.buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter);

        const outputOptions = format === 'mp4' ? [
          '-c:v libx264',
          '-preset fast',
          '-profile:v baseline',
          `-crf ${settings.crf}`,
          `-b:v ${settings.bitrate}`,
          '-pix_fmt yuv420p',
          '-movflags +faststart'
        ] : [
          '-c:v libvpx-vp9',
          '-preset fast',
          `-crf ${settings.crf}`,
          `-b:v ${settings.bitrate}`,
          '-pix_fmt yuv420p'
        ];

        command
          .complexFilter(complexFilter)
          .outputOptions(outputOptions)
          .map(lastOutput)
          .output(outputPath)
          .on('start', (cmd) => {
            console.log(`🚀 FFmpeg started for job ${job.id}:`, cmd);
          })
          .on('progress', (progress) => {
            const percent = Math.min(30 + (progress.percent || 0) * 0.7, 99);
            job.updateProgress(percent);
          })
          .on('end', () => {
            try {
              console.log(`✅ FFmpeg finished for job ${job.id}`);
              // Cleanup temp files
              validImages.forEach(image => {
                try {
                  if (fs.existsSync(image.path)) {
                    fs.unlinkSync(image.path);
                  }
                } catch (cleanupErr) {
                  console.warn(`⚠️ Could not clean up temp file ${image.path}:`, cleanupErr.message);
                }
              });
              job.updateProgress(100);
              resolve({ 
                success: true, 
                filename: outputFilename,
                path: outputPath 
              });
            } catch (endError) {
              console.error(`❌ Error during FFmpeg 'end' event for job ${job.id}:`, endError);
              reject(endError);
            }
          })
          .on('error', (err, stdout, stderr) => {
            console.error(`❌ FFmpeg error for job ${job.id}:`, err.message);
            console.error('FFmpeg stdout:', stdout);
            console.error('FFmpeg stderr:', stderr);
            reject(new Error(`FFmpeg error: ${err.message}`));
          })
          .run();

      } catch (err) {
        console.error(`❌ Unexpected error in slideshow export for job ${job.id}:`, err);
        reject(err);
      }
    });
  }

  async processVideoExport(job, data) {
    const {
      videoPath,
      startTime,
      endTime,
      quality = 'standard',
      resolution,
      fps = 30,
      format = 'mp4'
    } = data;

    job.updateProgress(5);

    if (!fs.existsSync(videoPath)) {
      throw new Error('Video file not found');
    }

    const outputFilename = `video_${job.id}_${Date.now()}.${format}`;
    const outputPath = path.join(this.outputDir, outputFilename);

    job.updateProgress(10);

    return new Promise((resolve, reject) => {
      try {
        const qualityMap = {
          web: { crf: 28, preset: 'fast', scale: '1280:720' },
          standard: { crf: 23, preset: 'medium', scale: '1920:1080' },
          high: { crf: 18, preset: 'slow', scale: '1920:1080' },
          ultra: { crf: 15, preset: 'veryslow', scale: '3840:2160' }
        };

        const settings = qualityMap[quality] || qualityMap.standard;
        let command = ffmpeg(videoPath);

        // Apply trimming if specified
        if (typeof startTime === 'number' && typeof endTime === 'number') {
          const duration = endTime - startTime;
          command.seekInput(startTime).duration(duration);
        }

        // Apply resolution
        if (resolution && resolution.width && resolution.height) {
          command.size(`${resolution.width}x${resolution.height}`);
        } else if (settings.scale) {
          command.size(settings.scale);
        }

        const outputOptions = format === 'mp4' ? [
          '-preset', settings.preset,
          '-crf', settings.crf.toString(),
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        ] : format === 'webm' ? [
          '-c:v', 'libvpx-vp9',
          '-preset', settings.preset,
          '-crf', settings.crf.toString(),
          '-pix_fmt', 'yuv420p'
        ] : [
          '-c:v', 'libx264',
          '-preset', settings.preset,
          '-crf', settings.crf.toString(),
          '-pix_fmt', 'yuv420p'
        ];

        command
          .fps(fps)
          .videoCodec(format === 'webm' ? 'libvpx-vp9' : 'libx264')
          .audioCodec(format === 'webm' ? 'libvorbis' : 'aac')
          .outputOptions(outputOptions)
          .output(outputPath)
          .on('start', (cmd) => {
            console.log(`🚀 FFmpeg started for job ${job.id}:`, cmd);
          })
          .on('progress', async (progress) => {
            const percent = Math.min(10 + (progress.percent || 0) * 0.9, 99);
            job.updateProgress(percent);
          })
          .on('end', async () => {
            job.updateProgress(100);
            
            const stats = fs.statSync(outputPath);
            resolve({
              success: true,
              filename: outputFilename,
              outputPath,
              size: stats.size,
              format
            });
          })
          .on('error', (error) => {
            console.error(`❌ FFmpeg error for job ${job.id}:`, error);
            reject(error);
          })
          .run();

      } catch (error) {
        reject(error);
      }
    });
  }

  async processVideoTrim(job, data) {
    const {
      videoPath,
      startTime,
      endTime,
      outputName,
      sessionId
    } = data;

    job.updateProgress(5);

    if (!fs.existsSync(videoPath)) {
      throw new Error('Video file not found');
    }

    const sessionDir = path.join(this.tempDir, sessionId);
    const trimmedName = outputName || `trimmed_${Date.now()}.mp4`;
    const outputPath = path.join(sessionDir, trimmedName);

    // Ensure session directory exists
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    job.updateProgress(10);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .on('start', (cmd) => {
          console.log(`🚀 FFmpeg started for job ${job.id}:`, cmd);
        })
        .on('progress', async (progress) => {
          const percent = Math.min(10 + (progress.percent || 0) * 0.9, 99);
          job.updateProgress(percent);
        })
        .on('end', async () => {
          job.updateProgress(100);
          
          const stats = fs.statSync(outputPath);
          resolve({
            success: true,
            filename: trimmedName,
            outputPath,
            size: stats.size,
            duration: endTime - startTime
          });
        })
        .on('error', (error) => {
          console.error(`❌ FFmpeg error for job ${job.id}:`, error);
          reject(error);
        })
        .run();
    });
  }

  async processGifExport(job, data) {
    const {
      images,
      transitions = [],
      frameDurations = [],
      sessionId,
      fps = 24,
      quality = 'standard'
    } = data;

    job.updateProgress(5);

    // LOG: Imágenes recibidas
    console.log('🟣 [WORKER GIF] Imágenes recibidas:', images?.length, 'sessionId:', sessionId);
    if (Array.isArray(images)) {
      images.forEach((img, idx) => {
        console.log(`    [${idx}] filename:`, img.filename, 'id:', img.id);
      });
    }

    const validImages = this.validateImages(images, sessionId);
    // LOG: Imágenes válidas tras validación
    console.log('🟣 [WORKER GIF] Imágenes válidas tras validación:', validImages.length);
    validImages.forEach((img, idx) => {
      console.log(`    [${idx}] path: ${img.path}  (existe: ${fs.existsSync(img.path)})`);
    });
    if (validImages.length !== images.length) {
      console.warn('⚠️ [WORKER GIF] ¡Alerta! No todas las imágenes existen en disco.');
    }

    if (validImages.length === 0) {
      throw new Error('No valid images found');
    }

    const outputFilename = `animation_${job.id}_${Date.now()}.gif`;
    const outputPath = path.join(this.outputDir, outputFilename);

    job.updateProgress(10);

    return new Promise((resolve, reject) => {
      try {
        let command = ffmpeg();
        let complexFilter = [];
        
        // Build simple GIF export without complex transitions
        validImages.forEach((image, index) => {
          const duration = (frameDurations[index] || 1000) / 1000;
          command.input(image.path).inputOptions(['-loop', '1', '-t', String(duration)]);
          
          // Scale and prepare each image for GIF
          complexFilter.push(`[${index}:v]scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2,fps=${fps}[v${index}]`);
        });

        // Concatenate all images for GIF
        let concatInput = '';
        for (let i = 0; i < validImages.length; i++) {
          concatInput += `[v${i}]`;
        }
        complexFilter.push(`${concatInput}concat=n=${validImages.length}:v=1:a=0[outv]`);

        job.updateProgress(30);

        command
          .complexFilter(complexFilter)
          .outputOptions([
            '-f gif',
            '-loop 0'
          ])
          .map('[outv]')
          .output(outputPath)
          .on('start', (cmd) => {
            console.log(`🚀 FFmpeg started for job ${job.id}:`, cmd);
          })
          .on('progress', async (progress) => {
            const percent = Math.min(30 + (progress.percent || 0) * 0.7, 99);
            job.updateProgress(percent);
          })
          .on('end', async () => {
            job.updateProgress(100);
            
            const stats = fs.statSync(outputPath);
            resolve({
              success: true,
              filename: outputFilename,
              outputPath,
              size: stats.size,
              format: 'gif'
            });
          })
          .on('error', (error) => {
            console.error(`❌ FFmpeg error for job ${job.id}:`, error);
            reject(error);
          })
          .run();

      } catch (error) {
        reject(error);
      }
    });
  }

  async processFormatConversion(job, data) {
    const {
      inputPath,
      outputFormat,
      quality = 'standard',
      fps = 30
    } = data;

    job.updateProgress(5);

    if (!fs.existsSync(inputPath)) {
      throw new Error('Input file not found');
    }

    const outputFilename = `converted_${job.id}_${Date.now()}.${outputFormat}`;
    const outputPath = path.join(this.outputDir, outputFilename);

    job.updateProgress(10);

    return new Promise((resolve, reject) => {
      const settings = this.qualityPresets[quality] || this.qualityPresets.standard;
      
      let command = ffmpeg(inputPath);

      const outputOptions = this.getOutputOptionsForFormat(outputFormat, settings);

      command
        .fps(fps)
        .outputOptions(outputOptions)
        .output(outputPath)
        .on('start', (cmd) => {
          console.log(`🚀 FFmpeg started for job ${job.id}:`, cmd);
        })
        .on('progress', async (progress) => {
          const percent = Math.min(10 + (progress.percent || 0) * 0.9, 99);
          job.updateProgress(percent);
        })
        .on('end', async () => {
          job.updateProgress(100);
          
          const stats = fs.statSync(outputPath);
          resolve({
            success: true,
            filename: outputFilename,
            outputPath,
            size: stats.size,
            format: outputFormat
          });
        })
        .on('error', (error) => {
          console.error(`❌ FFmpeg error for job ${job.id}:`, error);
          reject(error);
        })
        .run();
    });
  }

  // Helper methods (extracted from main server)
  validateImages(images, sessionId) {
    return images.map(img => {
      const imagePath = path.join(this.tempDir, sessionId, img.filename);
      const exists = fs.existsSync(imagePath);
      return exists ? { ...img, path: imagePath } : null;
    }).filter(Boolean);
  }

  calculateInputDurations(validImages, transitions, frameDurations, defaultDuration) {
    const inputDurations = [];
    let totalDuration = 0; // en segundos

    for (let i = 0; i < validImages.length; i++) {
      const baseMs = frameDurations[i] || defaultDuration; // duración pura del frame
      const transMs = (i < transitions.length && transitions[i] && transitions[i].duration)
        ? transitions[i].duration
        : 0; // duración de la transición que le sigue

      // La entrada FFmpeg para la imagen i debe durar base + transición (en segundos)
      const inputSeconds = (baseMs + transMs) / 1000;
      inputDurations.push(inputSeconds);

      totalDuration += baseMs / 1000;
      if (i < validImages.length - 1) {
        totalDuration += transMs / 1000; // suma transición sólo una vez
      }
    }

    return { inputDurations, totalDuration };
  }

  buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter) {
    if (validImages.length === 1) return '[v0]';

    console.log('🎞️  Building transition chain:', {
      images: validImages.length,
      transitions: transitions.map((t, i) => `${i}: ${t?.type || 'cut'}:${t?.duration || 0}ms`),
      frameDurations
    });

    // Create a concatenation filter for all inputs as fallback
    let concatInputs = '';
    for (let i = 0; i < validImages.length; i++) {
      concatInputs += `[v${i}]`;
    }
    // Check if we have any real transitions
    const hasRealTransitions = transitions.some(t => 
      t && t.type && t.type !== 'none' && t.type !== 'cut' && (t.duration || 0) > 0);
    if (!hasRealTransitions) {
      const concatFilter = `${concatInputs}concat=n=${validImages.length}:v=1:a=0[outv]`;
      complexFilter.push(concatFilter);
      console.log(`🎞️  Using simple concat: ${concatFilter}`);
      return '[outv]';
    }
    // Build transition chain with xfade
    let lastLabel = '[v0]';
    let cumulativeTime = (frameDurations[0] || defaultDuration) / 1000;
    for (let i = 0; i < validImages.length - 1; i++) {
      const nextLabel = `[v${i + 1}]`;
      const trans = transitions[i] || { type: 'cut', duration: 0 };
      // Ensure minimum duration for non-cut transitions
      const transDurSec = (trans.type && !['none', 'cut'].includes(trans.type)) 
        ? Math.max((trans.duration || 0) / 1000, 0.1)  // Minimum 100ms for real transitions
        : 0.001;  // Minimal duration for cuts (1ms)
      // Always use a real effect, even for cuts (with minimal duration)
      const effect = (trans.type && this.transitionEffects[trans.type]) 
        ? this.transitionEffects[trans.type] 
        : 'fade';  // Default to fade
      console.log(`🎞️  Transition ${i}: ${trans.type} -> ${effect}, duration: ${transDurSec}s`);
      const offset = cumulativeTime - transDurSec;
      const outLabel = i === validImages.length - 2 ? '[outv]' : `[x${i}]`;
      // Always create a transition, even for cuts (with minimal duration)
      const filterCommand = `${lastLabel}${nextLabel}xfade=transition=${effect}:duration=${transDurSec}:offset=${offset}${outLabel}`;
      complexFilter.push(filterCommand);
      console.log(`🎞️  Added filter: ${filterCommand}`);
      lastLabel = outLabel;
      if (i + 1 < frameDurations.length) {
        cumulativeTime += (frameDurations[i + 1] || defaultDuration) / 1000;
      }
    }
    return lastLabel;
  }

  getOutputOptionsForFormat(format, settings) {
    switch (format) {
      case 'mp4':
        return [
          '-c:v libx264',
          '-preset fast',
          `-crf ${settings.crf}`,
          '-pix_fmt yuv420p',
          '-movflags +faststart'
        ];
      case 'webm':
        return [
          '-c:v libvpx-vp9',
          '-preset fast',
          `-crf ${settings.crf}`,
          '-pix_fmt yuv420p'
        ];
      case 'mov':
        return [
          '-c:v libx264',
          '-preset fast',
          `-crf ${settings.crf}`,
          '-pix_fmt yuv420p'
        ];
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async close() {
    try {
      await this.worker.close();
      await this.connection.disconnect();
      console.log('✅ Export worker closed');
    } catch (error) {
      console.error('❌ Failed to close export worker:', error);
    }
  }
}

module.exports = ExportWorker;
