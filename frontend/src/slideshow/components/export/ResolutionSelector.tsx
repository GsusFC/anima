import React from 'react';
import CustomResolutionPanel, { ResolutionSettings } from './CustomResolutionPanel';

export interface ResolutionSelectorProps {
  resolution: ResolutionSettings;
  customResolutionTab: 'manual' | 'presets';
  onResolutionPresetChange: (preset: string) => void;
  onCustomResolutionTabChange: (tab: 'manual' | 'presets') => void;
  onCustomResolutionChange: (resolution: Partial<ResolutionSettings>) => void;
}

const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  resolution,
  customResolutionTab,
  onResolutionPresetChange,
  onCustomResolutionTabChange,
  onCustomResolutionChange
}) => {
  const resolutionPresets = ['4k', '1080p', '720p', '480p', 'custom'];

  return (
    <div className="mb-3">
      <h4 className="text-dark-400 font-mono text-xs mb-2 uppercase tracking-wider">Resolution</h4>
      <div className="flex flex-wrap gap-1.5">
        {resolutionPresets.map(preset => (
          <button
            key={preset}
            onClick={() => onResolutionPresetChange(preset)}
            className={`px-2 py-1 rounded text-xs font-mono transition-all ${
              (resolution.preset || '1080p') === preset
                ? 'bg-accent-pink text-white border border-accent-pink-dark'
                : 'bg-dark-800 text-dark-400 border border-dark-650 hover:bg-dark-750 hover:text-dark-300'
            }`}
          >
            {preset === '4k' ? '4K' : preset.toUpperCase()}
          </button>
        ))}
      </div>
      
      {/* Custom Resolution Panel */}
      {resolution.preset === 'custom' && (
        <CustomResolutionPanel
          resolution={resolution}
          activeTab={customResolutionTab}
          onTabChange={onCustomResolutionTabChange}
          onResolutionChange={onCustomResolutionChange}
        />
      )}
    </div>
  );
};

export default ResolutionSelector;
