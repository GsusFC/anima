// Figma plugin types with strict TypeScript

export interface UploadedFileInfo {
  filename: string;
  size?: number;
  mimetype?: string;
  path?: string;
}

export interface ImageFile {
  file: File;
  id: string;
  name: string;
  size: number;
  preview: string;
  uploadedInfo?: UploadedFileInfo;
  addedAt: Date;
}

export interface UploadResponse {
  success: boolean;
  sessionId: string;
  files: UploadedFileInfo[];
  message?: string;
}

export type TransitionType = 'cut' | 'fade' | 'slide' | 'zoom' | 'dissolve';

export interface TransitionConfig {
  type: TransitionType;
  duration: number;
}

export interface TimelineItem {
  id: string;
  imageId: string;
  duration: number;
  position: number;
  transition?: TransitionConfig;
  filename?: string; // Backend compatibility
}

export type ExportFormat = 'mp4' | 'gif' | 'webm';
export type ExportQuality = 'low' | 'medium' | 'high';

export interface Resolution {
  width: number;
  height: number;
  preset: string;
}

export interface ExportSettings {
  format: ExportFormat;
  quality: ExportQuality;
  resolution: Resolution;
  fps: number;
  mp4?: {
    fps: number;
    quality: ExportQuality;
    resolution: Resolution;
  };
  webm?: {
    fps: number;
    quality: ExportQuality;
    resolution: Resolution;
  };
}

// Figma plugin specific types
export interface FigmaMessage {
  type: 'request-images' | 'close-plugin' | 'images' | 'error';
  data?: number[][];
  message?: string;
}

export interface Project {
  id: string;
  images: ImageFile[];
  timeline: TimelineItem[];
  exportSettings: ExportSettings;
}

// Configuration presets
export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  exportSettings: ExportSettings;
  defaultDuration: number;
  defaultTransition: TransitionConfig;
}

// Cache interfaces
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface PreviewCache {
  [key: string]: CacheEntry<string>; // timeline hash -> preview URL
} 