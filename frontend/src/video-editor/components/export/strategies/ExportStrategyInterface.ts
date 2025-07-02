import { VideoExportSettings } from '../../../types/video-editor.types';

export interface ExportRequest {
  videoPath: string;
  startTime: number;
  endTime: number;
  settings: VideoExportSettings;
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

export interface ExportStrategy {
  format: string;
  displayName: string;
  defaultSettings: Partial<VideoExportSettings>;
  
  // Validation
  validateSettings(settings: VideoExportSettings): string | null;
  
  // Estimation
  estimateFileSize(duration: number, settings: VideoExportSettings): string;
  
  // Export execution
  execute(request: ExportRequest): Promise<ExportResult>;
}
