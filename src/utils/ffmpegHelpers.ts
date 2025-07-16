import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { ImageFile, Transition, ImageDimensions } from '../types';
import { QUALITY_PRESETS, TRANSITION_EFFECTS } from '../config/server';

/**
 * Detects image dimensions using FFmpeg
 * 
 * @param imagePath - Path to the image file
 * @returns Promise resolving to image dimensions
 */
export function getImageDimensions(imagePath: string): Promise<ImageDimensions> {
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
 * Calculates optimal resolution based on first image aspect ratio
 * 
 * @param images - Array of image files
 * @param sessionId - Session ID
 * @param maxHeight - Maximum height constraint
 * @returns Promise resolving to calculated dimensions
 */
export async function calculateAutoResolution(
  images: ImageFile[], 
  sessionId: string, 
  maxHeight = 1080
): Promise<ImageDimensions> {
  if (!images || images.length === 0) return { width: 1920, height: 1080 };
  
  try {
    const firstImagePath = path.join(process.env.TEMP_DIR || 'uploads', sessionId, images[0].filename);
    const dims = await getImageDimensions(firstImagePath);
    
    // Calculate aspect ratio
    const aspectRatio = dims.width / dims.height;
    
    // Scale to fit maxHeight while maintaining aspect ratio
    const height = Math.min(dims.height, maxHeight);
    const width = Math.round(height * aspectRatio);
    
    // Ensure even numbers for better encoding
    return {
      width: width % 2 === 0 ? width : width + 1,
      height: height % 2 === 0 ? height : height + 1
    };
  } catch (error) {
    console.error('Error calculating auto resolution:', error);
    return { width: 1920, height: 1080 }; // Fallback
  }
}

/**
 * Calculate optimal input durations for exports with transitions
 * 
 * @param validImages - Array of valid image files
 * @param transitions - Array of transitions
 * @param frameDurations - Array of frame durations in milliseconds
 * @param defaultDuration - Default duration in milliseconds
 * @returns Object with calculated durations
 */
export function calculateInputDurations(
  validImages: ImageFile[], 
  transitions: Transition[] | undefined, 
  frameDurations: number[], 
  defaultDuration: number
): { totalDuration: number; inputDurations: number[]; maxTransitionDuration: number } {
  // Ensure transitions is always an array to avoid runtime errors when no transitions are supplied
  if (!Array.isArray(transitions)) {
    transitions = [];
  }
  const results = {
    totalDuration: 0,
    inputDurations: [] as number[],
    maxTransitionDuration: 0
  };
  
  // For slideshow with cuts/no transitions, use exact frame durations
  // Only apply buffers when there are actual transitions
  const hasRealTransitions = transitions && transitions.some(t => 
    t && t.type && t.type !== 'cut' && t.type !== 'none'
  );
  
  if (!hasRealTransitions) {
    // Simple case: no transitions, use exact durations
    for (let i = 0; i < validImages.length; i++) {
      const frameDuration = (frameDurations[i] || defaultDuration) / 1000;
      results.inputDurations.push(frameDuration);
      results.totalDuration += frameDuration;
    }
    console.log('📏 Using exact durations (no transitions)');
  } else {
    // Complex case: has transitions, apply buffer logic
    console.log('📏 Using buffered durations (has transitions)');
    
    // Calculate total duration needed and max transition duration
    for (let i = 0; i < validImages.length; i++) {
      const frameDuration = (frameDurations[i] || defaultDuration) / 1000;
      results.totalDuration += frameDuration;
      
      if (i < transitions.length && transitions[i] && transitions[i].type !== 'cut' && transitions[i].type !== 'none') {
        const transitionDuration = Math.min(transitions[i].duration / 1000, frameDuration * 0.9);
        results.maxTransitionDuration = Math.max(results.maxTransitionDuration, transitionDuration);
        results.totalDuration += transitionDuration * 0.3;
      }
    }
    
    // Calculate individual input durations with buffer for transitions
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

/**
 * Build unified transition chain for both GIF and Video
 * 
 * @param validImages - Array of valid image files
 * @param transitions - Array of transitions
 * @param frameDurations - Array of frame durations in milliseconds
 * @param duration - Default duration in milliseconds
 * @param complexFilter - Array to store complex filter commands
 * @returns Last output label for FFmpeg command
 */
export function buildUnifiedTransitionChain(
  validImages: ImageFile[], 
  transitions: Transition[] | undefined, 
  frameDurations: number[], 
  duration: number, 
  complexFilter: string[]
): string {
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

  console.log(`🎞️ [FFMPEG] Starting transition chain for ${validImages.length} images`);
  console.log(`🎞️ [FFMPEG] Frame durations:`, frameDurations.map((d, i) => `${i}: ${d}ms`));

  for (let i = 0; i < validImages.length - 1; i++) {
    const currentFrameDuration = (frameDurations[i] || duration) / 1000;
    const transition = transitions?.[i] || { type: 'fade', duration: 500 };

    // transition.duration comes in milliseconds from frontend, convert to seconds for FFmpeg
    let transitionDuration = (transition.type && !['none', 'cut'].includes(transition.type))
      ? Math.max(transition.duration / 1000, 0.1)
      : 0.001;
    let transitionType = TRANSITION_EFFECTS[transition.type] || 'fade';

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
    console.log(`🎞️ [FFMPEG] Frame ${i}->${i+1}: duration=${currentFrameDuration}s, total=${totalVideoTime}s, transition=${transitionDuration}s, offset=${offset}s`);
    console.log(`🎞️ [FFMPEG] XFade filter: ${xfadeFilter}`);
    complexFilter.push(xfadeFilter);
    lastOutput = outputLabel;
  }
  console.log(`🎞️ [FFMPEG] Total xfade transitions processed: ${validImages.length - 1}, final output: ${lastOutput}`);
  return lastOutput;
}

/**
 * Convert master video to other formats
 * 
 * @param masterPath - Path to master video file
 * @param format - Target format (gif, webm, mov, mp4)
 * @param quality - Quality preset (low, standard, high, ultra)
 * @param sessionId - Session ID
 * @returns Promise resolving to output file information
 */
export function convertMasterToFormat(
  masterPath: string, 
  format: string, 
  quality = 'standard', 
  sessionId: string
): Promise<{ filename: string; outputPath: string }> {
  const outputFilename = `animagen_${Date.now()}.${format}`;
  const outputPath = path.join(process.env.OUTPUT_DIR || 'output', outputFilename);

  console.log(`🔄 Converting master to ${format.toUpperCase()}: ${masterPath} -> ${outputPath}`);

  return new Promise((resolve, reject) => {
    let command = ffmpeg(masterPath);

    if (format === 'gif') {
      // GIF conversion with dynamic quality settings
      const gifSettings = {
        low: {
          fps: 10,
          scale: '480:-1',
          colors: 64,
          dither: 'none',
          bayerScale: 0
        },
        standard: {
          fps: 15,
          scale: '720:-1',
          colors: 128,
          dither: 'bayer',
          bayerScale: 3
        },
        high: {
          fps: 20,
          scale: '1080:-1',
          colors: 256,
          dither: 'bayer',
          bayerScale: 5
        },
        ultra: {
          fps: 25,
          scale: '1440:-1',
          colors: 256,
          dither: 'floyd_steinberg',
          bayerScale: 5
        }
      };

      const settings = gifSettings[quality as keyof typeof gifSettings] || gifSettings.standard;
      console.log(`🎨 GIF Settings for ${quality}:`, settings);

      // First pass: Generate optimized palette
      const paletteFilter = `fps=${settings.fps},scale=${settings.scale}:flags=lanczos,palettegen=max_colors=${settings.colors}:stats_mode=diff`;

      command
        .outputOptions([
          '-vf', paletteFilter,
          '-y'
        ])
        .output(outputPath.replace('.gif', '_palette.png'))
        .on('end', () => {
          // Second pass: Apply palette with quality settings
          const ditherOption = settings.dither === 'floyd_steinberg'
            ? 'floyd_steinberg'
            : settings.dither === 'none'
              ? 'none'
              : `bayer:bayer_scale=${settings.bayerScale}`;

          const finalFilter = `fps=${settings.fps},scale=${settings.scale}:flags=lanczos[v];[v][1:v]paletteuse=dither=${ditherOption}`;

          console.log(`🎨 GIF Final filter: ${finalFilter}`);

          ffmpeg(masterPath)
            .input(outputPath.replace('.gif', '_palette.png'))
            .outputOptions([
              '-filter_complex', finalFilter,
              '-y'
            ])
            .output(outputPath)
            .on('end', () => {
              // Cleanup palette file
              fs.unlinkSync(outputPath.replace('.gif', '_palette.png'));
              console.log(`✅ GIF created with ${quality} quality: ${outputFilename}`);
              resolve({ filename: outputFilename, outputPath });
            })
            .on('error', reject)
            .run();
        })
        .on('error', reject)
        .run();
    } else if (format === 'webm') {
      // WebM conversion
      const qualitySettings = {
        low: { crf: 35, bitrate: '1M' },
        standard: { crf: 30, bitrate: '2M' },
        high: { crf: 25, bitrate: '4M' },
        ultra: { crf: 20, bitrate: '6M' }
      };
      const settings = qualitySettings[quality as keyof typeof qualitySettings] || qualitySettings.standard;

      command
        .outputOptions([
          '-c:v libvpx-vp9',
          '-cpu-used 2',
          '-deadline realtime',
          `-crf ${settings.crf}`,
          `-b:v ${settings.bitrate}`,
          '-pix_fmt yuv420p',
          '-row-mt 1',
          '-y'
        ])
        .output(outputPath)
        .on('end', () => resolve({ filename: outputFilename, outputPath }))
        .on('error', reject)
        .run();
    } else if (format === 'mov') {
      // MOV conversion (same as MP4 but with MOV container)
      const qualitySettings = {
        low: { crf: 28, bitrate: '2M' },
        standard: { crf: 23, bitrate: '4M' },
        high: { crf: 20, bitrate: '6M' },
        ultra: { crf: 18, bitrate: '8M' }
      };
      const settings = qualitySettings[quality as keyof typeof qualitySettings] || qualitySettings.standard;

      command
        .outputOptions([
          '-c:v libx264',
          '-preset medium',
          '-profile:v high',
          `-crf ${settings.crf}`,
          `-b:v ${settings.bitrate}`,
          '-pix_fmt yuv420p',
          '-movflags +faststart',
          '-y'
        ])
        .output(outputPath)
        .on('end', () => resolve({ filename: outputFilename, outputPath }))
        .on('error', reject)
        .run();
    } else {
      // MP4 - just copy the master file with potential quality adjustment
      if (quality === 'ultra' || quality === 'high') {
        // For high quality, just copy the master (it's already high quality)
        fs.copyFileSync(masterPath, outputPath);
        resolve({ filename: outputFilename, outputPath });
      } else {
        // For lower quality, re-encode with lower settings
        const qualitySettings = {
          low: { crf: 28, bitrate: '2M' },
          standard: { crf: 25, bitrate: '3M' }
        };
        const settings = qualitySettings[quality as keyof typeof qualitySettings] || qualitySettings.standard;

        command
          .outputOptions([
            '-c:v libx264',
            '-preset fast',
            '-profile:v high',
            `-crf ${settings.crf}`,
            `-b:v ${settings.bitrate}`,
            '-pix_fmt yuv420p',
            '-movflags +faststart',
            '-y'
          ])
          .output(outputPath)
          .on('end', () => resolve({ filename: outputFilename, outputPath }))
          .on('error', reject)
          .run();
      }
    }
  });
}

/**
 * Creates a video input for FFmpeg with scaling and padding
 * 
 * @param command - FFmpeg command instance
 * @param imagePath - Path to the image file
 * @param duration - Duration in seconds
 * @param index - Input index
 * @param width - Target width
 * @param height - Target height
 * @param fps - Frames per second
 */
export function addVideoInput(
  command: ffmpeg.FfmpegCommand,
  imagePath: string,
  duration: number,
  index: number,
  width: number,
  height: number,
  fps: number
): void {
  command.input(imagePath).inputOptions(['-loop', '1', '-t', String(duration)]);
  
  // Add scale and pad filter for this input
  const filterString = `[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${fps}[v${index}]`;
  
  console.log(`🎞️ [FFMPEG] Input ${index}: ${imagePath}, duration=${duration}s, filter=${filterString}`);
}

/**
 * Generates a simple slideshow with transitions
 * 
 * @param images - Array of image files
 * @param transitions - Array of transitions
 * @param frameDurations - Array of frame durations in milliseconds
 * @param outputPath - Output file path
 * @param settings - Export settings
 * @returns Promise resolving when export is complete
 */
export function generateSlideshow(
  images: ImageFile[],
  transitions: Transition[] | undefined,
  frameDurations: number[],
  outputPath: string,
  settings: {
    width: number;
    height: number;
    fps: number;
    crf: number;
    bitrate: string;
    preset?: string;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!images || images.length === 0) {
      return reject(new Error('No images provided'));
    }

    const defaultDuration = 3000; // 3 seconds default
    const command = ffmpeg();
    const complexFilter: string[] = [];

    // Calculate optimal input durations
    const durationCalc = calculateInputDurations(images, transitions, frameDurations, defaultDuration);
    
    // Add inputs with optimized durations
    images.forEach((image, index) => {
      const inputDuration = durationCalc.inputDurations[index];
      addVideoInput(
        command, 
        image.path || '', 
        inputDuration, 
        index, 
        settings.width, 
        settings.height, 
        settings.fps
      );
    });

    // Build transition chain
    const lastOutput = buildUnifiedTransitionChain(
      images, 
      transitions, 
      frameDurations, 
      defaultDuration, 
      complexFilter
    );

    // Set output options
    command
      .complexFilter(complexFilter)
      .outputOptions([
        '-c:v libx264',
        `-preset ${settings.preset || 'medium'}`,
        '-profile:v high',
        `-crf ${settings.crf}`,
        `-b:v ${settings.bitrate}`,
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      ])
      .map(lastOutput)
      .output(outputPath)
      .on('start', cmd => {
        console.log('FFmpeg started:', cmd);
      })
      .on('progress', progress => {
        console.log(`FFmpeg progress: ${Math.round(progress.percent || 0)}%`);
      })
      .on('end', () => {
        console.log('FFmpeg finished');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Trims a video file
 * 
 * @param videoPath - Path to the video file
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @param outputPath - Output file path
 * @returns Promise resolving when trim is complete
 */
export function trimVideo(
  videoPath: string,
  startTime: number,
  endTime: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('start', cmd => {
        console.log('FFmpeg trim started:', cmd);
      })
      .on('progress', progress => {
        console.log(`FFmpeg trim progress: ${Math.round(progress.percent || 0)}%`);
      })
      .on('end', () => {
        console.log('FFmpeg trim finished');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg trim error:', err);
        reject(err);
      })
      .run();
  });
}

export default {
  getImageDimensions,
  calculateAutoResolution,
  calculateInputDurations,
  buildUnifiedTransitionChain,
  convertMasterToFormat,
  addVideoInput,
  generateSlideshow,
  trimVideo
};
