import React from 'react';
import { ExportSettings } from '../types/slideshow.types';
import { ExportStrategy } from './ExportStrategy';

/**
 * Base Video Export Strategy
 * Handles common video export controls and settings
 */
export abstract class VideoExportStrategy extends ExportStrategy {
  
  renderControls(
    exportSettings: ExportSettings,
    updateExportSettings: (updates: Partial<ExportSettings>) => void
  ): React.ReactElement {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          fontSize: '12px',
          color: '#f3f4f6',
          fontWeight: 'bold',
          fontFamily: '"Space Mono", monospace'
        }}>
          🎬 {this.getDisplayName()} Settings
        </div>
        
        {/* Codec Settings */}
        <div style={{ marginBottom: '12px' }}>
          <label style={this.createLabel()}>
            Video Codec
          </label>
          <select
            value={this.getCodec()}
            onChange={() => {}} // Disabled - codec is format-specific
            disabled
            style={{
              ...this.createInputStyle(),
              opacity: 0.7,
              cursor: 'not-allowed'
            }}
          >
            <option value={this.getCodec()}>{this.getCodec()} (Optimized)</option>
          </select>
        </div>

        {/* Bitrate Settings */}
        <div style={{ marginBottom: '12px' }}>
          <label style={this.createLabel()}>
            Video Bitrate
          </label>
          <select
            value={this.getBitrateFromQuality(exportSettings.quality)}
            onChange={(e) => this.handleBitrateChange(e.target.value, updateExportSettings)}
            style={this.createInputStyle()}
          >
            <option value="1M">1 Mbps (Low Quality)</option>
            <option value="3M">3 Mbps (Medium Quality)</option>
            <option value="5M">5 Mbps (High Quality)</option>
            <option value="8M">8 Mbps (Ultra Quality)</option>
          </select>
        </div>

        {/* CRF Settings for quality-based encoding */}
        <div style={{ marginBottom: '0' }}>
          <label style={this.createLabel()}>
            Quality Mode
          </label>
          <select
            value={exportSettings.quality}
            onChange={(e) => updateExportSettings({ 
              quality: e.target.value as 'low' | 'medium' | 'high' | 'ultra' 
            })}
            style={this.createInputStyle()}
          >
            <option value="low">Fast Encode (Lower Quality)</option>
            <option value="medium">Balanced (Good Quality)</option>
            <option value="high">High Quality (Slower)</option>
            <option value="ultra">Ultra Quality (Slowest)</option>
          </select>
        </div>
      </div>
    );
  }

  /**
   * Get the codec used by this video format
   */
  abstract getCodec(): string;

  /**
   * Get bitrate recommendation based on quality setting
   */
  protected getBitrateFromQuality(quality: string): string {
    switch (quality) {
      case 'low': return '1M';
      case 'medium': return '3M';
      case 'high': return '5M';
      case 'ultra': return '8M';
      default: return '3M';
    }
  }

  /**
   * Handle bitrate change and update quality accordingly
   */
  protected handleBitrateChange(
    bitrate: string, 
    updateExportSettings: (updates: Partial<ExportSettings>) => void
  ): void {
    let quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium';
    
    switch (bitrate) {
      case '1M': quality = 'low'; break;
      case '3M': quality = 'medium'; break;
      case '5M': quality = 'high'; break;
      case '8M': quality = 'ultra'; break;
    }
    
    updateExportSettings({ quality });
  }

  validate(settings: ExportSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate FPS for video
    if (settings.fps && (settings.fps < 1 || settings.fps > 120)) {
      errors.push('FPS must be between 1 and 120 for video formats.');
    }

    // Validate resolution
    if (settings.resolution) {
      if (settings.resolution.width < 1 || settings.resolution.height < 1) {
        errors.push('Resolution must be at least 1x1 pixels.');
      }
      if (settings.resolution.width > 7680 || settings.resolution.height > 4320) {
        errors.push('Resolution cannot exceed 8K (7680x4320).');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getSupportedQualities(): Array<'low' | 'medium' | 'high' | 'ultra'> {
    return ['low', 'medium', 'high', 'ultra'];
  }
}

/**
 * MP4 Export Strategy
 */
export class Mp4ExportStrategy extends VideoExportStrategy {
  getCodec(): string {
    return 'H.264';
  }

  getDefaults(): Partial<ExportSettings> {
    return {
      format: 'mp4',
      quality: 'high',
      fps: 30
    };
  }

  getFileExtension(): string {
    return 'mp4';
  }

  getDisplayName(): string {
    return 'MP4 Video';
  }

  getDescription(): string {
    return 'Most compatible video format. Perfect for sharing, streaming, and playback on all devices and platforms.';
  }

  getRecommendedHint(): string {
    return '💡 MP4 with H.264 codec offers the best compatibility across all devices and platforms.';
  }
}

/**
 * WebM Export Strategy
 */
export class WebmExportStrategy extends VideoExportStrategy {
  getCodec(): string {
    return 'VP9';
  }

  getDefaults(): Partial<ExportSettings> {
    return {
      format: 'webm',
      quality: 'high',
      fps: 30
    };
  }

  getFileExtension(): string {
    return 'webm';
  }

  getDisplayName(): string {
    return 'WebM Video';
  }

  getDescription(): string {
    return 'Open-source video format optimized for web. Smaller file sizes with excellent quality, ideal for web applications.';
  }

  getRecommendedHint(): string {
    return '💡 WebM offers better compression than MP4 but may have limited compatibility on older devices.';
  }
}

/**
 * MOV Export Strategy
 */
export class MovExportStrategy extends VideoExportStrategy {
  getCodec(): string {
    return 'H.264';
  }

  getDefaults(): Partial<ExportSettings> {
    return {
      format: 'mov',
      quality: 'ultra',
      fps: 30
    };
  }

  getFileExtension(): string {
    return 'mov';
  }

  getDisplayName(): string {
    return 'MOV Video';
  }

  getDescription(): string {
    return 'Apple QuickTime format. Best for professional video editing and high-quality archival. Larger file sizes.';
  }

  getRecommendedHint(): string {
    return '💡 MOV format is ideal for professional video editing workflows and Apple ecosystem.';
  }
}
