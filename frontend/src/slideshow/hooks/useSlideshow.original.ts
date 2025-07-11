import { useState, useCallback } from 'react';
import { 
  ImageFile, 
  TimelineItem, 
  ExportSettings,
  SlideshowState,
  UploadResponse,
  PreviewResponse,
  ExportResponse
} from '../types/slideshow.types';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

// API functions
const uploadImagesAPI = async (files: File[], sessionId: string): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));

  const response = await fetch(`${API_BASE_URL}/upload?sessionId=${sessionId}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

const generatePreviewAPI = async (payload: any): Promise<PreviewResponse> => {
  const response = await fetch(`${API_BASE_URL}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Preview generation failed: ${response.statusText}`);
  }

  return response.json();
};

const exportAPI = async (format: string, payload: any): Promise<ExportResponse> => {
  const response = await fetch(`${API_BASE_URL}/export/${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.json();
};

export const useSlideshow = () => {
  const [state, setState] = useState<SlideshowState>({
    project: {
      id: `project_${Date.now()}`,
      images: [],
      timeline: [],
      exportSettings: {
        format: 'gif',
        preset: 'web',
        quality: 'medium',
        fps: 30,
        resolution: {
          width: 1920,
          height: 1080,
          preset: 'original'
        },
        loop: true,
        tags: {
          quality: 'standard',
          fps: '30',
          resolution: 'original'
        }
      },
      sessionId: ''
    },
    preview: {
      url: null,
      isGenerating: false,
      error: null
    },
    export: {
      isExporting: false,
      progress: 0,
      lastResult: null,
      error: null
    },
    isUploading: false,
    dragActive: false
  });

  // Create preview from file
  const createImagePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }, []);

  // Upload images
  const uploadImages = useCallback(async (files: File[]) => {
    setState(prev => ({ ...prev, isUploading: true }));

    try {
      // Use existing session ID if available, otherwise create new one
      const sessionId = state.project.sessionId || Date.now().toString();
      
      console.log(`📤 Upload starting with sessionId: ${sessionId}`);
      
      // Create image objects with previews
      const newImages: ImageFile[] = await Promise.all(
        files.map(async (file) => ({
          file,
          id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          preview: await createImagePreview(file),
          addedAt: new Date()
        }))
      );

      // Upload to backend
      const uploadResult = await uploadImagesAPI(files, sessionId);
      
      if (uploadResult.success) {
        // Update images with uploaded info
        newImages.forEach((image, index) => {
          const uploadedFile = uploadResult.files[index];
          if (uploadedFile) {
            image.uploadedInfo = uploadedFile;
          }
        });

        setState(prev => ({
          ...prev,
          project: {
            ...prev.project,
            images: [...prev.project.images, ...newImages],
            sessionId: sessionId // Use the consistent sessionId, not the one from response
          },
          isUploading: false
        }));

        console.log('✅ Images uploaded successfully:', uploadResult);
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      setState(prev => ({
        ...prev,
        isUploading: false
      }));
      throw error;
    }
  }, [state.project.sessionId, createImagePreview]);

  // Add image to timeline
  const addToTimeline = useCallback((imageId: string, duration: number = 1000) => {
    const newTimelineItem: TimelineItem = {
      id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageId,
      duration,
      position: state.project.timeline.length
      // No transition by default - user can add them manually
    };

    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        timeline: [...prev.project.timeline, newTimelineItem]
      },
      preview: {
        ...prev.preview,
        url: null // Reset preview when timeline changes
      }
    }));
  }, [state.project.timeline.length]);

  // Remove image from project
  const removeImage = useCallback((imageId: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        images: prev.project.images.filter(img => img.id !== imageId),
        timeline: prev.project.timeline.filter(item => item.imageId !== imageId)
      },
      preview: {
        ...prev.preview,
        url: null // Reset preview when timeline changes
      }
    }));
  }, []);

  // Update timeline item
  const updateTimelineItem = useCallback((itemId: string, updates: Partial<TimelineItem>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        timeline: prev.project.timeline.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      },
      preview: {
        ...prev.preview,
        url: null // Reset preview when timeline changes
      }
    }));
  }, []);

  // Remove from timeline
  const removeFromTimeline = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        timeline: prev.project.timeline.filter(item => item.id !== itemId)
      },
      preview: {
        ...prev.preview,
        url: null // Reset preview when timeline changes
      }
    }));
  }, []);

  // Reorder timeline
  const reorderTimeline = useCallback((newTimeline: TimelineItem[]) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        timeline: newTimeline
      },
      preview: {
        ...prev.preview,
        url: null // Reset preview when timeline changes
      }
    }));
  }, []);

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (state.project.timeline.length === 0) return;

    setState(prev => ({
      ...prev,
      preview: { ...prev.preview, isGenerating: true, error: null }
    }));

    try {
      const payload = {
        images: state.project.timeline.map(item => {
          const image = state.project.images.find(img => img.id === item.imageId);
          const filename = image?.uploadedInfo?.filename || image?.name;
          console.log(`🔍 Timeline item ${item.id} → image ${image?.id} → filename: ${filename}`);
          return { filename };
        }),
        transitions: state.project.timeline.slice(0, -1).map(item => ({
          type: item.transition?.type || 'cut', // Default to 'cut' (no transition)
          duration: item.transition?.duration || 0 // No duration for cuts
        })),
        frameDurations: state.project.timeline.map(item => item.duration),
        sessionId: state.project.sessionId
      };

      console.log('🎬 Preview payload:', payload);
      console.log('🔍 State project:', {
        timelineLength: state.project.timeline.length,
        imagesLength: state.project.images.length,
        sessionId: state.project.sessionId
      });
      
      if (!payload.sessionId) {
        throw new Error('No session ID available. Please upload images first.');
      }

      if (payload.images.length === 0) {
        throw new Error('No images in timeline. Please add images to timeline first.');
      }

      const result = await generatePreviewAPI(payload);
      
      console.log('🎬 Preview result:', result);
      
      if (result.success) {
        const videoUrl = `${API_BASE_URL}${result.previewUrl}?t=${Date.now()}`;
        console.log('🎬 Preview video URL:', videoUrl);
        setState(prev => ({
          ...prev,
          preview: {
            url: videoUrl,
            isGenerating: false,
            error: null
          }
        }));
      } else {
        throw new Error(result.message || 'Preview generation failed');
      }
    } catch (error) {
      console.error('❌ Preview generation failed:', error);
      setState(prev => ({
        ...prev,
        preview: {
          ...prev.preview,
          isGenerating: false,
          error: error instanceof Error ? error.message : 'Preview generation failed'
        }
      }));
    }
  }, [state.project.timeline, state.project.images, state.project.sessionId]);

  // Export slideshow
  const exportSlideshow = useCallback(async () => {
    if (state.project.timeline.length === 0) return;

    setState(prev => ({
      ...prev,
      export: { ...prev.export, isExporting: true, error: null, progress: 0 }
    }));

    // Progress simulation since backend doesn't send real progress
    const simulateProgress = () => {
      const steps = [
        { progress: 10, message: 'Preparing images...' },
        { progress: 25, message: 'Processing transitions...' },
        { progress: 45, message: 'Encoding frames...' },
        { progress: 70, message: 'Optimizing output...' },
        { progress: 90, message: 'Finalizing export...' }
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          const step = steps[stepIndex];
          setState(prev => ({
            ...prev,
            export: {
              ...prev.export,
              progress: step.progress,
              currentStep: step.message
            }
          }));
          stepIndex++;
        } else {
          clearInterval(progressInterval);
        }
      }, 800);

      return progressInterval;
    };

    const progressInterval = simulateProgress();

    try {
      const payload = {
        images: state.project.timeline.map(item => {
          const image = state.project.images.find(img => img.id === item.imageId);
          return { filename: image?.uploadedInfo?.filename || image?.name };
        }),
        transitions: state.project.timeline.slice(0, -1).map(item => ({
          type: item.transition?.type || 'cut', // Default to 'cut' (no transition)
          duration: item.transition?.duration || 0 // No duration for cuts
        })),
        frameDurations: state.project.timeline.map(item => item.duration),
        sessionId: state.project.sessionId,
        exportSettings: state.project.exportSettings
      };

      // Use 'video' endpoint for slideshow exports (supports mp4/webm), 'gif' for GIF
      const format = state.project.exportSettings.format === 'gif' ? 'gif' : 'video';
      const result = await exportAPI(format, payload);
      
      clearInterval(progressInterval);
      
      if (result.success) {
        // Show completion
        setState(prev => ({
          ...prev,
          export: {
            ...prev.export,
            progress: 100,
            currentStep: 'Export complete!'
          }
        }));

        // Small delay to show completion, then trigger download
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = `${API_BASE_URL}${result.downloadUrl}`;
          link.download = result.filename || 'download';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setState(prev => ({
            ...prev,
            export: {
              isExporting: false,
              progress: 100,
              lastResult: result.downloadUrl,
              error: null,
              currentStep: undefined
            }
          }));
        }, 1000);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('❌ Export failed:', error);
      setState(prev => ({
        ...prev,
        export: {
          ...prev.export,
          isExporting: false,
          error: error instanceof Error ? error.message : 'Export failed',
          currentStep: undefined
        }
      }));
    }
  }, [state.project]);

  // Update export settings
  const updateExportSettings = useCallback((updates: Partial<ExportSettings>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        exportSettings: { ...prev.project.exportSettings, ...updates }
      }
    }));
  }, []);

  // Set drag active state
  const setDragActive = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, dragActive: active }));
  }, []);

  // Clear project
  const clearProject = useCallback(() => {
    setState(prev => ({
      ...prev,
      project: {
        id: `project_${Date.now()}`,
        images: [],
        timeline: [],
        exportSettings: prev.project.exportSettings, // Keep export settings
        sessionId: ''
      },
      preview: {
        url: null,
        isGenerating: false,
        error: null
      },
      export: {
        isExporting: false,
        progress: 0,
        lastResult: null,
        error: null
      }
    }));
  }, []);

  return {
    // State
    project: state.project,
    preview: state.preview,
    export: state.export,
    isUploading: state.isUploading,
    dragActive: state.dragActive,
    
    // Computed
    hasImages: state.project.images.length > 0,
    hasTimeline: state.project.timeline.length > 0,
    
    // Actions
    uploadImages,
    addToTimeline,
    removeImage,
    updateTimelineItem,
    removeFromTimeline,
    reorderTimeline,
    generatePreview,
    exportSlideshow,
    updateExportSettings,
    setDragActive,
    clearProject
  };
};
