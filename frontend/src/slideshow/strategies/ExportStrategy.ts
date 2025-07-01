import React from 'react';
import { ExportSettings } from '../types/slideshow.types';

/**
 * Abstract base class for export strategies
 * Implements the Strategy pattern for different export formats
 */
export abstract class ExportStrategy {
  /**
   * Render format-specific controls
   */
  abstract renderControls(
    exportSettings: ExportSettings,
    updateExportSettings: (updates: Partial<ExportSettings>) => void
  ): React.ReactElement | null;

  /**
   * Get default settings for this format
   */
  abstract getDefaults(): Partial<ExportSettings>;

  /**
   * Validate settings for this format
   */
  abstract validate(settings: ExportSettings): {
    isValid: boolean;
    errors: string[];
  };

  /**
   * Get format-specific file extension
   */
  abstract getFileExtension(): string;

  /**
   * Get format display name
   */
  abstract getDisplayName(): string;

  /**
   * Get format description
   */
  abstract getDescription(): string;

  /**
   * Get supported quality levels for this format
   */
  abstract getSupportedQualities(): Array<'low' | 'medium' | 'high' | 'ultra'>;

  /**
   * Get recommended settings hint
   */
  abstract getRecommendedHint(): string;

  /**
   * Common utility method for creating styled containers
   */
  protected createContainer(
    _title: string,
    _icon: string,
    borderColor: string = '#ec4899'
  ): Pick<React.CSSProperties, 'marginBottom' | 'padding' | 'backgroundColor' | 'border' | 'borderRadius'> {
    return {
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: '#0f172a',
      border: `1px solid ${borderColor}`,
      borderRadius: '6px'
    };
  }

  /**
   * Common utility method for creating section titles
   */
  protected createSectionTitle(
    _title: string,
    _icon: string,
    color: string = '#ec4899'
  ): React.CSSProperties {
    return {
      fontSize: '11px',
      color,
      fontWeight: 'bold',
      marginBottom: '12px',
      fontFamily: '"Space Mono", monospace',
      textTransform: 'uppercase'
    };
  }

  /**
   * Common utility method for creating input labels
   */
  protected createLabel(): React.CSSProperties {
    return {
      display: 'block',
      fontSize: '10px',
      color: '#9ca3af',
      marginBottom: '6px',
      fontFamily: '"Space Mono", monospace'
    };
  }

  /**
   * Common utility method for creating select/input styles
   */
  protected createInputStyle(): React.CSSProperties {
    return {
      width: '100%',
      padding: '6px',
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '4px',
      color: 'white',
      fontSize: '10px',
      fontFamily: '"Space Mono", monospace'
    };
  }
}
