import { useState, useCallback } from 'react';
import { VideoSegment } from '../types/video-editor.types';

/**
 * Hook specialized in video segments/timeline management
 */
export const useVideoSegments = () => {
  const [segments, setSegments] = useState<VideoSegment[]>([]);

  // Add a new segment
  const addSegment = useCallback((startTime: number, endTime: number, videoId: string) => {
    const newSegment: VideoSegment = {
      id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Math.max(0, startTime),
      endTime: Math.max(startTime + 0.1, endTime), // Ensure minimum duration
      videoId,
      createdAt: new Date()
    };

    setSegments(prev => [...prev, newSegment]);
    return newSegment;
  }, []);

  // Update an existing segment
  const updateSegment = useCallback((segmentId: string, updates: Partial<VideoSegment>) => {
    setSegments(prev => 
      prev.map(segment => 
        segment.id === segmentId 
          ? { 
              ...segment, 
              ...updates,
              // Ensure valid time ranges
              startTime: Math.max(0, updates.startTime ?? segment.startTime),
              endTime: Math.max(
                (updates.startTime ?? segment.startTime) + 0.1, 
                updates.endTime ?? segment.endTime
              )
            }
          : segment
      )
    );
  }, []);

  // Remove a segment
  const removeSegment = useCallback((segmentId: string) => {
    setSegments(prev => prev.filter(segment => segment.id !== segmentId));
  }, []);

  // Clear all segments
  const clearSegments = useCallback(() => {
    setSegments([]);
  }, []);

  // Get total duration of all segments
  const getTotalDuration = useCallback(() => {
    return segments.reduce((total, segment) => 
      total + (segment.endTime - segment.startTime), 0
    );
  }, [segments]);

  // Trim video by creating a single segment
  const trimVideo = useCallback((startTime: number, endTime: number, videoId: string) => {
    // Clear existing segments and create a single trim segment
    const trimSegment: VideoSegment = {
      id: `trim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Math.max(0, startTime),
      endTime: Math.max(startTime + 0.1, endTime),
      videoId,
      createdAt: new Date()
    };

    setSegments([trimSegment]);
    return trimSegment;
  }, []);

  // Reorder segments
  const reorderSegments = useCallback((newSegments: VideoSegment[]) => {
    setSegments(newSegments);
  }, []);

  // Get segments sorted by start time
  const getSortedSegments = useCallback(() => {
    return [...segments].sort((a, b) => a.startTime - b.startTime);
  }, [segments]);

  return {
    // State
    segments,
    
    // Computed
    totalDuration: getTotalDuration(),
    sortedSegments: getSortedSegments(),
    
    // Actions
    addSegment,
    updateSegment,
    removeSegment,
    clearSegments,
    trimVideo,
    reorderSegments,
    getTotalDuration,
    getSortedSegments
  };
};
