import React, { useState, useEffect } from 'react';
import { useAPI, CompositionData } from '../../hooks/useAPI';
import { useExportValidation, ExportSettings } from '../../hooks/useExportValidation';
import { ValidationMessages, ValidationSummary, InlineValidationMessage } from '../ValidationMessages';

type ExportFormat = 'gif' | 'mp4' | 'webm';
type PresetType = 'web' | 'quality' | 'size' | 'social' | 'custom';

interface TagConfig {
  [key: string]: string[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

const ExportControls: React.FC = () => {
  const { exportGIF, exportVideo, reExportComposition, getComposition, downloadFile, isExporting, exportProgress } = useAPI();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('gif');
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('web');
  const [lastExportResult, setLastExportResult] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Composition state for re-exports
  const [currentComposition, setCurrentComposition] = useState<CompositionData | null>(null);
  const [exportedFormats, setExportedFormats] = useState<ExportFormat[]>([]);
  
  // Tag selections
  const [selectedTags, setSelectedTags] = useState<{[key: string]: string}>({
    quality: 'standard',
    fps: '30',
    resolution: 'original'
  });

  // Helper function to get resolution dimensions
  const getResolutionDimensions = (resolution: string) => {
    switch (resolution) {
      case '480p': return { width: 854, height: 480 };
      case '720p': return { width: 1280, height: 720 };
      case '1080p': return { width: 1920, height: 1080 };
      case 'original':
      default: return { width: 1920, height: 1080 }; // Default fallback
    }
  };

  // Convert selectedTags to ExportSettings for validation
  const currentExportSettings: ExportSettings = {
    format: selectedFormat,
    fps: parseInt(selectedTags.fps) || 30,
    quality: selectedTags.quality as any,
    resolution: {
      width: getResolutionDimensions(selectedTags.resolution).width,
      height: getResolutionDimensions(selectedTags.resolution).height,
      preset: selectedTags.resolution
    },
    gif: selectedFormat === 'gif' ? {
      colors: parseInt(selectedTags.colors) || 256,
      dither: selectedTags.dithering !== 'none',
      loop: selectedTags.loop || 'infinite'
    } : undefined
  };

  // Real-time validation
  const validation = useExportValidation(currentExportSettings);

  // Notification functions
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: Date.now()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Monitor timeline data changes
  useEffect(() => {
    const checkTimelineData = () => {
      const data = (window as any).__timelineData || [];
      if (JSON.stringify(data) !== JSON.stringify(timelineData)) {
        setTimelineData(data);
        // Reset download button when timeline changes
        if (lastExportResult) {
          setLastExportResult(null);
        }
      }
    };
    
    const interval = setInterval(checkTimelineData, 200);
    checkTimelineData(); // Check immediately
    
    return () => clearInterval(interval);
  }, [timelineData, lastExportResult]);

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

  // Use timeline data instead of mediaItems for canExport
  const canExport = timelineData.length > 0 && validation.canExport;

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
    // Only reset download button for major quality changes that would significantly affect output
    if (lastExportResult && ['quality', 'codec', 'resolution'].includes(category)) {
      setLastExportResult(null);
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      console.log('❌ Export blocked: canExport =', canExport);
      return;
    }

    // Additional validation check
    if (!validation.canExport) {
      const errorMessages = validation.messages
        .filter(m => m.type === 'error')
        .map(m => m.message)
        .join('\n');

      showNotification('error', 'Configuración Inválida',
        `No se puede exportar debido a errores de configuración:\n${errorMessages}`);
      return;
    }
    
    // Get timeline data from Timeline component
    const currentTimelineData = (window as any).__timelineData || [];
    let sessionId = (window as any).__sessionId;
    
    console.log('🔍 Export Debug Info:');
    console.log('- Timeline Data:', currentTimelineData);
    console.log('- Session ID:', sessionId);
    console.log('- Can Export:', canExport);
    
    if (currentTimelineData.length === 0) {
      console.error('❌ No timeline data available');
      showNotification('error', 'Timeline Error', 'No images in timeline. Please add images to timeline first.');
      return;
    }

    // Check for missing uploadedFile info
    const missingUploadInfo = currentTimelineData.filter((item: any) => !item.uploadedFile);
    
    if (missingUploadInfo.length > 0) {
      console.log(`⚠️ Found ${missingUploadInfo.length} files without upload info`);
      console.log('Missing files:', missingUploadInfo.map((item: any) => item.file?.name));
      
      showNotification('error', 'Upload Error', `${missingUploadInfo.length} files are missing upload information. Please re-add these files to the timeline using the ImageUpload panel.`);
      return;
    }
    
    if (!sessionId) {
      console.error('❌ No session ID available');
      showNotification('error', 'Session Error', 'No session ID found. Please upload images first.');
      return;
    }

    try {
      // Process timeline data for export
      const images = currentTimelineData.map((item: any, index: number) => {
        console.log(`🖼️ Processing item ${index}:`, item);
        
        // Try multiple ways to get filename
        let filename = null;
        if (item.uploadedFile?.filename) {
          filename = item.uploadedFile.filename;
        } else if (item.file?.name) {
          filename = item.file.name;
        } else if (typeof item.filename === 'string') {
          filename = item.filename;
        }
        
        console.log(`📁 Filename for item ${index}:`, filename);
        
        if (!filename) {
          throw new Error(`No filename found for item ${index}`);
        }
        
        return { filename };
      });
      
      const transitions = currentTimelineData.map((item: any) => ({
        type: item.transition?.type || 'fade',
        duration: item.duration || 1000
      }));

      const exportParams = {
        sessionId,
        images,
        transitions,
        quality: selectedTags.quality,
        duration: currentTimelineData.length > 0 ? currentTimelineData[0].duration || 1000 : 1000, // Use first frame duration as default
        frameDurations: currentTimelineData.map((item: any) => item.duration || 1000), // Individual frame durations
        ...selectedTags // Include all format-specific settings
      };

      console.log('📤 Export Params:', exportParams);

      let result;
      if (selectedFormat === 'gif') {
        console.log('🎬 Starting GIF export...');
        result = await exportGIF(exportParams);
      } else {
        console.log('🎬 Starting Video export...');
        result = await exportVideo({
          ...exportParams,
          format: selectedFormat
        });
      }

      console.log('✅ Export result:', result);
      console.log('✅ Export result type:', typeof result);
      console.log('✅ Export result keys:', Object.keys(result || {}));

      if (result && result.success) {
        setLastExportResult(result.filename);
        console.log('🎉 Export completed:', result);
        
        // Handle composition auto-save
        if (result.compositionId) {
          console.log('🎯 Composition auto-saved:', result.compositionId);
          
          // Load composition data and setup re-export state
          try {
            const compositionData = await getComposition(result.compositionId);
            setCurrentComposition(compositionData);
            
            // Set exported formats
            const exported = compositionData.exports.map(exp => exp.format as ExportFormat);
            setExportedFormats(exported);
            
            console.log('📊 Composition state updated:', {
              exported,
              total: compositionData.exports.length
            });
            
            showNotification('success', 'Export Completed! 🎉', 
              `${selectedFormat.toUpperCase()} generated and downloaded automatically!`);
            
            // Auto-download the file
            setTimeout(() => {
              downloadFile(result.filename);
            }, 1000);
          } catch (compositionError) {
            console.error('Failed to load composition:', compositionError);
            showNotification('success', 'Export Completed! 🎉', 
              `Your ${selectedFormat.toUpperCase()} has been generated successfully: ${result.filename}`);
          }
        } else {
          showNotification('success', 'Export Completed! 🎉', 
            `Your ${selectedFormat.toUpperCase()} has been generated successfully: ${result.filename}`);
        }
      } else {
        console.log('❌ Export result indicates failure:', result);
        throw new Error(result?.message || 'Export failed - no success flag');
      }
    } catch (error) {
      console.error('💥 Export failed:', error);
      showNotification('error', 'Export Failed', `${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle re-export for different formats
  const handleReExport = async (format: ExportFormat) => {
    if (!currentComposition) {
      showNotification('error', 'Re-export Error', 'No composition available for re-export');
      return;
    }

    try {
      console.log(`🔄 Re-exporting composition ${currentComposition.id} as ${format.toUpperCase()}`);
      
      const result = await reExportComposition(currentComposition.id, format, selectedTags.quality);
      
      if (result && result.success) {
        // Update state to reflect new export
        setExportedFormats(prev => [...prev, format]);
        
        // Refresh composition data to get updated export history
        const updatedComposition = await getComposition(currentComposition.id);
        setCurrentComposition(updatedComposition);
        
        console.log(`✅ Re-export successful: ${result.filename}`);
        showNotification('success', 'Re-export Completed! 🎉', 
          `${format.toUpperCase()} generated from existing composition: ${result.filename}`);
      }
    } catch (error) {
      console.error('💥 Re-export failed:', error);
      showNotification('error', 'Re-export Failed', 
        `Failed to re-export as ${format.toUpperCase()}: ${error instanceof Error ? error.message : String(error)}`);
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
      {/* Inline validation for FPS */}
      {category === 'fps' && (
        <InlineValidationMessage
          validation={validation}
          field="fps"
          className="mt-2"
        />
      )}
    </div>
  );

  return (
    <>
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px'
      }}>
        {/* Scrollable Settings Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '8px',
        minHeight: 0,
        scrollbarWidth: 'thin',
        scrollbarColor: '#4b5563 transparent'
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
                onClick={() => {
                  setSelectedFormat(f as ExportFormat);
                  // Only reset download button if the result format doesn't match the new format
                  if (lastExportResult && !lastExportResult.includes(`.${f}`)) {
                    setLastExportResult(null);
                  }
                }}
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
                onClick={() => {
                  setSelectedPreset(preset);
                  // Only reset download button for significant preset changes, not minor adjustments
                  if (lastExportResult && preset === 'custom') {
                    // Don't reset when switching to custom (user is just fine-tuning)
                  } else if (lastExportResult && preset !== selectedPreset) {
                    // Reset only when switching between major presets
                    setLastExportResult(null);
                  }
                }}
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

        {/* Validation Messages */}
        {validation.messages.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <ValidationMessages
              validation={validation}
              className="space-y-2"
              maxMessages={3}
            />
          </div>
        )}
      </div>

      {/* Fixed Bottom Section - Single Action Button */}
      <div style={{
        flexShrink: 0,
        marginTop: '16px'
      }}>
        {/* Validation Summary */}
        <ValidationSummary
          validation={validation}
          className="mb-3"
        />

        {/* Single Transforming Button */}
        <button
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: lastExportResult
              ? 'rgba(0, 200, 0, 0.15)'
              : !validation.canExport
                ? 'rgba(220, 38, 38, 0.15)'
                : 'rgba(255, 69, 0, 0.15)',
            color: lastExportResult
              ? '#00c800'
              : !validation.canExport
                ? '#dc2626'
                : '#ff4500',
            border: `1px solid ${lastExportResult
              ? '#00c800'
              : !validation.canExport
                ? '#dc2626'
                : '#ff4500'}`,
            borderRadius: '3px',
            cursor: canExport ? 'pointer' : 'not-allowed',
            fontFamily: '"Space Mono", monospace',
            position: 'relative',
            overflow: 'hidden',
            opacity: (!canExport || isExporting) ? 0.6 : 1
          }}
          onClick={handleExport}
          disabled={!canExport || isExporting}
          title={!validation.canExport
            ? `Configuración inválida: ${validation.messages.filter(m => m.type === 'error').map(m => m.message).join(', ')}`
            : undefined}
        >
          {/* Progress bar background when exporting */}
          {isExporting && exportProgress && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${exportProgress.progress}%`,
              backgroundColor: 'rgba(255, 69, 0, 0.25)',
              transition: 'width 0.3s ease',
              zIndex: 0
            }} />
          )}

