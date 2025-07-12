// Export controller with real functionality
import { ExportSettings, ExportProgress, ExportResult, FrameExportResult } from '@shared/types';
import { FigmaAPIService } from '../services/FigmaAPIService';
import { AnimaGenAPIService } from '../services/AnimaGenAPIService';
import { PerformanceOptimizer } from '../utils/PerformanceOptimizer';
import { ErrorHandler } from '../utils/ErrorHandler';

export class ExportController {
  private figmaService: FigmaAPIService;
  private animaGenService: AnimaGenAPIService;
  private performanceOptimizer: PerformanceOptimizer;
  private isExporting = false;
  private currentExportId: string | null = null;

  constructor() {
    this.figmaService = new FigmaAPIService();
    this.animaGenService = new AnimaGenAPIService();
    this.performanceOptimizer = new PerformanceOptimizer();
  }

  async exportFrames(
    frameIds: string[],
    settings: ExportSettings
  ): Promise<ExportResult> {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    this.isExporting = true;
    this.currentExportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`🚀 Starting export of ${frameIds.length} frames`);
      
      // Validate frames and settings
      await this.validateExportRequest(frameIds, settings);
      
      // Send initial progress
      this.sendProgress({
        stage: 'preparing',
        current: 0,
        total: frameIds.length,
        message: 'Preparing export...',
        exportId: this.currentExportId,
        percentage: 0,
        estimatedTimeRemaining: this.estimateExportTime(frameIds, settings)
      });

      // Export frames in optimized batches
      const frameResults = await this.performanceOptimizer.processInBatches(
        frameIds,
        async (frameId, index) => {
          return this.exportSingleFrame(frameId, settings, index, frameIds.length);
        },
        settings.batchSize || 3
      );

      // Filter successful exports
      const successfulExports = frameResults.filter(result => result.success);

      if (successfulExports.length === 0) {
        throw new Error('No frames were successfully exported');
      }

      // Send upload progress
      this.sendProgress({
        stage: 'uploading',
        current: successfulExports.length,
        total: frameIds.length,
        message: 'Uploading to AnimaGen...',
        exportId: this.currentExportId,
        percentage: 80
      });

      // Upload to AnimaGen
      const uploadResult = await this.animaGenService.uploadFrames(
        successfulExports,
        settings
      );

      const result: ExportResult = {
        success: true,
        exportId: this.currentExportId,
        sessionId: uploadResult.sessionId,
        projectId: uploadResult.projectId,
        projectUrl: uploadResult.projectUrl,
        framesExported: successfulExports.length,
        framesTotal: frameIds.length,
        failedFrames: frameResults.filter(r => !r.success).map(r => r.frameId),
        uploadResult,
        exportTime: Date.now(),
        settings
      };

      // Send final result to UI
      figma.ui.postMessage({
        type: 'export-complete',
        data: result
      });

      console.log(`✅ Export completed: ${frameIds.length} frames`);
      return result;

    } catch (error) {
      console.error('❌ Export failed:', error);
      
      const errorResult: ExportResult = {
        success: false,
        exportId: this.currentExportId,
        error: error.message,
        framesExported: 0,
        framesTotal: frameIds.length,
        exportTime: Date.now(),
        settings
      };

      figma.ui.postMessage({
        type: 'export-error',
        data: errorResult
      });

      throw error;

    } finally {
      this.isExporting = false;
      this.currentExportId = null;
    }
  }

  private async exportSingleFrame(
    frameId: string,
    settings: ExportSettings,
    index: number,
    total: number
  ): Promise<FrameExportResult> {
    try {
      const frame = figma.getNodeById(frameId) as FrameNode;

      if (!frame || frame.type !== 'FRAME') {
        throw new Error(`Frame ${frameId} not found or invalid`);
      }

      // Send progress update
      this.sendProgress({
        stage: 'exporting',
        current: index + 1,
        total,
        message: `Exporting "${frame.name}"...`,
        frameName: frame.name,
        exportId: this.currentExportId,
        percentage: Math.round(((index + 1) / total) * 70) // 70% for export phase
      });

      // Export frame data using Figma API
      const imageData = await this.figmaService.exportFrame(frameId, settings);
      const metadata = this.figmaService.getFrameMetadata(frameId);

      return {
        success: true,
        frameId,
        frameName: frame.name,
        imageData,
        metadata,
        order: index,
        exportTime: Date.now(),
        fileSize: imageData.length
      };

    } catch (error) {
      console.error(`Failed to export frame ${frameId}:`, error);

      return {
        success: false,
        frameId,
        frameName: 'Unknown',
        error: error.message,
        order: index,
        exportTime: Date.now()
      };
    }
  }

  private async validateExportRequest(
    frameIds: string[],
    settings: ExportSettings
  ): Promise<void> {
    if (frameIds.length === 0) {
      throw new Error('No frames selected for export');
    }

    if (frameIds.length > 20) {
      throw new Error('Maximum 20 frames can be exported at once');
    }

    // Validate each frame exists and is exportable
    for (const frameId of frameIds) {
      const frame = figma.getNodeById(frameId);
      if (!frame || frame.type !== 'FRAME') {
        throw new Error(`Frame ${frameId} not found or invalid`);
      }
      
      if (!frame.visible) {
        throw new Error(`Frame "${frame.name}" is not visible`);
      }
    }

    // Validate settings
    if (!['PNG', 'JPG'].includes(settings.format)) {
      throw new Error('Invalid export format');
    }

    if (![1, 2, 3, 4].includes(settings.scale)) {
      throw new Error('Invalid export scale');
    }
  }

  private sendProgress(progress: ExportProgress): void {
    figma.ui.postMessage({
      type: 'export-progress',
      data: progress
    });
  }

  private estimateExportTime(frameIds: string[], settings: ExportSettings): number {
    const baseTimePerFrame = 2000; // 2 seconds base
    const scaleMultiplier = settings.scale * 0.5;
    const formatMultiplier = settings.format === 'PNG' ? 1.2 : 1.0;
    
    return Math.round(
      frameIds.length * baseTimePerFrame * scaleMultiplier * formatMultiplier
    );
  }

  cancelExport(): void {
    if (this.isExporting && this.currentExportId) {
      console.log(`🛑 Cancelling export ${this.currentExportId}`);
      
      this.isExporting = false;
      
      figma.ui.postMessage({
        type: 'export-cancelled',
        data: {
          exportId: this.currentExportId,
          message: 'Export cancelled by user'
        }
      });
      
      this.currentExportId = null;
    }
  }

  isExportInProgress(): boolean {
    return this.isExporting;
  }

  getCurrentExportId(): string | null {
    return this.currentExportId;
  }
}
