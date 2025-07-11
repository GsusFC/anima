import React from 'react';
import { VideoExportSettings, QualityValue } from '../../types/video-editor.types';

interface ExportQualitySettingsProps {
  settings: VideoExportSettings;
  onSettingsChange: (settings: VideoExportSettings) => void;
}

export const ExportQualitySettings: React.FC<ExportQualitySettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const qualityOptions = [
    { value: 'web', label: 'Web' },
    { value: 'standard', label: 'Standard' },
    { value: 'high', label: 'High' },
    { value: 'max', label: 'Maximum' }
  ];

  return (
    <div className="mb-4">
      {/* Quality Settings */}
      <div className="mb-3">
        <h3 className="text-mono-upper text-pink-500 mb-2">
          Quality Settings
        </h3>
        
        <div className="flex gap-1.5 flex-wrap">
          {qualityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSettingsChange({
                ...settings,
                quality: option.value as QualityValue
              })}
              className={`px-3 py-1.5 rounded border text-xs font-mono transition-all ${
                settings.quality === option.value
                  ? 'border-pink-500 bg-pink-500/20 text-pink-500 font-bold'
                  : 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Rate - Single Line */}
      <div className="flex items-center gap-2">
        <label className="text-mono-upper text-pink-500">
          Frame Rate (FPS)
        </label>
        <input
          type="number"
          min="1"
          max={settings.format === 'gif' ? "30" : "60"}
          value={settings.fps}
          onChange={(e) => onSettingsChange({
            ...settings,
            fps: parseInt(e.target.value) || 30
          })}
          className="w-15 px-1.5 py-1 bg-gray-700 border border-gray-600 rounded text-gray-200 text-xs font-mono"
        />
      </div>
    </div>
  );
};
