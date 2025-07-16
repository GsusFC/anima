const os = require('os');

class VideoOptimizer {
  constructor() {
    this.cpuCount = os.cpus().length;
    this.maxThreads = Math.min(this.cpuCount, 8); // Cap at 8 threads
  }

  /**
   * Get optimized MP4 settings based on content and quality
   */
  getOptimizedMP4Settings(quality, resolution, contentType = 'slideshow') {
    const baseSettings = {
      web: {
        preset: 'fast',
        crf: 28,
        maxBitrate: '1M',
        bufsize: '2M',
        profile: 'baseline',
        level: '3.1'
      },
      standard: {
        preset: 'medium',
        crf: 23,
        maxBitrate: '2M',
        bufsize: '4M',
        profile: 'main',
        level: '4.0'
      },
      high: {
        preset: 'slow',
        crf: 18,
        maxBitrate: '4M',
        bufsize: '8M',
        profile: 'high',
        level: '4.2'
      },
      ultra: {
        preset: 'veryslow',
        crf: 15,
        maxBitrate: '8M',
        bufsize: '16M',
        profile: 'high',
        level: '5.0'
      }
    };

    let settings = baseSettings[quality] || baseSettings.standard;

    // Adjust settings based on resolution
    const pixelCount = resolution.width * resolution.height;
    
    if (pixelCount <= 640 * 480) { // SD
      settings.crf = Math.max(settings.crf - 2, 15);
      settings.maxBitrate = this.adjustBitrate(settings.maxBitrate, 0.6);
    } else if (pixelCount <= 1280 * 720) { // HD
      settings.crf = Math.max(settings.crf - 1, 15);
      settings.maxBitrate = this.adjustBitrate(settings.maxBitrate, 0.8);
    } else if (pixelCount >= 1920 * 1080) { // FHD+
      settings.crf = Math.min(settings.crf + 1, 28);
      settings.maxBitrate = this.adjustBitrate(settings.maxBitrate, 1.2);
    }

    // Adjust for content type
    if (contentType === 'slideshow') {
      // Slideshows can use higher CRF since they have less motion
      settings.crf = Math.min(settings.crf + 2, 28);
      settings.preset = quality === 'web' ? 'fast' : 'medium'; // Faster presets for slideshows
    }

    return {
      ...settings,
      threads: Math.min(this.maxThreads, 4), // MP4 doesn't benefit much from many threads
      pixFmt: 'yuv420p',
      movflags: '+faststart'
    };
  }

  /**
   * Get optimized WebM settings based on content and quality
   */
  getOptimizedWebMSettings(quality, resolution, contentType = 'slideshow') {
    const baseSettings = {
      web: {
        deadline: 'good',
        crf: 35,
        maxBitrate: '800k',
        targetBitrate: '600k',
        cpuUsed: 2
      },
      standard: {
        deadline: 'good',
        crf: 30,
        maxBitrate: '1.5M',
        targetBitrate: '1M',
        cpuUsed: 1
      },
      high: {
        deadline: 'best',
        crf: 25,
        maxBitrate: '3M',
        targetBitrate: '2M',
        cpuUsed: 0
      },
      ultra: {
        deadline: 'best',
        crf: 20,
        maxBitrate: '6M',
        targetBitrate: '4M',
        cpuUsed: 0
      }
    };

    let settings = baseSettings[quality] || baseSettings.standard;

    // Adjust settings based on resolution
    const pixelCount = resolution.width * resolution.height;
    
    if (pixelCount <= 640 * 480) { // SD
      settings.crf = Math.max(settings.crf - 3, 20);
      settings.maxBitrate = this.adjustBitrate(settings.maxBitrate, 0.5);
      settings.targetBitrate = this.adjustBitrate(settings.targetBitrate, 0.5);
    } else if (pixelCount <= 1280 * 720) { // HD
      settings.crf = Math.max(settings.crf - 2, 20);
      settings.maxBitrate = this.adjustBitrate(settings.maxBitrate, 0.7);
      settings.targetBitrate = this.adjustBitrate(settings.targetBitrate, 0.7);
    } else if (pixelCount >= 1920 * 1080) { // FHD+
      settings.crf = Math.min(settings.crf + 2, 35);
      settings.maxBitrate = this.adjustBitrate(settings.maxBitrate, 1.3);
      settings.targetBitrate = this.adjustBitrate(settings.targetBitrate, 1.3);
    }

    // Adjust for content type
    if (contentType === 'slideshow') {
      // Slideshows benefit from VP9's efficiency with static content
      settings.crf = Math.min(settings.crf + 3, 35);
      settings.cpuUsed = Math.max(settings.cpuUsed - 1, 0); // Better quality for static content
    }

    return {
      ...settings,
      threads: this.maxThreads, // VP9 benefits from more threads
      tileColumns: Math.min(Math.floor(Math.log2(this.maxThreads)), 6),
      frameParallel: 1,
      autoAltRef: 1,
      lagInFrames: 25,
      pixFmt: 'yuv420p'
    };
  }

