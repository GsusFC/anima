import React, { useState } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import ExportProgressModal from './ExportProgressModal';
import { ExportStrategyFactory } from '../strategies/ExportStrategyFactory';
import { useExportValidation, ExportSettings as ValidationExportSettings } from '../../hooks/useExportValidation';
import { useExportHandlers } from '../hooks/useExportHandlers';

// Import refactored components
import FormatSelector from './export/FormatSelector';
import QualitySelector from './export/QualitySelector';
import ResolutionSelector from './export/ResolutionSelector';
import ExportButton from './export/ExportButton';
import ExportValidationDisplay from './export/ExportValidationDisplay';

/**
 * ExportControlsPro - Full-featured version with all controls visible
 * This is the complete version with 320px width and all advanced options
 * Use this for power users who need access to all export settings
 */
const ExportControlsPro: React.FC = () => {
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
            <div className="text-xs">Add images to timeline first</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-dark-950 p-4 flex flex-col gap-4">
      
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

      {/* Resolution Selection */}
      <ResolutionSelector
        resolution={handlers.resolution.resolution}
        customResolutionTab={customResolutionTab}
        onResolutionPresetChange={handlers.resolution.onResolutionPresetChange}
        onCustomResolutionTabChange={setCustomResolutionTab}
        onCustomResolutionChange={handlers.resolution.onCustomResolutionChange}
      />

      {/* FPS Tags */}
      <div className="mb-4">
        <h4 className="text-dark-400 font-mono text-xs mb-2 uppercase tracking-wider">Frame Rate</h4>
        <div className="flex flex-wrap gap-1.5">
          {[60, 30, 24, 15].map(fps => (
            <button
              key={fps}
              onClick={() => handlers.fps.onFpsChange(fps)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                (handlers.fps.currentFps || 30) === fps
                  ? 'bg-accent-pink text-white border border-accent-pink-dark'
                  : 'bg-dark-800 text-dark-400 border border-dark-650 hover:bg-dark-750 hover:text-dark-300'
              }`}
            >
              {fps}fps
            </button>
          ))}
        </div>
      </div>

      {/* Format-Specific Controls */}
      {currentStrategy.renderControls(exportSettings, updateExportSettings)}

      {/* Validation Display */}
      <ExportValidationDisplay validation={validation} />

      {/* Export Button */}
      <ExportButton
        exportState={exportState}
        validation={validation}
        currentFormat={exportSettings.format}
        onExport={() => handlers.export.onExport(validation)}
      />

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

export default ExportControlsPro;