          {/* Button content */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Icon */}
            <svg style={{ width: '16px', height: '16px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {lastExportResult ? (
                // Download icon
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 16l4 4m0 0l4-4m-4 4V4" />
              ) : (
                // Export icon
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )}
            </svg>

            {/* Text */}
            <span>
              {isExporting ? (
                exportProgress ? `${exportProgress.message} ${Math.round(exportProgress.progress)}%` : 'EXPORTING...'
              ) : !validation.canExport ? (
                `CONFIGURACIÓN INVÁLIDA - ${validation.messages.filter(m => m.type === 'error').length} ERROR${validation.messages.filter(m => m.type === 'error').length !== 1 ? 'ES' : ''}`
              ) : timelineData.length === 0 ? (
                'SELECT MEDIA TO EXPORT'
              ) : (
                `EXPORT ${selectedFormat.toUpperCase()}`
              )}
            </span>
          </div>
        </button>



        {/* All format buttons - show after first successful export */}
        {currentComposition && (
          <div style={{ marginTop: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '8px',
              fontFamily: '"Space Mono", monospace'
            }}>
              📁 All Formats
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['gif', 'mp4', 'webm'] as ExportFormat[]).filter(format => format !== selectedFormat).map(format => {
                const isExported = exportedFormats.includes(format);
                const exportData = currentComposition.exports.find(exp => exp.format === format);
                
                return (
                  <button
                    key={format}
                    onClick={() => {
                      console.log(`🔍 Button clicked: ${format}`);
                      console.log(`🔍 isExported: ${isExported}`);
                      console.log(`🔍 exportData:`, exportData);
                      console.log(`🔍 currentComposition.exports:`, currentComposition.exports);
                      
                      if (isExported && exportData) {
                        // Download existing file
                        console.log(`📥 Downloading: ${exportData.filename}`);
                        console.log(`📥 Full URL: ${window.location.origin.replace(':5173', ':3001')}/download/${exportData.filename}`);
                        downloadFile(exportData.filename);
                      } else {
                        // Export new format
                        console.log(`📤 Exporting new: ${format}`);
                        handleReExport(format);
                      }
                    }}
                    disabled={isExporting}
                    style={{
                      flex: '1',
                      minWidth: '80px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: isExported 
                        ? 'rgba(34, 197, 94, 0.15)' 
                        : 'rgba(59, 130, 246, 0.15)',
                      color: isExported ? '#22c55e' : '#3b82f6',
                      border: `1px solid ${isExported ? '#22c55e' : '#3b82f6'}`,
                      borderRadius: '3px',
                      cursor: isExporting ? 'not-allowed' : 'pointer',
                      fontFamily: '"Space Mono", monospace',
                      opacity: isExporting ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isExported ? (
                        // Download icon
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 16l4 4m0 0l4-4m-4 4V4" />
                      ) : (
                        // Export icon
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      )}
                    </svg>
                    {isExported ? '⬇' : '📤'} {format.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Notification System */}
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px'
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${
              notification.type === 'success' ? '#22c55e' : 
              notification.type === 'error' ? '#ef4444' : 
              '#3b82f6'
            }`,
            backgroundColor: `rgba(${
              notification.type === 'success' ? '34, 197, 94' : 
              notification.type === 'error' ? '239, 68, 68' : 
              '59, 130, 246'
            }, 0.1)`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(0)',
            animation: 'slideIn 0.3s ease-out',
            position: 'relative'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => removeNotification(notification.id)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>

          {/* Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '20px',
              marginTop: '2px'
            }}>
              {notification.type === 'success' ? '✅' : 
               notification.type === 'error' ? '❌' : 
               'ℹ️'}
            </div>

            <div style={{ flex: 1 }}>
              {/* Title */}
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '4px',
                fontFamily: '"Space Mono", monospace'
              }}>
                {notification.title}
              </div>

              {/* Message */}
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.4',
                fontFamily: '"Space Mono", monospace'
              }}>
                {notification.message}
              </div>

              {/* Timestamp */}
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '8px',
                fontFamily: '"Space Mono", monospace'
              }}>
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Progress bar for auto-dismiss */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0 0 8px 8px'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: `${
                notification.type === 'success' ? '#22c55e' : 
                notification.type === 'error' ? '#ef4444' : 
                '#3b82f6'
              }`,
              width: '100%',
              borderRadius: '0 0 8px 8px',
              animation: 'progressBar 5s linear forwards'
            }} />
          </div>
        </div>
      ))}
    </div>

    {/* CSS Animations */}
    <style>{`
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes progressBar {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }
    `}</style>
    </>
  );
};

export default ExportControls; 