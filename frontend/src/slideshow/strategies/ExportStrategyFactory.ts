import { ExportStrategy } from './ExportStrategy';
import { GifExportStrategy } from './GifExportStrategy';
import { Mp4ExportStrategy, WebmExportStrategy, MovExportStrategy } from './VideoExportStrategy';

/**
 * Factory for creating export strategies
 * Implements the Factory pattern to instantiate the correct strategy based on format
 */
export class ExportStrategyFactory {
  private static strategies: Map<string, ExportStrategy> = new Map();

  /**
   * Create or get cached strategy instance for the given format
   */
  static create(format: string): ExportStrategy {
    // Use cached instance if available
    if (this.strategies.has(format)) {
      return this.strategies.get(format)!;
    }

    // Create new strategy instance
    let strategy: ExportStrategy;

    switch (format.toLowerCase()) {
      case 'gif':
        strategy = new GifExportStrategy();
        break;
      case 'mp4':
        strategy = new Mp4ExportStrategy();
        break;
      case 'webm':
        strategy = new WebmExportStrategy();
        break;
      case 'mov':
        strategy = new MovExportStrategy();
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Cache the strategy
    this.strategies.set(format, strategy);
    return strategy;
  }

  /**
   * Get all supported formats
   */
  static getSupportedFormats(): string[] {
    return ['gif', 'mp4', 'webm', 'mov'];
  }

  /**
   * Check if format is supported
   */
  static isFormatSupported(format: string): boolean {
    return this.getSupportedFormats().includes(format.toLowerCase());
  }

  /**
   * Get strategy without caching (for testing or special cases)
   */
  static createFresh(format: string): ExportStrategy {
    switch (format.toLowerCase()) {
      case 'gif':
        return new GifExportStrategy();
      case 'mp4':
        return new Mp4ExportStrategy();
      case 'webm':
        return new WebmExportStrategy();
      case 'mov':
        return new MovExportStrategy();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Clear strategy cache (useful for testing or memory management)
   */
  static clearCache(): void {
    this.strategies.clear();
  }

  /**
   * Get all cached strategies
   */
  static getCachedStrategies(): Map<string, ExportStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Preload all strategies (useful for performance optimization)
   */
  static preloadAll(): void {
    this.getSupportedFormats().forEach(format => {
      this.create(format);
    });
  }

  /**
   * Get format display names for UI
   */
  static getFormatDisplayNames(): { [key: string]: string } {
    return {
      'gif': 'Animated GIF',
      'mp4': 'MP4 Video',
      'webm': 'WebM Video', 
      'mov': 'MOV Video'
    };
  }

  /**
   * Get format descriptions for UI
   */
  static getFormatDescriptions(): { [key: string]: string } {
    return {
      'gif': 'Perfect for web sharing and social media',
      'mp4': 'Most compatible format for all devices',
      'webm': 'Optimized for web with smaller file sizes',
      'mov': 'Professional quality for video editing'
    };
  }

  /**
   * Get recommended format based on use case
   */
  static getRecommendedFormat(useCase: 'web' | 'social' | 'professional' | 'general'): string {
    switch (useCase) {
      case 'web':
        return 'webm';
      case 'social':
        return 'gif';
      case 'professional':
        return 'mov';
      case 'general':
      default:
        return 'mp4';
    }
  }
}
