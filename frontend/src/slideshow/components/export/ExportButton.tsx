import React from 'react';

export interface ExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
  isCompleted: boolean;
}

export interface ValidationResult {
  canExport: boolean;
  messages: Array<{ type: 'error' | 'warning'; message: string }>;
}

export interface ExportButtonProps {
  exportState: ExportState;
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
  const getButtonText = () => {
    if (exportState.isExporting) {
      return '⏳ Exporting...';
    }
    
    if (!validation.canExport) {
      return '❌ Configuración Inválida';
    }
    
    return `🚀 Export ${currentFormat.toUpperCase()}`;
  };

  const getButtonTitle = () => {
    if (!validation.canExport) {
      const errorMessages = validation.messages
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
      disabled={exportState.isExporting || !validation.canExport}
      className={`mt-auto p-4 rounded-lg font-mono font-bold text-lg uppercase transition-all duration-200 ${
        exportState.isExporting || !validation.canExport
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
