// Figma API service with enhanced export functionality
import { ExportSettings } from '@shared/types';

export class FigmaAPIService {

  async exportFrame(
    frameId: string,
    settings: ExportSettings
  ): Promise<Uint8Array> {
    const frame = figma.getNodeById(frameId) as FrameNode;

    if (!frame || frame.type !== 'FRAME') {
      throw new Error(`Frame with ID ${frameId} not found`);
    }

    // Validate frame is exportable
    if (!frame.visible) {
      throw new Error(`Frame "${frame.name}" is not visible`);
    }

    if (frame.locked) {
      console.warn(`⚠️ Frame "${frame.name}" is locked but will be exported`);
    }

    // Prepare export settings according to Figma API
    const exportSettings: ExportSettingsImage = {
      format: settings.format,
      constraint: {
        type: 'SCALE',
        value: settings.scale
      },
      ...(settings.format === 'JPG' && {
        quality: Math.max(0.1, Math.min(1.0, settings.quality))
      }),
      useAbsoluteBounds: settings.useAbsoluteBounds || false,
      contentsOnly: settings.contentsOnly || false
    };

    try {
      console.log(`📸 Exporting frame "${frame.name}" (${frame.width}x${frame.height}) at ${settings.scale}x scale`);

      const startTime = performance.now();
      const imageData = await frame.exportAsync(exportSettings);
      const exportTime = performance.now() - startTime;

      console.log(`✅ Frame exported in ${exportTime.toFixed(2)}ms, size: ${this.formatFileSize(imageData.length)}`);

      return imageData;
    } catch (error) {
      console.error(`❌ Export failed for frame ${frame.name}:`, error);
      throw new Error(`Failed to export frame "${frame.name}": ${error.message}`);
    }
  }

  async exportFramesBatch(
    frameIds: string[],
    settings: ExportSettings,
    onProgress?: (current: number, total: number, frameName: string) => void
  ): Promise<Map<string, Uint8Array>> {
    const results = new Map<string, Uint8Array>();

    for (let i = 0; i < frameIds.length; i++) {
      const frameId = frameIds[i];
      const frame = figma.getNodeById(frameId) as FrameNode;

      if (onProgress) {
        onProgress(i + 1, frameIds.length, frame?.name || 'Unknown');
      }

      try {
        const imageData = await this.exportFrame(frameId, settings);
        results.set(frameId, imageData);

        // Small delay to prevent overwhelming Figma
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Failed to export frame ${frameId}:`, error);
        // Continue with other frames
      }
    }

    return results;
  }

  getFrameMetadata(frameId: string): any {
    const frame = figma.getNodeById(frameId) as FrameNode;

    if (!frame) {
      return null;
    }

    return {
      id: frame.id,
      name: frame.name,
      width: Math.round(frame.width),
      height: Math.round(frame.height),
      x: Math.round(frame.x),
      y: Math.round(frame.y),
      fills: frame.fills,
      effects: frame.effects,
      visible: frame.visible,
      locked: frame.locked,
      cornerRadius: frame.cornerRadius,
      layoutMode: frame.layoutMode,
      childrenCount: frame.children.length,
      aspectRatio: frame.width / frame.height,
      estimatedComplexity: this.estimateFrameComplexity(frame)
    };
  }

  private estimateFrameComplexity(frame: FrameNode): 'low' | 'medium' | 'high' {
    let complexity = 0;

    // Count nodes
    const nodeCount = this.countNodes(frame);
    complexity += Math.min(nodeCount / 10, 3); // Max 3 points for node count

    // Check for effects
    if (frame.effects && frame.effects.length > 0) {
      complexity += 1;
    }

    // Check for complex fills
    if (frame.fills && frame.fills.some(fill => fill.type !== 'SOLID')) {
      complexity += 1;
    }

    // Check for images
    if (this.hasImages(frame)) {
      complexity += 1;
    }

    if (complexity < 2) return 'low';
    if (complexity < 4) return 'medium';
    return 'high';
  }

  private countNodes(node: SceneNode): number {
    let count = 1;

    if ('children' in node) {
      for (const child of node.children) {
        count += this.countNodes(child);
      }
    }

    return count;
  }

  private hasImages(frame: FrameNode): boolean {
    return this.findNodesByType(frame, 'IMAGE').length > 0;
  }

  private findNodesByType(node: SceneNode, type: string): SceneNode[] {
    const results: SceneNode[] = [];

    if (node.type === type) {
      results.push(node);
    }

    if ('children' in node) {
      for (const child of node.children) {
        results.push(...this.findNodesByType(child, type));
      }
    }

    return results;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  }

  // Utility methods for frame validation
  validateFrameForExport(frameId: string): { valid: boolean; reason?: string } {
    const frame = figma.getNodeById(frameId) as FrameNode;

    if (!frame) {
      return { valid: false, reason: 'Frame not found' };
    }

    if (frame.type !== 'FRAME') {
      return { valid: false, reason: 'Node is not a frame' };
    }

    if (!frame.visible) {
      return { valid: false, reason: 'Frame is not visible' };
    }

    if (frame.width < 1 || frame.height < 1) {
      return { valid: false, reason: 'Frame has invalid dimensions' };
    }

    if (frame.width > 8000 || frame.height > 8000) {
      return { valid: false, reason: 'Frame is too large (max 8000px)' };
    }

    return { valid: true };
  }

  // Get optimal export settings based on frame characteristics
  getOptimalExportSettings(frameId: string): Partial<ExportSettings> {
    const frame = figma.getNodeById(frameId) as FrameNode;

    if (!frame) {
      return {};
    }

    const complexity = this.estimateFrameComplexity(frame);
    const size = frame.width * frame.height;

    // Suggest optimal settings based on frame characteristics
    const settings: Partial<ExportSettings> = {};

    // Format suggestion
    const hasTransparency = this.hasTransparentElements(frame);
    settings.format = hasTransparency ? 'PNG' : 'JPG';

    // Scale suggestion based on size
    if (size > 2000000) { // > 2MP
      settings.scale = 1;
    } else if (size > 500000) { // > 0.5MP
      settings.scale = 2;
    } else {
      settings.scale = 3;
    }

    // Quality suggestion
    if (settings.format === 'JPG') {
      settings.quality = complexity === 'high' ? 0.9 : 0.8;
    }

    return settings;
  }

  private hasTransparentElements(frame: FrameNode): boolean {
    // Check if frame or any child has transparency
    if (frame.opacity < 1) return true;

    if (frame.fills) {
      const hasTransparentFill = frame.fills.some(fill =>
        fill.type === 'SOLID' && fill.opacity < 1
      );
      if (hasTransparentFill) return true;
    }

    // Check children recursively
    return frame.children.some(child => {
      if ('opacity' in child && child.opacity < 1) return true;
      if ('fills' in child && child.fills) {
        return child.fills.some(fill =>
          fill.type === 'SOLID' && fill.opacity < 1
        );
      }
      return false;
    });
  }
}
