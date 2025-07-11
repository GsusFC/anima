import React from 'react';
import { ValidationResult } from '../../../shared/types/validation.types';
import { toLegacyValidation, fromLegacySlideshowExportState, LegacySlideshowExportState } from '../../../shared/utils/validation-adapters';

export interface ExportButtonProps {
  exportState: LegacySlideshowExportState;
  validation: ValidationResult;
  currentFormat: string;
  onExport: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
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
      return '❌ Configuración Inválida';
    }

    return `🚀 Export ${currentFormat.toUpperCase()}`;
  };

  const getButtonTitle = () => {
    if (!legacyValidation.canExport) {
      const errorMessages = legacyValidation.messages
        .filter(m => m.type === 'error')
        .map(m => m.message)
        .join(', ');
      return `Configuración inválida: ${errorMessages}`;
    }
    return undefined;
  };

  return (
    <button
      onClick={onExport}
      disabled={canonicalExportState.isExporting || !legacyValidation.canExport}
      className={`mt-auto p-4 rounded-lg font-mono font-bold text-lg uppercase transition-all duration-200 ${
        canonicalExportState.isExporting || !legacyValidation.canExport
          ? 'bg-dark-600 cursor-not-allowed opacity-70 text-dark-400'
          : 'bg-accent-pink hover:bg-accent-pink-dark text-white shadow-glow-pink'
      }`}
      title={getButtonTitle()}
    >
      {getButtonText()}
    </button>
  );
};

export default ExportButton;
