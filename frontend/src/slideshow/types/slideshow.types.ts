// Slideshow Types - Professional Architecture

export interface ImageFile {
  file: File;
  id: string;
  name: string;
  size: number;
  preview: string; // data URL for preview
  uploadedInfo?: UploadedImageInfo;
  addedAt: Date;
}

export interface UploadedImageInfo {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface TimelineItem {
  id: string;
  imageId: string; // Reference to ImageFile
  duration: number; // milliseconds
  position: number; // order in timeline
  transition?: TransitionConfig;
}

export interface TransitionConfig {
  type: TransitionType;
  duration: number; // milliseconds
}

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'dissolve' | 'cut';

export interface SlideshowProject {
  id: string;
  images: ImageFile[];
  timeline: TimelineItem[];
  exportSettings: ExportSettings;
  sessionId: string;
}

export interface ExportSettings {
  format: 'gif' | 'mp4' | 'webm';
  preset: 'web' | 'quality' | 'size' | 'social' | 'custom';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  resolution: {
    width: number;
    height: number;
    preset: 'original' | '480p' | '720p' | '1080p' | '4k' | 'custom';
  };
  loop: boolean;
  tags: {[key: string]: string};
  bitrate?: number;
  fastStart?: boolean;
  optimizeSize?: boolean;
  filename?: string;
  gif?: {
    dither?: 'none' | 'bayer' | 'floyd_steinberg' | 'sierra2' | 'sierra2_4a';
    colors?: 16 | 32 | 64 | 128 | 256;
  };
}

export interface PreviewState {
  url: string | null;
  isGenerating: boolean;
  error: string | null;
}

export interface ExportState {
  isExporting: boolean;
  progress: number;
  lastResult: string | null;
  error: string | null;
  currentStep?: string;
}

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
  filename: string;
  compositionId?: string;
}
