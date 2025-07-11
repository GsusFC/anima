import React, { createContext, useContext, ReactNode } from 'react';
import { useSlideshow } from '../hooks/useSlideshow';

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
  updateTimelineItem: (itemId: string, updates: any) => void;
  removeFromTimeline: (itemId: string) => void;
  reorderTimeline: (newTimeline: any[]) => void;
  generatePreview: () => Promise<void>;
  exportSlideshow: () => Promise<void>;
  updateExportSettings: (updates: any) => void;
  updateExportState: (updates: any) => void;
  setDragActive: (active: boolean) => void;
  clearProject: () => void;
  
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