  /**
   * Build optimized FFmpeg command for MP4
   */
  buildMP4Command(inputFlags, filterComplex, outputFile, settings, fps) {
    const mp4Settings = this.getOptimizedMP4Settings(settings.quality, settings.resolution, 'slideshow');
    
    const codecOptions = [
      `-filter_complex "${filterComplex}"`,
      `-map "[out]"`,
      `-c:v libx264`,
      `-preset ${mp4Settings.preset}`,
      `-crf ${mp4Settings.crf}`,
      `-maxrate ${mp4Settings.maxBitrate}`,
      `-bufsize ${mp4Settings.bufsize}`,
      `-profile:v ${mp4Settings.profile}`,
      `-level ${mp4Settings.level}`,
      `-threads ${mp4Settings.threads}`,
      `-r ${fps}`,
      `-pix_fmt ${mp4Settings.pixFmt}`,
      `-movflags ${mp4Settings.movflags}`,
      `-y`
    ].join(' ');

    return `ffmpeg ${inputFlags.join(' ')} ${codecOptions} "${outputFile}"`;
  }

  /**
   * Build optimized FFmpeg command for WebM
   */
  buildWebMCommand(inputFlags, filterComplex, outputFile, settings, fps) {
    const webmSettings = this.getOptimizedWebMSettings(settings.quality, settings.resolution, 'slideshow');
    
    const codecOptions = [
      `-filter_complex "${filterComplex}"`,
      `-map "[out]"`,
      `-c:v libvpx-vp9`,
      `-deadline ${webmSettings.deadline}`,
      `-crf ${webmSettings.crf}`,
      `-b:v 0`, // Use CRF mode
      `-maxrate ${webmSettings.maxBitrate}`,
      `-bufsize ${webmSettings.maxBitrate}`,
      `-cpu-used ${webmSettings.cpuUsed}`,
      `-threads ${webmSettings.threads}`,
      `-tile-columns ${webmSettings.tileColumns}`,
      `-frame-parallel ${webmSettings.frameParallel}`,
      `-auto-alt-ref ${webmSettings.autoAltRef}`,
      `-lag-in-frames ${webmSettings.lagInFrames}`,
      `-r ${fps}`,
      `-pix_fmt ${webmSettings.pixFmt}`,
      `-y`
    ].join(' ');

    return `ffmpeg ${inputFlags.join(' ')} ${codecOptions} "${outputFile}"`;
  }

  /**
   * Get optimal FPS based on content and format
   */
  getOptimalFPS(requestedFPS, format, contentType = 'slideshow') {
    let optimalFPS = requestedFPS;

    if (contentType === 'slideshow') {
      // Slideshows don't need high FPS
      if (format === 'gif') {
        optimalFPS = Math.min(requestedFPS, 15);
      } else if (format === 'mp4') {
        optimalFPS = Math.min(requestedFPS, 30);
      } else if (format === 'webm') {
        optimalFPS = Math.min(requestedFPS, 30);
      }
    }

    // Ensure minimum FPS
    optimalFPS = Math.max(optimalFPS, format === 'gif' ? 8 : 24);

    return optimalFPS;
  }

  /**
   * Adjust bitrate string by multiplier
   */
  adjustBitrate(bitrateStr, multiplier) {
    const match = bitrateStr.match(/^(\d+(?:\.\d+)?)([kKmM]?)$/);
    if (!match) return bitrateStr;

    const value = parseFloat(match[1]);
    const unit = match[2] || '';
    const newValue = (value * multiplier).toFixed(1);

    return `${newValue}${unit}`;
  }

  /**
   * Get system performance recommendations
   */
  getPerformanceRecommendations() {
    const totalRAM = os.totalmem() / (1024 * 1024 * 1024); // GB
    const freeRAM = os.freemem() / (1024 * 1024 * 1024); // GB

    return {
      recommendedConcurrency: Math.min(Math.floor(this.cpuCount / 2), 3),
      maxResolution: totalRAM >= 8 ? '1080p' : '720p',
      cacheEnabled: freeRAM > 2,
      threads: this.maxThreads,
      systemInfo: {
        cpuCount: this.cpuCount,
        totalRAM: totalRAM.toFixed(1) + 'GB',
        freeRAM: freeRAM.toFixed(1) + 'GB'
      }
    };
  }

  /**
   * Estimate processing time based on settings
   */
  estimateProcessingTime(imageCount, resolution, format, quality) {
    const pixelCount = resolution.width * resolution.height;
    const baseTimePerFrame = pixelCount / 1000000; // Base time in seconds per megapixel

    let multiplier = 1;
    
    // Format multipliers
    if (format === 'gif') multiplier *= 1.5; // GIF palette generation
    else if (format === 'webm') multiplier *= 1.2; // VP9 encoding
    else if (format === 'mp4') multiplier *= 1.0; // H.264 baseline

    // Quality multipliers
    const qualityMultipliers = {
      web: 0.7,
      standard: 1.0,
      high: 1.5,
      ultra: 2.5
    };
    multiplier *= qualityMultipliers[quality] || 1.0;

    // CPU multiplier
    multiplier /= Math.min(this.cpuCount / 4, 2);

    const estimatedSeconds = imageCount * baseTimePerFrame * multiplier;
    
    return {
      estimatedSeconds: Math.ceil(estimatedSeconds),
      estimatedMinutes: Math.ceil(estimatedSeconds / 60),
      confidence: imageCount > 10 ? 'medium' : 'low'
    };
  }
}

module.exports = VideoOptimizer;
