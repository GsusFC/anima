import React from 'react';
import { VideoExportSettings, GIFLoopValue, GIFColorValue } from '../../types/video-editor.types';

interface ExportGIFSettingsProps {
  settings: VideoExportSettings;
  onSettingsChange: (settings: VideoExportSettings) => void;
}

export const ExportGIFSettings: React.FC<ExportGIFSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  if (settings.format !== 'gif') {
    return null;
  }

  const loopOptions = [
    { value: 'infinite', label: 'Loop Forever' },
    { value: 'once', label: 'Play Once' },
    { value: '3', label: 'Loop 3 Times' },
    { value: '5', label: 'Loop 5 Times' }
  ];

  const colorOptions = [
    { value: 256, label: '256 Colors (Best Quality)' },
    { value: 128, label: '128 Colors (Good Quality)' },
    { value: 64, label: '64 Colors (Small Size)' },
    { value: 32, label: '32 Colors (Smallest)' }
  ];

  const updateGIFSetting = (key: keyof NonNullable<VideoExportSettings['gif']>, value: GIFLoopValue | GIFColorValue | boolean) => {
    onSettingsChange({
      ...settings,
      gif: {
        loop: 'infinite',
        colors: 256,
        dither: true,
        ...settings.gif,
        [key]: value
      }
    });
  };

  return (
    <div className="mb-4">
      <h3 className="text-mono-upper text-pink-500 mb-2">
        GIF Options
      </h3>
      
      {/* Loop Setting */}
      <div className="mb-4">
        <label className="block text-xs font-mono font-bold text-gray-200 mb-2">
          Loop Behavior
        </label>
        <div className="flex flex-col gap-1">
          {loopOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer py-1"
            >
              <input
                type="radio"
                name="gifLoop"
                value={option.value}
                checked={settings.gif?.loop === option.value}
                onChange={(e) => updateGIFSetting('loop', e.target.value as GIFLoopValue)}
                className="accent-pink-500"
              />
              <span className="text-xs font-mono text-gray-200">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div className="mb-4">
        <label className="block text-xs font-mono font-bold text-gray-200 mb-2">
          Color Palette
        </label>
        <div className="flex flex-col gap-1">
          {colorOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer py-1"
            >
              <input
                type="radio"
                name="gifColors"
                value={option.value}
                checked={settings.gif?.colors === option.value}
                onChange={(e) => updateGIFSetting('colors', parseInt(e.target.value) as GIFColorValue)}
                className="accent-pink-500"
              />
              <span className="text-xs font-mono text-gray-200">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Dithering */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.gif?.dither || false}
            onChange={(e) => updateGIFSetting('dither', e.target.checked)}
            className="accent-pink-500"
          />
          <div>
            <div className="text-xs font-mono font-bold text-gray-200">
              Enable Dithering
            </div>
            <div className="text-[10px] font-mono text-gray-400">
              Improves color gradients but increases file size
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};
