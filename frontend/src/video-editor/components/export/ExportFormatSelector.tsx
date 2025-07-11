import React from 'react';
import { ExportStrategyFactory } from './strategies/ExportStrategyFactory';

interface ExportFormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
}

export const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({
  selectedFormat,
  onFormatChange
}) => {
  const strategies = ExportStrategyFactory.getAllStrategies();

  return (
    <div className="mb-4">
      <h3 className="text-mono-upper text-pink-500 mb-2">
        Export Format
      </h3>
      
      <div className="flex gap-1.5 flex-wrap">
        {strategies.map((strategy) => (
          <button
            key={strategy.format}
            onClick={() => onFormatChange(strategy.format)}
            className={`px-3 py-1.5 rounded border text-xs font-mono transition-all ${
              selectedFormat === strategy.format
                ? 'border-pink-500 bg-pink-500/20 text-pink-500 font-bold'
                : 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {strategy.displayName}
          </button>
        ))}
      </div>
    </div>
  );
};
