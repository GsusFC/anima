const { Worker } = require('bullmq');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { createRedisConnection } = require('../utils/redis');
const { JobTypes } = require('../queues/jobTypes');

// Import helper functions from main server (we'll need to extract these)
const { FilterGraph } = require('../FilterGraph');

class ExportWorker {
  constructor() {
    this.connection = createRedisConnection();
    this.outputDir = path.join(__dirname, '..', process.env.OUTPUT_DIR || 'output');
    this.tempDir = path.join(__dirname, '..', process.env.TEMP_DIR || 'uploads');
    this.compositionsDir = path.join(__dirname, '..', 'compositions');
    
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

    // Transition effects mapping
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
      circlecrop: 'circlecrop',
      circleopen: 'circleopen',
      circleclose: 'circleclose',
      radial: 'radial',
      pixelize: 'pixelize',
      distance: 'distance'
    };

    this.worker = new Worker('video-processing', this.processJob.bind(this), {
      connection: this.connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 2,
      removeOnComplete: 50,
      removeOnFail: 100
    });

    this.setupEventHandlers();
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
    const { type, data } = job;
    
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

    const validImages = this.validateImages(images, sessionId);
    if (validImages.length === 0) {
      throw new Error('No valid images found');
    }

    const outputFilename = `animation_${job.id}_${Date.now()}.gif`;
    const outputPath = path.join(this.outputDir, outputFilename);

    job.updateProgress(10);

    return new Promise((resolve, reject) => {
      try {
        const filterGraph = new FilterGraph();
        
        // Build filter for GIF creation
        const filters = filterGraph.createGifFilters(validImages, transitions, frameDurations, { fps });
        
        let command = ffmpeg();
        
        validImages.forEach((image, index) => {
          const duration = (frameDurations[index] || 1000) / 1000;
          command.input(image.path).inputOptions(['-loop', '1', '-t', String(duration)]);
        });

        command
          .complexFilter(filters)
          .outputOptions([
            '-f gif',
            '-loop 0'
          ])
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
    const results = {
      totalDuration: 0,
      inputDurations: [],
      maxTransitionDuration: 0
    };
    
    const hasRealTransitions = transitions && transitions.some(t => 
      t && t.type && t.type !== 'cut' && t.type !== 'none'
    );
    
    if (!hasRealTransitions) {
      for (let i = 0; i < validImages.length; i++) {
        const frameDuration = (frameDurations[i] || defaultDuration) / 1000;
        results.inputDurations.push(frameDuration);
        results.totalDuration += frameDuration;
      }
    } else {
      for (let i = 0; i < validImages.length; i++) {
        const frameDuration = (frameDurations[i] || defaultDuration) / 1000;
        results.totalDuration += frameDuration;
        
        if (i < transitions.length && transitions[i] && transitions[i].type !== 'cut' && transitions[i].type !== 'none') {
          const transitionDuration = Math.min(transitions[i].duration / 1000, frameDuration * 0.9);
          results.maxTransitionDuration = Math.max(results.maxTransitionDuration, transitionDuration);
          results.totalDuration += transitionDuration * 0.3;
        }
      }
      
      const bufferMultiplier = 1.5 + (results.maxTransitionDuration / results.totalDuration);
      
      for (let i = 0; i < validImages.length; i++) {
        const baseDuration = (frameDurations[i] || defaultDuration) / 1000;
        const inputDuration = Math.max(
          baseDuration,
          results.totalDuration / validImages.length * bufferMultiplier
        );
        results.inputDurations.push(inputDuration);
      }
    }
    
    return results;
  }

  buildUnifiedTransitionChain(validImages, transitions, frameDurations, defaultDuration, complexFilter) {
    if (validImages.length === 1) {
      return '[v0]';
    }

    const hasAnyRealTransitions = transitions && transitions.some(t => 
      t && t.type && t.type !== 'cut' && t.type !== 'none'
    );

    if (!transitions || validImages.length < 2 || !hasAnyRealTransitions) {
      let concatVideo = "";
      for(let i = 0; i < validImages.length; i++){
        concatVideo += `[v${i}]`;
      }
      complexFilter.push(`${concatVideo}concat=n=${validImages.length}[outv]`);
      return '[outv]';
    }

    let lastOutput = '[v0]';
    let totalVideoTime = 0;
    
    for (let i = 0; i < validImages.length - 1; i++) {
      const currentFrameDuration = (frameDurations[i] || defaultDuration) / 1000;
      const transition = transitions[i] || { type: 'fade', duration: 500 };
      
      let transitionDuration = Math.min(transition.duration / 1000, currentFrameDuration * 0.9);
      let transitionType = this.transitionEffects[transition.type] || 'fade';

      if (transitionType === 'none') {
        transitionType = 'fade';
        transitionDuration = 0.001;
      }

      const nextInput = `[v${i + 1}]`;
      const outputLabel = (i === validImages.length - 2) ? '[outv]' : `[t${i}]`;
      
      const offset = totalVideoTime + currentFrameDuration - transitionDuration;
      totalVideoTime += currentFrameDuration;
      
      const xfadeFilter = `${lastOutput}${nextInput}xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset}${outputLabel}`;
      complexFilter.push(xfadeFilter);
      lastOutput = outputLabel;
    }
    
    return lastOutput;
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
