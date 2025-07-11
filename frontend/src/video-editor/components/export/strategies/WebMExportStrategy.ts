import { ExportStrategy, ExportRequest, ExportResult } from './ExportStrategyInterface';
import { VideoExportSettings } from '../../../types/video-editor.types';

export class WebMExportStrategy implements ExportStrategy {
  format = 'webm';
  displayName = 'WebM';
  
  defaultSettings: Partial<VideoExportSettings> = {
    format: 'webm',
    quality: 'standard',
    fps: 30,
    resolution: {
      width: 1920,
      height: 1080,
      preset: 'original'
    }
  };

  validateSettings(settings: VideoExportSettings): string | null {
    if (settings.fps && (settings.fps < 1 || settings.fps > 60)) {
      return 'FPS must be between 1 and 60';
    }
    
    if (settings.resolution.width < 128 || settings.resolution.height < 128) {
      return 'Resolution must be at least 128x128';
    }
    
    if (settings.resolution.width > 4096 || settings.resolution.height > 4096) {
      return 'Resolution cannot exceed 4096x4096';
    }
    
    return null;
  }

  estimateFileSize(duration: number, settings: VideoExportSettings): string {
    // WebM typically has better compression than MP4
    const baseMbPerSecond = settings.quality === 'web' ? 0.4 : 
                           settings.quality === 'standard' ? 1.0 :
                           settings.quality === 'high' ? 2.0 : 3.5;
    return (duration * baseMbPerSecond).toFixed(1);
  }

  async execute(request: ExportRequest): Promise<ExportResult> {
    const API_BASE_URL = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : window.location.origin;

    const exportData = {
      videoPath: request.videoPath,
      startTime: request.startTime,
      endTime: request.endTime,
      format: this.format,
      quality: request.settings.quality,
      resolution: request.settings.resolution,
      fps: request.settings.fps
    };

    const response = await fetch(`${API_BASE_URL}/export/${this.format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportData),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `WebM export failed: ${response.statusText}`
      };
    }

    const result = await response.json();
    
    if (result.success && result.downloadUrl) {
      return {
        success: true,
        downloadUrl: result.downloadUrl,
        filename: result.filename
      };
    } else {
      return {
        success: false,
        error: 'WebM export failed: No download URL received'
      };
    }
  }
}
