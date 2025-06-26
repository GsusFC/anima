import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface MediaItem {
  id: string;
  file: File;
  filename: string;
  originalName: string;
  path: string;
  name: string;
  type: string;
  size: number;
  duration: number;
  transition: TransitionType;
}

export interface TimelineFrame {
  id: string;
  mediaId: string;
  duration: number;
  transition: {
    type: TransitionType;
    duration: number;
  };
}

export type TransitionType = 
  | 'none' 
  | 'fade' 
  | 'crossfade' 
  | 'dissolve' 
  | 'slide_left' 
  | 'slide_right' 
  | 'slide_up' 
  | 'slide_down' 
  | 'zoom_in' 
  | 'zoom_out' 
  | 'rotate_left' 
  | 'rotate_right';

interface MediaContextType {
  mediaItems: MediaItem[];
  timelineFrames: TimelineFrame[];
  sessionId: string | null;
  setSessionId: (sessionId: string) => void;
  addMedia: (media: MediaItem) => void;
  removeMedia: (id: string) => void;
  addToTimeline: (mediaId: string) => void;
  removeFromTimeline: (frameId: string) => void;
  updateFrame: (frameId: string, updates: Partial<TimelineFrame>) => void;
  reorderTimeline: (fromIndex: number, toIndex: number) => void;
  clearTimeline: () => void;
  clearAll: () => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};

interface MediaProviderProps {
  children: ReactNode;
}

export const MediaProvider: React.FC<MediaProviderProps> = ({ children }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [timelineFrames, setTimelineFrames] = useState<TimelineFrame[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const addMedia = useCallback((media: MediaItem) => {
    setMediaItems(prev => [...prev, media]);
  }, []);

  const removeMedia = useCallback((id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
    // Also remove from timeline if present
    setTimelineFrames(prev => prev.filter(frame => frame.mediaId !== id));
  }, []);

  const addToTimeline = useCallback((mediaId: string) => {
    const mediaItem = mediaItems.find(item => item.id === mediaId);
    if (!mediaItem) return;

    const newFrame: TimelineFrame = {
      id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mediaId,
      duration: mediaItem.duration * 1000, // Convert to milliseconds
      transition: {
        type: 'none',
        duration: 500
      }
    };

    setTimelineFrames(prev => [...prev, newFrame]);
  }, [mediaItems]);

  const removeFromTimeline = useCallback((frameId: string) => {
    setTimelineFrames(prev => prev.filter(frame => frame.id !== frameId));
  }, []);

  const updateFrame = useCallback((frameId: string, updates: Partial<TimelineFrame>) => {
    setTimelineFrames(prev => 
      prev.map(frame => 
        frame.id === frameId ? { ...frame, ...updates } : frame
      )
    );
  }, []);

  const reorderTimeline = useCallback((fromIndex: number, toIndex: number) => {
    setTimelineFrames(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const clearTimeline = useCallback(() => {
    setTimelineFrames([]);
  }, []);

  const clearAll = useCallback(() => {
    setMediaItems([]);
    setTimelineFrames([]);
    setSessionId(null);
  }, []);

  const contextValue: MediaContextType = {
    mediaItems,
    timelineFrames,
    sessionId,
    setSessionId,
    addMedia,
    removeMedia,
    addToTimeline,
    removeFromTimeline,
    updateFrame,
    reorderTimeline,
    clearTimeline,
    clearAll
  };

  return (
    <MediaContext.Provider value={contextValue}>
      {children}
    </MediaContext.Provider>
  );
}; 