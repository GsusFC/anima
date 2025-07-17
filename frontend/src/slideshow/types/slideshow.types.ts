// Slideshow Types - Professional Architecture
// Extends unified base types for slideshow-specific functionality

import {
  BaseFile,
  BaseUploadedInfo,
  BaseTimelineItem,
  BaseTransition,
  BaseExportSettings,
  BaseExportState,
  BasePreviewState,
  BaseProject,
  BaseResolution
} from '../../shared/types/unified.types';

// Slideshow-specific image file interface
export interface ImageFile extends BaseFile {
  type: 'image';
  preview: string; // data URL for preview
  uploadedInfo?: UploadedImageInfo;
  addedAt: Date;
}

// Slideshow-specific uploaded info
export interface UploadedImageInfo extends BaseUploadedInfo {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
}

// Slideshow-specific timeline item
export interface TimelineItem extends BaseTimelineItem {
  imageId: string; // Reference to ImageFile
  transition?: TransitionConfig;
}

// Slideshow-specific transition configuration
export interface TransitionConfig extends BaseTransition {
  type: TransitionType;
}

export type TransitionType = 
  // Básicas
  | 'cut' | 'fade' | 'dissolve' | 'fadeblack' | 'fadewhite'
  // Slides
  | 'slideleft' | 'slideright' | 'slideup' | 'slidedown'
  // Wipes
  | 'wipeleft' | 'wiperight' | 'wipeup' | 'wipedown' | 'wipetl' | 'wipetr'
  // Efectos especiales
  | 'zoomin' | 'circleopen' | 'circleclose' | 'radial' | 'pixelize' | 'hblur'
  // Legacy (mantener compatibilidad)
  | 'slide' | 'zoom';

// Slideshow-specific project interface
export interface SlideshowProject extends BaseProject<TimelineItem, ExportSettings> {
  images: ImageFile[];
  sessionId: string;
}

// Slideshow-specific export settings
export interface ExportSettings extends BaseExportSettings {
  format: 'gif' | 'mp4' | 'webm' | 'mov';
  preset: 'web' | 'quality' | 'size' | 'social' | 'custom';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  resolution: BaseResolution;
  loop: boolean;
  tags: {[key: string]: string};
  bitrate?: number;
  fastStart?: boolean;
  optimizeSize?: boolean;
  gif?: {
    dither?: 'none' | 'bayer' | 'floyd_steinberg' | 'sierra2' | 'sierra2_4a';
    colors?: 16 | 32 | 64 | 128 | 256;
    loop?: boolean | string;
  };
}

// Slideshow-specific preview state
export interface PreviewState extends BasePreviewState {
  progress?: number;
  stage?: string;
}

// Slideshow-specific export state
export interface ExportState extends BaseExportState {
  lastResult: string | null;
  filename?: string;
}

// Slideshow-specific application state
export interface SlideshowState {
  project: SlideshowProject;
  preview: PreviewState;
  export: ExportState;
  isUploading: boolean;
  dragActive: boolean;
}

// API Response types
export interface UploadResponse {
  success: boolean;
  sessionId: string;
  files: UploadedImageInfo[];
  message: string;
}

export interface PreviewResponse {
  success: boolean;
  previewUrl: string;
  message?: string;
}

export interface ExportResponse {
  success: boolean;
  downloadUrl: string;
  filename?: string;
  jobId?: string; // For unified export system
  compositionId?: string;
}
