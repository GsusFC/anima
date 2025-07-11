import { useCallback } from 'react';
import { ExportStrategyFactory } from '../strategies/ExportStrategyFactory';
import { ValidationResult } from '../../shared/types/validation.types';
import { toLegacyValidation } from '../../shared/utils/validation-adapters';

export interface ExportSettings {
  format: 'gif' | 'mp4' | 'webm' | 'mov';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  resolution: {
    width: number;
    height: number;
    preset: string;
  };
  gif?: any;
}

export interface ExportHandlersProps {
  exportSettings: ExportSettings;
  updateExportSettings: (updates: Partial<ExportSettings>) => void;
  exportSlideshow: () => void;
  updateExportState: (updates: any) => void;
}

export const useExportHandlers = ({
  exportSettings,
  updateExportSettings,
  exportSlideshow,
  updateExportState
}: ExportHandlersProps) => {

  // Format handlers
  const handleFormatChange = useCallback((format: 'gif' | 'mp4' | 'webm' | 'mov') => {
    // Get default settings for the new format
    const strategy = ExportStrategyFactory.create(format);
    const defaults = strategy.getDefaults();
    updateExportSettings({ ...defaults, format });
  }, [updateExportSettings]);

  // Quality handlers
  const handleQualityChange = useCallback((quality: 'low' | 'medium' | 'high' | 'ultra') => {
    updateExportSettings({ quality });
  }, [updateExportSettings]);

  // Resolution handlers
  const handleResolutionChange = useCallback((preset: string) => {
    const presets = {
      'original': { width: 1920, height: 1080, preset: 'original' },
      '4k': { width: 3840, height: 2160, preset: '4k' },
      '1080p': { width: 1920, height: 1080, preset: '1080p' },
      '720p': { width: 1280, height: 720, preset: '720p' },
      '480p': { width: 854, height: 480, preset: '480p' },
      '360p': { width: 640, height: 360, preset: '360p' },
      'custom': { width: 1920, height: 1080, preset: 'custom' }
    };
    
    const resolution = presets[preset as keyof typeof presets];
    if (resolution) {
      updateExportSettings({ resolution });
    }
  }, [updateExportSettings]);

  const handleCustomResolutionChange = useCallback((updates: Partial<{ width: number; height: number; preset: string }>) => {
    updateExportSettings({
      resolution: {
        ...exportSettings.resolution,
        ...updates
      }
    });
  }, [exportSettings.resolution, updateExportSettings]);

  // FPS handlers
  const handleFpsChange = useCallback((fps: number) => {
    updateExportSettings({ fps });
  }, [updateExportSettings]);

  // Export handlers
  const handleExport = useCallback((validation: ValidationResult) => {
    // Convertir a formato legacy para compatibilidad
    const legacyValidation = toLegacyValidation(validation);

    // Use real-time validation
    if (!legacyValidation.canExport) {
      const errorMessages = legacyValidation.messages
        .filter(m => m.type === 'error')
        .map(m => m.message)
        .join('\n');

      alert(`Configuración de exportación inválida:\n${errorMessages}`);
      return;
    }

    exportSlideshow();
  }, [exportSlideshow]);

  const handleCancelExport = useCallback(() => {
    // Reset the export state to close the modal
    updateExportState({
      isExporting: false,
      progress: 0,
      error: null,
      isCompleted: false,
      downloadUrl: undefined
    });
  }, [updateExportState]);

  return {
    format: {
      currentFormat: exportSettings.format,
      onFormatChange: handleFormatChange
    },
    quality: {
      currentQuality: exportSettings.quality,
      onQualityChange: handleQualityChange
    },
    resolution: {
      resolution: exportSettings.resolution,
      onResolutionPresetChange: handleResolutionChange,
      onCustomResolutionChange: handleCustomResolutionChange
    },
    export: {
      onExport: handleExport,
      onCancel: handleCancelExport
    },
    fps: {
      currentFps: exportSettings.fps,
      onFpsChange: handleFpsChange
    }
  };
};
