import React from 'react';
import { ValidationResult } from '../../../shared/types/validation.types';
import { toLegacyValidation, fromLegacySlideshowExportState, LegacySlideshowExportState } from '../../../shared/utils/validation-adapters';

export interface FloatingExportButtonProps {
  exportState: LegacySlideshowExportState;
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
  // Convertir a formatos canónicos
  const canonicalExportState = fromLegacySlideshowExportState(exportState);
  const legacyValidation = toLegacyValidation(validation);

  const getButtonText = () => {
    if (canonicalExportState.isExporting) {
      return '⏳ Exporting...';
    }

    if (!legacyValidation.canExport) {
      return '❌ Invalid';
    }

    return `🚀 Export ${currentFormat.toUpperCase()}`;
  };

  const getButtonTitle = () => {
    if (!legacyValidation.canExport) {
      const errorMessages = legacyValidation.messages
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
      disabled={canonicalExportState.isExporting || !legacyValidation.canExport}
      className={`
        absolute bottom-4 right-4 z-20
        px-4 py-3 rounded-lg font-mono font-bold text-sm uppercase
        transition-all duration-200 shadow-lg
        min-w-[120px] max-w-[200px]
        ${canonicalExportState.isExporting || !legacyValidation.canExport
          ? 'bg-dark-600 cursor-not-allowed opacity-70 text-dark-400'
          : 'bg-accent-pink hover:bg-accent-pink-dark text-white shadow-glow-pink hover:scale-105'
        }
      `}
      title={getButtonTitle()}
      style={{
        // Fallback styles para asegurar visibilidad
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        zIndex: 20
      }}
    >
      {getButtonText()}
    </button>
  );
};

export default FloatingExportButton;
