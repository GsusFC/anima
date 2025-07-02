// Simple subset of types for use within the Figma plugin

export interface UploadedFileInfo {
  filename: string;
  [key: string]: any;
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
}

export interface TransitionConfig {
  type: string;
  duration: number;
}

export interface TimelineItem {
  id: string;
  imageId: string;
  duration: number;
  position: number;
  transition?: TransitionConfig;
}

export interface ExportSettings {
  format: 'mp4' | 'gif' | 'webm';
  quality: 'low' | 'medium' | 'high';
  resolution: { width: number; height: number; preset: string };
  fps: number;
} 