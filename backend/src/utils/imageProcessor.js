const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('crypto');

class ImageProcessor {
  constructor(cacheDir = './cache/images') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generate cache key for processed image
   */
  generateCacheKey(imagePath, options) {
    const stats = fs.statSync(imagePath);
    const imageHash = `${path.basename(imagePath)}-${stats.size}-${stats.mtime.getTime()}`;
    const optionsHash = JSON.stringify(options);
    
    return crypto.createHash('md5')
      .update(imageHash + optionsHash)
      .digest('hex');
  }

  /**
   * Get optimal resolution for a set of images
   */
  async getOptimalResolution(images, targetFormat = 'mp4', maxResolution = '1080p') {
    try {
      if (!images || images.length === 0) {
        return { width: 1920, height: 1080 };
      }

      // Get dimensions of all images
      const dimensions = await Promise.all(
        images.map(async (image) => {
          try {
            return await this.getImageDimensions(image.path);
          } catch (error) {
            console.warn(`⚠️ Could not get dimensions for ${image.path}:`, error.message);
            return { width: 1920, height: 1080 };
          }
        })
      );

      // Calculate average aspect ratio
      const aspectRatios = dimensions.map(d => d.width / d.height);
      const avgAspectRatio = aspectRatios.reduce((sum, ratio) => sum + ratio, 0) / aspectRatios.length;

      // Find most common resolution
      const resolutionCounts = {};
      dimensions.forEach(d => {
        const key = `${d.width}x${d.height}`;
        resolutionCounts[key] = (resolutionCounts[key] || 0) + 1;
      });

      const mostCommonRes = Object.keys(resolutionCounts)
        .reduce((a, b) => resolutionCounts[a] > resolutionCounts[b] ? a : b);

      console.log(`📊 Image analysis: Most common resolution: ${mostCommonRes}, Avg aspect ratio: ${avgAspectRatio.toFixed(2)}`);

      // Determine optimal resolution based on format and content
      return this.calculateTargetResolution(avgAspectRatio, targetFormat, maxResolution);

    } catch (error) {
      console.error('❌ Error calculating optimal resolution:', error);
      return { width: 1920, height: 1080 };
    }
  }

  /**
   * Calculate target resolution based on aspect ratio and format
   */
  calculateTargetResolution(aspectRatio, format, maxResolution) {
    const resolutionPresets = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '1440p': { width: 2560, height: 1440 },
      '4k': { width: 3840, height: 2160 }
    };

    let baseResolution = resolutionPresets[maxResolution] || resolutionPresets['1080p'];

    // Adjust for format-specific optimizations
    if (format === 'gif') {
      // GIFs should be smaller for better performance
      baseResolution = aspectRatio > 1.5 ? 
        { width: 800, height: 450 } : // Wide aspect ratio
        { width: 600, height: 600 };  // Square/portrait
    } else if (format === 'webm') {
      // WebM can handle higher resolutions efficiently
      if (maxResolution === '1080p' && aspectRatio > 1.5) {
        baseResolution = { width: 1920, height: 1080 };
      }
    }

    // Adjust dimensions to match aspect ratio
    let { width, height } = baseResolution;
    
    if (Math.abs(aspectRatio - (width / height)) > 0.1) {
      // Adjust to match aspect ratio
      if (aspectRatio > (width / height)) {
        // Wider than target, adjust height
        height = Math.round(width / aspectRatio);
      } else {
        // Taller than target, adjust width
        width = Math.round(height * aspectRatio);
      }
    }

    // Ensure even dimensions
    width = width % 2 === 0 ? width : width - 1;
    height = height % 2 === 0 ? height : height - 1;

    console.log(`🎯 Target resolution: ${width}x${height} for ${format} (aspect: ${aspectRatio.toFixed(2)})`);
    
    return { width, height, aspectRatio };
  }

  /**
   * Process and cache image with specific settings
   */
  async processImage(imagePath, options = {}) {
    const {
      width,
      height,
      format = 'png',
      quality = 90,
      forceReprocess = false
    } = options;

    const cacheKey = this.generateCacheKey(imagePath, options);
    const cachedPath = path.join(this.cacheDir, `processed_${cacheKey}.${format}`);

    // Return cached version if exists and not forcing reprocess
    if (!forceReprocess && fs.existsSync(cachedPath)) {
      console.log(`📦 Using cached processed image: ${cacheKey}`);
      return cachedPath;
    }

    console.log(`🔄 Processing image: ${path.basename(imagePath)} -> ${width}x${height}`);

    return new Promise((resolve, reject) => {
      let command = ffmpeg(imagePath);

      // Apply scaling if dimensions provided
      if (width && height) {
        command = command.size(`${width}x${height}`);
      }

      // Apply format-specific options
      if (format === 'jpg' || format === 'jpeg') {
        command = command.outputOptions([
          '-q:v', Math.round((100 - quality) / 10).toString() // Convert percentage to FFmpeg quality scale
        ]);
      } else if (format === 'png') {
        command = command.outputOptions([
          '-compression_level', '6' // Good balance of speed vs compression
        ]);
      }

      command
        .output(cachedPath)
        .on('end', () => {
          console.log(`✅ Image processed and cached: ${cachedPath}`);
          resolve(cachedPath);
        })
        .on('error', (error) => {
          console.error('❌ Image processing failed:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * Batch process multiple images with optimal settings
   */
  async batchProcessImages(images, options = {}) {
    const {
      targetFormat = 'mp4',
      maxResolution = '1080p',
      quality = 90
    } = options;

    try {
      // Calculate optimal resolution for the batch
      const optimalResolution = await this.getOptimalResolution(images, targetFormat, maxResolution);
      
      console.log(`🔄 Batch processing ${images.length} images to ${optimalResolution.width}x${optimalResolution.height}`);

      // Process images in parallel (but limit concurrency)
      const concurrencyLimit = 3;
      const processedImages = [];

      for (let i = 0; i < images.length; i += concurrencyLimit) {
        const batch = images.slice(i, i + concurrencyLimit);
        
        const batchPromises = batch.map(async (image) => {
          try {
            const processedPath = await this.processImage(image.path, {
              width: optimalResolution.width,
              height: optimalResolution.height,
              format: targetFormat === 'gif' ? 'png' : 'jpg',
              quality: quality
            });

            return {
              ...image,
              processedPath,
              originalPath: image.path,
              dimensions: optimalResolution
            };
          } catch (error) {
            console.error(`❌ Failed to process image ${image.path}:`, error);
            return {
              ...image,
              processedPath: image.path, // Fallback to original
              originalPath: image.path,
              dimensions: optimalResolution,
              processingError: error.message
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        processedImages.push(...batchResults);

        // Small delay between batches to prevent overwhelming the system
        if (i + concurrencyLimit < images.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Batch processing completed: ${processedImages.length} images processed`);
      
      return {
        images: processedImages,
        optimalResolution,
        stats: {
          total: images.length,
          processed: processedImages.filter(img => !img.processingError).length,
          errors: processedImages.filter(img => img.processingError).length
        }
      };

    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      throw error;
    }
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
   * Clean old cached images
   */
  cleanCache(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const files = fs.readdirSync(this.cacheDir);
      const now = Date.now();
      let cleanedCount = 0;

      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(`🗑️ Cleaned ${cleanedCount} cached images`);
      }
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let totalSize = 0;
      
      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      return {
        fileCount: files.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      return { fileCount: 0, totalSize: 0, totalSizeMB: '0.00' };
    }
  }
}

module.exports = ImageProcessor;
