// Frame detection and analysis controller
import { FigmaAPIService } from '../services/FigmaAPIService';
import { FrameAnalyzer } from '../utils/FrameAnalyzer';
import { DetectedFrame, FrameMetadata } from '@shared/types';

export class FrameController {
  private figmaService: FigmaAPIService;
  private frameAnalyzer: FrameAnalyzer;
  private detectedFrames: DetectedFrame[] = [];

  constructor() {
    this.figmaService = new FigmaAPIService();
    this.frameAnalyzer = new FrameAnalyzer();
  }

  async detectFrames(): Promise<DetectedFrame[]> {
    try {
      console.log('🔍 Starting frame detection...');
      
      // Get current selection
      const selection = figma.currentPage.selection;
      const selectedFrames = selection.filter(
        node => node.type === 'FRAME' && node.visible
      ) as FrameNode[];

      let framesToProcess: FrameNode[];

      if (selectedFrames.length > 0) {
        console.log(`📋 Found ${selectedFrames.length} selected frames`);
        framesToProcess = selectedFrames;
      } else {
        // Get all frames from current page
        const allFrames = figma.currentPage.children.filter(
          node => node.type === 'FRAME' && node.visible
        ) as FrameNode[];
        
        console.log(`📄 Found ${allFrames.length} frames on current page`);
        framesToProcess = allFrames;
      }

      // Process and analyze frames
      this.detectedFrames = await this.processFrames(framesToProcess);
      
      // Sort frames by position (smart ordering)
      this.detectedFrames = this.frameAnalyzer.sortFramesByPosition(this.detectedFrames);
      
      // Send to UI
      figma.ui.postMessage({
        type: 'frames-detected',
        data: { 
          frames: this.detectedFrames,
          source: selectedFrames.length > 0 ? 'selection' : 'page',
          timestamp: Date.now()
        }
      });

      console.log(`✅ Successfully detected ${this.detectedFrames.length} frames`);
      return this.detectedFrames;

    } catch (error) {
      console.error('❌ Frame detection failed:', error);
      
      figma.ui.postMessage({
        type: 'error',
        data: { 
          error: 'Failed to detect frames',
          details: error.message,
          code: 'FRAME_DETECTION_ERROR'
        }
      });
      
      return [];
    }
  }

  private async processFrames(frames: FrameNode[]): Promise<DetectedFrame[]> {
    const processedFrames: DetectedFrame[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      
      try {
        const metadata = await this.extractFrameMetadata(frame);
        const analysis = this.frameAnalyzer.analyzeFrame(frame);
        
        const detectedFrame: DetectedFrame = {
          id: frame.id,
          name: frame.name,
          width: Math.round(frame.width),
          height: Math.round(frame.height),
          x: Math.round(frame.x),
          y: Math.round(frame.y),
          visible: frame.visible,
          locked: frame.locked,
          type: 'FRAME',
          order: i,
          selected: figma.currentPage.selection.includes(frame),
          metadata,
          analysis,
          estimatedSize: this.frameAnalyzer.estimateExportSize(frame),
          complexity: analysis.complexity > 2 ? 'high' : analysis.complexity > 1 ? 'medium' : 'low',
          aspectRatio: frame.width / frame.height,
          isValidForExport: this.validateFrameForExport(frame)
        };

        processedFrames.push(detectedFrame);
        
      } catch (error) {
        console.warn(`⚠️ Failed to process frame ${frame.name}:`, error);
        // Continue with other frames
      }
    }

    return processedFrames;
  }

  private async extractFrameMetadata(frame: FrameNode): Promise<FrameMetadata> {
    return {
      fills: frame.fills,
      effects: frame.effects,
      cornerRadius: frame.cornerRadius,
      layoutMode: frame.layoutMode,
      primaryAxisSizingMode: frame.primaryAxisSizingMode,
      counterAxisSizingMode: frame.counterAxisSizingMode,
      paddingLeft: frame.paddingLeft,
      paddingRight: frame.paddingRight,
      paddingTop: frame.paddingTop,
      paddingBottom: frame.paddingBottom,
      itemSpacing: frame.itemSpacing,
      childrenCount: frame.children.length,
      hasImages: this.frameAnalyzer.hasImages(frame),
      hasText: this.frameAnalyzer.hasText(frame),
      hasVectors: this.frameAnalyzer.hasVectors(frame)
    };
  }

  private validateFrameForExport(frame: FrameNode): boolean {
    // Validation rules for export
    const minSize = 50;
    const maxSize = 8000;
    
    return (
      frame.visible &&
      !frame.locked &&
      frame.width >= minSize &&
      frame.height >= minSize &&
      frame.width <= maxSize &&
      frame.height <= maxSize
    );
  }

  getDetectedFrames(): DetectedFrame[] {
    return this.detectedFrames;
  }

  getFrameById(id: string): DetectedFrame | undefined {
    return this.detectedFrames.find(frame => frame.id === id);
  }

  async refreshFrameDetection(): Promise<DetectedFrame[]> {
    console.log('🔄 Refreshing frame detection...');
    return this.detectFrames();
  }
}
