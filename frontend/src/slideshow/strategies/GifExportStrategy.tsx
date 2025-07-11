import React from 'react';
import { ExportSettings } from '../types/slideshow.types';
import { ExportStrategy } from './ExportStrategy';

/**
 * GIF Export Strategy
 * Handles GIF-specific export controls and settings
 */
export class GifExportStrategy extends ExportStrategy {
  
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
          🎨 GIF Settings
        </div>
        
        {/* Loop Settings */}
        <div style={{ marginBottom: '12px' }}>
          <label style={this.createLabel()}>
            Loop Behavior
          </label>
          <select
            value={exportSettings.loop ? 'infinite' : '1'}
            onChange={(e) => updateExportSettings({ loop: e.target.value === 'infinite' })}
            style={this.createInputStyle()}
          >
            <option value="infinite">🔄 Infinite Loop</option>
            <option value="1">⏹️ Play Once</option>
          </select>
        </div>

        {/* Dithering */}
        <div style={{ marginBottom: '12px' }}>
          <label style={this.createLabel()}>
            Dithering Algorithm
          </label>
          <select
            value={exportSettings.gif?.dither || 'floyd_steinberg'}
            onChange={(e) => updateExportSettings({ 
              gif: { 
                ...exportSettings.gif, 
                dither: e.target.value as 'none' | 'bayer' | 'floyd_steinberg' | 'sierra2' | 'sierra2_4a'
              } 
            })}
            style={this.createInputStyle()}
          >
            <option value="floyd_steinberg">Floyd-Steinberg (Best Quality)</option>
            <option value="bayer">Bayer (Fast)</option>
            <option value="sierra2">Sierra2 (Balanced)</option>
            <option value="sierra2_4a">Sierra2-4A (Smooth)</option>
            <option value="none">No Dithering</option>
          </select>
        </div>

        {/* Color Palette */}
        <div style={{ marginBottom: '0' }}>
          <label style={this.createLabel()}>
            Color Palette Size
          </label>
          <select
            value={exportSettings.gif?.colors || 256}
            onChange={(e) => updateExportSettings({ 
              gif: { 
                ...exportSettings.gif, 
                colors: parseInt(e.target.value) as 16 | 32 | 64 | 128 | 256
              } 
            })}
            style={this.createInputStyle()}
          >
            <option value={256}>256 Colors (Max Quality)</option>
            <option value={128}>128 Colors (Balanced)</option>
            <option value={64}>64 Colors (Smaller Size)</option>
            <option value={32}>32 Colors (Small Size)</option>
            <option value={16}>16 Colors (Minimal)</option>
          </select>
        </div>
      </div>
    );
  }

  getDefaults(): Partial<ExportSettings> {
    return {
      format: 'gif',
      quality: 'high',
      loop: true,
      gif: {
        dither: 'floyd_steinberg',
        colors: 256
      }
    };
  }

  validate(settings: ExportSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate GIF-specific settings
    if (settings.gif) {
      if (settings.gif.colors && ![16, 32, 64, 128, 256].includes(settings.gif.colors)) {
        errors.push('Tamaño de paleta de colores inválido. Debe ser 16, 32, 64, 128 o 256.');
      }

      if (settings.gif.dither && !['none', 'bayer', 'floyd_steinberg', 'sierra2', 'sierra2_4a'].includes(settings.gif.dither)) {
        errors.push('Algoritmo de dithering inválido.');
      }
    }

    // Updated FPS validation for GIF - now consistent with new validation system
    if (settings.fps && settings.fps > 50) {
      errors.push('FPS para GIF debe ser 50 o menor para mejor compatibilidad.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getFileExtension(): string {
    return 'gif';
  }

  getDisplayName(): string {
    return 'Animated GIF';
  }

  getDescription(): string {
    return 'Compressed animated image format, perfect for web sharing and social media. Smaller file sizes but limited color palette.';
  }

  getSupportedQualities(): Array<'low' | 'medium' | 'high' | 'ultra'> {
    return ['low', 'medium', 'high']; // Ultra not typically useful for GIF
  }

  getRecommendedHint(): string {
    return '💡 For best results: Use 256 colors with Floyd-Steinberg dithering. Keep FPS at 24 or lower for smooth playback.';
  }
}
