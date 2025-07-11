// Backend Export Manager - Server-side processing only

export interface ExportOptions {
  format: 'mp4' | 'webm' | 'gif';
  fps?: number;
  quality?: 'low' | 'standard' | 'high';
  resolution?: {
    width: number;
    height: number;
  };
  frameDurations?: number[];
}

export interface ProgressCallback {
  (progress: number, message: string): void;
}

export interface ExportResult {
  blob: Blob;
  method: 'wasm' | 'backend';
  filename: string;
}

class ExportManager {
  private wasmAvailable: boolean | null = null;
  private baseURL = 'http://localhost:3001';

  async detectWasmSupport(): Promise<boolean> {
    if (this.wasmAvailable !== null) return this.wasmAvailable;

    try {
      // Quick WASM support check
      const checks = {
        webassembly: typeof WebAssembly !== 'undefined',
        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        crossOriginIsolated: crossOriginIsolated === true,
        worker: typeof Worker !== 'undefined'
      };

      console.log('🔍 Browser capabilities:', checks);

      // Server-side processing only - no WASM FFmpeg
      this.wasmAvailable = Object.values(checks).every(Boolean);
      
      if (!this.wasmAvailable) {
        console.log('⚠️ WASM not fully supported, will use backend');
      }

      return this.wasmAvailable;
    } catch (error) {
      console.log('⚠️ WASM detection failed, will use backend');
      this.wasmAvailable = false;
      return false;
    }
  }

  async exportSlideshow(
    images: File[],
    options: ExportOptions,
    onProgress?: ProgressCallback
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
    const filename = `slideshow_${timestamp}.${options.format}`;

    // For now, skip WASM and go directly to backend for reliability
    console.log('🔧 Skipping WASM, using backend for reliability...');
    onProgress?.(0, 'Using backend processing...');

    // Fallback to backend
    try {
      const blob = await this.exportWithBackend(images, options, onProgress);
      return { blob, method: 'backend', filename };
    } catch (backendError) {
      throw new Error(`Both WASM and backend export failed. Backend error: ${backendError}`);
    }
  }

  // WASM export disabled for now - focus on backend reliability
  // private async _exportWithWasm(...) { ... }

  private async exportWithBackend(
    images: File[],
    options: ExportOptions,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    onProgress?.(0, 'Uploading images to backend...');

    // 1. Upload images
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.log('📦 Session ID:', sessionId);
    
    const formData = new FormData();
    
    images.forEach((image, index) => {
      console.log(`📸 Adding image ${index}:`, image.name, `${image.size} bytes`);
      formData.append('images', image, `image${index}.png`);
    });

    console.log('📤 Uploading to:', `${this.baseURL}/upload?sessionId=${sessionId}`);
    const uploadResponse = await fetch(`${this.baseURL}/upload?sessionId=${sessionId}`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload result:', uploadResult);
    onProgress?.(30, 'Images uploaded, processing...');

    // 2. Export with backend
    const exportPayload = {
      sessionId,
      images: uploadResult.files.map((file: any) => ({ filename: file.filename })),
      frameDurations: options.frameDurations?.map(d => d * 1000) || [3000], // Convert to ms
      format: options.format,
      fps: options.fps || 30,
      quality: options.quality || 'standard',
    };

    // Add resolution if specified
    if (options.resolution) {
      (exportPayload as any).resolution = 'custom';
      (exportPayload as any).videoConfig = {
        resolution: options.resolution
      };
    }

    const endpoint = `/api/unified-export/${options.format}`;
    console.log('🎬 Export payload:', exportPayload);
    console.log('📤 Exporting to unified endpoint:', `${this.baseURL}${endpoint}`);
    
    try {
      const exportResponse = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportPayload)
      });
      
      if (!exportResponse.ok) {
        throw new Error(`Export failed: ${exportResponse.statusText}`);
      }
      
      const result = await exportResponse.json();
      
      // Manejar respuesta directa (sin jobId)
      if (result.downloadUrl && !result.jobId) {
        console.log('✅ Export completed directly, downloading from:', result.downloadUrl);
        // Descargar directamente
        const downloadResponse = await fetch(`${this.baseURL}${result.downloadUrl}`);
        if (!downloadResponse.ok) {
          throw new Error(`Download failed: ${downloadResponse.statusText}`);
        }
        return await downloadResponse.blob();
      }
      
      // Si hay jobId, seguir con el proceso de polling
      if (result.jobId && result.statusUrl) {
        console.log('🔄 Export queued with jobId:', result.jobId);
        
        // Polling de estado
        let status = 'queued';
        let progress = 0;
        
        while (status !== 'completed' && status !== 'failed') {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
          
          const statusResponse = await fetch(`${this.baseURL}${result.statusUrl}`);
          if (!statusResponse.ok) throw new Error('Failed to get job status');
          
          const statusData = await statusResponse.json();
          status = statusData.status;
          progress = statusData.progress || 0;
          
          // Actualizar UI con progreso
          if (onProgress) onProgress(progress, statusData.message || 'Procesando...');
          
          if (status === 'failed') {
            throw new Error(statusData.error || 'Export failed');
          }
        }
        
        // Trabajo completado, descargar resultado
        console.log('✅ Export job completed, downloading from:', result.downloadUrl);
        const downloadResponse = await fetch(`${this.baseURL}${result.downloadUrl}`);
        if (!downloadResponse.ok) {
          throw new Error(`Download failed: ${downloadResponse.statusText}`);
        }
        return await downloadResponse.blob();
      }
      
      throw new Error('Invalid response from export API');
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  // Utility to download blob
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const exportManager = new ExportManager();

// Utility hook for React components
import { useState, useCallback } from 'react';

export interface UseExportManagerReturn {
  isExporting: boolean;
  progress: number;
  message: string;
  error: string | null;
  method: 'wasm' | 'backend' | null;
  exportSlideshow: (images: File[], options: ExportOptions, filename?: string) => Promise<void>;
  reset: () => void;
}

export function useExportManager(): UseExportManagerReturn {
  const [state, setState] = useState({
    isExporting: false,
    progress: 0,
    message: '',
    error: null as string | null,
    method: null as 'wasm' | 'backend' | null
  });

  const exportSlideshow = useCallback(async (
    images: File[],
    options: ExportOptions,
    filename?: string
  ) => {
    setState(prev => ({ ...prev, isExporting: true, error: null, progress: 0 }));

    try {
      const result = await exportManager.exportSlideshow(images, options, (progress, message) => {
        setState(prev => ({ ...prev, progress, message }));
      });

      setState(prev => ({ 
        ...prev, 
        isExporting: false, 
        progress: 100, 
        message: `Export complete via ${result.method}!`,
        method: result.method
      }));

      // Auto-download
      if (filename || result.filename) {
        exportManager.downloadBlob(result.blob, filename || result.filename);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : String(error),
        progress: 0,
        message: 'Export failed'
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isExporting: false,
      progress: 0,
      message: '',
      error: null,
      method: null
    });
  }, []);

  return {
    ...state,
    exportSlideshow,
    reset
  };
}
