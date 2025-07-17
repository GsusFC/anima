import React from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import ExportProgressModal from './ExportProgressModal';
import { ExportStrategyFactory } from '../strategies/ExportStrategyFactory';
import { useExportValidation, ExportSettings as ValidationExportSettings } from '../../hooks/useExportValidation';
import { useExportHandlers } from '../hooks/useExportHandlers';

// Import unified components
import {
  UnifiedFormatSelector,
  UnifiedQualitySelector,
  UnifiedEmptyState,
  type QualityLevel
} from '../../shared/components/export';

// Import remaining specific components
import ResolutionSelectorSimple from './export/ResolutionSelectorSimple';
import AdvancedSettingsPanel from './export/AdvancedSettingsPanel';
import ValidationSummaryCompact from './export/ValidationSummaryCompact';

/**
 * ExportControls - Streamlined version (280px width)
 * Simplified interface with essential controls visible and advanced settings collapsed
 * For the full-featured version, see ExportControlsPro.tsx
 */
const ExportControls: React.FC = () => {
  const {
    project,
    export: exportState,
    hasTimeline,
    exportSlideshow,
    updateExportSettings,
    updateExportState
  } = useSlideshowContext();



  const { exportSettings } = project;

  // Convert to ValidationExportSettings for real-time validation
  const currentValidationSettings: ValidationExportSettings = {
    format: exportSettings.format as any,
    fps: exportSettings.fps,
    quality: exportSettings.quality as any,
    resolution: exportSettings.resolution,
    gif: exportSettings.gif
  };

  // Real-time validation
  const validation = useExportValidation(currentValidationSettings);

  // Use refactored handlers
  const handlers = useExportHandlers({
    exportSettings,
    updateExportSettings,
    exportSlideshow,
    updateExportState
  });

  // Get current strategy for format-specific controls
  const currentStrategy = ExportStrategyFactory.create(exportSettings.format);

  // Type-safe wrapper for quality change handler
  const handleQualityChange = (quality: QualityLevel) => {
    // Only accept quality levels that are valid for slideshow mode
    const validSlideshowQualities: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];
    if (validSlideshowQualities.includes(quality)) {
      handlers.quality.onQualityChange(quality as 'low' | 'medium' | 'high' | 'ultra');
    }
  };

  if (!hasTimeline) {
    return <UnifiedEmptyState mode="slideshow" />;
  }

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Format Selection - Unified */}
      <UnifiedFormatSelector
        currentFormat={handlers.format.currentFormat}
        onFormatChange={handlers.format.onFormatChange}
        mode="slideshow"
      />

      {/* Quality Selection - Unified */}
      <UnifiedQualitySelector
        currentQuality={handlers.quality.currentQuality}
        onQualityChange={handleQualityChange}
        mode="slideshow"
      />

      {/* Simplified Resolution Selection */}
      <ResolutionSelectorSimple
        resolution={handlers.resolution.resolution}
        onResolutionPresetChange={handlers.resolution.onResolutionPresetChange}
        onCustomResolutionChange={handlers.resolution.onCustomResolutionChange}
      />

      {/* Advanced Settings (Collapsed) */}
      <AdvancedSettingsPanel
        strategy={currentStrategy}
        exportSettings={exportSettings}
        updateExportSettings={updateExportSettings}
        fpsHandlers={handlers.fps}
      />

      {/* Compact Validation Summary */}
      <ValidationSummaryCompact validation={validation} />

      {/* Note: Export Button moved to Timeline area for better workflow */}
      {/* See Timeline.tsx for the floating export button implementation */}

      {/* Export Progress Modal */}
      <ExportProgressModal
        isVisible={exportState.isExporting || exportState.isCompleted}
        progress={exportState.progress}
        error={exportState.error}
        isCompleted={exportState.isCompleted}
        downloadUrl={exportState.downloadUrl}
        currentStep={exportState.currentStep}
        onCancel={handlers.export.onCancel}
        format={exportSettings.format}
        onDownload={() => {
          if (exportState.downloadUrl) {
            const link = document.createElement('a');
            link.href = `${window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin}${exportState.downloadUrl}`;
            link.download = '';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }}
      />
    </div>
  );
};

export default ExportControls;
