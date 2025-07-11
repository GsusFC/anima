import React from 'react';

export interface ResolutionSettings {
  width: number;
  height: number;
  preset: string;
}

export interface CustomResolutionPanelProps {
  resolution: ResolutionSettings;
  activeTab: 'manual' | 'presets';
  onTabChange: (tab: 'manual' | 'presets') => void;
  onResolutionChange: (resolution: Partial<ResolutionSettings>) => void;
}

const CustomResolutionPanel: React.FC<CustomResolutionPanelProps> = ({
  resolution,
  activeTab,
  onTabChange,
  onResolutionChange
}) => {
  const aspectRatioPresets = [
    { ratio: '1:1', width: 1080, height: 1080, label: 'Square' },
    { ratio: '16:9', width: 1920, height: 1080, label: 'Widescreen' },
    { ratio: '9:16', width: 1080, height: 1920, label: 'Portrait' },
    { ratio: '4:3', width: 1440, height: 1080, label: 'Classic' },
    { ratio: '21:9', width: 2560, height: 1080, label: 'Ultrawide' }
  ];

  return (
    <div className="mt-1.5 p-1.5 bg-dark-800/50 rounded border border-dark-650/50">
      {/* Tab Headers */}
      <div className="flex mb-2">
        <button
          onClick={() => onTabChange('presets')}
          className={`flex-1 px-2 py-1 text-xs font-mono rounded-l border-r border-dark-600 transition-colors ${
            activeTab === 'presets'
              ? 'bg-accent-pink text-white border-accent-pink'
              : 'bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-dark-300'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => onTabChange('manual')}
          className={`flex-1 px-2 py-1 text-xs font-mono rounded-r transition-colors ${
            activeTab === 'manual'
              ? 'bg-accent-pink text-white border-accent-pink'
              : 'bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-dark-300'
          }`}
        >
          Manual
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'presets' && (
        <div className="space-y-2">
          <div className="text-dark-400 font-mono text-xs text-center mb-2">Aspect Ratios</div>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {aspectRatioPresets.map((preset) => (
              <button
                key={preset.ratio}
                onClick={() => onResolutionChange({
                  preset: 'custom',
                  width: preset.width,
                  height: preset.height
                })}
                className={`px-2 py-1.5 bg-dark-700 hover:bg-dark-600 border rounded text-xs font-mono transition-colors ${
                  resolution.width === preset.width && resolution.height === preset.height
                    ? 'border-accent-pink text-accent-pink'
                    : 'border-dark-600 text-dark-300 hover:text-white'
                }`}
                title={`${preset.width} × ${preset.height}`}
              >
                <div className="font-bold">{preset.ratio}</div>
                <div className="text-xs opacity-75">{preset.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="space-y-2">
          <div className="text-dark-400 font-mono text-xs text-center mb-2">Manual Entry</div>
          <div className="flex items-center gap-2 justify-center">
            <div className="flex flex-col items-center">
              <label className="text-xs text-dark-400 mb-1">Width</label>
              <input
                type="number"
                value={resolution.width || 1920}
                onChange={(e) => onResolutionChange({
                  width: parseInt(e.target.value) || 1920,
                  preset: 'custom'
                })}
                className="w-20 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs font-mono text-center"
                min="320"
                max="4096"
                placeholder="1920"
              />
            </div>
            <span className="text-dark-500 font-mono text-lg mt-4">×</span>
            <div className="flex flex-col items-center">
              <label className="text-xs text-dark-400 mb-1">Height</label>
              <input
                type="number"
                value={resolution.height || 1080}
                onChange={(e) => onResolutionChange({
                  height: parseInt(e.target.value) || 1080,
                  preset: 'custom'
                })}
                className="w-20 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs font-mono text-center"
                min="240"
                max="2160"
                placeholder="1080"
              />
            </div>
          </div>
          <div className="text-center text-xs text-dark-500 mt-1">
            {resolution.width && resolution.height && (
              <>Ratio: {(resolution.width / resolution.height).toFixed(2)}:1</>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomResolutionPanel;
