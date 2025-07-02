import { ExportStrategy, ExportRequest, ExportResult } from './ExportStrategyInterface';
import { VideoExportSettings } from '../../../types/video-editor.types';

export class GIFExportStrategy implements ExportStrategy {
  format = 'gif';
  displayName = 'GIF';
  
  defaultSettings: Partial<VideoExportSettings> = {
    format: 'gif',
    quality: 'standard',
    fps: 15, // Lower default FPS for GIFs
    resolution: {
      width: 640,
      height: 360,
      preset: 'medium'
    },
    gif: {
      loop: 'infinite',
      colors: 256,
      dither: true
    }
  };

  validateSettings(settings: VideoExportSettings): string | null {
    if (settings.fps && (settings.fps < 1 || settings.fps > 30)) {
      return 'GIF FPS should be between 1 and 30 for optimal file size';
    }
    
    if (settings.resolution.width > 1920 || settings.resolution.height > 1080) {
      return 'GIF resolution should not exceed 1920x1080 for reasonable file size';
    }
    
    if (settings.gif?.colors && (settings.gif.colors < 2 || settings.gif.colors > 256)) {
      return 'GIF colors must be between 2 and 256';
    }
    
    return null;
  }

  estimateFileSize(duration: number, settings: VideoExportSettings): string {
    // GIFs are generally larger per second than video
    const baseMbPerSecond = settings.quality === 'web' ? 1.0 : 
                           settings.quality === 'standard' ? 2.0 :
                           settings.quality === 'high' ? 4.0 : 6.0;
    
    // Factor in resolution and colors
    const pixelCount = settings.resolution.width * settings.resolution.height;
    const resolutionFactor = pixelCount / (640 * 360); // Baseline
    const colorFactor = (settings.gif?.colors || 256) / 256;
    
    return (duration * baseMbPerSecond * resolutionFactor * colorFactor).toFixed(1);
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
      fps: request.settings.fps,
      gif: request.settings.gif
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
        error: `GIF export failed: ${response.statusText}`
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
        error: 'GIF export failed: No download URL received'
      };
    }
  }
}
