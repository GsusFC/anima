import React, { useState, useCallback, useEffect } from 'react';
import { useVideoEditorContext } from '../../context/VideoEditorContext';
import { VideoExportSettings } from '../../types/video-editor.types';
import { showToast } from '../Toast';
import { ExportStrategyFactory } from './strategies/ExportStrategyFactory';
import { ExportFormatSelector } from './ExportFormatSelector';
import { ExportQualitySettings } from './ExportQualitySettings';
import { ExportResolutionSettings } from './ExportResolutionSettings';
import { ExportGIFSettings } from './ExportGIFSettings';
import { useExportValidation, ExportSettings } from '../../../hooks/useExportValidation';
import { ValidationMessages, ValidationSummary } from '../../../components/ValidationMessages';

/**
 * Video Export Builder - Strategy Pattern
 * Uses export strategies for different formats with specialized UI components
 */
export const VideoExportBuilder: React.FC = () => {
  const { project, hasVideo } = useVideoEditorContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSettings, setExportSettings] = useState<VideoExportSettings>({
    format: 'mp4',
    quality: 'standard',
    resolution: {
      width: project.video?.width || 1920,
      height: project.video?.height || 1080,
      preset: 'original'
    },
    fps: 30,
    gif: {
      loop: 'infinite',
      colors: 256,
      dither: true
    }
  });

  // Convert VideoExportSettings to ExportSettings for validation
  const currentExportSettings: ExportSettings = {
    format: exportSettings.format as any,
    fps: exportSettings.fps,
    quality: exportSettings.quality as any,
    resolution: exportSettings.resolution,
    gif: exportSettings.gif
  };

  // Real-time validation
  const validation = useExportValidation(currentExportSettings);

  // Update settings when format changes
  const handleFormatChange = useCallback((format: string) => {
    const strategy = ExportStrategyFactory.getStrategy(format);
    if (strategy) {
      setExportSettings(prev => ({
        ...prev,
        ...strategy.defaultSettings,
        format: format as VideoExportSettings['format']
      }));
    }
  }, []);

  // Update resolution when video changes
  useEffect(() => {
    if (hasVideo && project.video) {
      setExportSettings(prev => ({
        ...prev,
        resolution: {
          ...prev.resolution,
          width: project.video!.width,
          height: project.video!.height
        }
      }));
    }
  }, [hasVideo, project.video]);

  const totalDuration = project.segments.reduce((sum, segment) => 
    sum + (segment.endTime - segment.startTime), 0
  );

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Real-time validation check
      if (!validation.canExport) {
        const errorMessages = validation.messages
          .filter(m => m.type === 'error')
          .map(m => m.message)
          .join('\n');

        showToast(`Configuración inválida: ${errorMessages}`, 'error');
        setIsExporting(false);
        return;
      }

      // Validation
      if (project.segments.length === 0) {
        showToast('No segments found. Please create segments first.', 'warning');
        setIsExporting(false);
        return;
      }

      if (!project.video?.uploadedInfo?.path) {
        showToast('Original video path not available. Please re-upload video.', 'warning');
        setIsExporting(false);
        return;
      }

      // Get strategy for current format
      const strategy = ExportStrategyFactory.getStrategy(exportSettings.format);
      if (!strategy) {
        showToast(`Unsupported export format: ${exportSettings.format}`, 'error');
        setIsExporting(false);
        return;
      }

      // Validate settings (legacy validation as backup)
      const validationError = strategy.validateSettings(exportSettings);
      if (validationError) {
        showToast(`Settings error: ${validationError}`, 'error');
        setIsExporting(false);
        return;
      }

      console.log('🎬 Starting export with strategy:', {
        format: exportSettings.format,
        segments: project.segments,
        settings: exportSettings,
        totalDuration
      });

      // Prepare export request
      const segment = project.segments[0]; // For now, export first segment
      const exportRequest = {
        videoPath: project.video.uploadedInfo.path,
        startTime: segment.startTime,
        endTime: segment.endTime,
        settings: exportSettings
      };

      // Execute export using strategy
      const result = await strategy.execute(exportRequest);
      
      if (result.success && result.downloadUrl) {
        // Trigger download
        const API_BASE_URL = window.location.hostname === 'localhost' 
          ? 'http://localhost:3001' 
          : window.location.origin;
          
        const link = document.createElement('a');
        link.href = `${API_BASE_URL}${result.downloadUrl}`;
        link.download = result.filename || `exported_video.${exportSettings.format}`;
        link.setAttribute('target', '_blank');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
        
        console.log('✅ Export completed and downloaded:', result.filename);
        showToast(`Export completed! Downloaded: ${result.filename}`, 'success');
        setExportProgress(100);
      } else {
        throw new Error(result.error || 'Export failed');
      }

      setIsExporting(false);

    } catch (error) {
      console.error('❌ Export failed:', error);
      showToast(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Empty state
  if (!hasVideo) {
    return (
      <div className="h-full flex items-center justify-center text-dark-500 bg-dark-850">
        <div className="text-center font-mono">
          <p className="m-0 text-lg">No Video Loaded</p>
          <p className="mt-1 text-sm">Export options will appear here</p>
        </div>
      </div>
    );
  }

  // const currentStrategy = ExportStrategyFactory.getStrategy(exportSettings.format);
  // const estimatedSize = currentStrategy 
  //   ? currentStrategy.estimateFileSize(totalDuration, exportSettings)
  //   : '0.0';

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Export Progress */}
      {isExporting && (
        <div className="p-3 bg-dark-900 rounded border border-dark-650">
          <div className="text-sm font-mono text-accent-green mb-2">
            Exporting... {exportProgress}%
          </div>
          <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-green transition-all duration-300 ease-out"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Simple Format & Quality Selection */}
      <div className="space-y-3">
        <ExportFormatSelector
          selectedFormat={exportSettings.format}
          onFormatChange={handleFormatChange}
        />

        <ExportQualitySettings
          settings={exportSettings}
          onSettingsChange={setExportSettings}
        />

        <ExportResolutionSettings
          settings={exportSettings}
          onSettingsChange={setExportSettings}
          originalWidth={project.video?.width || 1920}
          originalHeight={project.video?.height || 1080}
        />

        <ExportGIFSettings
          settings={exportSettings}
          onSettingsChange={setExportSettings}
        />

        {/* Validation Messages */}
        {validation.messages.length > 0 && (
          <div className="mt-4">
            <ValidationMessages
              validation={validation}
              className="space-y-2"
              maxMessages={3}
            />
          </div>
        )}
      </div>

      {/* Export Button - Prominent */}
      {/* Validation Summary */}
      <ValidationSummary
        validation={validation}
        className="mb-3"
      />

      <button
        onClick={handleExport}
        disabled={isExporting || project.segments.length === 0 || !validation.canExport}
        className={`mt-auto w-full p-4 rounded-lg font-mono font-bold text-lg uppercase transition-all duration-200 ${
          isExporting || project.segments.length === 0 || !validation.canExport
            ? 'bg-dark-600 cursor-not-allowed opacity-60 text-dark-400'
            : 'bg-accent-green hover:bg-green-600 text-white shadow-lg'
        }`}
        title={!validation.canExport
          ? `Configuración inválida: ${validation.messages.filter(m => m.type === 'error').map(m => m.message).join(', ')}`
          : undefined}
      >
        {isExporting
          ? `⏳ Exporting ${exportSettings.format.toUpperCase()}...`
          : !validation.canExport
            ? `❌ Configuración Inválida`
            : `🚀 Export ${exportSettings.format.toUpperCase()}`}
      </button>
    </div>
  );
};
