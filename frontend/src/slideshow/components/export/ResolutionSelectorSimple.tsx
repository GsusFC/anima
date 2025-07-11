import React, { useState } from 'react';
import { ResolutionSettings } from './CustomResolutionPanel';

export interface ResolutionSelectorSimpleProps {
  resolution: ResolutionSettings;
  onResolutionPresetChange: (preset: string) => void;
  onCustomResolutionChange: (resolution: Partial<ResolutionSettings>) => void;
}

const ResolutionSelectorSimple: React.FC<ResolutionSelectorSimpleProps> = ({
  resolution,
  onResolutionPresetChange,
  onCustomResolutionChange
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Simplified presets - only the most common ones
  const commonPresets = ['1080p', '720p', 'custom'];

  const handleCustomClick = () => {
    if (resolution.preset === 'custom') {
      setShowCustomModal(true);
    } else {
      onResolutionPresetChange('custom');
    }
  };

  return (
    <div className="mb-3">
      <h4 className="text-dark-400 font-mono text-xs mb-2 uppercase tracking-wider">Resolution</h4>
      <div className="flex flex-wrap gap-1.5">
        {commonPresets.map(preset => (
          <button
            key={preset}
            onClick={() => preset === 'custom' ? handleCustomClick() : onResolutionPresetChange(preset)}
            className={`px-2 py-1 rounded text-xs font-mono transition-all ${
              (resolution.preset || '1080p') === preset
                ? 'bg-accent-pink text-white border border-accent-pink-dark'
                : 'bg-dark-800 text-dark-400 border border-dark-650 hover:bg-dark-750 hover:text-dark-300'
            }`}
          >
            {preset === 'custom' ? 'Custom' : preset.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Custom Resolution Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-900 border border-dark-600 rounded-lg p-4 w-80">
            <h3 className="text-accent-pink font-mono text-sm font-bold mb-3 uppercase tracking-wider">
              Custom Resolution
            </h3>
            
            <div className="space-y-3">
              {/* Quick Presets */}
              <div>
                <h4 className="text-dark-400 font-mono text-xs mb-2">Quick Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Square', width: 1080, height: 1080 },
                    { label: 'Portrait', width: 1080, height: 1920 },
                    { label: 'Ultrawide', width: 2560, height: 1080 },
                    { label: 'Classic 4:3', width: 1440, height: 1080 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        onCustomResolutionChange({
                          preset: 'custom',
                          width: preset.width,
                          height: preset.height
                        });
                        setShowCustomModal(false);
                      }}
                      className="px-2 py-1.5 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded text-xs font-mono transition-colors text-dark-300 hover:text-white"
                    >
                      <div className="font-bold">{preset.label}</div>
                      <div className="text-xs opacity-75">{preset.width}×{preset.height}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Entry */}
              <div>
                <h4 className="text-dark-400 font-mono text-xs mb-2">Manual Entry</h4>
                <div className="flex items-center gap-2 justify-center">
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-dark-400 mb-1">Width</label>
                    <input
                      type="number"
                      value={resolution.width || 1920}
                      onChange={(e) => onCustomResolutionChange({
                        width: parseInt(e.target.value) || 1920,
                        preset: 'custom'
                      })}
                      className="w-20 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs font-mono text-center"
                      min="320"
                      max="4096"
                    />
                  </div>
                  <span className="text-dark-500 font-mono text-lg mt-4">×</span>
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-dark-400 mb-1">Height</label>
                    <input
                      type="number"
                      value={resolution.height || 1080}
                      onChange={(e) => onCustomResolutionChange({
                        height: parseInt(e.target.value) || 1080,
                        preset: 'custom'
                      })}
                      className="w-20 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs font-mono text-center"
                      min="240"
                      max="2160"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCustomModal(false)}
                className="flex-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded text-xs font-mono text-dark-300 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResolutionSelectorSimple;
