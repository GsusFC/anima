import React, { createContext, useContext, ReactNode } from 'react';
import { useSlideshow } from '../hooks/useSlideshow';
import { TimelineItem, ExportSettings, ExportState } from '../types/slideshow.types';

// Specific update interfaces to replace 'any'
export interface TimelineItemUpdate {
  duration?: number;
  transition?: {
    type: string;
    duration: number;
    easing: string;
  };
  position?: number;
}

export interface ExportSettingsUpdate {
  format?: string;
  quality?: string;
  fps?: number;
  resolution?: {
    width: number;
    height: number;
    preset: string;
  };
  gif?: {
    dither?: boolean | string;
    colors?: number;
    loop?: boolean | string;
  };
}

export interface ExportStateUpdate {
  isExporting?: boolean;
  progress?: number;
  error?: string | null;
  isCompleted?: boolean;
  downloadUrl?: string;
}

// Create context with the same interface as the hook
interface SlideshowContextType {
  // State
  project: ReturnType<typeof useSlideshow>['project'];
  preview: ReturnType<typeof useSlideshow>['preview'];
  export: ReturnType<typeof useSlideshow>['export'];
  isUploading: boolean;
  dragActive: boolean;
  selection: ReturnType<typeof useSlideshow>['selection'];
  
  // Computed
  hasImages: boolean;
  hasTimeline: boolean;
  
  // Actions
  uploadImages: (files: File[]) => Promise<void>;
  addToTimeline: (imageId: string, duration?: number) => void;
  removeImage: (imageId: string) => void;
  updateTimelineItem: (itemId: string, updates: TimelineItemUpdate) => void;
  removeFromTimeline: (itemId: string) => void;
  reorderTimeline: (newTimeline: TimelineItem[]) => void;
  generatePreview: () => Promise<void>;
  exportSlideshow: () => Promise<void>;
  updateExportSettings: (updates: ExportSettingsUpdate) => void;
  updateExportState: (updates: ExportStateUpdate) => void;
  setDragActive: (active: boolean) => void;
  clearProject: () => void;
  loadSlideshowFromAPI: (slideshowId: string) => Promise<boolean>;
  loadImagesFromSession: (sessionId: string) => Promise<boolean>;
  
  // Selection Actions
  toggleSelectionMode: () => void;
  toggleImageSelection: (imageId: string) => void;
  clearSelection: () => void;
  addSelectedToTimeline: () => void;
}

const SlideshowContext = createContext<SlideshowContextType | null>(null);

interface SlideshowProviderProps {
  children: ReactNode;
}

export const SlideshowProvider: React.FC<SlideshowProviderProps> = ({ children }) => {
  const slideshowState = useSlideshow();

  const contextValue = React.useMemo(() => ({
    ...slideshowState
  }), [slideshowState]);

  return (
    <SlideshowContext.Provider value={contextValue}>
      {children}
    </SlideshowContext.Provider>
  );
};

export const useSlideshowContext = (): SlideshowContextType => {
  const context = useContext(SlideshowContext);
  if (!context) {
    throw new Error('useSlideshowContext must be used within a SlideshowProvider');
  }
  return context;
};
