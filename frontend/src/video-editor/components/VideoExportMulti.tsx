import React, { useState } from 'react';
import { useVideoEditor } from '../context/VideoEditorContextMulti';
import { VideoExportSettings } from '../types/video-editor.types';

const VideoExportMulti: React.FC = () => {
  const { project, hasSequence, getSequenceDuration } = useVideoEditor();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSettings, setExportSettings] = useState<VideoExportSettings>({
    format: 'mp4',
    quality: 'standard',
    resolution: {
      width: 1920,
      height: 1080,
      preset: 'original'
    },
    fps: 30,
    gif: {
      loop: 'infinite',
      colors: 256,
      dither: true
    }
  });

  if (!hasSequence) {
    return (
      <div className="h-full flex flex-col bg-gray-900">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-medium">Export Settings</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">No sequence to export</p>
            <p className="text-sm text-gray-500">Add videos to the timeline first</p>
          </div>
        </div>
      </div>
    );
  }

  const sequenceDuration = getSequenceDuration();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // TODO: Implement actual export functionality
      // For now, just simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('Export completed:', exportSettings);
      alert('Export completed! (This is a placeholder - actual export functionality will be implemented next)');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-medium">Export Settings</h3>
        <p className="text-gray-400 text-sm mt-1">
          Sequence: {formatTime(sequenceDuration)} • {project.sequence.items.length} item{project.sequence.items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Export Settings */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
          <select
            value={exportSettings.format}
            onChange={(e) => setExportSettings(prev => ({ 
              ...prev, 
              format: e.target.value as 'mp4' | 'webm' | 'mov' | 'gif' 
            }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="mp4">MP4 (H.264)</option>
            <option value="webm">WebM (VP9)</option>
            <option value="mov">MOV</option>
            <option value="gif">GIF</option>
          </select>
        </div>

        {/* Quality Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
          <select
            value={exportSettings.quality}
            onChange={(e) => setExportSettings(prev => ({ 
              ...prev, 
              quality: e.target.value as any 
            }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="web">Web (Small file)</option>
            <option value="standard">Standard</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>

        {/* Resolution Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
          <select
            value={exportSettings.resolution.preset}
            onChange={(e) => {
              const preset = e.target.value;
              let width = 1920, height = 1080;
              
              switch (preset) {
                case '480p': width = 854; height = 480; break;
                case '720p': width = 1280; height = 720; break;
                case '1080p': width = 1920; height = 1080; break;
                case '4k': width = 3840; height = 2160; break;
                case 'original': 
                  // Use first video's resolution as reference
                  const firstVideoItem = project.sequence.items.find(item => item.type === 'video');
                  if (firstVideoItem) {
                    const firstVideo = project.library.videos.find(v => v.id === (firstVideoItem as any).videoId);
                    if (firstVideo) {
                      width = firstVideo.width;
                      height = firstVideo.height;
                    }
                  }
                  break;
              }
              
              setExportSettings(prev => ({
                ...prev,
                resolution: { width, height, preset: preset as any }
              }));
            }}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="original">Original</option>
            <option value="480p">480p (854×480)</option>
            <option value="720p">720p (1280×720)</option>
            <option value="1080p">1080p (1920×1080)</option>
            <option value="4k">4K (3840×2160)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {exportSettings.resolution.width}×{exportSettings.resolution.height}
          </p>
        </div>

        {/* Frame Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Frame Rate</label>
          <select
            value={exportSettings.fps}
            onChange={(e) => setExportSettings(prev => ({ 
              ...prev, 
              fps: parseInt(e.target.value) 
            }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
          >
            <option value={24}>24 fps</option>
            <option value={30}>30 fps</option>
            <option value={60}>60 fps</option>
          </select>
        </div>

        {/* GIF-specific settings */}
        {exportSettings.format === 'gif' && (
          <div className="space-y-4 p-4 bg-gray-800 rounded border border-gray-600">
            <h4 className="text-sm font-medium text-gray-300">GIF Options</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Colors</label>
              <select
                value={exportSettings.gif?.colors}
                onChange={(e) => setExportSettings(prev => ({
                  ...prev,
                  gif: { 
                    ...prev.gif!, 
                    colors: parseInt(e.target.value) as any 
                  }
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
              >
                <option value={256}>256 colors (best quality)</option>
                <option value={128}>128 colors</option>
                <option value={64}>64 colors</option>
                <option value={32}>32 colors (smallest)</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={exportSettings.gif?.dither}
                onChange={(e) => setExportSettings(prev => ({
                  ...prev,
                  gif: { 
                    ...prev.gif!, 
                    dither: e.target.checked 
                  }
                }))}
                className="mr-2"
              />
              <label className="text-sm text-gray-400">Enable dithering</label>
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="p-4 border-t border-gray-700">
        {isExporting ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Exporting...</span>
              <span>{exportProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={handleExport}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
          >
            Export Sequence
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoExportMulti;
