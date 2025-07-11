import { useCallback } from 'react';
import { TimelineItem, ImageFile, ExportSettings } from '../types/slideshow.types';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : window.location.origin;








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
