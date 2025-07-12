// Frame analysis utilities
import { DetectedFrame, FrameAnalysis } from '@shared/types';

export class FrameAnalyzer {
  
  analyzeFrame(frame: FrameNode): FrameAnalysis {
    const complexity = this.calculateComplexity(frame);
    const contentTypes = this.analyzeContentTypes(frame);
    const performance = this.estimatePerformance(frame);
    
    return {
      complexity,
      contentTypes,
      performance,
      nodeCount: this.countNodes(frame),
      hasTransparentBackground: this.hasTransparentBackground(frame),
      dominantColors: this.extractDominantColors(frame),
      estimatedProcessingTime: this.estimateProcessingTime(frame, complexity)
    };
  }

  sortFramesByPosition(frames: DetectedFrame[]): DetectedFrame[] {
    return [...frames].sort((a, b) => {
      // Smart sorting algorithm
      const yDiff = Math.abs(a.y - b.y);
      const tolerance = 100; // pixels
      
      if (yDiff < tolerance) {
        // Same row, sort by X position
        return a.x - b.x;
      } else {
        // Different rows, sort by Y position
        return a.y - b.y;
      }
    }).map((frame, index) => ({
      ...frame,
      order: index
    }));
  }

  estimateExportSize(frame: FrameNode): string {
    const pixels = frame.width * frame.height;
    const complexity = this.calculateComplexity(frame);
    
    // Base estimation: 3 bytes per pixel for RGB
    let estimatedBytes = pixels * 3;
    
    // Adjust for complexity
    estimatedBytes *= complexity;
    
    // Adjust for transparency
    if (this.hasTransparentBackground(frame)) {
      estimatedBytes *= 1.33; // RGBA vs RGB
    }
    
    return this.formatFileSize(estimatedBytes);
  }

  private calculateComplexity(frame: FrameNode): number {
    let complexity = 1.0;
    const nodeCount = this.countNodes(frame);
    
    // Base complexity from node count
    if (nodeCount > 100) complexity += 1.0;
    else if (nodeCount > 50) complexity += 0.5;
    else if (nodeCount > 20) complexity += 0.3;
    
    // Additional complexity factors
    if (this.hasImages(frame)) complexity += 0.5;
    if (this.hasVectors(frame)) complexity += 0.3;
    if (this.hasEffects(frame)) complexity += 0.4;
    if (this.hasBlends(frame)) complexity += 0.3;
    
    return Math.min(complexity, 3.0); // Cap at 3x
  }

  private analyzeContentTypes(frame: FrameNode): string[] {
    const types: string[] = [];
    
    if (this.hasText(frame)) types.push('text');
    if (this.hasImages(frame)) types.push('images');
    if (this.hasVectors(frame)) types.push('vectors');
    if (this.hasShapes(frame)) types.push('shapes');
    if (this.hasComponents(frame)) types.push('components');
    
    return types;
  }

  private estimatePerformance(frame: FrameNode): 'fast' | 'medium' | 'slow' {
    const nodeCount = this.countNodes(frame);
    const hasComplexEffects = this.hasComplexEffects(frame);
    const size = frame.width * frame.height;
    
    if (nodeCount > 100 || hasComplexEffects || size > 4000000) {
      return 'slow';
    } else if (nodeCount > 50 || size > 1000000) {
      return 'medium';
    } else {
      return 'fast';
    }
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

  hasImages(frame: FrameNode): boolean {
    return this.findNodesByType(frame, 'IMAGE').length > 0;
  }

  hasText(frame: FrameNode): boolean {
    return this.findNodesByType(frame, 'TEXT').length > 0;
  }

  hasVectors(frame: FrameNode): boolean {
    return this.findNodesByType(frame, 'VECTOR').length > 0;
  }

  private hasShapes(frame: FrameNode): boolean {
    const shapeTypes = ['RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR'];
    return shapeTypes.some(type => 
      this.findNodesByType(frame, type as any).length > 0
    );
  }

  private hasComponents(frame: FrameNode): boolean {
    return this.findNodesByType(frame, 'INSTANCE').length > 0;
  }

  private hasEffects(frame: FrameNode): boolean {
    return this.hasNodeWithEffects(frame);
  }

  private hasBlends(frame: FrameNode): boolean {
    return this.hasNodeWithBlendMode(frame);
  }

  private hasComplexEffects(frame: FrameNode): boolean {
    return this.hasNodeWithComplexEffects(frame);
  }

  private hasTransparentBackground(frame: FrameNode): boolean {
    if (!frame.fills || frame.fills.length === 0) return true;
    
    const solidFills = frame.fills.filter(fill => 
      fill.type === 'SOLID' && fill.visible !== false
    ) as SolidPaint[];
    
    return solidFills.some(fill => fill.opacity < 1);
  }

  private extractDominantColors(frame: FrameNode): string[] {
    const colors: string[] = [];
    
    if (frame.fills) {
      frame.fills.forEach(fill => {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          const { r, g, b } = fill.color;
          const hex = this.rgbToHex(r, g, b);
          colors.push(hex);
        }
      });
    }
    
    return colors.slice(0, 3); // Return top 3 colors
  }

  private estimateProcessingTime(frame: FrameNode, complexity: number): number {
    const baseTime = 1000; // 1 second base
    const sizeMultiplier = (frame.width * frame.height) / 1000000; // per megapixel
    
    return Math.round(baseTime * complexity * Math.max(sizeMultiplier, 0.5));
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

  private hasNodeWithEffects(node: SceneNode): boolean {
    if ('effects' in node && node.effects && node.effects.length > 0) {
      return true;
    }
    
    if ('children' in node) {
      return node.children.some(child => this.hasNodeWithEffects(child));
    }
    
    return false;
  }

  private hasNodeWithBlendMode(node: SceneNode): boolean {
    if ('blendMode' in node && node.blendMode !== 'NORMAL') {
      return true;
    }
    
    if ('children' in node) {
      return node.children.some(child => this.hasNodeWithBlendMode(child));
    }
    
    return false;
  }

  private hasNodeWithComplexEffects(node: SceneNode): boolean {
    if ('effects' in node && node.effects) {
      const complexEffects = ['LAYER_BLUR', 'BACKGROUND_BLUR'];
      return node.effects.some(effect => 
        complexEffects.includes(effect.type) && effect.visible !== false
      );
    }
    
    if ('children' in node) {
      return node.children.some(child => this.hasNodeWithComplexEffects(child));
    }
    
    return false;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  }
}
