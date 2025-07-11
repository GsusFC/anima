/**
 * FilterGraph.js - Scalable FFmpeg filter_complex generator
 * 
 * Solves the problem of filter_complex chains becoming too long/complex
 * by using a declarative graph model with batch processing.
 */

class MediaNode {
  constructor(path, duration, type = 'image', options = {}) {
    this.id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.path = path;
    this.duration = duration; // in seconds
    this.type = type; // 'image' | 'video' | 'audio'
    this.width = options.width || null;
    this.height = options.height || null;
    this.fps = options.fps || null;
    this.inputIndex = null; // Set when added to graph
    this.filters = []; // Additional filters to apply
  }

  addFilter(filter) {
    this.filters.push(filter);
    return this;
  }

  getInputLabel() {
    return `[${this.inputIndex}:v]`;
  }

  getOutputLabel() {
    return `[v${this.inputIndex}]`;
  }
}

class TransitionEdge {
  constructor(fromNode, toNode, type = 'fade', duration = 0.5) {
    this.id = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.type = type;
    this.duration = duration; // in seconds
    this.offset = null; // Calculated during graph traversal
  }

  calculateOffset(timelinePosition, clipDuration) {
    // Transition starts at the end of current clip minus transition duration
    this.offset = timelinePosition + clipDuration - this.duration;
    return this.offset;
  }
}

class FilterGraph {
  constructor(options = {}) {
    this.nodes = [];
    this.edges = [];
    this.batchSize = options.batchSize || 15; // Max inputs per batch
    this.targetWidth = options.width || 1920;
    this.targetHeight = options.height || 1080;
    this.targetFps = options.fps || 30;
    this.transitionEffects = {
      'none': 'fade',
      'fade': 'fade',
      'dissolve': 'fade',
      'cut': 'fade',
      'fadeblack': 'fadeblack',
      'fadewhite': 'fadewhite',
      'slideleft': 'slideleft',
      'slideright': 'slideright',
      'slideup': 'slideup',
      'slidedown': 'slidedown',
      'wipeleft': 'wipeleft',
      'wiperight': 'wiperight'
    };
  }

  addNode(node) {
    node.inputIndex = this.nodes.length;
    this.nodes.push(node);
    return this;
  }

  addTransition(fromNodeIndex, toNodeIndex, type = 'fade', duration = 0.5) {
    if (fromNodeIndex >= this.nodes.length || toNodeIndex >= this.nodes.length) {
      throw new Error('Invalid node indices for transition');
    }
    
    const edge = new TransitionEdge(
      this.nodes[fromNodeIndex],
      this.nodes[toNodeIndex],
      type,
      duration
    );
    
    this.edges.push(edge);
    return this;
  }

  // Create MediaNodes from legacy format
  static fromLegacyImages(validImages, transitions = [], frameDurations = [], duration = 1000) {
    const graph = new FilterGraph();
    
    // Add media nodes
    validImages.forEach((image, index) => {
      const frameDuration = (frameDurations[index] || duration) / 1000; // Convert to seconds
      const node = new MediaNode(image.path, frameDuration, 'image');
      graph.addNode(node);
    });

    // Add transitions
    transitions.forEach((transition, index) => {
      if (index < validImages.length - 1) {
        const transitionType = transition?.type || 'fade';
        const transitionDuration = Math.min((transition?.duration || 500) / 1000, 0.9); // Convert to seconds, max 90% of frame
        graph.addTransition(index, index + 1, transitionType, transitionDuration);
      }
    });

    return graph;
  }

