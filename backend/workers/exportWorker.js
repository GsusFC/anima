const { Worker } = require('bullmq');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { createRedisConnection } = require('../utils/redis');
const { JobTypes } = require('../queues/jobTypes');

// Note: FilterGraph import removed - implementing GIF export directly

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
      none: 'none',
      cut: 'none',
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
      hblur: 'hblur'
    };

    this.worker = new Worker('video-processing', this.processJob.bind(this), {
      connection: this.connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 2,
      removeOnComplete: 50,
      removeOnFail: 100
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
              format,
              duration: durationCalc.totalDuration
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

    let lastLabel = '[v0]';
    let cumulativeTime = (frameDurations[0] || defaultDuration) / 1000; // segundos acumulados tras el primer frame

    for (let i = 0; i < validImages.length - 1; i++) {
      const nextLabel = `[v${i + 1}]`;
      const trans = transitions[i] || { type: 'cut', duration: 0 };
      const transDurSec = (trans.duration || 0) / 1000;
      const effect = this.transitionEffects[trans.type] || 'fade';
      
      console.log(`🎞️  Transition ${i}: ${trans.type} -> ${effect}, duration: ${transDurSec}s`);

      // Offset = tiempo transcurrido hasta el inicio del frame siguiente menos la duración de la transición
      const offset = cumulativeTime - transDurSec;

      const outLabel = i === validImages.length - 2 ? '[outv]' : `[x${i}]`;

      // Skip xfade for instant transitions (cut, none) or zero duration
      if (effect === 'none' || transDurSec <= 0) {
        // For instant transitions, just use the current frame label
        console.log(`🎞️  Skipping transition ${i} (instant cut)`);
        lastLabel = nextLabel;
      } else {
        const filterCommand = `${lastLabel}${nextLabel}xfade=transition=${effect}:duration=${transDurSec}:offset=${offset}${outLabel}`;
        complexFilter.push(filterCommand);
        console.log(`🎞️  Added filter: ${filterCommand}`);
        // Preparar para la siguiente iteración
        lastLabel = outLabel;
      }
      if (i + 1 < frameDurations.length) {
        cumulativeTime += (frameDurations[i + 1] || defaultDuration) / 1000;
      }
      if (i + 1 < transitions.length) {
        cumulativeTime += transDurSec;
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
