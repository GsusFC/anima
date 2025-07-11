import React, { useState } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import ExportProgressModal from './ExportProgressModal';

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

  const handleFormatChange = (format: 'gif' | 'mp4' | 'webm') => {
    updateExportSettings({ format });
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high' | 'ultra') => {
    updateExportSettings({ quality });
  };

  const handleResolutionChange = (preset: string) => {
    const presets = {
      'original': { width: 1920, height: 1080, preset: 'original' },
      '480p': { width: 854, height: 480, preset: '480p' },
      '720p': { width: 1280, height: 720, preset: '720p' },
      '1080p': { width: 1920, height: 1080, preset: '1080p' },
      '4k': { width: 3840, height: 2160, preset: '4k' }
    };
    
    const resolution = presets[preset as keyof typeof presets];
    if (resolution) {
      updateExportSettings({ resolution });
    }
  };



  if (!hasTimeline) {
    return (
      <div style={{
        height: '100%',
        backgroundColor: '#0a0a0b',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px' // Reduced padding
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1b',
          borderRadius: '8px',
          border: '1px solid #343536'
        }}>
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            fontFamily: '"Space Mono", monospace'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>Export Ready</div>
            <div style={{ fontSize: '11px' }}>Add content to timeline first</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      backgroundColor: '#0a0a0b',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 12px 0 12px', // No padding bottom for sticky button
      position: 'relative'
    }}>
      {/* Scrollable content area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        paddingBottom: '120px' // Space for fixed export button
      }}>
      {/* Format Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px',
          fontFamily: '"Space Mono", monospace'
        }}>
          Format
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['gif', 'mp4', 'webm'].map((format) => (
            <button
              key={format}
              onClick={() => handleFormatChange(format as any)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: exportSettings.format === format ? '#ec4899' : '#374151',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Space Mono", monospace',
                textTransform: 'uppercase'
              }}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px',
          fontFamily: '"Space Mono", monospace'
        }}>
          Quality
        </label>
        <select
          value={exportSettings.quality}
          onChange={(e) => handleQualityChange(e.target.value as any)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            fontFamily: '"Space Mono", monospace'
          }}
        >
          <option value="low">Low (Fast)</option>
          <option value="medium">Medium (Balanced)</option>
          <option value="high">High (Quality)</option>
          <option value="ultra">Ultra (Best)</option>
        </select>
      </div>

      {/* Resolution Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px',
          fontFamily: '"Space Mono", monospace'
        }}>
          Resolution
        </label>
        <select
          value={exportSettings.resolution.preset}
          onChange={(e) => handleResolutionChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            fontFamily: '"Space Mono", monospace'
          }}
        >
          <option value="original">Original</option>
          <option value="480p">480p (854×480)</option>
          <option value="720p">720p (1280×720)</option>
          <option value="1080p">1080p (1920×1080)</option>
          <option value="4k">4K (3840×2160)</option>
        </select>
      </div>

      {/* FPS Control */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px',
          fontFamily: '"Space Mono", monospace'
        }}>
          Frame Rate: {exportSettings.fps} FPS
        </label>
        <input
          type="range"
          min="10"
          max="60"
          step="5"
          value={exportSettings.fps}
          onChange={(e) => updateExportSettings({ fps: parseInt(e.target.value) })}
          style={{ width: '100%' }}
        />
      </div>

      {/* Advanced Settings Toggle */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '4px',
            color: '#9ca3af',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: '"Space Mono", monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
            e.currentTarget.style.color = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1f2937';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <span>⚙️ ADVANCED SETTINGS</span>
          <span style={{ 
            transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>
            ▼
          </span>
        </button>
      </div>

      {/* Advanced Settings Panel */}
      {showAdvanced && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '6px',
          animation: 'slideIn 0.3s ease'
        }}>
          
          {/* Bitrate Control */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginBottom: '8px',
              fontFamily: '"Space Mono", monospace'
            }}>
              Bitrate: {exportSettings.bitrate || 'Auto'} {exportSettings.bitrate ? 'Mbps' : ''}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={exportSettings.bitrate || 2}
                onChange={(e) => updateExportSettings({ bitrate: parseFloat(e.target.value) })}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => updateExportSettings({ bitrate: undefined })}
                style={{
                  padding: '4px 8px',
                  backgroundColor: exportSettings.bitrate ? '#1f2937' : '#ec4899',
                  border: 'none',
                  borderRadius: '3px',
                  color: 'white',
                  fontSize: '9px',
                  cursor: 'pointer',
                  fontFamily: '"Space Mono", monospace'
                }}
              >
                AUTO
              </button>
            </div>
          </div>

          {/* Encoder Preset */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginBottom: '8px',
              fontFamily: '"Space Mono", monospace'
            }}>
              Encoder Preset
            </label>
            <select
              value={exportSettings.preset || 'medium'}
              onChange={(e) => updateExportSettings({ preset: e.target.value })}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                fontFamily: '"Space Mono", monospace'
              }}
            >
              <option value="ultrafast">Ultra Fast (Large Size)</option>
              <option value="superfast">Super Fast</option>
              <option value="veryfast">Very Fast</option>
              <option value="faster">Faster</option>
              <option value="fast">Fast</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="slow">Slow (Better Quality)</option>
              <option value="slower">Slower</option>
              <option value="veryslow">Very Slow (Best Quality)</option>
            </select>
          </div>

          {/* GIF Specific Settings */}
          {exportSettings.format === 'gif' && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#0f172a',
              border: '1px solid #ec4899',
              borderRadius: '6px'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#ec4899',
                fontWeight: 'bold',
                marginBottom: '12px',
                fontFamily: '"Space Mono", monospace',
                textTransform: 'uppercase'
              }}>
                🎨 GIF Optimization
              </div>
              
              {/* Loop Settings */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginBottom: '6px',
                  fontFamily: '"Space Mono", monospace'
                }}>
                  Loop Behavior
                </label>
                <select
                  value={exportSettings.loop ? 'infinite' : '1'}
                  onChange={(e) => updateExportSettings({ loop: e.target.value === 'infinite' })}
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
                  <option value="infinite">🔄 Infinite Loop</option>
                  <option value="1">⏹️ Play Once</option>
                </select>
              </div>

              {/* Dithering */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginBottom: '6px',
                  fontFamily: '"Space Mono", monospace'
                }}>
                  Dithering Algorithm
                </label>
                <select
                  value={exportSettings.gif?.dither || 'floyd_steinberg'}
                  onChange={(e) => updateExportSettings({ 
                    gif: { 
                      ...exportSettings.gif, 
                      dither: e.target.value as 'none' | 'bayer' | 'floyd_steinberg' | 'sierra2' | 'sierra2_4a'
                    } 
                  })}
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
                  <option value="floyd_steinberg">Floyd-Steinberg (Best Quality)</option>
                  <option value="bayer">Bayer (Fast)</option>
                  <option value="sierra2">Sierra2 (Balanced)</option>
                  <option value="sierra2_4a">Sierra2-4A (Smooth)</option>
                  <option value="none">No Dithering</option>
                </select>
              </div>

              {/* Color Palette */}
              <div style={{ marginBottom: '0' }}>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginBottom: '6px',
                  fontFamily: '"Space Mono", monospace'
                }}>
                  Color Palette Size
                </label>
                <select
                  value={exportSettings.gif?.colors || 256}
                  onChange={(e) => updateExportSettings({ 
                    gif: { 
                      ...exportSettings.gif, 
                      colors: parseInt(e.target.value) as 16 | 32 | 64 | 128 | 256
                    } 
                  })}
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
                  <option value={256}>256 Colors (Max Quality)</option>
                  <option value={128}>128 Colors (Balanced)</option>
                  <option value={64}>64 Colors (Smaller Size)</option>
                  <option value={32}>32 Colors (Small Size)</option>
                  <option value={16}>16 Colors (Minimal)</option>
                </select>
              </div>
            </div>
          )}



          {/* Optimization */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginBottom: '8px',
              fontFamily: '"Space Mono", monospace'
            }}>
              Optimization
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '10px',
                color: '#d1d5db',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={exportSettings.fastStart || false}
                  onChange={(e) => updateExportSettings({ fastStart: e.target.checked })}
                  style={{ transform: 'scale(0.8)' }}
                />
                Fast Start (Web Streaming)
              </label>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '10px',
                color: '#d1d5db',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={exportSettings.optimizeSize || false}
                  onChange={(e) => updateExportSettings({ optimizeSize: e.target.checked })}
                  style={{ transform: 'scale(0.8)' }}
                />
                Optimize File Size
              </label>
            </div>
          </div>

          {/* Output Name */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginBottom: '8px',
              fontFamily: '"Space Mono", monospace'
            }}>
              Output Filename
            </label>
            <input
              type="text"
              value={exportSettings.filename || ''}
              onChange={(e) => updateExportSettings({ filename: e.target.value })}
              placeholder={`slideshow.${exportSettings.format}`}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                fontFamily: '"Space Mono", monospace'
              }}
            />
          </div>
        </div>
      )}


      </div>

      {/* Fixed Export Area at Bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0a0a0b',
        padding: '12px',
        borderTop: '1px solid #343536'
      }}>
        {/* Export Progress */}
        {exportState.progress > 0 && exportState.progress < 100 && (
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#1f2937',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              width: `${exportState.progress}%`,
              height: '100%',
              backgroundColor: '#ec4899',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}

        {/* Export Error */}
        {exportState.error && (
          <div style={{
            padding: '8px',
            backgroundColor: '#7f1d1d',
            border: '1px solid #dc2626',
            borderRadius: '4px',
            color: '#fca5a5',
            fontSize: '10px',
            fontFamily: '"Space Mono", monospace',
            marginBottom: '8px'
          }}>
            Export Error: {exportState.error}
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={exportSlideshow}
          disabled={exportState.isExporting || !hasTimeline}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: exportState.isExporting ? '#6b7280' : '#ec4899',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: exportState.isExporting ? 'not-allowed' : 'pointer',
            fontFamily: '"Space Mono", monospace',
            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!exportState.isExporting && hasTimeline) {
              e.currentTarget.style.backgroundColor = '#be185d';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(236, 72, 153, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!exportState.isExporting && hasTimeline) {
              e.currentTarget.style.backgroundColor = '#ec4899';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.3)';
            }
          }}
        >
          {exportState.isExporting ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              EXPORTING...
            </div>
          ) : (
            `🚀 EXPORT ${exportSettings.format.toUpperCase()}`
          )}
        </button>
      </div>

      {/* Export Progress Modal */}
      <ExportProgressModal
        isVisible={exportState.isExporting}
        format={exportSettings.format}
        progress={exportState.progress}
        error={exportState.error}
        onCancel={handleCancelExport}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Custom Scrollbar Styles for Slideshow */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(26, 26, 27, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(236, 72, 153, 0.6);
          border-radius: 4px;
          border: 1px solid rgba(26, 26, 27, 0.8);
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(236, 72, 153, 0.8);
        }

        ::-webkit-scrollbar-thumb:active {
          background: rgba(190, 24, 93, 0.9);
        }

        ::-webkit-scrollbar-corner {
          background: rgba(26, 26, 27, 0.3);
        }

        /* Firefox Scrollbar */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(236, 72, 153, 0.6) rgba(26, 26, 27, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ExportControls;
