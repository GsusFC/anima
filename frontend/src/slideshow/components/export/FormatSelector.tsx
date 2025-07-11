import React from 'react';
import { ExportStrategyFactory } from '../../strategies/ExportStrategyFactory';

export interface FormatSelectorProps {
  currentFormat: 'gif' | 'mp4' | 'webm' | 'mov';
  onFormatChange: (format: 'gif' | 'mp4' | 'webm' | 'mov') => void;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  currentFormat,
  onFormatChange
}) => {
  return (
    <div className="mb-2">
      <h3 className="text-accent-pink font-mono text-sm font-bold mb-3 uppercase tracking-wider">
        📁 Export Format
      </h3>
      <div className="flex gap-2">
        {ExportStrategyFactory.getSupportedFormats().map((format) => (
          <button
            key={format}
            onClick={() => onFormatChange(format as any)}
            className={`flex-1 py-2 px-3 rounded text-xs font-mono font-bold uppercase transition-all ${
              currentFormat === format 
                ? 'bg-accent-pink text-white border border-accent-pink-dark' 
                : 'bg-dark-800 text-dark-300 border border-dark-650 hover:bg-dark-750 hover:border-dark-600'
            }`}
          >
            {format}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FormatSelector;
