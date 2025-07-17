import React, { useCallback } from 'react';
import { UnifiedFormatSelector, UnifiedQualitySelector, UnifiedEmptyState } from '../export';
import type { ExportFormat, QualityLevel } from '../export';
import { useExportValidation, ExportSettings as ValidationExportSettings } from '../../../hooks/useExportValidation';
import { convertToUnifiedFormat, convertToValidationQuality, isValidUnifiedFormat } from '../../types/export.types';
import { showToast } from '../Toast';

// Base interfaces for unified export functionality
export interface BaseExportSettings {
  format: string;
  quality: string;
  fps?: number;
  resolution?: {
    width: number;
    height: number;
    preset: string;
  };
  gif?: {
    colors?: number;
    dither?: boolean | string;
    loop?: string | boolean;
  };
}

export interface BaseExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
  isCompleted: boolean;
  downloadUrl?: string;
}

export interface BaseExportBuilderProps<TSettings extends BaseExportSettings> {
  // Core props
  mode: 'slideshow' | 'video-editor';
  hasContent: boolean;
  
  // Settings and state
  exportSettings: TSettings;
  exportState: BaseExportState;
  
  // Handlers
  onSettingsChange: (settings: TSettings) => void;
  onExport: () => Promise<void>;
  onCancel?: () => void;
  
  // Customization
  additionalControls?: React.ReactNode;
  customValidation?: (settings: TSettings) => { canExport: boolean; messages: string[] };
  
  // Progress display
  progressContent?: React.ReactNode;
  
  // Export button customization
  exportButtonText?: string;
  exportButtonDisabledText?: string;
  
  // Layout
  className?: string;
}

/**
 * Base Export Builder Component
 * 
 * Unified foundation for export functionality across slideshow and video-editor.
 * Eliminates code duplication between ExportControls.tsx and VideoExportBuilder.tsx.
 * 
 * Features:
 * - Unified format and quality selection
 * - Real-time validation with type safety
 * - Progress tracking and error handling
 * - Customizable additional controls
 * - Mode-specific theming and behavior
 */
export function BaseExportBuilder<TSettings extends BaseExportSettings>({
  mode,
  hasContent,
  exportSettings,
  exportState,
  onSettingsChange,
  onExport,
  onCancel: _onCancel,
  additionalControls,
  customValidation,
  progressContent,
  exportButtonText,
  exportButtonDisabledText,
  className = ''
}: BaseExportBuilderProps<TSettings>) {
  
  // Convert to ValidationExportSettings for real-time validation
  const currentValidationSettings: ValidationExportSettings = {
    format: isValidUnifiedFormat(exportSettings.format) 
      ? convertToUnifiedFormat(exportSettings.format) 
      : 'mp4',
    fps: exportSettings.fps,
    quality: convertToValidationQuality(exportSettings.quality),
    resolution: exportSettings.resolution,
    gif: exportSettings.gif ? {
      ...exportSettings.gif,
      loop: typeof exportSettings.gif.loop === 'boolean'
        ? (exportSettings.gif.loop ? 'infinite' : 'once')
        : exportSettings.gif.loop
    } : undefined
  };

  // Real-time validation
  const validation = useExportValidation(currentValidationSettings);
  
  // Custom validation if provided
  const customValidationResult = customValidation?.(exportSettings);
  
  // Combined validation result
  const canExport = validation.canExport && (customValidationResult?.canExport ?? true);
  const allMessages = [
    ...validation.messages.map(m => m.message),
    ...(customValidationResult?.messages ?? [])
  ];

  // Handle format change
  const handleFormatChange = useCallback((format: string) => {
    onSettingsChange({
      ...exportSettings,
      format
    } as TSettings);
  }, [exportSettings, onSettingsChange]);

  // Handle quality change with type safety
  const handleQualityChange = useCallback((quality: QualityLevel) => {
    onSettingsChange({
      ...exportSettings,
      quality
    } as TSettings);
  }, [exportSettings, onSettingsChange]);

  // Handle export with error handling
  const handleExport = useCallback(async () => {
    if (!canExport) {
      showToast('Export configuration is invalid', 'error');
      return;
    }

    try {
      await onExport();
    } catch (error) {
      console.error('Export failed:', error);
      showToast(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        'error'
      );
    }
  }, [canExport, onExport]);

  // Show empty state if no content
  if (!hasContent) {
    return <UnifiedEmptyState mode={mode} />;
  }

  // Determine button styling based on mode
  const getButtonClasses = () => {
    const baseClasses = "w-full p-4 rounded-lg font-mono font-bold text-lg uppercase transition-all duration-200";
    const disabledClasses = "bg-dark-600 cursor-not-allowed opacity-60 text-dark-400";
    
    if (exportState.isExporting || !canExport) {
      return `${baseClasses} ${disabledClasses}`;
    }
    
    if (mode === 'slideshow') {
      return `${baseClasses} bg-pink-600 hover:bg-pink-700 text-white shadow-lg`;
    } else {
      return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white shadow-lg`;
    }
  };

  // Determine button text
  const getButtonText = () => {
    if (exportState.isExporting) {
      return `⏳ Exporting ${exportSettings.format.toUpperCase()}...`;
    }
    if (!canExport) {
      return exportButtonDisabledText || '❌ Invalid Configuration';
    }
    return exportButtonText || `🚀 Export ${exportSettings.format.toUpperCase()}`;
  };

  return (
    <div className={`h-full flex flex-col gap-4 ${className}`}>
      {/* Export Progress */}
      {exportState.isExporting && (
        <div className="p-3 bg-dark-900 rounded border border-dark-650">
          {progressContent || (
            <>
              <div className="text-sm font-mono text-accent-green mb-2">
                Exporting... {exportState.progress}%
              </div>
              <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-green transition-all duration-300 ease-out"
                  style={{ width: `${exportState.progress}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Core Export Controls */}
      <div className="space-y-3">
        {/* Format Selection */}
        <UnifiedFormatSelector
          currentFormat={exportSettings.format as ExportFormat}
          onFormatChange={handleFormatChange}
          mode={mode}
        />

        {/* Quality Selection */}
        <UnifiedQualitySelector
          currentQuality={exportSettings.quality as QualityLevel}
          onQualityChange={handleQualityChange}
          mode={mode}
        />

        {/* Additional Controls */}
        {additionalControls}
      </div>

      {/* Validation Messages */}
      {!canExport && allMessages.length > 0 && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
          <div className="text-red-400 text-sm font-mono">
            <div className="font-bold mb-1">Configuration Issues:</div>
            <ul className="list-disc list-inside space-y-1">
              {allMessages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={exportState.isExporting || !canExport}
        className={getButtonClasses()}
        title={!canExport ? `Invalid configuration: ${allMessages.join(', ')}` : undefined}
      >
        {getButtonText()}
      </button>
    </div>
  );
}

export default BaseExportBuilder;
