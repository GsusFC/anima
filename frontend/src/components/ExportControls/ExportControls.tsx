import React, { useState, useEffect } from 'react';
import { useMedia } from '../../context/MediaProvider';
import { useAPI } from '../../hooks/useAPI';

type ExportFormat = 'gif' | 'mp4' | 'webm';
type PresetType = 'web' | 'quality' | 'size' | 'social' | 'custom';

interface TagConfig {
  [key: string]: string[];
}

const ExportControls: React.FC = () => {
  const { mediaItems } = useMedia();
  const { exportGIF, exportVideo, downloadFile, isExporting, exportProgress } = useAPI();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('gif');
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('web');
  const [lastExportResult, setLastExportResult] = useState<string | null>(null);
  
  // Tag selections
  const [selectedTags, setSelectedTags] = useState<{[key: string]: string}>({
    quality: 'standard',
    fps: '30',
    resolution: 'original'
  });

  // Format-specific tag configurations
  const tagConfigs: {[key in ExportFormat]: TagConfig} = {
    gif: {
      colors: ['64', '128', '256'],
      dithering: ['none', 'floyd', 'bayer'],
      loop: ['infinite', '1x', '2x', '3x'],
      optimize: ['web', 'quality', 'size']
    },
    mp4: {
      codec: ['h264', 'h265'],
      profile: ['baseline', 'main', 'high'],
      bitrate: ['2m', '5m', '10m', 'vbr'],
      preset: ['fast', 'medium', 'slow']
    },
    webm: {
      codec: ['vp8', 'vp9', 'av1'],
      mode: ['cbr', 'vbr', 'cq'],
      speed: ['4', '8', '12', '16'],
      quality: ['good', 'best', 'realtime']
    }
  };

  // Universal tags
  const universalTags: TagConfig = {
    quality: ['web', 'standard', 'high', 'premium', 'ultra'],
    fps: ['15', '24', '30', '60'],
    resolution: ['original', '480p', '720p', '1080p']
  };

  // Preset configurations
  const presets = {
    web: {
      gif: { quality: 'web', fps: '24', colors: '128', dithering: 'none', loop: 'infinite', optimize: 'web' },
      mp4: { quality: 'web', fps: '30', codec: 'h264', profile: 'baseline', bitrate: '2m', preset: 'fast' },
      webm: { quality: 'web', fps: '30', codec: 'vp8', mode: 'cbr', speed: '8', webm_quality: 'good' }
    },
    quality: {
      gif: { quality: 'high', fps: '30', colors: '256', dithering: 'floyd', loop: 'infinite', optimize: 'quality' },
      mp4: { quality: 'high', fps: '30', codec: 'h264', profile: 'high', bitrate: '10m', preset: 'slow' },
      webm: { quality: 'high', fps: '30', codec: 'vp9', mode: 'cq', speed: '4', webm_quality: 'best' }
    },
    size: {
      gif: { quality: 'web', fps: '15', colors: '64', dithering: 'none', loop: 'infinite', optimize: 'size' },
      mp4: { quality: 'web', fps: '24', codec: 'h264', profile: 'baseline', bitrate: '2m', preset: 'fast' },
      webm: { quality: 'web', fps: '24', codec: 'vp8', mode: 'cbr', speed: '12', webm_quality: 'realtime' }
    },
    social: {
      gif: { quality: 'standard', fps: '24', colors: '128', dithering: 'floyd', loop: 'infinite', optimize: 'web' },
      mp4: { quality: 'standard', fps: '30', codec: 'h264', profile: 'main', bitrate: '5m', preset: 'medium' },
      webm: { quality: 'standard', fps: '30', codec: 'vp9', mode: 'vbr', speed: '8', webm_quality: 'good' }
    }
  };

  const canExport = mediaItems.length > 0;

  // Apply preset when changed
  useEffect(() => {
    if (selectedPreset !== 'custom' && presets[selectedPreset]) {
      const presetConfig = presets[selectedPreset][selectedFormat];
      setSelectedTags({ ...selectedTags, ...presetConfig });
    }
  }, [selectedPreset, selectedFormat]);

  const handleTagClick = (category: string, value: string) => {
    setSelectedTags(prev => ({ ...prev, [category]: value }));
    if (selectedPreset !== 'custom') {
      setSelectedPreset('custom');
    }
  };

  const handleExport = async () => {
    if (!canExport) return;
    
    // Get timeline data from Timeline component
    const timelineData = (window as any).__timelineData || [];
    const sessionId = (window as any).__sessionId;
    
    if (!sessionId || timelineData.length === 0) {
      console.error('No timeline data or session ID available');
      return;
    }

    try {
      const exportParams = {
        sessionId,
        images: timelineData.map((item: any) => ({ 
          filename: item.uploadedFile?.filename || item.file.name 
        })),
        transitions: timelineData.map((item: any) => ({
          type: item.transition?.type || 'fade',
          duration: item.duration || 1000
        })),
        quality: selectedTags.quality,
        duration: timelineData.reduce((total: number, item: any) => total + (item.duration || 1000), 0),
        ...selectedTags // Include all format-specific settings
      };

      let result;
      if (selectedFormat === 'gif') {
        result = await exportGIF(exportParams);
      } else {
        result = await exportVideo({
          ...exportParams,
          format: selectedFormat
        });
      }

      if (result.success) {
        setLastExportResult(result.filename);
        console.log('Export completed:', result);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderTagGroup = (label: string, category: string, tags: string[]) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '11px',
        fontWeight: '500',
        color: '#d1d5db',
        marginBottom: '6px',
        fontFamily: '"Space Mono", monospace'
      }}>
        {label}
      </label>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => handleTagClick(category, tag)}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: '500',
              border: '1px solid #343536',
              borderRadius: '3px',
              backgroundColor: selectedTags[category] === tag ? 'rgba(255, 69, 0, 0.15)' : '#1a1a1b',
                              color: selectedTags[category] === tag ? '#ff4500' : '#9ca3af',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontFamily: '"Space Mono", monospace',
              transition: 'all 0.2s ease'
            }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px'
    }}>
      {/* Format Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#d1d5db',
          marginBottom: '8px',
          fontFamily: '"Space Mono", monospace'
        }}>
          FORMAT
        </label>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {['gif', 'mp4', 'webm'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFormat(f as ExportFormat)}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '500',
                border: '1px solid #343536',
                borderRadius: '2px',
                backgroundColor: selectedFormat === f ? 'rgba(255, 69, 0, 0.15)' : '#1a1a1b',
                                  color: selectedFormat === f ? '#ff4500' : '#9ca3af',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontFamily: '"Space Mono", monospace'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#d1d5db',
          marginBottom: '8px',
          fontFamily: '"Space Mono", monospace'
        }}>
          PRESETS
        </label>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          {(['web', 'quality', 'size', 'social', 'custom'] as PresetType[]).map(preset => (
            <button
              key={preset}
              onClick={() => setSelectedPreset(preset)}
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '500',
                border: '1px solid #343536',
                borderRadius: '2px',
                backgroundColor: selectedPreset === preset ? 'rgba(255, 69, 0, 0.15)' : '#1a1a1b',
                                  color: selectedPreset === preset ? '#ff4500' : '#9ca3af',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontFamily: '"Space Mono", monospace'
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Universal Settings */}
      {renderTagGroup('QUALITY', 'quality', universalTags.quality)}
      {renderTagGroup('FPS', 'fps', universalTags.fps)}
      {renderTagGroup('RESOLUTION', 'resolution', universalTags.resolution)}

      {/* Format-specific Settings */}
      {selectedFormat === 'gif' && (
        <>
          {renderTagGroup('COLORS', 'colors', tagConfigs.gif.colors)}
          {renderTagGroup('DITHERING', 'dithering', tagConfigs.gif.dithering)}
          {renderTagGroup('LOOP', 'loop', tagConfigs.gif.loop)}
          {renderTagGroup('OPTIMIZE', 'optimize', tagConfigs.gif.optimize)}
        </>
      )}

      {selectedFormat === 'mp4' && (
        <>
          {renderTagGroup('CODEC', 'codec', tagConfigs.mp4.codec)}
          {renderTagGroup('PROFILE', 'profile', tagConfigs.mp4.profile)}
          {renderTagGroup('BITRATE', 'bitrate', tagConfigs.mp4.bitrate)}
          {renderTagGroup('PRESET', 'preset', tagConfigs.mp4.preset)}
        </>
      )}

      {selectedFormat === 'webm' && (
        <>
          {renderTagGroup('CODEC', 'codec', tagConfigs.webm.codec)}
          {renderTagGroup('MODE', 'mode', tagConfigs.webm.mode)}
          {renderTagGroup('SPEED', 'speed', tagConfigs.webm.speed)}
          {renderTagGroup('QUALITY', 'webm_quality', tagConfigs.webm.quality)}
        </>
      )}



      {/* Progress Bar */}
      {exportProgress && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}>
            <span style={{
              fontSize: '11px',
              color: '#9ca3af',
              fontFamily: '"Space Mono", monospace'
            }}>
              {exportProgress.message}
            </span>
            <span style={{
              fontSize: '11px',
              color: '#ff4500',
              fontFamily: '"Space Mono", monospace'
            }}>
              {Math.round(exportProgress.progress)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#2a2a2b',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${exportProgress.progress}%`,
              height: '100%',
              backgroundColor: '#ff4500',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* Export Button */}
      <button 
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          fontWeight: '600',
          backgroundColor: 'rgba(255, 69, 0, 0.15)',
          color: '#ff4500',
          border: '1px solid #ff4500',
          borderRadius: '3px',
          cursor: 'pointer',
          marginBottom: '16px',
          fontFamily: '"Space Mono", monospace'
        }}
        onClick={handleExport}
        disabled={!canExport || isExporting}
      >
        <svg style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {isExporting 
          ? 'EXPORTING...' 
          : canExport 
            ? `EXPORT ${selectedFormat.toUpperCase()}`
            : 'SELECT MEDIA TO EXPORT'
        }
      </button>

      {/* Download Button */}
      {lastExportResult && (
        <button 
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: 'rgba(0, 200, 0, 0.15)',
            color: '#00c800',
            border: '1px solid #00c800',
            borderRadius: '3px',
            cursor: 'pointer',
            marginBottom: '16px',
            fontFamily: '"Space Mono", monospace'
          }}
          onClick={() => downloadFile(lastExportResult)}
        >
          <svg style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 16l4 4m0 0l4-4m-4 4V4" />
          </svg>
          DOWNLOAD {selectedFormat.toUpperCase()}
        </button>
      )}


    </div>
  );
};

export default ExportControls; 