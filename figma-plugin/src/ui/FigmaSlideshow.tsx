// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useImageManagement } from '../plugin-hooks/useImageManagement';
import { useExportManagement } from '../plugin-hooks/useExportManagement';
import { usePreviewGeneration, PreviewState } from '../plugin-hooks/usePreviewGeneration';
import { ImageFile, TimelineItem, ExportSettings } from '../types/slideshow.types';

interface Project {
  id: string;
  images: ImageFile[];
  timeline: TimelineItem[];
  exportSettings: ExportSettings;
}

// Plugin-specific slideshow component
const FigmaSlideshow = () => {
  const [project, setProject] = useState({
    id: `figma_project_${Date.now()}`,
    images: [],
    timeline: [],
    exportSettings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1920, height: 1080, preset: '1080p' },
      fps: 30
    }
  });

  const [error, setError] = useState(null);
  
  // Hooks for image and export management
  const { sessionId, uploadImages, isUploading } = useImageManagement();
  const { 
    currentJob, 
    isExporting, 
    error: exportError, 
    startExport, 
    downloadResult, 
    cancelExport,
    isCompleted,
    canDownload,
    isProcessing
  } = useExportManagement();

  // Preview state
  const [previewState, setPreviewState] = useState<PreviewState>({
    url: null,
    isGenerating: false,
    error: null
  });

  // Hook preview generation
  const { generatePreview, clearPreview } = usePreviewGeneration({
    timeline: project.timeline,
    images: project.images,
    sessionId,
    updatePreviewState: (updates) =>
      setPreviewState((prev) => ({ ...prev, ...updates }))
  });

  // Listen for images from Figma plugin
  useEffect(() => {
    try {
      console.log('Setting up message listener...');
      
      window.onmessage = async (event) => {
        console.log('Received message:', event.data);
        
        const msg = event.data.pluginMessage;
        if (msg?.type === 'images') {
          console.log('Processing images:', msg.data);
          
          const processed = msg.data.map((arr, index) => {
            try {
              const uint8 = new Uint8Array(arr);
              const blob = new Blob([uint8], { type: 'image/png' });
              const url = URL.createObjectURL(blob);
              return { blob, url };
            } catch (err) {
              console.error(`Error processing image ${index}:`, err);
              return null;
            }
          }).filter(Boolean);
          
          console.log('Created URLs:', processed.map(p=>p.url));
          
          // Convert to ImageFile format and add to project (preserve blob bytes for upload)
          const newImages = processed.map((item, index) => ({
            file: new File([item.blob], `figma-frame-${index}.png`, { type: 'image/png' }),
            id: `figma_image_${index}_${Date.now()}`,
            name: `Frame ${index + 1}`,
            size: item.blob.size,
            preview: item.url,
            addedAt: new Date()
          }));

          const newTimeline = newImages.map((img, index) => ({
            id: `timeline_${index}_${Date.now()}`,
            imageId: img.id,
            duration: 1000, // 1 second default
            position: index,
            transition: index < newImages.length - 1 ? { type: 'fade', duration: 500 } : undefined
          }));

          setProject(prev => ({
            ...prev,
            images: newImages,
            timeline: newTimeline
          }));

          // Upload images to backend
          if (newImages.length > 0) {
            try {
              const files = newImages.map(img => img.file);
              await uploadImages(files);
            } catch (uploadError) {
              console.error('Upload failed:', uploadError);
              setError('Failed to upload images to backend');
            }
          }
        } else if (msg?.type === 'error') {
          setError(msg.message);
        }
      };

      // Request images on mount
      console.log('Requesting images from plugin...');
      parent.postMessage({ pluginMessage: { type: 'request-images' } }, '*');
    } catch (err) {
      console.error('Setup error:', err);
      setError('Failed to initialize plugin');
    }
  }, []);

  const updateTimelineItem = (itemId, updates) => {
    setProject(prev => ({
      ...prev,
      timeline: prev.timeline.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const removeFromTimeline = (itemId) => {
    setProject(prev => ({
      ...prev,
      timeline: prev.timeline.filter(item => item.id !== itemId)
    }));
  };

  const formatDuration = (duration) => {
    return `${(duration / 1000).toFixed(1)}s`;
  };

  // Handle export
  const handleExport = async () => {
    if (!sessionId || project.timeline.length === 0) {
      setError('No images to export');
      return;
    }

    try {
      // Convert timeline to backend format
      const timelineData = project.timeline.map(item => ({
        imageId: item.imageId,
        duration: item.duration,
        transition: item.transition
      }));

      await startExport(sessionId, timelineData, project.exportSettings);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    }
  };

  // Handle download
  const handleDownload = async () => {
    try {
      await downloadResult();
    } catch (err) {
      setError(`Download failed: ${err.message}`);
    }
  };

  // Error display (includes preview errors)
  if (error || exportError || previewState.error) {
    const errorMessage = error || exportError || previewState.error;
    return React.createElement('div', {
      style: {
        padding: '20px',
        backgroundColor: '#0a0a0b',
        color: '#ef4444',
        fontFamily: '"Space Mono", monospace',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }
    }, [
      React.createElement('div', {
        key: 'error-text',
        style: { fontSize: '14px' }
      }, `Error: ${errorMessage}`),
      React.createElement('button', {
        key: 'retry',
        onClick: () => {
          setError(null);
          if (exportError) {
            cancelExport();
          }
        },
        style: {
          padding: '8px 16px',
          backgroundColor: '#ec4899',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '12px'
        }
      }, 'Try Again')
    ]);
  }

  return React.createElement('div', {
    style: {
      height: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      fontFamily: '"Space Mono", monospace',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      style: {
        padding: '12px 16px',
        borderBottom: '1px solid #343536',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, [
      React.createElement('h3', {
        key: 'title',
        style: { margin: 0, fontSize: '14px' }
      }, `🎬 Slideshow (${project.images.length} frames)`),
      React.createElement('button', {
        key: 'close',
        onClick: () => parent.postMessage({ pluginMessage: { type: 'close-plugin' } }, '*'),
        style: {
          background: 'none',
          border: '1px solid #343536',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }
      }, 'Close')
    ]),

    // Content
    React.createElement('div', {
      key: 'content',
      style: {
        flex: 1,
        padding: '16px',
        overflow: 'auto'
      }
    }, project.timeline.length === 0 ? 
      // Empty state
      React.createElement('div', {
        style: {
          textAlign: 'center',
          color: '#9ca3af',
          padding: '40px'
        }
      }, [
        React.createElement('p', { key: 'msg' }, 'Select frames in Figma and click "Refresh" to load images'),
        React.createElement('button', {
          key: 'refresh',
          onClick: () => parent.postMessage({ pluginMessage: { type: 'request-images' } }, '*'),
          style: {
            padding: '8px 16px',
            backgroundColor: '#ec4899',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px'
          }
        }, 'Refresh Selection')
      ]) : 
      // Timeline items
      React.createElement('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }
      }, project.timeline.map((item, index) => {
        const image = project.images.find(img => img.id === item.imageId);
        if (!image) return null;

        return React.createElement('div', {
          key: item.id,
          style: {
            backgroundColor: '#1a1a1b',
            border: '1px solid #343536',
            borderRadius: '6px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }
        }, [
          // Thumbnail
          React.createElement('img', {
            key: 'thumb',
            src: image.preview,
            style: {
              width: '60px',
              height: '40px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #4b5563'
            }
          }),
          // Info
          React.createElement('div', {
            key: 'info',
            style: { flex: 1 }
          }, [
            React.createElement('div', {
              key: 'name',
              style: { fontSize: '12px', marginBottom: '4px' }
            }, image.name),
            // Duration control
            React.createElement('div', {
              key: 'duration',
              style: { display: 'flex', alignItems: 'center', gap: '8px' }
            }, [
              React.createElement('label', {
                key: 'label',
                style: { fontSize: '10px', color: '#9ca3af' }
              }, 'Duration:'),
              React.createElement('input', {
                key: 'slider',
                type: 'range',
                min: '300',
                max: '5000',
                step: '100',
                value: item.duration,
                onChange: (e) => updateTimelineItem(item.id, { duration: parseInt(e.target.value) }),
                style: { flex: 1, accentColor: '#ec4899' }
              }),
              React.createElement('span', {
                key: 'time',
                style: { fontSize: '10px', minWidth: '40px' }
              }, formatDuration(item.duration))
            ])
          ])
        ]);
      })),

    // Preview section (video or button)
    previewState.url && React.createElement('video', {
      key: 'preview-video',
      src: previewState.url,
      controls: true,
      style: {
        width: '100%',
        borderRadius: '6px',
        marginBottom: '12px',
        maxHeight: '200px',
        objectFit: 'contain',
        backgroundColor: '#000'
      }
    }),
    !previewState.url && React.createElement('button', {
      key: 'preview-btn',
      onClick: generatePreview,
      disabled: previewState.isGenerating || project.timeline.length === 0 || isUploading,
      style: {
        width: '100%',
        padding: '12px',
        backgroundColor: previewState.isGenerating || project.timeline.length === 0 ? '#343536' : '#3b82f6',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        cursor: previewState.isGenerating || project.timeline.length === 0 ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '8px'
      }
    }, previewState.isGenerating ? 'Generating Preview...' : '🔍 PREVIEW'),

    // Export Section
    React.createElement('div', {
      key: 'export',
      style: {
        padding: '16px',
        borderTop: '1px solid #343536',
        backgroundColor: '#1a1a1b'
      }
    }, [
      // Export button or progress
      isExporting ? 
        // Progress UI
        React.createElement('div', {
          key: 'progress',
          style: { marginBottom: '12px' }
        }, [
          React.createElement('div', {
            key: 'status',
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }
          }, [
            React.createElement('span', {
              key: 'label',
              style: { fontSize: '12px' }
            }, currentJob?.status === 'pending' ? 'Queued...' : 
               currentJob?.status === 'processing' ? 'Processing...' : 
               'Exporting...'),
            React.createElement('span', {
              key: 'percent',
              style: { fontSize: '12px', color: '#9ca3af' }
            }, `${currentJob?.progress || 0}%`)
          ]),
          React.createElement('div', {
            key: 'bar',
            style: {
              width: '100%',
              height: '4px',
              backgroundColor: '#343536',
              borderRadius: '2px',
              overflow: 'hidden'
            }
          }, React.createElement('div', {
            style: {
              width: `${currentJob?.progress || 0}%`,
              height: '100%',
              backgroundColor: '#ec4899',
              transition: 'width 0.3s ease'
            }
          })),
          React.createElement('button', {
            key: 'cancel',
            onClick: cancelExport,
            style: {
              marginTop: '8px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #ef4444',
              color: '#ef4444',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              width: '100%'
            }
          }, 'Cancel Export')
        ]) :
        // Export button
        React.createElement('button', {
          key: 'export-btn',
          onClick: handleExport,
          disabled: project.timeline.length === 0 || isUploading,
          style: {
            width: '100%',
            padding: '12px',
            backgroundColor: project.timeline.length === 0 || isUploading ? '#343536' : '#ec4899',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: project.timeline.length === 0 || isUploading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }
        }, isUploading ? 'Uploading...' : 
           project.timeline.length === 0 ? 'No frames to export' : 
           '🚀 EXPORT SLIDESHOW'),

      // Download button (when completed)
      canDownload && React.createElement('button', {
        key: 'download-btn',
        onClick: handleDownload,
        style: {
          width: '100%',
          padding: '12px',
          backgroundColor: '#22c55e',
          border: 'none',
          borderRadius: '6px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          marginTop: '8px'
        }
      }, '⬇️ DOWNLOAD VIDEO'),

      // Format selector
      !isExporting && React.createElement('div', {
        key: 'format',
        style: {
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginTop: '8px'
        }
      }, ['mp4', 'gif', 'webm'].map(format => 
        React.createElement('button', {
          key: format,
          onClick: () => setProject(prev => ({
            ...prev,
            exportSettings: { ...prev.exportSettings, format }
          })),
          style: {
            padding: '4px 12px',
            backgroundColor: project.exportSettings.format === format ? '#ec4899' : 'transparent',
            border: `1px solid ${project.exportSettings.format === format ? '#ec4899' : '#343536'}`,
            color: project.exportSettings.format === format ? 'white' : '#9ca3af',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }
        }, format.toUpperCase())
      ))
    ])
  ]);
};

export default FigmaSlideshow; 