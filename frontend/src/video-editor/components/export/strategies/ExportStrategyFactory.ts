import { ExportStrategy } from './ExportStrategyInterface';
import { MP4ExportStrategy } from './MP4ExportStrategy';
import { GIFExportStrategy } from './GIFExportStrategy';
import { WebMExportStrategy } from './WebMExportStrategy';

export class ExportStrategyFactory {
  private static strategies: Map<string, ExportStrategy> = new Map([
    ['mp4', new MP4ExportStrategy()],
    ['gif', new GIFExportStrategy()],
    ['webm', new WebMExportStrategy()]
  ]);

  static getStrategy(format: string): ExportStrategy | null {
    return this.strategies.get(format.toLowerCase()) || null;
  }

  static getAllStrategies(): ExportStrategy[] {
    return Array.from(this.strategies.values());
  }

  static getSupportedFormats(): string[] {
    return Array.from(this.strategies.keys());
  }

  static getDefaultSettingsForFormat(format: string) {
    const strategy = this.getStrategy(format);
    return strategy?.defaultSettings || {};
  }
}
