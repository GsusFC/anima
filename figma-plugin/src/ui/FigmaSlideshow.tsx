import React, { useState, useEffect } from 'react';
import { useImageManagement } from '../plugin-hooks/useImageManagement';
import { useExportManagement } from '../plugin-hooks/useExportManagement';
import { usePreviewGeneration, PreviewState } from '../plugin-hooks/usePreviewGeneration';
import { useExportProgress } from '../plugin-hooks/useExportProgress';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ImageFile, TimelineItem, ExportSettings } from '../types/slideshow.types';
import { colors, typography } from '../design-system/tokens';
import { ScrollContainerWithCSS as ScrollContainer } from '../design-system/ScrollContainer';

// Components
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { Timeline } from '../components/Timeline';
import { ExportSection } from '../components/ExportSection';
import { ErrorDisplay } from '../components/ErrorDisplay';


// Utils
import { validateExportData } from '../utils/validation';
import { downloadBlob, generateFilename } from '../utils/download';
import { apiService } from '../services/api';
import { usePluginContext, useAPIConfig } from '../context/PluginContext';
import { SettingsModal } from '../components/SettingsModal';
import { LogViewer } from '../components/LogViewer';
import { logger } from '../utils/logger';
import { pluginStorage } from '../utils/storage';

interface Project {
  id: string;
  images: ImageFile[];
  timeline: TimelineItem[];
  exportSettings: ExportSettings;
}

