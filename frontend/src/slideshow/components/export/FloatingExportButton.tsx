import React from 'react';
import { ExportState, ValidationResult } from './ExportButton';

export interface FloatingExportButtonProps {
  exportState: ExportState;
  validation: ValidationResult;
  currentFormat: string;
  onExport: () => void;
}

const FloatingExportButton: React.FC<FloatingExportButtonProps> = ({
  exportState,
  validation,
  currentFormat,
  onExport
}) => {
  const getButtonText = () => {
    if (exportState.isExporting) {
      return '⏳ Exporting...';
    }
    
    if (!validation.canExport) {
      return '❌ Invalid';
    }
    
    return `🚀 Export ${currentFormat.toUpperCase()}`;
  };

  const getButtonTitle = () => {
    if (!validation.canExport) {
      const errorMessages = validation.messages
        .filter(m => m.type === 'error')
        .map(m => m.message)
        .join(', ');
      return `Invalid configuration: ${errorMessages}`;
    }
    return `Export slideshow as ${currentFormat.toUpperCase()}`;
  };

  return (
    <button
      onClick={onExport}
      disabled={exportState.isExporting || !validation.canExport}
      className={`
        absolute bottom-4 right-4 z-10
        px-4 py-3 rounded-lg font-mono font-bold text-sm uppercase 
        transition-all duration-200 shadow-lg
        ${exportState.isExporting || !validation.canExport
          ? 'bg-dark-600 cursor-not-allowed opacity-70 text-dark-400'
          : 'bg-accent-pink hover:bg-accent-pink-dark text-white shadow-glow-pink hover:scale-105'
        }
      `}
      title={getButtonTitle()}
    >
      {getButtonText()}
    </button>
  );
};

export default FloatingExportButton;