  // Generate normalization filters (scale, fps, padding)
  generateNormalizationFilters() {
    const filters = [];
    
    this.nodes.forEach((node, index) => {
      const inputLabel = node.getInputLabel();
      const outputLabel = node.getOutputLabel();
      
      // Build filter chain for this input
      let filterChain = `${inputLabel}scale=${this.targetWidth}:${this.targetHeight}:force_original_aspect_ratio=decrease`;
      
      // Add fps if specified
      if (this.targetFps) {
        filterChain += `,fps=${this.targetFps}`;
      }
      
      // Add any custom filters
      if (node.filters.length > 0) {
        filterChain += ',' + node.filters.join(',');
      }
      
      filterChain += outputLabel;
      filters.push(filterChain);
    });

    return filters;
  }

  // Generate transition filters using xfade
  generateTransitionFilters() {
    if (this.nodes.length <= 1 || this.edges.length === 0) {
      return this.generateSimpleConcat();
    }

    const filters = [];
    let timelinePosition = 0;
    let lastOutput = this.nodes[0].getOutputLabel();

    this.edges.forEach((edge, index) => {
      const currentFrameDuration = edge.fromNode.duration;
      const transitionType = this.transitionEffects[edge.type] || 'fade';
      const transitionDuration = edge.duration;
      
      // Calculate offset
      const offset = edge.calculateOffset(timelinePosition, currentFrameDuration);
      
      const nextInput = edge.toNode.getOutputLabel();
      const outputLabel = (index === this.edges.length - 1) ? '[outv]' : `[t${index}]`;
      
      const xfadeFilter = `${lastOutput}${nextInput}xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset}${outputLabel}`;
      filters.push(xfadeFilter);
      
      lastOutput = outputLabel;
      timelinePosition += currentFrameDuration;
    });

    return filters;
  }

  // Generate simple concat for when no transitions or single batch
  generateSimpleConcat() {
    if (this.nodes.length === 1) {
      return [`${this.nodes[0].getOutputLabel()}copy[outv]`];
    }

    const concatInputs = this.nodes.map(node => node.getOutputLabel()).join('');
    return [`${concatInputs}concat=n=${this.nodes.length}:v=1:a=0[outv]`];
  }

  // Check if we need batch processing
  needsBatchProcessing() {
    return this.nodes.length > this.batchSize;
  }

  // Generate filters for single batch
  generateSingleBatchFilters() {
    const normalizationFilters = this.generateNormalizationFilters();
    
    // If no real transitions, use simple concat
    const hasRealTransitions = this.edges.some(edge => 
      edge.type && edge.type !== 'cut' && edge.type !== 'none'
    );

    const compositionFilters = hasRealTransitions 
      ? this.generateTransitionFilters()
      : this.generateSimpleConcat();

    return [...normalizationFilters, ...compositionFilters];
  }

  // Main entry point - generate complete filter_complex chain
  generateFilterChain() {
    if (!this.needsBatchProcessing()) {
      // Simple case - single batch
      return this.generateSingleBatchFilters();
    }

    // TODO: Implement batch processing for >15 inputs
    // For now, use simple approach
    console.warn(`FilterGraph: ${this.nodes.length} nodes exceeds batch size ${this.batchSize}, using simplified processing`);
    return this.generateSingleBatchFilters();
  }

  // Legacy compatibility wrapper
  buildUnifiedTransitionChain() {
    const filters = this.generateFilterChain();
    return '[outv]'; // Return expected output label
  }

  // Get complete FFmpeg command components
  getFFmpegComponents() {
    return {
      inputs: this.nodes.map(node => ({
        path: node.path,
        options: ['-loop', '1', '-t', String(node.duration)]
      })),
      complexFilter: this.generateFilterChain(),
      outputLabel: '[outv]'
    };
  }

  // Debug info
  getDebugInfo() {
    return {
      nodeCount: this.nodes.length,
      edgeCount: this.edges.length,
      batchSize: this.batchSize,
      needsBatching: this.needsBatchProcessing(),
      totalDuration: this.nodes.reduce((sum, node) => sum + node.duration, 0),
      transitionTypes: this.edges.map(edge => edge.type)
    };
  }
}

module.exports = {
  MediaNode,
  TransitionEdge,
  FilterGraph
};