const FigmaSlideshow: React.FC = () => {
    const { config } = usePluginContext();
    const { promptForAPIURL } = useAPIConfig();
    const [showSettings, setShowSettings] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [project, setProject] = useState<Project>({
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

    // Note: Selection state removed - using direct reordering in timeline instead

    const [error, setError] = useState<string | null>(null);
    const [previewState, setPreviewState] = useState<PreviewState>({
        url: null,
        isGenerating: false,
        error: null
    });

    // Hooks for functionality
  const { sessionId, uploadImages, isUploading } = useImageManagement();
  const { 
    currentJob, 
    isExporting, 
    error: exportError, 
    startExport, 
    downloadResult, 
    cancelExport,
        canDownload
  } = useExportManagement();

  const { generatePreview, clearPreview } = usePreviewGeneration({
    timeline: project.timeline,
    images: project.images,
    sessionId,
    updatePreviewState: (updates) =>
      setPreviewState((prev) => ({ ...prev, ...updates }))
  });

    const { percent: socketPercent, connected: socketConnected } = useExportProgress(
        sessionId // Connect when we have a sessionId, not just when exporting
    );

    // Note: Selection management functions removed - timeline now uses direct reordering

    // Set up logging session
  useEffect(() => {
        if (sessionId) {
            logger.setSessionId(sessionId);
            logger.logComponentMount('FigmaSlideshow', { config });
        }

        return () => {
            logger.logComponentUnmount('FigmaSlideshow');
        };
    }, [sessionId, config]);

    // Handlers
    const handleAPISettings = () => {
        const url = prompt(
            'API base URL',
            pluginStorage.getItem('ANIMAGEN_API') || 'http://localhost:3001'
        );
        if (url) {
            pluginStorage.setItem('ANIMAGEN_API', url);
            apiService.updateBaseURL(url);
            alert('API URL saved. Reload the plugin to apply changes.');
        }
    };

    const handleClose = () => {
        parent.postMessage({ pluginMessage: { type: 'close-plugin' } }, '*');
    };

    const handleRefresh = () => {
        parent.postMessage({ pluginMessage: { type: 'request-images' } }, '*');
    };

    const handleUpdateTimelineItem = (itemId: string, updates: Partial<TimelineItem>) => {
        setProject(prev => ({
            ...prev,
            timeline: prev.timeline.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
            )
        }));
    };

    const handleRemoveTimelineItem = (itemId: string) => {
        setProject(prev => ({
            ...prev,
            timeline: prev.timeline.filter(item => item.id !== itemId)
        }));
    };

    const handleMoveTimelineItem = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= project.timeline.length) return;

        setProject(prev => {
            const newTimeline = [...prev.timeline];
            const [movedItem] = newTimeline.splice(fromIndex, 1);
            newTimeline.splice(toIndex, 0, movedItem);

            // Update positions
            const updatedTimeline = newTimeline.map((item, index) => ({
                ...item,
                position: index
            }));

            return {
                ...prev,
                timeline: updatedTimeline
            };
        });
    };

    const handleFormatChange = (format: string) => {
        setProject(prev => ({
            ...prev,
            exportSettings: { ...prev.exportSettings, format: format as any }
        }));
    };

    const cycleFormat = () => {
        const formats = ['mp4', 'gif', 'webm'];
        const currentIndex = formats.indexOf(project.exportSettings.format);
        const nextIndex = (currentIndex + 1) % formats.length;
        handleFormatChange(formats[nextIndex]);
    };

    // Export handling
    const handleExport = async () => {
        const validation = validateExportData(
            sessionId || '',
            project.timeline,
            project.images,
            project.exportSettings
        );

        if (!validation.isValid) {
            setError(validation.errors.join('; '));
            return;
        }

        try {
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

            // Convert timeline data to proper format for export
            const exportData = timelineData.map((item, index) => ({
                ...item,
                id: project.timeline[index]?.id || `export_${index}`,
                position: index
            }));

            await startExport(sessionId!, exportData, project.exportSettings, config.gif);
        } catch (err) {
            setError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDownload = async () => {
        try {
            await downloadResult();
        } catch (err) {
            setError(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleLogDownload = async () => {
        if (!currentJob?.logUrl) return;

        try {
            const response = await fetch(`${apiService['baseURL']}${currentJob.logUrl}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch log: ${response.statusText}`);
            }

            const logText = await response.text();
            const filename = `error-log-${currentJob.id}.txt`;
            downloadBlob(new Blob([logText], { type: 'text/plain' }), filename);
        } catch (err) {
            console.error('Log download failed:', err);
            setError(`Log download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleRetry = () => {
        setError(null);
        if (exportError) {
            cancelExport();
        }
    };

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onRefresh: handleRefresh,
        onExport: () => {
            if (!isExporting && canExport) {
                handleExport();
            }
        },
        onPreview: () => {
            if (canGeneratePreview) {
                generatePreview();
            }
        },
        onClose: handleClose,
        onFormatCycle: cycleFormat,
        enabled: Boolean(!isExporting && !previewState.isGenerating)
    });

  // Listen for images from Figma plugin
  useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
        const msg = event.data.pluginMessage;
        if (msg?.type === 'images') {
          console.log('Processing images:', msg.data);
          
                const processed = msg.data.map((arr: ArrayBuffer, index: number) => {
            try {
              const uint8 = new Uint8Array(arr);
              const blob = new Blob([uint8], { type: 'image/png' });
              const url = URL.createObjectURL(blob);
              return { blob, url };
            } catch (err) {
              console.error(`Error processing image ${index}:`, err);
              return null;
            }
                }).filter((item: { blob: Blob; url: string } | null): item is { blob: Blob; url: string } => item !== null);
          
                const newImages: ImageFile[] = processed.map((item: { blob: Blob; url: string }, index: number) => ({
            file: new File([item.blob], `figma-frame-${index}.png`, { type: 'image/png' }),
            id: `figma_image_${index}_${Date.now()}`,
            name: `Frame ${index + 1}`,
            size: item.blob.size,
            preview: item.url,
            addedAt: new Date()
          }));

                // Auto-add to timeline (restored original behavior)
                const newTimeline: TimelineItem[] = newImages.map((img, index) => ({
                id: `timeline_${index}_${Date.now()}`,
                imageId: img.id,
                duration: 3000,  // 3 seconds per frame for better visibility
                position: index,
                transition: index < newImages.length - 1 ? { type: 'fade', duration: 1000 } : undefined  // 1 second fade
                }));

          setProject(prev => ({
            ...prev,
            images: newImages,
            timeline: newTimeline
          }));

          // Upload images to backend
          if (newImages.length > 0) {
            try {
                        console.log('🔄 Uploading images to backend...', { count: newImages.length });
              const files = newImages.map(img => img.file);
              const uploadResult = await uploadImages(files);

                        console.log('✅ Upload result:', {
                            sessionId: uploadResult?.sessionId,
                            imagesCount: uploadResult?.images?.length,
                            uploadedFilenames: uploadResult?.images?.map(img => img.uploadedInfo?.filename)
                        });

                        if (uploadResult?.images) {
                setProject(prev => {
                                console.log('🔄 Enriching project images with upload info...', {
                                    projectImagesCount: prev.images.length,
                                    uploadedImagesCount: uploadResult.images.length
                                });

                  const enriched = prev.images.map((img, idx) => {
                    const uploaded = uploadResult.images[idx];
                                    if (uploaded?.uploadedInfo) {
                                        console.log(`📸 Enriching image ${idx}: ${img.name} -> ${uploaded.uploadedInfo.filename}`);
                                        return { ...img, uploadedInfo: uploaded.uploadedInfo };
                                    }
                                    return img;
                                });

                                console.log('✅ Enriched images:', enriched.map(img => ({
                                    name: img.name,
                                    filename: img.uploadedInfo?.filename,
                                    hasUploadInfo: !!img.uploadedInfo
                                })));

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

        window.addEventListener('message', handleMessage);
        handleRefresh(); // Request images on mount

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [uploadImages]);

    // Clear preview when timeline changes
    useEffect(() => {
        if (previewState.url) {
            clearPreview();
        }
    }, [project.timeline, clearPreview, previewState.url]);

    // Auto-open preview modal when preview is ready
    useEffect(() => {
        if (previewState.url && !previewState.isGenerating && !previewState.error) {
            setShowPreviewModal(true);
        }
    }, [previewState.url, previewState.isGenerating, previewState.error]);

    // Computed values
    const anyError = error || exportError || previewState.error;
    const canExport = Boolean(!isExporting && project.timeline.length > 0 && project.images.length > 0 && sessionId && !isUploading);
    const canGeneratePreview = Boolean(!previewState.isGenerating && project.timeline.length > 0 && !isUploading && sessionId);

    // Error display
    if (anyError) {
        return (
            <ErrorDisplay
                errorMessage={anyError}
                canDownload={Boolean(canDownload)}
                hasLogUrl={!!currentJob?.logUrl}
                onDownloadVideo={canDownload ? handleDownload : undefined}
                onDownloadLog={currentJob?.logUrl ? handleLogDownload : undefined}
                onRetry={handleRetry}
            />
        );
    }

    // Main UI
    return (
        <div
            style={{
      height: '100vh',
                backgroundColor: colors.bg.primary,
                color: colors.text.primary,
                fontFamily: typography.fontFamily,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <Header
                frameCount={project.images.length}
                onSetAPI={handleAPISettings}
                onClose={handleClose}
                onOpenLogs={() => setShowLogs(true)}
                onOpenSettings={() => setShowSettings(true)}
                debugMode={config.debugMode}
            />



            <ScrollContainer>
                {project.timeline.length === 0 ? (
                    <EmptyState onRefresh={handleRefresh} />
                ) : (
                    <Timeline
                        timeline={project.timeline}
                        images={project.images}
                        previewState={previewState}
                        canGeneratePreview={canGeneratePreview}
                        onUpdateItem={handleUpdateTimelineItem}
                        onRemoveItem={handleRemoveTimelineItem}
                        onMoveItem={handleMoveTimelineItem}
                        onGeneratePreview={generatePreview}
                        exportFormat={project.exportSettings.format}
                    />
                )}
            </ScrollContainer>

            <ExportSection
                isExporting={isExporting}
                currentJob={currentJob}
                socketConnected={socketConnected}
                socketPercent={socketPercent}
                canExport={canExport}
                canDownload={Boolean(canDownload)}
                exportSettings={project.exportSettings}
                onExport={handleExport}
                onDownload={handleDownload}
                onCancel={cancelExport}
                onFormatChange={handleFormatChange}
            />

            {/* Modals */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />

            <LogViewer
                isOpen={showLogs}
                onClose={() => setShowLogs(false)}
            />


        </div>
    );
};

export default FigmaSlideshow;
