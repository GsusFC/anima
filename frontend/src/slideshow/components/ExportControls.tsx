import React from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import ExportProgressModal from './ExportProgressModal';
import { ExportStrategyFactory } from '../strategies/ExportStrategyFactory';
import BaseExportBuilder from '../../shared/components/base/BaseExportBuilder';
import type { BaseExportSettings, BaseExportState } from '../../shared/components/base/BaseExportBuilder';

// Import remaining specific components
import ResolutionSelectorSimple from './export/ResolutionSelectorSimple';
import AdvancedSettingsPanel from './export/AdvancedSettingsPanel';


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
    updateExportSettings
  } = useSlideshowContext();

  const { exportSettings } = project;

  // Get current strategy for format-specific controls
  const currentStrategy = ExportStrategyFactory.create(exportSettings.format);

  // Convert slideshow export settings to base format
  const baseExportSettings: BaseExportSettings = {
    format: exportSettings.format,
    quality: exportSettings.quality,
    fps: exportSettings.fps,
    resolution: exportSettings.resolution,
    gif: exportSettings.gif
  };

  // Convert slideshow export state to base format
  const baseExportState: BaseExportState = {
    isExporting: exportState.isExporting,
    progress: exportState.progress,
    error: exportState.error,
    isCompleted: exportState.isCompleted,
    downloadUrl: exportState.downloadUrl
  };

  // Handle settings change
  const handleSettingsChange = (newSettings: BaseExportSettings) => {
    updateExportSettings({
      format: newSettings.format,
      quality: newSettings.quality,
      fps: newSettings.fps,
      resolution: newSettings.resolution,
      gif: newSettings.gif
    });
  };

  // Additional controls specific to slideshow
  const additionalControls = (
    <>
      {/* Simplified Resolution Selection */}
      <ResolutionSelectorSimple
        resolution={exportSettings.resolution}
        onResolutionPresetChange={(preset) => {
          updateExportSettings({
            resolution: { ...exportSettings.resolution, preset }
          });
        }}
        onCustomResolutionChange={(resolution) => {
          updateExportSettings({
            resolution: { ...exportSettings.resolution, ...resolution, preset: 'custom' }
          });
        }}
      />

      {/* Advanced Settings (Collapsed) */}
      <AdvancedSettingsPanel
        strategy={currentStrategy}
        exportSettings={exportSettings}
        updateExportSettings={updateExportSettings}
        fpsHandlers={{
          currentFps: exportSettings.fps || 30,
          onFpsChange: (fps) => updateExportSettings({ fps })
        }}
      />
    </>
  );

  return (
    <>
      <BaseExportBuilder
        mode="slideshow"
        hasContent={hasTimeline}
        exportSettings={baseExportSettings}
        exportState={baseExportState}
        onSettingsChange={handleSettingsChange}
        onExport={exportSlideshow}
        additionalControls={additionalControls}
        exportButtonText="🚀 Export Slideshow"
        exportButtonDisabledText="❌ Invalid Configuration"
      />

      {/* Export Progress Modal - Keep existing modal for slideshow-specific features */}
      <ExportProgressModal
        isVisible={exportState.isExporting || exportState.isCompleted}
        progress={exportState.progress}
        error={exportState.error}
        isCompleted={exportState.isCompleted}
        downloadUrl={exportState.downloadUrl}
        currentStep={exportState.currentStep}
        onCancel={() => {
          // Cancel export logic
        }}
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
    </>
  );
};

export default ExportControls;
