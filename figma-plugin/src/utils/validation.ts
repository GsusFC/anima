import { TimelineItem, ImageFile, ExportSettings } from '../types/slideshow.types';

/**
 * Validation utilities for plugin data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate timeline items
 */
export const validateTimeline = (
  timeline: TimelineItem[],
  images: ImageFile[]
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (timeline.length === 0) {
    errors.push('Timeline is empty');
  }

  if (images.length === 0) {
    errors.push('No images available');
  }

  // Check if all timeline items have corresponding images
  timeline.forEach((item, index) => {
    const image = images.find(img => img.id === item.imageId);
    if (!image) {
      errors.push(`Timeline item ${index + 1} references missing image: ${item.imageId}`);
    }

    // Validate durations
    if (item.duration < 100) {
      warnings.push(`Timeline item ${index + 1} has very short duration (${item.duration}ms)`);
    }
    if (item.duration > 10000) {
      warnings.push(`Timeline item ${index + 1} has very long duration (${item.duration}ms)`);
    }

    // Validate transitions
    if (item.transition) {
      if (item.transition.duration < 0) {
        errors.push(`Timeline item ${index + 1} has negative transition duration`);
      }
      if (item.transition.duration > item.duration) {
        warnings.push(`Timeline item ${index + 1} transition duration exceeds frame duration`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate export settings
 */
export const validateExportSettings = (settings: ExportSettings): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const validFormats = ['mp4', 'gif', 'webm'];
  if (!validFormats.includes(settings.format)) {
    errors.push(`Invalid format: ${settings.format}. Must be one of: ${validFormats.join(', ')}`);
  }

  const validQualities = ['web', 'standard', 'high', 'premium', 'ultra'];
  if (!validQualities.includes(settings.quality)) {
    errors.push(`Invalid quality: ${settings.quality}. Must be one of: ${validQualities.join(', ')}`);
  }

  if (settings.resolution) {
    if (settings.resolution.width < 100 || settings.resolution.height < 100) {
      errors.push('Resolution too small (minimum 100x100)');
    }
    if (settings.resolution.width > 4096 || settings.resolution.height > 4096) {
      warnings.push('Very high resolution may cause performance issues');
    }
  }

  if (settings.fps && (settings.fps < 1 || settings.fps > 120)) {
    errors.push('FPS must be between 1 and 120');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate session data before export
 */
export const validateExportData = (
  sessionId: string,
  timeline: TimelineItem[],
  images: ImageFile[],
  settings: ExportSettings
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sessionId) {
    errors.push('No session ID available');
  }

  // Validate timeline
  const timelineResult = validateTimeline(timeline, images);
  errors.push(...timelineResult.errors);
  warnings.push(...timelineResult.warnings);

  // Validate settings
  const settingsResult = validateExportSettings(settings);
  errors.push(...settingsResult.errors);
  warnings.push(...settingsResult.warnings);

  // Check if images are uploaded
  const missingUploads = images.filter(img => !img.uploadedInfo);
  if (missingUploads.length > 0) {
    errors.push(`${missingUploads.length} images not uploaded to backend`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get human-readable validation summary
 */
export const getValidationSummary = (result: ValidationResult): string => {
  if (result.isValid) {
    return result.warnings.length > 0 
      ? `Ready to export (${result.warnings.length} warnings)`
      : 'Ready to export';
  }
  
  return `Cannot export: ${result.errors.length} error(s)`;
};
