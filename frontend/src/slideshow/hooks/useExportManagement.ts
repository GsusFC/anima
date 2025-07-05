import { useCallback } from 'react';
import { TimelineItem, ImageFile, ExportSettings, ExportResponse } from '../types/slideshow.types';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

// API function for export
const exportAPI = async (format: string, payload: any): Promise<ExportResponse> => {
  const endpoint = format === 'gif' ? '/gif-simple' : '/video-simple';
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export interface ExportState {
  isExporting: boolean;
  progress: number;
  lastResult: string | null;
  error: string | null;
  currentStep?: string;
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

  const exportSlideshow = useCallback(async () => {
    if (timeline.length === 0) return;

    updateExportState({ 
      isExporting: true, 
      error: null, 
      progress: 0 
    });

    const progressInterval = simulateProgress();

    try {
      const payload = {
        images: timeline.map(item => {
          const image = images.find(img => img.id === item.imageId);
          return { filename: image?.uploadedInfo?.filename || image?.name };
        }),
        transitions: timeline.slice(0, -1).map(item => ({
          type: item.transition?.type || 'cut', // Default to 'cut' (no transition)
          duration: item.transition?.duration || 0 // No duration for cuts
        })),
        frameDurations: timeline.map(item => item.duration),
        sessionId: sessionId,
        exportSettings: exportSettings
      };

      // Debug logging
      console.log('🎬 Export payload:', {
        totalImages: images.length,
        timelineItems: timeline.length,
        payload: payload,
        imageFilenames: payload.images.map(img => img.filename)
      });
      console.log('🎬 Full export payload:', JSON.stringify(payload, null, 2));

      // Use 'video' endpoint for slideshow exports (supports mp4/webm), 'gif' for GIF
      const format = exportSettings.format === 'gif' ? 'gif' : 'video';
      const result = await exportAPI(format, payload);
      
      clearInterval(progressInterval);
      
      if (result.success) {
        // Show completion
        updateExportState({
          progress: 100,
          currentStep: 'Export complete!'
        });

        // Small delay to show completion, then trigger download
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = `${API_BASE_URL}${result.downloadUrl}`;
          link.download = result.filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          updateExportState({
            isExporting: false,
            progress: 100,
            lastResult: result.downloadUrl,
            error: null,
            currentStep: undefined
          });
        }, 1000);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('❌ Export failed:', error);
      updateExportState({
        isExporting: false,
        error: error instanceof Error ? error.message : 'Export failed',
        currentStep: undefined
      });
    }
  }, [timeline, images, sessionId, exportSettings, updateExportState, simulateProgress]);

  const updateExportSettings = useCallback((updates: Partial<ExportSettings>) => {
    updateExportSettingsState(updates);
  }, [updateExportSettingsState]);

  return {
    exportSlideshow,
    updateExportSettings
  };
};
