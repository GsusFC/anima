import { useCallback } from 'react';
import { TimelineItem, ImageFile, ExportSettings, ExportResponse } from '../types/slideshow.types';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : window.location.origin;

// Helper function to trigger file download
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const triggerDownload = (downloadUrl: string) => {
  try {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}${downloadUrl}`;
    link.download = ''; // Let browser determine filename from Content-Disposition header
    link.style.display = 'none';

    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('🔽 Download triggered for:', downloadUrl);
  } catch (error) {
    console.error('❌ Failed to trigger download:', error);
  }
};

// Función optimizada para manejar la exportación con WebSocket + fallback polling
const handleExportResponse = async (
  result: any,
  onProgress?: (progress: number, message: string) => void
): Promise<ExportResponse> => {
  // Si hay jobId y statusUrl, necesitamos hacer polling
  if (result.jobId && result.statusUrl) {
    console.log('🔄 Trabajo en cola, usando WebSocket + fallback polling:', result.jobId);

    return new Promise((resolve, reject) => {
      let isResolved = false;
      let pollInterval: number | null = null;
      let websocketTimeout: number | null = null;

      // Función para limpiar recursos
      const cleanup = () => {
        if (pollInterval) clearInterval(pollInterval);
        if (websocketTimeout) clearTimeout(websocketTimeout);
      };

      // Función para resolver una sola vez
      const resolveOnce = (data: any) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(data);
        }
      };

      // Función para rechazar una sola vez
      const rejectOnce = (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          reject(error);
        }
      };

      // 1. Intentar usar WebSocket primero (más eficiente)
      try {
        const socket = (window as any).io?.();
        if (socket) {
          console.log('🔌 Using WebSocket for real-time updates');

          // Escuchar eventos específicos del trabajo
          socket.on(`job:${result.jobId}:progress`, (data: any) => {
            console.log('📡 WebSocket progress:', data);
            if (onProgress) onProgress(data.progress || 0, data.message || 'Processing...');
          });

          socket.on(`job:${result.jobId}:completed`, (data: any) => {
            console.log('✅ WebSocket job completed:', data);
            resolveOnce({
              success: true,
              downloadUrl: data.downloadUrl || result.downloadUrl,
              jobId: result.jobId
            });
          });

          socket.on(`job:${result.jobId}:failed`, (data: any) => {
            console.log('❌ WebSocket job failed:', data);
            rejectOnce(new Error(data.error || 'Export failed'));
          });

          // Timeout para WebSocket (fallback a polling si no hay respuesta en 3s)
          websocketTimeout = setTimeout(() => {
            console.log('⚠️ WebSocket timeout, falling back to polling');
            socket.off(`job:${result.jobId}:progress`);
            socket.off(`job:${result.jobId}:completed`);
            socket.off(`job:${result.jobId}:failed`);
            startPolling();
          }, 3000);

        } else {
          console.log('🔄 WebSocket not available, using polling');
          startPolling();
        }
      } catch (error) {
        console.log('🔄 WebSocket error, falling back to polling:', error);
        startPolling();
      }

      // 2. Función de fallback: Polling optimizado (menos frecuente)
      function startPolling() {
        if (isResolved) return;

        console.log('🔄 Starting optimized polling for:', result.jobId);

        let pollCount = 0;
        const maxPolls = 60; // Máximo 2 minutos de polling

        pollInterval = setInterval(async () => {
          if (isResolved) return;

          pollCount++;
          if (pollCount > maxPolls) {
            rejectOnce(new Error('Export timeout - job took too long'));
            return;
          }

          try {
            const statusResponse = await fetch(`${API_BASE_URL}${result.statusUrl}`);
            if (!statusResponse.ok) throw new Error('Failed to get job status');

            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
              resolveOnce({
                success: true,
                downloadUrl: statusData.downloadUrl || result.downloadUrl,
                jobId: result.jobId
              });
            } else if (statusData.status === 'failed') {
              rejectOnce(new Error(statusData.error || 'Export failed'));
            } else {
              // En progreso
              const progress = statusData.progress || 0;
              if (onProgress) onProgress(progress, statusData.message || 'Procesando...');
            }
          } catch (error) {
            console.error('Error polling job status:', error);
            rejectOnce(new Error('Failed to get export status'));
          }
        }, 2000); // Poll cada 2 segundos (menos agresivo que antes)
      }
    });
  }

  // Procesamiento directo, devolver resultado tal cual
  return result;
};

// Función principal de exportación usando endpoint unificado
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const exportAPI = async (
  format: string,
  payload: any,
  onProgress?: (progress: number, message: string) => void
): Promise<ExportResponse> => {
  // Usar siempre el endpoint unificado
  const endpoint = `/api/unified-export/${format}`;

  console.log(`🎬 Using unified export endpoint: ${endpoint}`);
  console.log(`🎬 Export payload:`, JSON.stringify(payload, null, 2));

  try {
    // Realizar petición
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Export API error response:', errorData);
      throw new Error(errorData.error || `Export failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Export API response:', result);

    // Manejar respuesta (con polling si es necesario)
    return handleExportResponse(result, onProgress);
  } catch (error) {
    console.error('💥 Export API error:', error);
    throw error;
  }
};

export interface ExportState {
  isExporting: boolean;
  progress: number;
  lastResult: string | null;
  error: string | null;
  currentStep?: string;
  isCompleted: boolean;
  downloadUrl?: string;
}

