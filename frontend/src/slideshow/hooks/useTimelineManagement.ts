import { useState, useCallback } from 'react';
import { TimelineItem, ImageFile } from '../types/slideshow.types';

export const useTimelineManagement = () => {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  const addToTimeline = useCallback((imageId: string, duration: number = 1000) => {
    const newItem: TimelineItem = {
      id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageId,
      duration,
      position: timeline.length, // Position at end
      transition: undefined // No transition by default
    };

    setTimeline(prev => [...prev, newItem]);
  }, []);

  const updateTimelineItem = useCallback((itemId: string, updates: Partial<TimelineItem>) => {
    setTimeline(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  }, []);

  const removeFromTimeline = useCallback((itemId: string) => {
    setTimeline(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const reorderTimeline = useCallback((newTimeline: TimelineItem[]) => {
    setTimeline(newTimeline);
  }, []);

  const clearTimeline = useCallback(() => {
    setTimeline([]);
  }, []);

  // Helper function to get timeline data with image information
  const getTimelineWithImages = useCallback((images: ImageFile[]) => {
    return timeline.map(item => {
      const image = images.find(img => img.id === item.imageId);
      return {
        ...item,
        image
      };
    }).filter(item => item.image); // Only include items with valid images
  }, [timeline]);

  // Helper function to generate timeline payload for API calls
  const getTimelinePayload = useCallback((images: ImageFile[]) => {
    const timelineData = getTimelineWithImages(images);
    
    return {
      images: timelineData.map(item => {
        const filename = item.image?.uploadedInfo?.filename || item.image?.name;
        console.log(`🔍 Timeline item ${item.id} → image ${item.image?.id} → filename: ${filename}`);
        return { filename };
      }),
      transitions: timeline.slice(0, -1).map(item => ({
        type: item.transition?.type || 'cut',
        duration: item.transition?.duration || 0
      })),
      frameDurations: timeline.map(item => item.duration)
    };
  }, [timeline, getTimelineWithImages]);

  return {
    // State
    timeline,
    
    // Computed
    hasTimeline: timeline.length > 0,
    timelineLength: timeline.length,
    
    // Actions
    addToTimeline,
    updateTimelineItem,
    removeFromTimeline,
    reorderTimeline,
    clearTimeline,
    
    // Helpers
    getTimelineWithImages,
    getTimelinePayload
  };
};
