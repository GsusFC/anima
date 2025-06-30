import React, { useState } from 'react';
import { useVideoEditorContext } from '../context/VideoEditorContext';
import { VideoExportSettings } from '../types/video-editor.types';

const VideoExport: React.FC = () => {
  const { project, hasVideo } = useVideoEditorContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSettings, setExportSettings] = useState<VideoExportSettings>({
    format: 'mp4',
    quality: 'standard',
    resolution: {
      width: project.video?.width || 1920,
      height: project.video?.height || 1080,
      preset: 'original'
    },
    fps: 30,
    gif: {
      loop: 'infinite',
      colors: 256,
      dither: true
    }
  });

  if (!hasVideo) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        backgroundColor: '#0f0f0f'
      }}>
        <div style={{ textAlign: 'center', fontFamily: '"Space Mono", monospace' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>No Video Loaded</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>Export options will appear here</p>
        </div>
      </div>
    );
  }

  const totalDuration = project.segments.reduce((sum, segment) => 
    sum + (segment.endTime - segment.startTime), 0
  );

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Get trimmed video segments
      const trimmedSegments = project.segments.filter(segment => segment.trimmedPath);
      
      if (trimmedSegments.length === 0) {
        alert('No trimmed segments found. Please trim the video first.');
        setIsExporting(false);
        return;
      }

      console.log('🎬 Starting export with settings:', {
        segments: trimmedSegments,
        settings: exportSettings,
        totalDuration
      });

      // Use the trimmed video path from the first segment
      const trimmedVideoPath = trimmedSegments[0].trimmedPath;
      
      const API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : window.location.origin;

      const exportData = {
        videoPath: trimmedVideoPath,
        format: exportSettings.format,
        quality: exportSettings.quality,
        resolution: exportSettings.resolution,
        fps: exportSettings.fps,
        gif: exportSettings.gif
      };

      const response = await fetch(`${API_BASE_URL}/export/${exportSettings.format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the download URL from response
      const result = await response.json();
      
      if (result.success && result.downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = `${API_BASE_URL}${result.downloadUrl}`;
        link.download = result.filename || `exported_video.${exportSettings.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Export completed and downloaded:', result.filename);
        setExportProgress(100);
      } else {
        throw new Error('Export failed: No download URL received');
      }

      setIsExporting(false);

    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const formatFileSize = (duration: number) => {
    // Rough estimate based on quality
    const baseMbPerSecond = exportSettings.quality === 'web' ? 0.5 : 
                           exportSettings.quality === 'standard' ? 1.2 :
                           exportSettings.quality === 'high' ? 2.5 : 4.0;
    return (duration * baseMbPerSecond).toFixed(1);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    }}>
      {/* Export Header */}
      <div style={{
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #343536'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '14px',
          color: '#ff4500',
          fontWeight: 'bold',
          marginBottom: '5px'
        }}>
          VIDEO EXPORT
        </h2>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          Export your edited video
        </p>
      </div>

      {/* Export Settings */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#1a1a1b',
        borderRadius: '8px',
        border: '1px solid #343536'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '12px',
          color: '#d1d5db',
          fontWeight: 'bold',
          marginBottom: '15px'
        }}>
          EXPORT SETTINGS
        </h3>

        {/* Format Selection */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            color: '#9ca3af',
            marginBottom: '8px'
          }}>
            Format
          </label>
          <select
            value={exportSettings.format}
            onChange={(e) => setExportSettings(prev => ({ 
              ...prev, 
              format: e.target.value as 'mp4' | 'webm' | 'mov' | 'gif'
            }))}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '11px',
              backgroundColor: '#0a0a0b',
              color: '#d1d5db',
              border: '1px solid #343536',
              borderRadius: '4px',
              fontFamily: '"Space Mono", monospace'
            }}
          >
            <option value="mp4">MP4 (H.264)</option>
            <option value="webm">WebM (VP9)</option>
            <option value="mov">MOV (QuickTime)</option>
            <option value="gif">🎨 GIF Animation</option>
          </select>
        </div>

        {/* Video Quality Selection - Only for video formats */}
        {exportSettings.format !== 'gif' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginBottom: '8px'
            }}>
              Quality
            </label>
            <select
              value={exportSettings.quality}
              onChange={(e) => setExportSettings(prev => ({ 
                ...prev, 
                quality: e.target.value as 'web' | 'standard' | 'high' | 'ultra' 
              }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '11px',
                backgroundColor: '#0a0a0b',
                color: '#d1d5db',
                border: '1px solid #343536',
                borderRadius: '4px',
                fontFamily: '"Space Mono", monospace'
              }}
            >
              <option value="web">Web (720p, smaller file)</option>
              <option value="standard">Standard (1080p, balanced)</option>
              <option value="high">High (1080p, high bitrate)</option>
              <option value="ultra">Ultra (4K, maximum quality)</option>
            </select>
          </div>
        )}

        {/* Resolution Selection */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            color: '#9ca3af',
            marginBottom: '8px'
          }}>
            Resolution
          </label>
          <select
            value={exportSettings.resolution.preset}
            onChange={(e) => {
              const preset = e.target.value as 'original' | '480p' | '720p' | '1080p' | '4k' | 'custom';
              let width = exportSettings.resolution.width;
              let height = exportSettings.resolution.height;
              
              if (preset === '480p') { width = 854; height = 480; }
              else if (preset === '720p') { width = 1280; height = 720; }
              else if (preset === '1080p') { width = 1920; height = 1080; }
              else if (preset === '4k') { width = 3840; height = 2160; }
              else if (preset === 'original' && project.video) { 
                width = project.video.width; 
                height = project.video.height; 
              }
              
              setExportSettings(prev => ({ 
                ...prev, 
                resolution: { ...prev.resolution, preset, width, height }
              }));
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '11px',
              backgroundColor: '#0a0a0b',
              color: '#d1d5db',
              border: '1px solid #343536',
              borderRadius: '4px',
              fontFamily: '"Space Mono", monospace'
            }}
          >
            <option value="original">Original ({project.video?.width}×{project.video?.height})</option>
            <option value="480p">480p (854×480)</option>
            <option value="720p">720p (1280×720)</option>
            <option value="1080p">1080p (1920×1080)</option>
            <option value="4k">4K (3840×2160)</option>
          </select>
        </div>

        {/* Frame Rate - Different options for GIF vs Video */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            color: '#9ca3af',
            marginBottom: '8px'
          }}>
            Frame Rate
          </label>
          <select
            value={exportSettings.fps}
            onChange={(e) => setExportSettings(prev => ({ 
              ...prev, 
              fps: parseInt(e.target.value)
            }))}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '11px',
              backgroundColor: '#0a0a0b',
              color: '#d1d5db',
              border: '1px solid #343536',
              borderRadius: '4px',
              fontFamily: '"Space Mono", monospace'
            }}
          >
            {exportSettings.format === 'gif' ? (
              <>
                <option value="10">10 fps (Smallest GIFs)</option>
                <option value="15">15 fps (Small GIFs)</option>
                <option value="20">20 fps (Balanced)</option>
                <option value="24">24 fps (Smooth GIFs)</option>
              </>
            ) : (
              <>
                <option value="24">24 fps (Cinema)</option>
                <option value="30">30 fps (Standard)</option>
                <option value="60">60 fps (Smooth)</option>
              </>
            )}
          </select>
        </div>

        {/* GIF Specific Settings */}
        {exportSettings.format === 'gif' && (
          <div style={{
            marginBottom: '15px',
            padding: '15px',
            backgroundColor: '#0f0f0f',
            borderRadius: '6px',
            border: '1px solid #2a2a2b'
          }}>
            <h4 style={{
              margin: 0,
              fontSize: '11px',
              color: '#ff4500',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              🎨 GIF OPTIONS
            </h4>
            
            {/* Loop Count */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                color: '#9ca3af',
                marginBottom: '6px'
              }}>
                Loop Count
              </label>
              <select
                value={exportSettings.gif?.loop}
                onChange={(e) => setExportSettings(prev => ({ 
                  ...prev, 
                  gif: { 
                    ...prev.gif!, 
                    loop: e.target.value === 'infinite' ? 'infinite' : parseInt(e.target.value)
                  }
                }))}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '10px',
                  backgroundColor: '#0a0a0b',
                  color: '#d1d5db',
                  border: '1px solid #343536',
                  borderRadius: '3px',
                  fontFamily: '"Space Mono", monospace'
                }}
              >
                <option value="infinite">∞ Infinite Loop</option>
                <option value="1">1 time</option>
                <option value="2">2 times</option>
                <option value="3">3 times</option>
                <option value="5">5 times</option>
              </select>
            </div>

            {/* Color Palette */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                color: '#9ca3af',
                marginBottom: '6px'
              }}>
                Color Palette
              </label>
              <select
                value={exportSettings.gif?.colors}
                onChange={(e) => setExportSettings(prev => ({ 
                  ...prev, 
                  gif: { 
                    ...prev.gif!, 
                    colors: parseInt(e.target.value) as 256 | 128 | 64 | 32
                  }
                }))}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '10px',
                  backgroundColor: '#0a0a0b',
                  color: '#d1d5db',
                  border: '1px solid #343536',
                  borderRadius: '3px',
                  fontFamily: '"Space Mono", monospace'
                }}
              >
                <option value="256">256 colors (Best quality)</option>
                <option value="128">128 colors (Good quality)</option>
                <option value="64">64 colors (Smaller file)</option>
                <option value="32">32 colors (Smallest file)</option>
              </select>
            </div>

            {/* Dithering */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                style={{ width: '12px', height: '12px' }}
              />
              <label style={{
                fontSize: '10px',
                color: '#9ca3af'
              }}>
                Enable dithering (smoother gradients)
              </label>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        <div style={{
          padding: '12px',
          backgroundColor: '#0f0f0f',
          borderRadius: '4px',
          border: '1px solid #2a2a2b'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Resolution:</span>
            <span style={{ fontSize: '11px', color: '#d1d5db' }}>
              {project.video!.width} × {project.video!.height}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Frame Rate:</span>
            <span style={{ fontSize: '11px', color: '#d1d5db' }}>
              {project.video!.fps} fps
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Est. Size:</span>
            <span style={{ fontSize: '11px', color: '#d1d5db' }}>
              ~{formatFileSize(totalDuration)} MB
            </span>
          </div>
        </div>
      </div>

      {/* Export Preview */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#1a1a1b',
        borderRadius: '8px',
        border: '1px solid #343536'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '12px',
          color: '#d1d5db',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          EXPORT PREVIEW
        </h3>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px'
        }}>
          <span>Segments to export:</span>
          <span style={{ color: '#ff4500', fontWeight: 'bold' }}>
            {project.segments.length}
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px'
        }}>
          <span>Total duration:</span>
          <span style={{ color: '#ff4500', fontWeight: 'bold' }}>
            {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toFixed(1).padStart(4, '0')}
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#9ca3af'
        }}>
          <span>Original duration:</span>
          <span style={{ color: '#9ca3af' }}>
            {Math.floor(project.video!.duration / 60)}:{(project.video!.duration % 60).toFixed(1).padStart(4, '0')}
          </span>
        </div>
      </div>

      {/* Export Button */}
      <div style={{ marginTop: 'auto' }}>
        {isExporting ? (
          <div style={{
            padding: '15px',
            backgroundColor: '#1a1a1b',
            borderRadius: '8px',
            border: '1px solid #343536'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '11px', color: '#d1d5db', fontWeight: 'bold' }}>
                EXPORTING VIDEO...
              </span>
              <span style={{ fontSize: '11px', color: '#ff4500', fontWeight: 'bold' }}>
                {exportProgress}%
              </span>
            </div>
            
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#0a0a0b',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${exportProgress}%`,
                height: '100%',
                backgroundColor: '#ff4500',
                transition: 'width 0.2s ease'
              }} />
            </div>
          </div>
        ) : (
          <button
            onClick={handleExport}
            disabled={project.segments.length === 0}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '12px',
              backgroundColor: project.segments.length === 0 ? '#343536' : '#ff4500',
              color: project.segments.length === 0 ? '#6b7280' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: project.segments.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            {project.segments.length === 0 ? 'NO SEGMENTS TO EXPORT' : 'EXPORT VIDEO'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoExport;