export interface ExportActions {
  exportSlideshow: () => Promise<void>;
  updateExportSettings: (updates: Partial<ExportSettings>) => void;
}

export interface UseExportManagementProps {
  timeline: TimelineItem[];
  images: ImageFile[];
  sessionId?: string;
  exportSettings: ExportSettings;
  updateExportState: (updates: Partial<ExportState>) => void;
  updateExportSettingsState: (updates: Partial<ExportSettings>) => void;
}

export const useExportManagement = ({
  timeline,
  images,
  sessionId,
  exportSettings,
  updateExportState,
  updateExportSettingsState
}: UseExportManagementProps): ExportActions => {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const simulateProgress = useCallback(() => {
    const steps = [
      { progress: 10, message: 'Preparing images...' },
      { progress: 25, message: 'Processing transitions...' },
      { progress: 45, message: 'Encoding frames...' },
      { progress: 70, message: 'Optimizing output...' },
      { progress: 90, message: 'Finalizing export...' }
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        updateExportState({
          progress: step.progress,
          currentStep: step.message
        });
        stepIndex++;
      } else {
        clearInterval(progressInterval);
      }
    }, 800);

    return progressInterval;
  }, [updateExportState]);

  // NEW: Export using master video as base with enhanced progress tracking
  const exportFromMaster = useCallback(async (masterFilename: string) => {
    if (!masterFilename) {
      throw new Error('Master filename is required');
    }

    // Progress starts at 50% (preview already generated)
    updateExportState({
      progress: 60,
      currentStep: `Converting to ${exportSettings.format.toUpperCase()} (${exportSettings.quality} quality)...`
    });

    try {
      const payload = {
        masterFilename,
        format: exportSettings.format,
        quality: exportSettings.quality,
        sessionId: sessionId
      };

      console.log('🔄 Step 2: Export from master payload:', payload);

      // Simulate conversion progress
      updateExportState({
        progress: 70,
        currentStep: `Processing ${exportSettings.format.toUpperCase()} conversion...`
      });

      const response = await fetch(`${API_BASE_URL}/export/from-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Format conversion failed');
      }

      const result = await response.json();
      console.log('✅ Step 2 completed: Export from master result:', result);

      // Final completion state
      updateExportState({
        isExporting: false,
        progress: 100,
        currentStep: `${exportSettings.format.toUpperCase()} export completed!`,
        downloadUrl: result.downloadUrl,
        isCompleted: true
      });

      // Auto-trigger download
      if (result.downloadUrl) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = `${API_BASE_URL}${result.downloadUrl}`;
          link.download = result.filename || `export.${exportSettings.format}`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 500);
      }

      return result;
    } catch (error) {
      console.error('❌ Export from master failed:', error);
      updateExportState({
        isExporting: false,
        error: error instanceof Error ? error.message : 'Format conversion failed',
        progress: 0,
        currentStep: 'Export failed',
        isCompleted: false
      });
      throw error;
    }
  }, [exportSettings, sessionId, updateExportState]);

  const exportSlideshow = useCallback(async () => {
    if (timeline.length === 0) return;

    updateExportState({
      isExporting: true,
      error: null,
      progress: 0,
      currentStep: 'Preparing export...',
      isCompleted: false,
      downloadUrl: undefined
    });

    try {
      // Step 1: Generate high-quality master video (up to 4K, CRF 16-18, bitrate 8-15M)
      updateExportState({
        progress: 10,
        currentStep: 'Generating high-quality master video...'
      });

      const masterPayload = {
        images: timeline.map(item => {
          const image = images.find(img => img.id === item.imageId);
          return { filename: image?.uploadedInfo?.filename || image?.name };
        }),
        transitions: timeline.slice(0, -1).map(item => ({
          type: item.transition?.type || 'cut',
          duration: item.transition?.duration || 0
        })),
        frameDurations: timeline.map(item => item.duration),
        sessionId: sessionId
      };

      console.log('🎬 Step 1: Generating high-quality master for export:', masterPayload);

      const masterResponse = await fetch(`${API_BASE_URL}/generate-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(masterPayload)
      });

      if (!masterResponse.ok) {
        const error = await masterResponse.json();
        throw new Error(error.error || 'High-quality master generation failed');
      }

      const masterResult = await masterResponse.json();
      console.log('✅ Step 1 completed: High-quality master generated:', masterResult);

      // Step 2: Convert master to desired format
      updateExportState({
        progress: 50,
        currentStep: `Converting to ${exportSettings.format.toUpperCase()} (${exportSettings.quality})...`
      });

      console.log('🔄 Step 2: Converting master to final format');
      const exportResult = await exportFromMaster(masterResult.filename);

      console.log('✅ Export completed successfully:', exportResult);
      return exportResult;
    } catch (error) {
      console.error('❌ Export slideshow failed:', error);
      updateExportState({
        isExporting: false,
        error: error instanceof Error ? error.message : 'Export failed',
        progress: 0,
        currentStep: 'Export failed',
        isCompleted: false
      });
      throw error;
    }
  }, [timeline, images, sessionId, exportSettings, updateExportState, exportFromMaster]);

  const updateExportSettings = useCallback((updates: Partial<ExportSettings>) => {
    updateExportSettingsState(updates);
  }, [updateExportSettingsState]);

  return {
    exportSlideshow,
    updateExportSettings
  };
};
