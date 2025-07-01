import React, { useState } from 'react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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
      '360p': { width: 640, height: 360, preset: '360p' }
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
      <div style={{
        height: '100%',
        backgroundColor: '#0a0a0b',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px'
      }}>
        <div style={{
          flex: 1,
          backgroundColor: '#1a1a1b',
          borderRadius: '8px',
          border: '1px solid #343536',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <svg style={{ width: '48px', height: '48px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontFamily: '"Space Mono", monospace'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>No Export Available</div>
            <div style={{ fontSize: '11px' }}>Add images to timeline to enable export</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      backgroundColor: '#0a0a0b',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      
      {/* Format Selection */}
      <div style={{
        backgroundColor: '#1a1a1b',
        border: '1px solid #343536',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#f3f4f6',
          fontWeight: 'bold',
          marginBottom: '12px',
          fontFamily: '"Space Mono", monospace'
        }}>
          📁 Export Format
        </div>

        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {ExportStrategyFactory.getSupportedFormats().map((format) => {
            return (
              <button
                key={format}
                onClick={() => handleFormatChange(format as any)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: exportSettings.format === format ? '#ec4899' : '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: '"Space Mono", monospace',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (exportSettings.format !== format) {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.borderColor = '#4b5563';
                  }
                }}
                onMouseLeave={(e) => {
                  if (exportSettings.format !== format) {
                    e.currentTarget.style.backgroundColor = '#1f2937';
                    e.currentTarget.style.borderColor = '#374151';
                  }
                }}
              >
                {format.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Format-Specific Controls using Strategy Pattern */}
      <div style={{
        backgroundColor: '#1a1a1b',
        border: '1px solid #343536',
        borderRadius: '8px',
        padding: '16px'
      }}>
        {currentStrategy.renderControls(exportSettings, updateExportSettings)}
      </div>

      {/* Quality Settings */}
      <div style={{
        backgroundColor: '#1a1a1b',
        border: '1px solid #343536',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#f3f4f6',
          fontWeight: 'bold',
          marginBottom: '12px',
          fontFamily: '"Space Mono", monospace'
        }}>
          ⚙️ Quality Settings
        </div>

        {/* Quality Selector */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '10px',
            color: '#9ca3af',
            marginBottom: '6px',
            fontFamily: '"Space Mono", monospace'
          }}>
            Quality Preset
          </label>
          <select
            value={exportSettings.quality}
            onChange={(e) => handleQualityChange(e.target.value as any)}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              color: 'white',
              fontSize: '10px',
              fontFamily: '"Space Mono", monospace'
            }}
          >
            {currentStrategy.getSupportedQualities().map(quality => (
              <option key={quality} value={quality}>
                {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: showAdvanced ? '#374151' : '#1f2937',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            color: '#9ca3af',
            fontSize: '10px',
            fontFamily: '"Space Mono", monospace',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Settings
        </button>

        {/* Advanced Settings Panel */}
        {showAdvanced && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#0f172a',
            border: '1px solid #374151',
            borderRadius: '4px',
            animation: 'slideIn 0.3s ease'
          }}>
            {/* Resolution Settings */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                color: '#9ca3af',
                marginBottom: '6px',
                fontFamily: '"Space Mono", monospace'
              }}>
                Resolution
              </label>
              <select
                value={exportSettings.resolution?.preset || '1080p'}
                onChange={(e) => handleResolutionChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '10px',
                  fontFamily: '"Space Mono", monospace'
                }}
              >
                <option value="4k">4K (3840x2160)</option>
                <option value="1080p">1080p (1920x1080)</option>
                <option value="720p">720p (1280x720)</option>
                <option value="480p">480p (854x480)</option>
                <option value="360p">360p (640x360)</option>
              </select>
            </div>

            {/* FPS Settings */}
            <div style={{ marginBottom: '0' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                color: '#9ca3af',
                marginBottom: '6px',
                fontFamily: '"Space Mono", monospace'
              }}>
                Frame Rate (FPS)
              </label>
              <select
                value={exportSettings.fps || 30}
                onChange={(e) => handleFpsChange(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '10px',
                  fontFamily: '"Space Mono", monospace'
                }}
              >
                <option value={60}>60 FPS (Smooth)</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={15}>15 FPS (Low Bandwidth)</option>
                <option value={12}>12 FPS (GIF Optimized)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={exportState.isExporting}
        style={{
          padding: '16px',
          backgroundColor: exportState.isExporting ? '#6b7280' : '#ec4899',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: exportState.isExporting ? 'not-allowed' : 'pointer',
          fontFamily: '"Space Mono", monospace',
          textTransform: 'uppercase',
          transition: 'background-color 0.2s ease',
          opacity: exportState.isExporting ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          if (!exportState.isExporting) {
            e.currentTarget.style.backgroundColor = '#db2777';
          }
        }}
        onMouseLeave={(e) => {
          if (!exportState.isExporting) {
            e.currentTarget.style.backgroundColor = '#ec4899';
          }
        }}
      >
        {exportState.isExporting ? 
          '⏳ Exporting...' : 
          `🚀 EXPORT ${exportSettings.format.toUpperCase()}`
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
