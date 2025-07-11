import React, { useState } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import ExportProgressModal from './ExportProgressModal';
import { ExportStrategyFactory } from '../strategies/ExportStrategyFactory';
import { useExportValidation, ExportSettings as ValidationExportSettings } from '../../hooks/useExportValidation';
import { useExportHandlers } from '../hooks/useExportHandlers';

// Import refactored components
import FormatSelector from './export/FormatSelector';
import QualitySelector from './export/QualitySelector';
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

  // State for custom resolution tab
  const [customResolutionTab, setCustomResolutionTab] = useState<'manual' | 'presets'>('presets');

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

  if (!hasTimeline) {
    return (
      <div className="h-full bg-dark-950 flex flex-col p-3">
        <div className="panel flex-1 flex items-center justify-center flex-col gap-3">
          <svg className="w-12 h-12 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-center text-dark-400 font-mono">
            <div className="text-lg mb-1">No Export Available</div>
            <div className="text-sm">Add images to timeline to enable export</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-dark-950 p-3 flex flex-col gap-3" style={{ width: '280px' }}>

      {/* Format Selection */}
      <FormatSelector
        currentFormat={handlers.format.currentFormat}
        onFormatChange={handlers.format.onFormatChange}
      />

      {/* Quality Selection */}
      <QualitySelector
        currentQuality={handlers.quality.currentQuality}
        strategy={currentStrategy}
        onQualityChange={handlers.quality.onQualityChange}
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
