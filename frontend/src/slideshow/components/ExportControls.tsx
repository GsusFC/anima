import React from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import ExportProgressModal from './ExportProgressModal';
import { ExportStrategyFactory } from '../strategies/ExportStrategyFactory';

const ExportControls: React.FC = () => {
  const { 
    project, 
    export: exportState, 
    hasTimeline, 
    exportSlideshow, 
    updateExportSettings 
  } = useSlideshowContext();

  const { exportSettings } = project;
  // const [showAdvanced, setShowAdvanced] = useState(false); // TODO: Implement advanced settings
  
  const handleCancelExport = () => {
    // TODO: Implement actual export cancellation
    // For now, just reset the export state
    updateExportSettings({ isExporting: false, progress: 0, error: null });
  };

  // Add CSS for animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleFormatChange = (format: 'gif' | 'mp4' | 'webm' | 'mov') => {
    // Get default settings for the new format
    const strategy = ExportStrategyFactory.create(format);
    const defaults = strategy.getDefaults();
    updateExportSettings({ ...defaults, format });
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high' | 'ultra') => {
    updateExportSettings({ quality });
  };

  const handleResolutionChange = (preset: string) => {
    const presets = {
      'original': { width: 1920, height: 1080, preset: 'original' },
      '4k': { width: 3840, height: 2160, preset: '4k' },
      '1080p': { width: 1920, height: 1080, preset: '1080p' },
      '720p': { width: 1280, height: 720, preset: '720p' },
      '480p': { width: 854, height: 480, preset: '480p' },
      '360p': { width: 640, height: 360, preset: '360p' },
      'custom': { width: 1920, height: 1080, preset: 'custom' }
    };
    
    const resolution = presets[preset as keyof typeof presets];
    if (resolution) {
      updateExportSettings({ resolution });
    }
  };

  const handleFpsChange = (fps: number) => {
    updateExportSettings({ fps });
  };

  const handleExport = () => {
    // Validate settings using current strategy
    const strategy = ExportStrategyFactory.create(exportSettings.format);
    const validation = strategy.validate(exportSettings);
    
    if (!validation.isValid) {
      // Show validation errors (could be enhanced with a proper error modal)
      alert(`Export settings invalid:\n${validation.errors.join('\n')}`);
      return;
    }

    exportSlideshow();
  };

  // Get current strategy for format-specific controls
  const currentStrategy = ExportStrategyFactory.create(exportSettings.format);

  if (!hasTimeline) {
    return (
      <div className="h-full bg-dark-950 flex flex-col p-3">
        <div className="panel flex-1 flex items-center justify-center flex-col gap-3">
          <svg className="w-12 h-12 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-center text-dark-400 font-mono">
            <div className="text-lg mb-1">No Export Available</div>
            <div className="text-sm">Add images to timeline to enable export</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-dark-950 p-4 flex flex-col gap-4">
      
      {/* Format Selection - Simplified */}
      <div className="mb-2">
        <h3 className="text-accent-pink font-mono text-sm font-bold mb-3 uppercase tracking-wider">
          📁 Export Format
        </h3>
        <div className="flex gap-2">
          {ExportStrategyFactory.getSupportedFormats().map((format) => (
            <button
              key={format}
              onClick={() => handleFormatChange(format as any)}
              className={`flex-1 py-2 px-3 rounded text-xs font-mono font-bold uppercase transition-all ${
                exportSettings.format === format 
                  ? 'bg-accent-pink text-white border border-accent-pink-dark' 
                  : 'bg-dark-800 text-dark-300 border border-dark-650 hover:bg-dark-750 hover:border-dark-600'
              }`}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Tags */}
      <div className="mb-3">
        <h4 className="text-dark-400 font-mono text-xs mb-2 uppercase tracking-wider">Quality</h4>
        <div className="flex flex-wrap gap-1.5">
          {currentStrategy.getSupportedQualities().map(quality => (
            <button
              key={quality}
              onClick={() => handleQualityChange(quality as any)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                exportSettings.quality === quality
                  ? 'bg-accent-pink text-white border border-accent-pink-dark'
                  : 'bg-dark-800 text-dark-400 border border-dark-650 hover:bg-dark-750 hover:text-dark-300'
              }`}
            >
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Resolution Tags */}
      <div className="mb-3">
        <h4 className="text-dark-400 font-mono text-xs mb-2 uppercase tracking-wider">Resolution</h4>
        <div className="flex flex-wrap gap-1.5">
          {['4k', '1080p', '720p', '480p', 'custom'].map(preset => (
            <button
              key={preset}
              onClick={() => handleResolutionChange(preset)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                (exportSettings.resolution?.preset || '1080p') === preset
                  ? 'bg-accent-pink text-white border border-accent-pink-dark'
                  : 'bg-dark-800 text-dark-400 border border-dark-650 hover:bg-dark-750 hover:text-dark-300'
              }`}
            >
              {preset === '4k' ? '4K' : preset.toUpperCase()}
            </button>
          ))}
        </div>
        
        {/* Custom Resolution Input */}
        {exportSettings.resolution?.preset === 'custom' && (
          <div className="mt-2 p-2 bg-dark-800 rounded border border-dark-650">
            <div className="text-dark-400 font-mono text-xs mb-2">Custom Resolution</div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Width"
                value={exportSettings.resolution?.width || 1920}
                onChange={(e) => updateExportSettings({
                  resolution: {
                    ...exportSettings.resolution,
                    width: parseInt(e.target.value) || 1920,
                    preset: 'custom'
                  }
                })}
                className="flex-1 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs font-mono"
              />
              <span className="text-dark-400 font-mono text-xs flex items-center">×</span>
              <input
                type="number"
                placeholder="Height"
                value={exportSettings.resolution?.height || 1080}
                onChange={(e) => updateExportSettings({
                  resolution: {
                    ...exportSettings.resolution,
                    height: parseInt(e.target.value) || 1080,
                    preset: 'custom'
                  }
                })}
                className="flex-1 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* FPS Tags */}
      <div className="mb-4">
        <h4 className="text-dark-400 font-mono text-xs mb-2 uppercase tracking-wider">Frame Rate</h4>
        <div className="flex flex-wrap gap-1.5">
          {[60, 30, 24, 15].map(fps => (
            <button
              key={fps}
              onClick={() => handleFpsChange(fps)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                (exportSettings.fps || 30) === fps
                  ? 'bg-accent-pink text-white border border-accent-pink-dark'
                  : 'bg-dark-800 text-dark-400 border border-dark-650 hover:bg-dark-750 hover:text-dark-300'
              }`}
            >
              {fps}fps
            </button>
          ))}
        </div>
      </div>

      {/* Format-Specific Controls - Clean */}
      {currentStrategy.renderControls(exportSettings, updateExportSettings)}

      {/* Export Button - Prominent */}
      <button
        onClick={handleExport}
        disabled={exportState.isExporting}
        className={`mt-auto p-4 rounded-lg font-mono font-bold text-lg uppercase transition-all duration-200 ${
          exportState.isExporting 
            ? 'bg-dark-600 cursor-not-allowed opacity-70 text-dark-400' 
            : 'bg-accent-pink hover:bg-accent-pink-dark text-white shadow-glow-pink'
        }`}
      >
        {exportState.isExporting ? 
          '⏳ Exporting...' : 
          `🚀 Export ${exportSettings.format.toUpperCase()}`
        }
      </button>

      {/* Export Progress Modal */}
      <ExportProgressModal
        isVisible={exportState.isExporting}
        progress={exportState.progress}
        error={exportState.error}
        onCancel={handleCancelExport}
        format={exportSettings.format}
      />
    </div>
  );
};

export default ExportControls;
