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

      const result = await response.json();
      
      if (result.success && result.downloadUrl) {
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

  const renderVideoSettings = () => (
    <div style={{ marginBottom: '20px' }}>
      {/* Quality */}
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
          <option value="web">Web Quality</option>
          <option value="standard">Standard Quality</option>
          <option value="high">High Quality</option>
        </select>
      </div>

      {/* Frame Rate */}
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
          <option value="24">24 fps</option>
          <option value="30">30 fps</option>
          <option value="60">60 fps</option>
        </select>
      </div>
    </div>
  );

  const renderGifSettings = () => (
    <div style={{ marginBottom: '20px' }}>
      {/* Frame Rate for GIF */}
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
          <option value="10">10 fps (Small file)</option>
          <option value="15">15 fps (Balanced)</option>
          <option value="20">20 fps (Smooth)</option>
        </select>
      </div>

      {/* Loop */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px'
        }}>
          Loop
        </label>
        <select
          value={exportSettings.gif.loop}
          onChange={(e) => setExportSettings(prev => ({ 
            ...prev, 
            gif: { ...prev.gif, loop: e.target.value as 'once' | 'infinite' | number }
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
          <option value="infinite">Loop forever</option>
          <option value="once">Play once</option>
        </select>
      </div>
    </div>
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    }}>
      {/* Header */}
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
          EXPORT
        </h2>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          Duration: {totalDuration.toFixed(1)}s
        </p>
      </div>

      {/* Format Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px'
        }}>
          Format
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}>
          {/* Video Formats */}
          <button
            onClick={() => setExportSettings(prev => ({ ...prev, format: 'mp4' }))}
            style={{
              padding: '12px',
              backgroundColor: exportSettings.format === 'mp4' ? '#ff4500' : '#1a1a1b',
              color: exportSettings.format === 'mp4' ? 'white' : '#d1d5db',
              border: '1px solid #343536',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: '"Space Mono", monospace'
            }}
          >
            MP4
          </button>
          
          <button
            onClick={() => setExportSettings(prev => ({ ...prev, format: 'webm' }))}
            style={{
              padding: '12px',
              backgroundColor: exportSettings.format === 'webm' ? '#ff4500' : '#1a1a1b',
              color: exportSettings.format === 'webm' ? 'white' : '#d1d5db',
              border: '1px solid #343536',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: '"Space Mono", monospace'
            }}
          >
            WebM
          </button>
          
          <button
            onClick={() => setExportSettings(prev => ({ ...prev, format: 'gif' }))}
            style={{
              padding: '12px',
              backgroundColor: exportSettings.format === 'gif' ? '#ff4500' : '#1a1a1b',
              color: exportSettings.format === 'gif' ? 'white' : '#d1d5db',
              border: '1px solid #343536',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: '"Space Mono", monospace',
              gridColumn: 'span 2'
            }}
          >
            🎨 GIF
          </button>
        </div>
      </div>

      {/* Format-specific settings */}
      {exportSettings.format === 'gif' ? renderGifSettings() : renderVideoSettings()}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: isExporting ? '#6b7280' : '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          fontFamily: '"Space Mono", monospace',
          marginTop: 'auto'
        }}
      >
        {isExporting ? '⏳ Exporting...' : '📥 Export Video'}
      </button>

      {/* Progress */}
      {isExporting && (
        <div style={{
          marginTop: '10px',
          height: '4px',
          backgroundColor: '#343536',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: '#22c55e',
            width: `${exportProgress}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}
    </div>
  );
};

export default VideoExport;
