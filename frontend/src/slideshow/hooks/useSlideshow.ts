import { useState, useCallback } from 'react';
import { ImageFile, TimelineItem, ExportSettings, PreviewState, ExportState, TransitionType } from '../types/slideshow.types';
import { useImageManagement } from './useImageManagement';
import { usePreviewGeneration } from './usePreviewGeneration';
import { useExportManagement } from './useExportManagement';

// Main state interface
interface SlideshowState {
  project: {
    id: string;
    images: ImageFile[];
    timeline: TimelineItem[];
    exportSettings: ExportSettings;
    sessionId?: string;
  };
  preview: PreviewState;
  export: ExportState;
  isUploading: boolean;
  dragActive: boolean;
  selection: {
    selectedImages: string[]; // IDs en orden de selección
    isSelectionMode: boolean;
  };
}

// Initial state
const initialState: SlideshowState = {
  project: {
    id: `project_${Date.now()}`,
    images: [],
    timeline: [],
    exportSettings: {
      format: 'mp4',
      preset: 'quality',
      quality: 'high',
      fps: 30,
      resolution: {
        width: 1920,
        height: 1080,
        preset: '1080p'
      },
      loop: true,
      tags: {}
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
    error: null,
    isCompleted: false,
    downloadUrl: undefined
  },
  isUploading: false,
  dragActive: false,
  selection: {
    selectedImages: [],
    isSelectionMode: false
  }
};

export const useSlideshow = () => {
  const [state, setState] = useState<SlideshowState>(initialState);

  // State update helpers
  const updatePreviewState = useCallback((updates: Partial<PreviewState>) => {
    setState(prev => ({
      ...prev,
      preview: { ...prev.preview, ...updates }
    }));
  }, []);

  const updateExportState = useCallback((updates: Partial<ExportState>) => {
    setState(prev => ({
      ...prev,
      export: { ...prev.export, ...updates }
    }));
  }, []);

  const updateExportSettingsState = useCallback((updates: Partial<ExportSettings>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        exportSettings: { ...prev.project.exportSettings, ...updates }
      }
    }));
  }, []);

  // Initialize specialized hooks
  const imageManagement = useImageManagement(state.project.sessionId || '');

  // Upload images with loading state management
  const uploadImages = useCallback(async (files: File[]) => {
    setState(prev => ({ ...prev, isUploading: true }));
    try {
      const uploadedFiles = await imageManagement.uploadImages(files);
      if (uploadedFiles) {
        setState(prev => ({
          ...prev,
          project: {
            ...prev.project,
            images: uploadedFiles.images,
            sessionId: uploadedFiles.sessionId
          }
        }));
      }
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  }, [imageManagement]);

  // Timeline management actions that update state directly
  const addToTimeline = useCallback((imageId: string, duration: number = 1000) => {
    const newItem: TimelineItem = {
      id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageId,
      duration,
      position: state.project.timeline.length,
      transition: undefined
    };

    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        timeline: [...prev.project.timeline, newItem]
      },
      preview: { ...prev.preview, url: null }
    }));
  }, [state.project.timeline.length]);

  const updateTimelineItem = useCallback((itemId: string, updates: Partial<TimelineItem>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        timeline: prev.project.timeline.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      },
      preview: { ...prev.preview, url: null }
    }));
  }, []);

  const removeFromTimeline = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        timeline: prev.project.timeline.filter(item => item.id !== itemId)
      },
      preview: { ...prev.preview, url: null }
    }));
  }, []);

  const reorderTimeline = useCallback((newTimeline: TimelineItem[]) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        timeline: newTimeline
      },
      preview: { ...prev.preview, url: null }
    }));
  }, []);

  const previewGeneration = usePreviewGeneration({
    timeline: state.project.timeline,
    images: state.project.images,
    sessionId: state.project.sessionId,
    updatePreviewState
  });

  const exportManagement = useExportManagement({
    timeline: state.project.timeline,
    images: state.project.images,
    sessionId: state.project.sessionId,
    exportSettings: state.project.exportSettings,
    updateExportState,
    updateExportSettingsState
  });



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
        error: null,
        isCompleted: false,
        downloadUrl: undefined
      },
      selection: {
        selectedImages: [],
        isSelectionMode: false
      }
    }));
  }, []);

  // Load slideshow from API (for Figma-generated slideshows)
  const loadSlideshowFromAPI = useCallback(async (slideshowId: string) => {
    try {
      console.log('🎬 Loading slideshow from API:', slideshowId);

      const response = await fetch(`/api/slideshow/${slideshowId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load slideshow');
      }

      const slideshow = data.slideshow;
      console.log('✅ Slideshow data loaded:', slideshow);

      // Convert API data to internal format
      const images: ImageFile[] = slideshow.frames.map((frame: any) => ({
        id: frame.id,
        name: frame.name,
        file: null as any, // No actual file for API-loaded images
        size: 0,
        preview: frame.imageUrl, // Use the API image URL as preview
        addedAt: new Date(),
        uploadedInfo: {
          filename: frame.name,
          originalName: frame.name,
          path: frame.imageUrl,
          size: 0,
          mimetype: 'image/png'
        }
      }));

      const timeline: TimelineItem[] = slideshow.frames.map((frame: any) => ({
        id: `timeline_${frame.id}`,
        imageId: frame.id,
        duration: frame.duration,
        position: frame.order,
        transition: {
          type: frame.transition as TransitionType,
          duration: 500
        }
      }));

      // Update state with loaded data
      setState(prev => ({
        ...prev,
        project: {
          id: slideshow.id,
          images,
          timeline,
          exportSettings: {
            ...prev.project.exportSettings,
            format: slideshow.settings.format === 'slideshow' ? 'gif' : slideshow.settings.format as any,
            loop: slideshow.settings.loop
          },
          sessionId: slideshow.id
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
          error: null,
          isCompleted: false,
          downloadUrl: undefined
        },
        selection: {
          selectedImages: [],
          isSelectionMode: false
        }
      }));

      console.log('✅ Slideshow loaded successfully into context');
      return true;

    } catch (error) {
      console.error('❌ Failed to load slideshow from API:', error);
      setState(prev => ({
        ...prev,
        preview: {
          ...prev.preview,
          error: error instanceof Error ? error.message : 'Failed to load slideshow'
        }
      }));
      return false;
    }
  }, []);

  // Selection Management
  const toggleSelectionMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      selection: {
        selectedImages: [],
        isSelectionMode: !prev.selection.isSelectionMode
      }
    }));
  }, []);

  const toggleImageSelection = useCallback((imageId: string) => {
    setState(prev => {
      const currentSelected = prev.selection.selectedImages;
      const isSelected = currentSelected.includes(imageId);
      
      const newSelected = isSelected 
        ? currentSelected.filter(id => id !== imageId)
        : [...currentSelected, imageId]; // Mantiene orden de selección
      
      return {
        ...prev,
        selection: {
          ...prev.selection,
          selectedImages: newSelected
        }
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedImages: []
      }
    }));
  }, []);

  const addSelectedToTimeline = useCallback(() => {
    const selectedImages = state.selection.selectedImages;
    selectedImages.forEach(imageId => {
      addToTimeline(imageId);
    });
    clearSelection();
  }, [state.selection.selectedImages, addToTimeline, clearSelection]);

  // Remove image from project
  const removeImage = useCallback((imageId: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        images: prev.project.images.filter(img => img.id !== imageId),
        timeline: prev.project.timeline.filter(item => item.imageId !== imageId)
      },
      preview: { ...prev.preview, url: null }
    }));
  }, []);

  return {
    // State
    project: state.project,
    preview: state.preview,
    export: state.export,
    isUploading: state.isUploading,
    dragActive: state.dragActive,
    selection: state.selection,

    // Computed
    hasImages: state.project.images.length > 0,
    hasTimeline: state.project.timeline.length > 0,

    // Image Management Actions
    uploadImages,
    removeImage,
    
    // Timeline Management Actions
    addToTimeline,
    updateTimelineItem,
    removeFromTimeline,
    reorderTimeline,
    
    // Preview Actions
    generatePreview: previewGeneration.generatePreview,
    clearPreview: previewGeneration.clearPreview,
    
    // Export Actions
    exportSlideshow: exportManagement.exportSlideshow,
    updateExportSettings: exportManagement.updateExportSettings,
    updateExportState,
    
    // General Actions
    setDragActive,
    clearProject,
    loadSlideshowFromAPI,
    
    // Selection Actions
    toggleSelectionMode,
    toggleImageSelection,
    clearSelection,
    addSelectedToTimeline
  };
};
