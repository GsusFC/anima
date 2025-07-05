// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useImageManagement } from '../plugin-hooks/useImageManagement';
import { useExportManagement } from '../plugin-hooks/useExportManagement';
import { usePreviewGeneration, PreviewState } from '../plugin-hooks/usePreviewGeneration';
import { useExportProgress } from '../plugin-hooks/useExportProgress';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ImageFile, TimelineItem, ExportSettings } from '../types/slideshow.types';
import { API_BASE_URL } from '../constants';
import { colors, typography, spacing, borderRadius } from '../design-system/tokens';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Slider } from '../design-system/Slider';
import { Select } from '../design-system/Select';
import { TabGroup } from '../design-system/TabGroup';
import { TimelineItem } from '../design-system/TimelineItem';
import { ProgressBar } from '../design-system/ProgressBar';
import { ScrollContainerWithCSS as ScrollContainer } from '../design-system/ScrollContainer';


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

  // Real-time progress via Socket.IO
  const { percent: socketPercent, connected: socketConnected } = useExportProgress(isExporting ? sessionId : undefined);

  // Format cycling for Tab key
  const cycleFormat = () => {
    const formats = ['mp4', 'gif', 'webm'];
    const currentIndex = formats.indexOf(project.exportSettings.format);
    const nextIndex = (currentIndex + 1) % formats.length;
    setProject(prev => ({
      ...prev,
      exportSettings: { ...prev.exportSettings, format: formats[nextIndex] }
    }));
  };

  // Keyboard shortcuts
  const { shortcuts } = useKeyboardShortcuts({
    onRefresh: () => parent.postMessage({ pluginMessage: { type: 'request-images' } }, '*'),
    onExport: () => {
      if (!isExporting && project.timeline.length > 0 && project.images.length > 0 && sessionId) {
        handleExport();
      }
    },
    onPreview: () => {
      if (!previewState.isGenerating && project.timeline.length > 0 && !isUploading && sessionId) {
        generatePreview();
      }
    },
    onClose: () => parent.postMessage({ pluginMessage: { type: 'close-plugin' } }, '*'),
    onFormatCycle: cycleFormat,
    enabled: !isExporting && !previewState.isGenerating // Disable during export/preview
  });

  // Collect debug events locally for panel


  // Track progress updates
  useEffect(() => {
    if (isExporting) {
  
    }
  }, [currentJob?.progress, socketPercent, isExporting, currentJob?.status]);

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
              const uploadResult = await uploadImages(files);

              if (uploadResult && uploadResult.images) {
                // Merge uploadedInfo into project images
                setProject(prev => {
                  // Align by index (uploadResult.images preserves original order)
                  const enriched = prev.images.map((img, idx) => {
                    const uploaded = uploadResult.images[idx];
                    return uploaded ? { ...img, uploadedInfo: uploaded.uploadedInfo } : img;
                  });
                  return { ...prev, images: enriched };
                });
              }
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



  // Handle export
  const handleExport = async () => {
    if (!sessionId || project.timeline.length === 0 || project.images.length === 0) {
      setError('No images to export. Please select frames and upload before exporting.');
      return;
    }

    try {
      // Convert timeline to backend format and include backend filename
      const timelineData = project.timeline.map(item => {
        const img = project.images.find(i => i.id === item.imageId);
        const filename = img?.uploadedInfo?.filename || img?.file?.name || `${item.imageId}.png`;
        return {
          imageId: item.imageId,
          duration: item.duration,
          transition: item.transition,
          filename
        };
      });

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

  // Handle log download
  const handleLogDownload = async () => {
    if (!currentJob?.logUrl) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}${currentJob.logUrl}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch log: ${response.statusText}`);
      }
      
      const logText = await response.text();
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-log-${currentJob.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Log download failed:', err);
      setError(`Log download failed: ${err.message}`);
    }
  };

  // Clear the current preview whenever the timeline is modified so that users
  // always generate a fresh preview reflecting updated durations or transitions
  useEffect(() => {
    if (previewState.url) {
      clearPreview();
    }
  }, [project.timeline, clearPreview, previewState.url]);



  // Error display (includes preview errors)
  if (error || exportError || previewState.error) {
    const errorMessage = error || exportError || previewState.error;
    return React.createElement('div', {
      style: {
        padding: spacing.xl,
        backgroundColor: colors.bg.primary,
        color: colors.status.error,
        fontFamily: typography.fontFamily,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md
      }
    }, [
      React.createElement('div', {
        key: 'error-text',
        style: { 
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.medium
        }
      }, `Error: ${errorMessage}`),
      // Video download (if previous export completed)
      canDownload && React.createElement(Button, {
        key: 'download-video',
        variant: 'success',
        size: 'base',
        onClick: handleDownload
      }, '⬇️ Descargar último video'),
      // Log download (if available)
      currentJob?.logUrl && React.createElement(Button, {
        key: 'log',
        variant: 'secondary',
        size: 'base',
        onClick: handleLogDownload
      }, 'Download Log'),
      React.createElement(Button, {
        key: 'retry',
        variant: 'primary',
        size: 'base',
        onClick: () => {
          setError(null);
          if (exportError) {
            cancelExport();
          }
        }
      }, 'Try Again')
    ]);
  }

  return React.createElement('div', {
    style: {
      height: '100vh',
      backgroundColor: colors.bg.primary,
      color: colors.text.primary,
      fontFamily: typography.fontFamily,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, [
      // Header
      React.createElement('div', {
      key: 'header',
      style: {
      padding: spacing.lg,
      borderBottom: `1px solid ${colors.border.primary}`,
      backgroundColor: colors.bg.secondary,
      display: 'flex',
      justifyContent: 'space-between',
        alignItems: 'center'
        }
    }, [
        React.createElement('h3', {
          key: 'title',
          style: { margin: 0, fontSize: '14px' }
        }, `🎬 Slideshow (${project.images.length} frames)`),
        React.createElement(Button, {
          key: 'set-api',
          variant: 'ghost',
          size: 'sm',
          onClick: () => {
            const url = prompt('API base URL', localStorage.getItem('ANIMAGEN_API') || 'http://localhost:3001');
            if (url) {
              localStorage.setItem('ANIMAGEN_API', url);
              alert('API URL saved. Recarga el plugin para aplicar los cambios.');
            }
          }
        }, 'Set API'),
        React.createElement(Button, {
          key: 'close',
          variant: 'ghost',
          size: 'sm',
          onClick: () => parent.postMessage({ pluginMessage: { type: 'close-plugin' } }, '*')
        }, 'Close')
      ]),

      // Content
      React.createElement(ScrollContainer, {
        key: 'content',
        padding: spacing.lg
      }, project.timeline.length === 0 ? 
        // Empty state
        React.createElement('div', {
          style: {
            textAlign: 'center',
            color: colors.text.secondary,
            padding: spacing.xl,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.lg,
            justifyContent: 'center',
            minHeight: '200px'
          }
        }, [
          React.createElement('div', {
            key: 'icon',
            style: {
              fontSize: '32px',
              marginBottom: spacing.sm
            }
          }, '🖼️'),
          React.createElement('p', {
            key: 'msg',
            style: {
              margin: 0,
              fontSize: typography.fontSize.base,
              color: colors.text.secondary
            }
          }, 'Select frames in Figma and click "Refresh" to load images'),
          React.createElement(Button, {
            key: 'refresh',
            variant: 'primary',
            size: 'base',
            onClick: () => parent.postMessage({ pluginMessage: { type: 'request-images' } }, '*')
          }, 'Refresh Selection')
        ]) : 
        // Timeline items
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md
          }
        }, project.timeline.map((item, index) => {
          const image = project.images.find(img => img.id === item.imageId);
          if (!image) return null;

          return React.createElement(TimelineItem, {
            key: item.id,
            item,
            image,
            index,
            totalItems: project.timeline.length,
            onUpdate: updateTimelineItem,
            onRemove: removeFromTimeline
          });
        }))),

      // Preview section (video or button)
      React.createElement('div', {
        key: 'preview-section',
        style: {
          padding: `0 ${spacing.lg}`,
          borderTop: `1px solid ${colors.border.primary}`
        }
      }, [
        previewState.url ? 
          React.createElement('video', {
            key: 'preview-video',
            src: previewState.url,
            controls: true,
            style: {
              width: '100%',
              borderRadius: borderRadius.md,
              marginTop: spacing.md,
              marginBottom: spacing.md,
              maxHeight: '200px',
              objectFit: 'contain',
              backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.primary}`
            }
          }) :
          React.createElement('div', {
            key: 'preview-button',
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.md
            }
          }, React.createElement(Button, {
            variant: 'ghost',
            size: 'sm',
            disabled: previewState.isGenerating || project.timeline.length === 0 || isUploading || !sessionId,
            onClick: generatePreview
          }, previewState.isGenerating ? '⏳ Generating...' : '🔍 Quick Preview'))
      ]),

      // Export Section
      React.createElement('div', {
        key: 'export',
        style: {
          padding: spacing.lg,
          borderTop: `1px solid ${colors.border.primary}`,
          backgroundColor: colors.bg.secondary
        }
      }, [
        // Export button or progress
        isExporting ? 
          // Progress UI
          React.createElement('div', {
            key: 'progress',
            style: { marginBottom: spacing.md }
          }, [
            React.createElement(ProgressBar, {
              key: 'progress-bar',
              value: socketConnected ? socketPercent : (currentJob?.progress || 0),
              label: currentJob?.status === 'pending' ? 'Queued...' : 
                     currentJob?.status === 'processing' ? 'Processing...' : 
                     'Exporting...',
              color: 'primary'
            }),
            React.createElement(Button, {
              key: 'cancel',
              variant: 'error',
              size: 'sm',
              fullWidth: true,
              onClick: cancelExport
            }, 'Cancel Export')
          ]) :
          // Export button
          React.createElement(Button, {
            key: 'export-btn',
            variant: 'primary',
            size: 'lg',
            fullWidth: true,
            disabled: project.timeline.length === 0 || isUploading || project.images.length === 0 || !sessionId,
            onClick: handleExport
          }, isUploading ? 'Uploading...' : 
             project.timeline.length === 0 ? 'No frames to export' : 
             '🚀 Export Slideshow'),

        // Download button (when completed)
        canDownload && React.createElement(Button, {
          key: 'download-btn',
          variant: 'success',
          size: 'lg',
          fullWidth: true,
          onClick: handleDownload
        }, '⬇️ Download Video'),

        // Format selector
        !isExporting && React.createElement('div', {
          key: 'format',
          style: {
            display: 'flex',
            justifyContent: 'center',
            marginTop: spacing.sm
          }
        }, React.createElement(TabGroup, {
          tabs: [
            { value: 'mp4', label: 'MP4' },
            { value: 'gif', label: 'GIF' },
            { value: 'webm', label: 'WebM' }
          ],
          value: project.exportSettings.format,
          onChange: (format) => setProject(prev => ({
            ...prev,
            exportSettings: { ...prev.exportSettings, format }
          })),
          size: 'sm'
        }))
      ].filter(Boolean)),


  ]);
};

export default FigmaSlideshow;
