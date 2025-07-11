import React from 'react';
import { VideoExportSettings, ResolutionPreset } from '../../types/video-editor.types';

interface ExportResolutionSettingsProps {
  settings: VideoExportSettings;
  onSettingsChange: (settings: VideoExportSettings) => void;
  originalWidth: number;
  originalHeight: number;
}

export const ExportResolutionSettings: React.FC<ExportResolutionSettingsProps> = ({
  settings,
  onSettingsChange,
  originalWidth,
  originalHeight
}) => {
  const resolutionPresets = [
    { value: 'original', label: 'Original', width: originalWidth, height: originalHeight },
    { value: 'large', label: 'Full HD', width: 1920, height: 1080 },
    { value: 'medium', label: 'HD', width: 1280, height: 720 },
    { value: 'small', label: 'Small', width: 640, height: 360 },
    { value: 'custom', label: 'Custom', width: settings.resolution.width, height: settings.resolution.height }
  ];

  const handlePresetChange = (preset: string) => {
    const selectedPreset = resolutionPresets.find(p => p.value === preset);
    if (selectedPreset) {
      onSettingsChange({
        ...settings,
        resolution: {
          preset: preset as ResolutionPreset,
          width: selectedPreset.width,
          height: selectedPreset.height
        }
      });
    }
  };

  const handleCustomDimension = (dimension: 'width' | 'height', value: number) => {
    onSettingsChange({
      ...settings,
      resolution: {
        ...settings.resolution,
        preset: 'custom',
        [dimension]: value
      }
    });
  };

  return (
    <div className="mb-4">
      <h3 className="text-mono-upper text-pink-500 mb-2">
        Resolution
      </h3>
      
      <div className="flex gap-1.5 flex-wrap mb-2">
        {resolutionPresets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`px-3 py-1.5 rounded border text-xs font-mono transition-all ${
              settings.resolution.preset === preset.value
                ? 'border-pink-500 bg-pink-500/20 text-pink-500 font-bold'
                : 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Resolution Inputs */}
      {settings.resolution.preset === 'custom' && (
        <div className="flex gap-1.5 items-center mt-1.5">
          <input
            type="number"
            min="128"
            max="4096"
            value={settings.resolution.width}
            onChange={(e) => handleCustomDimension('width', parseInt(e.target.value) || 1920)}
            placeholder="Width"
            className="w-[70px] px-1.5 py-1 bg-gray-700 border border-gray-600 rounded text-gray-200 text-xs font-mono"
          />
          
          <span className="text-gray-400 text-xs font-mono">
            ×
          </span>
          
          <input
            type="number"
            min="128"
            max="4096"
            value={settings.resolution.height}
            onChange={(e) => handleCustomDimension('height', parseInt(e.target.value) || 1080)}
            placeholder="Height"
            className="w-[70px] px-1.5 py-1 bg-gray-700 border border-gray-600 rounded text-gray-200 text-xs font-mono"
          />
        </div>
      )}
    </div>
  );
};
