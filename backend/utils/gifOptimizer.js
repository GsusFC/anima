const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('crypto');

class GIFOptimizer {
  constructor(cacheDir = './cache/palettes') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Calculate optimal GIF resolution based on input images
   */
  async calculateOptimalResolution(images, maxWidth = 800, maxHeight = 600) {
    try {
      if (!images || images.length === 0) {
        return { width: 640, height: 480 };
      }

      // Get dimensions of first image as reference
      const firstImage = images[0];
      const dimensions = await this.getImageDimensions(firstImage.path);
      
      let { width, height } = dimensions;
      const aspectRatio = width / height;

      // Calculate optimal size maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const scaleRatio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * scaleRatio);
        height = Math.round(height * scaleRatio);
      }

      // Ensure even dimensions for better encoding
      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      // Minimum size constraints
      width = Math.max(width, 320);
      height = Math.max(height, 240);

      console.log(`🎨 Optimal GIF resolution: ${width}x${height} (aspect: ${aspectRatio.toFixed(2)})`);
      
      return { width, height, aspectRatio };
    } catch (error) {
      console.error('❌ Error calculating optimal resolution:', error);
      return { width: 640, height: 480, aspectRatio: 1.33 };
    }
  }

  /**
   * Generate cache key for palette based on images and settings
   */
  generatePaletteKey(images, settings) {
    const imageHashes = images.map(img => {
      const stats = fs.statSync(img.path);
      return `${img.filename}-${stats.size}-${stats.mtime.getTime()}`;
    });
    
    const settingsHash = JSON.stringify({
      colors: settings.colors,
      width: settings.width,
      height: settings.height,
      fps: settings.fps
    });

    return crypto.createHash('md5')
      .update(imageHashes.join('|') + settingsHash)
      .digest('hex');
  }

  /**
   * Get cached palette or generate new one
   */
  async getOrGeneratePalette(images, settings) {
    const paletteKey = this.generatePaletteKey(images, settings);
    const palettePath = path.join(this.cacheDir, `palette_${paletteKey}.png`);

    // Check if cached palette exists and is valid
    if (fs.existsSync(palettePath)) {
      console.log(`🎨 Using cached palette: ${paletteKey}`);
      return palettePath;
    }

    console.log(`🎨 Generating new palette: ${paletteKey}`);
    return await this.generatePalette(images, settings, palettePath);
  }

  /**
   * Generate optimized palette for GIF
   */
  async generatePalette(images, settings, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        let command = ffmpeg();

        // Add all images as inputs with optimal durations
        images.forEach((image, index) => {
          const duration = (settings.frameDurations?.[index] || 1000) / 1000;
          command.input(image.path).inputOptions(['-loop', '1', '-t', String(duration)]);
        });

        // Build filter for palette generation
        const scaleFilters = images.map((_, index) => 
          `[${index}:v]scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2,fps=${settings.fps}[v${index}]`
        );

        const concatInputs = images.map((_, index) => `[v${index}]`).join('');
        const paletteFilter = `${scaleFilters.join(';')};${concatInputs}concat=n=${images.length}:v=1:a=0[concat];[concat]palettegen=max_colors=${settings.colors}:stats_mode=diff[palette]`;

        command
          .complexFilter(paletteFilter)
          .map('[palette]')
          .output(outputPath)
          .on('end', () => {
            console.log(`✅ Palette generated: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('❌ Palette generation failed:', error);
            reject(error);
          })
          .run();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get optimal GIF settings based on quality level
   */
  getOptimalSettings(quality, resolution) {
    const baseSettings = {
      low: {
        colors: 64,
        fps: 10,
        dither: 'none',
        bayerScale: 0
      },
      standard: {
        colors: 128,
        fps: 15,
        dither: 'bayer',
        bayerScale: 3
      },
      high: {
        colors: 256,
        fps: 20,
        dither: 'bayer',
        bayerScale: 5
      },
      ultra: {
        colors: 256,
        fps: 24,
        dither: 'floyd_steinberg',
        bayerScale: 5
      }
    };

    const settings = baseSettings[quality] || baseSettings.standard;
    
    // Adjust FPS based on resolution (lower FPS for larger GIFs)
    const pixelCount = resolution.width * resolution.height;
    if (pixelCount > 500000) { // > 720p equivalent
      settings.fps = Math.max(settings.fps - 5, 8);
    }

    return {
      ...settings,
      width: resolution.width,
      height: resolution.height
    };
  }

  /**
   * Generate optimized GIF with cached palette
   */
  async generateOptimizedGIF(images, outputPath, options = {}) {
    try {
      const {
        quality = 'standard',
        frameDurations = [],
        maxWidth = 800,
        maxHeight = 600
      } = options;

      // Calculate optimal resolution
      const resolution = await this.calculateOptimalResolution(images, maxWidth, maxHeight);
      
      // Get optimal settings
      const settings = this.getOptimalSettings(quality, resolution);
      settings.frameDurations = frameDurations;

      console.log(`🎨 GIF optimization settings:`, settings);

      // Get or generate palette
      const palettePath = await this.getOrGeneratePalette(images, settings);

      // Generate final GIF using cached palette
      return await this.generateGIFWithPalette(images, palettePath, outputPath, settings);

    } catch (error) {
      console.error('❌ GIF optimization failed:', error);
      throw error;
    }
  }

  /**
   * Generate final GIF using pre-generated palette
   */
  async generateGIFWithPalette(images, palettePath, outputPath, settings) {
    return new Promise((resolve, reject) => {
      try {
        let command = ffmpeg();

        // Add images as inputs
        images.forEach((image, index) => {
          const duration = (settings.frameDurations?.[index] || 1000) / 1000;
          command.input(image.path).inputOptions(['-loop', '1', '-t', String(duration)]);
        });

        // Add palette as input
        command.input(palettePath);

        // Build filter chain
        const scaleFilters = images.map((_, index) => 
          `[${index}:v]scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2,fps=${settings.fps}[v${index}]`
        );

        const concatInputs = images.map((_, index) => `[v${index}]`).join('');
        const paletteIndex = images.length; // Palette is the last input
        
        const filterComplex = `${scaleFilters.join(';')};${concatInputs}concat=n=${images.length}:v=1:a=0[gif];[gif][${paletteIndex}:v]paletteuse=dither=${settings.dither}:bayer_scale=${settings.bayerScale}[out]`;

        command
          .complexFilter(filterComplex)
          .map('[out]')
          .outputOptions(['-loop', '0']) // Infinite loop
          .output(outputPath)
          .on('start', (cmd) => {
            console.log('🎨 Starting optimized GIF generation:', cmd);
          })
          .on('end', () => {
            console.log(`✅ Optimized GIF generated: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('❌ GIF generation failed:', error);
            reject(error);
          })
          .run();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get image dimensions using ffprobe
   */
  async getImageDimensions(imagePath) {
    return new Promise((resolve, reject) => {
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
  }

  /**
   * Clean old cached palettes
   */
  cleanCache(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const files = fs.readdirSync(this.cacheDir);
      const now = Date.now();

      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned cached palette: ${file}`);
        }
      });
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error);
    }
  }
}

module.exports = GIFOptimizer;
