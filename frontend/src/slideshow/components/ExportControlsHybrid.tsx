import React, { useState } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import { useExportManager, ExportOptions } from '../../utils/export-manager';
// import { FFmpegProgress } from '../../components/FFmpegProgress'; // Removed - FFmpeg not available

const ExportControlsHybrid: React.FC = () => {
  const { project, hasTimeline } = useSlideshowContext();
  const exportManager = useExportManager();
  
  // Local state for export settings
  const [settings, setSettings] = useState({
    format: 'mp4' as 'mp4' | 'webm' | 'gif',
    quality: 'standard' as 'low' | 'standard' | 'high',
    fps: 30,
    resolution: {
      preset: 'auto' as 'auto' | 'custom' | '480p' | '720p' | '1080p',
      width: 1920,
      height: 1080
    }
  });

  const [customResolutionTab, setCustomResolutionTab] = useState<'presets' | 'manual'>('presets');

  const handleExport = async () => {
    if (!hasTimeline || project.images.length === 0) return;

    // Convert project images to File objects
    const imageFiles = await Promise.all(
      project.images.map(async (img) => {
        if (img.file instanceof File) {
          return img.file;
        }
        // If it's a preview URL, fetch it and convert to File
        const response = await fetch(img.preview);
        const blob = await response.blob();
        return new File([blob], img.id + '.png', { type: 'image/png' });
      })
    );

    // Prepare export options
    const options: ExportOptions = {
      format: settings.format,
      fps: settings.fps,
      quality: settings.quality,
      frameDurations: project.timeline.map(item => item.duration / 1000), // Convert to seconds
    };

    // Set resolution based on preset
    if (settings.resolution.preset === 'custom') {
      options.resolution = {
        width: settings.resolution.width,
        height: settings.resolution.height
      };
    } else if (settings.resolution.preset !== 'auto') {
      const resolutionMap = {
        '480p': { width: 854, height: 480 },
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 }
      };
      options.resolution = resolutionMap[settings.resolution.preset];
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
    const filename = `slideshow_${timestamp}.${settings.format}`;

    await exportManager.exportSlideshow(imageFiles, options, filename);
  };

  const updateSettings = (updates: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <>
      <div className="p-6 bg-dark-800 h-full flex flex-col">
        <h2 className="text-lg font-semibold text-white mb-6">Export Settings</h2>
        
        {/* Export Method Indicator */}
        {exportManager.method && (
          <div className="mb-6 p-3 bg-dark-700 rounded-md border border-blue-500/30">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-blue-300">
                Using {exportManager.method === 'wasm' ? 'local processing' : 'backend processing'}
              </span>
            </div>
          </div>
        )}

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Format</label>
          <div className="grid grid-cols-3 gap-2">
            {(['mp4', 'webm', 'gif'] as const).map((format) => (
              <button
                key={format}
                onClick={() => updateSettings({ format })}
                disabled={exportManager.isExporting}
                className={`py-2 px-3 text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  settings.format === format
                    ? 'bg-primary text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600 disabled:hover:bg-dark-700'
                }`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Selection (for videos only) */}
        {settings.format !== 'gif' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'standard', 'high'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => updateSettings({ quality })}
                  disabled={exportManager.isExporting}
                  className={`py-2 px-3 text-sm font-medium rounded-md transition-colors capitalize disabled:cursor-not-allowed disabled:opacity-50 ${
                    settings.quality === quality
                      ? 'bg-primary text-white'
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600 disabled:hover:bg-dark-700'
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FPS */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Frame Rate: {settings.fps} FPS
          </label>
          <input
            type="range"
            min={settings.format === 'gif' ? 5 : 24}
            max={settings.format === 'gif' ? 30 : 60}
            value={settings.fps}
            onChange={(e) => updateSettings({ fps: parseInt(e.target.value) })}
            disabled={exportManager.isExporting}
            className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{settings.format === 'gif' ? '5' : '24'}</span>
            <span>{settings.format === 'gif' ? '30' : '60'}</span>
          </div>
        </div>

        {/* Resolution */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Resolution</label>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            {([
              { value: 'auto', label: 'Auto' },
              { value: '480p', label: '480p' },
              { value: '720p', label: '720p' },
              { value: '1080p', label: '1080p' }
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateSettings({ 
                  resolution: { ...settings.resolution, preset: value }
                })}
                disabled={exportManager.isExporting}
                className={`py-2 px-3 text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  settings.resolution.preset === value
                    ? 'bg-primary text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600 disabled:hover:bg-dark-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => updateSettings({ 
              resolution: { ...settings.resolution, preset: 'custom' }
            })}
            disabled={exportManager.isExporting}
            className={`w-full py-2 px-3 text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              settings.resolution.preset === 'custom'
                ? 'bg-primary text-white'
                : 'bg-dark-700 text-gray-300 hover:bg-dark-600 disabled:hover:bg-dark-700'
            }`}
          >
            Custom Resolution
          </button>

          {/* Custom Resolution Controls */}
          {settings.resolution.preset === 'custom' && (
            <div className="mt-4 p-4 bg-dark-700 rounded-md">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setCustomResolutionTab('presets')}
                  disabled={exportManager.isExporting}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    customResolutionTab === 'presets'
                      ? 'bg-primary text-white'
                      : 'bg-dark-600 text-gray-300 hover:bg-dark-500 disabled:hover:bg-dark-600'
                  }`}
                >
                  Presets
                </button>
                <button
                  onClick={() => setCustomResolutionTab('manual')}
                  disabled={exportManager.isExporting}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    customResolutionTab === 'manual'
                      ? 'bg-primary text-white'
                      : 'bg-dark-600 text-gray-300 hover:bg-dark-500 disabled:hover:bg-dark-600'
                  }`}
                >
                  Manual
                </button>
              </div>

              {customResolutionTab === 'presets' ? (
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { width: 1080, height: 1080, label: 'Square (1080x1080)' },
                    { width: 1080, height: 1920, label: 'Vertical (1080x1920)' },
                    { width: 1920, height: 1080, label: 'Horizontal (1920x1080)' },
                    { width: 800, height: 600, label: 'Classic (800x600)' }
                  ].map(({ width, height, label }) => (
                    <button
                      key={`${width}x${height}`}
                      onClick={() => updateSettings({
                        resolution: { ...settings.resolution, width, height }
                      })}
                      disabled={exportManager.isExporting}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-colors text-left disabled:cursor-not-allowed disabled:opacity-50 ${
                        settings.resolution.width === width && settings.resolution.height === height
                          ? 'bg-primary text-white'
                          : 'bg-dark-600 text-gray-300 hover:bg-dark-500 disabled:hover:bg-dark-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Width</label>
                    <input
                      type="number"
                      value={settings.resolution.width}
                      onChange={(e) => updateSettings({
                        resolution: { ...settings.resolution, width: parseInt(e.target.value) || 1920 }
                      })}
                      disabled={exportManager.isExporting}
                      className="w-full bg-dark-600 border border-dark-500 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      min="100"
                      max="4096"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Height</label>
                    <input
                      type="number"
                      value={settings.resolution.height}
                      onChange={(e) => updateSettings({
                        resolution: { ...settings.resolution, height: parseInt(e.target.value) || 1080 }
                      })}
                      disabled={exportManager.isExporting}
                      className="w-full bg-dark-600 border border-dark-500 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      min="100"
                      max="4096"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-auto">
          <button
            onClick={handleExport}
            disabled={!hasTimeline || project.images.length === 0 || exportManager.isExporting}
            className="w-full bg-primary hover:bg-primary-dark disabled:bg-dark-600 disabled:text-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
          >
            {exportManager.isExporting ? 'Exporting...' : `Export ${settings.format.toUpperCase()}`}
          </button>
          
          {(!hasTimeline || project.images.length === 0) && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Add images and create a timeline to export
            </p>
          )}
        </div>
      </div>

      {/* Progress Modal */}
      {exportManager.isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Processing Export...</h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-600">{exportManager.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportManager.progress}%` }}
                />
              </div>
            </div>
            {exportManager.message && (
              <p className="text-sm text-gray-600 mb-4">{exportManager.message}</p>
            )}
            {exportManager.error && (
              <p className="text-sm text-red-600 mb-4">{exportManager.error}</p>
            )}
            <button
              onClick={exportManager.reset}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportControlsHybrid;
