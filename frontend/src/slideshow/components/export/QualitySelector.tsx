import React from 'react';
import { ExportStrategy } from '../../strategies/ExportStrategy';

export interface QualitySelectorProps {
  currentQuality: 'low' | 'medium' | 'high' | 'ultra';
  strategy: ExportStrategy;
  onQualityChange: (quality: 'low' | 'medium' | 'high' | 'ultra') => void;
}

const QualitySelector: React.FC<QualitySelectorProps> = ({
  currentQuality,
  strategy,
  onQualityChange
}) => {
  return (
    <div className="mb-3">
      <h4 className="text-dark-400 font-mono text-xs mb-2 uppercase tracking-wider">Quality</h4>
      <div className="flex flex-wrap gap-1.5">
        {strategy.getSupportedQualities().map(quality => (
          <button
            key={quality}
            onClick={() => onQualityChange(quality as any)}
            className={`px-2 py-1 rounded text-xs font-mono transition-all ${
              currentQuality === quality
                ? 'bg-accent-pink text-white border border-accent-pink-dark'
                : 'bg-dark-800 text-dark-400 border border-dark-650 hover:bg-dark-750 hover:text-dark-300'
            }`}
          >
            {quality.charAt(0).toUpperCase() + quality.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QualitySelector;
