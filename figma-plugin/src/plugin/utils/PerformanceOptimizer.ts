// Performance optimization utilities
export class PerformanceOptimizer {
  private static readonly MAX_BATCH_SIZE = 3;
  private static readonly PROCESSING_DELAY = 100;
  private static readonly MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB
  
  async processInBatches<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    batchSize: number = PerformanceOptimizer.MAX_BATCH_SIZE,
    onProgress?: (current: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const actualBatchSize = Math.min(batchSize, PerformanceOptimizer.MAX_BATCH_SIZE);
    
    console.log(`🔄 Processing ${items.length} items in batches of ${actualBatchSize}`);
    
    for (let i = 0; i < items.length; i += actualBatchSize) {
      const batch = items.slice(i, i + actualBatchSize);
      
      // Check memory usage before processing batch
      await this.checkMemoryUsage();
      
      const batchPromises = batch.map(async (item, batchIndex) => {
        const globalIndex = i + batchIndex;
        
        if (onProgress) {
          onProgress(globalIndex + 1, items.length);
        }
        
        return processor(item, globalIndex);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Prevent blocking the main thread
      if (i + actualBatchSize < items.length) {
        await this.delay(PerformanceOptimizer.PROCESSING_DELAY);
      }
      
      console.log(`✅ Processed batch ${Math.floor(i / actualBatchSize) + 1}/${Math.ceil(items.length / actualBatchSize)}`);
    }
    
    return results;
  }
  
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; duration: number; memoryUsed: number }> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    console.log(`⏱️ Starting ${operationName}...`);
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      
      const duration = endTime - startTime;
      const memoryUsed = endMemory - startMemory;
      
      console.log(`✅ ${operationName} completed in ${duration.toFixed(2)}ms, memory: ${this.formatBytes(memoryUsed)}`);
      
      return { result, duration, memoryUsed };
      
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
  
  private async checkMemoryUsage(): Promise<void> {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage > PerformanceOptimizer.MAX_MEMORY_USAGE) {
      console.warn(`⚠️ High memory usage detected: ${this.formatBytes(memoryUsage)}`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('🗑️ Forced garbage collection');
      }
      
      // Add extra delay to allow memory cleanup
      await this.delay(500);
    }
  }
  
  private getMemoryUsage(): number {
    // In browser environment, we can't get exact memory usage
    // This is a placeholder for memory monitoring
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    return 0;
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Frame-specific optimization methods
  optimizeFrameProcessingOrder(frames: any[]): any[] {
    // Sort frames by complexity (simple first) for better performance
    return [...frames].sort((a, b) => {
      const complexityA = a.analysis?.complexity || 1;
      const complexityB = b.analysis?.complexity || 1;
      
      return complexityA - complexityB;
    });
  }
  
  calculateOptimalBatchSize(frames: any[], targetProcessingTime: number = 5000): number {
    const averageComplexity = frames.reduce((sum, frame) => {
      return sum + (frame.analysis?.complexity || 1);
    }, 0) / frames.length;
    
    // Estimate processing time per frame based on complexity
    const estimatedTimePerFrame = averageComplexity * 1000; // 1 second per complexity unit
    
    // Calculate batch size to stay within target time
    const optimalBatchSize = Math.max(1, Math.floor(targetProcessingTime / estimatedTimePerFrame));
    
    return Math.min(optimalBatchSize, PerformanceOptimizer.MAX_BATCH_SIZE);
  }
  
  // Memory management for large exports
  async processLargeExport<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: {
      maxConcurrent?: number;
      memoryThreshold?: number;
      progressCallback?: (current: number, total: number) => void;
    } = {}
  ): Promise<R[]> {
    const {
      maxConcurrent = 2,
      memoryThreshold = 50 * 1024 * 1024, // 50MB
      progressCallback
    } = options;
    
    const results: R[] = [];
    const semaphore = new Semaphore(maxConcurrent);
    
    const promises = items.map(async (item, index) => {
      await semaphore.acquire();
      
      try {
        // Check memory before processing
        const memoryUsage = this.getMemoryUsage();
        if (memoryUsage > memoryThreshold) {
          await this.delay(200); // Wait for memory to free up
        }
        
        const result = await processor(item, index);
        
        if (progressCallback) {
          progressCallback(index + 1, items.length);
        }
        
        return result;
        
      } finally {
        semaphore.release();
      }
    });
    
    const allResults = await Promise.all(promises);
    return allResults;
  }
}

// Simple semaphore implementation for concurrency control
class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }
    
    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }
  
  release(): void {
    this.permits++;
    
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      if (next) {
        this.permits--;
        next();
      }
    }
  }
}
