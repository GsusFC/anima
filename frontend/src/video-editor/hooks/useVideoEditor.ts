import { useState, useCallback } from 'react';
import { LegacyVideoProject, VideoSegmentUpdate } from '../types/video-editor.types';
import { useVideoManagement } from './useVideoManagement';
import { useVideoPlayback } from './useVideoPlayback';
import { useVideoSegments } from './useVideoSegments';

/**
 * Main Video Editor Hook - Composition Pattern
 * Composes specialized hooks for clean separation of concerns
 */
export const useVideoEditor = () => {
  // Project state
  const [project, setProject] = useState<LegacyVideoProject>({
    id: `video_project_${Date.now()}`,
    video: null,
    segments: [],
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });

  // Error state
  const [error] = useState<string | null>(null);

  // Specialized hooks
  const videoManagement = useVideoManagement(project.sessionId || '', setProject);
  const playback = useVideoPlayback();
  const segments = useVideoSegments();

  // Computed properties
  const hasVideo = project.video !== null;

  // Video management actions
  const uploadVideoInternal = useCallback(async (file: File) => {
    const videoFile = await videoManagement.uploadVideo(file);
    if (videoFile) {
      setProject(prev => ({
        ...prev,
        video: videoFile,
        segments: [] // Clear segments when new video is uploaded
      }));
      segments.clearSegments();
      
      // Set video element for playback control
      if (playback.videoElement) {
        playback.handleVideoLoaded(videoFile.duration);
      }
    }
    return videoFile;
  }, [videoManagement, segments, playback]);

  // Wrapper for context compatibility
  const uploadVideo = useCallback(async (file: File): Promise<void> => {
    await uploadVideoInternal(file);
  }, [uploadVideoInternal]);

  // Segment management actions (wrapped to update project state)
  const addSegment = useCallback((startTime: number, endTime: number) => {
    // Use functional access to latest project state to avoid stale closures
    setProject(prev => {
      if (!prev.video) return prev; // no video loaded

      segments.addSegment(startTime, endTime, prev.video.id);
      // Return updated project with fresh segments list
      return { ...prev, segments: [...segments.segments] };
    });
    // Return last added segment (caller may ignore if undefined)
    return segments.segments[segments.segments.length - 1] || null;
  }, [segments]);

  const updateSegment = useCallback((segmentId: string, updates: VideoSegmentUpdate) => {
    segments.updateSegment(segmentId, updates);
    setProject(prev => ({ ...prev, segments: [...segments.segments] }));
  }, [segments]);

  const removeSegment = useCallback((segmentId: string) => {
    segments.removeSegment(segmentId);
    setProject(prev => ({ ...prev, segments: [...segments.segments] }));
  }, [segments]);

  const trimVideo = useCallback((startTime: number, endTime: number) => {
    let newSegment: ReturnType<typeof segments.trimVideo> | null = null;
    setProject(prev => {
      if (!prev.video) return prev;
      newSegment = segments.trimVideo(startTime, endTime, prev.video.id);
      return { ...prev, segments: [newSegment] };
    });
    return newSegment;
  }, [segments]);

  // Clear project
  const clearProject = useCallback(() => {
    setProject({
      id: `video_project_${Date.now()}`,
      video: null,
      segments: [],
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    segments.clearSegments();
    playback.handleVideoEnded();
  }, [segments, playback]);

  return {
    // Project state
    project: {
      ...project,
      segments: segments.segments // Always use current segments
    },
    
    // Computed properties
    hasVideo,
    error,
    
    // Video management
    uploadVideo,
    isUploading: videoManagement.isUploading,
    
    // Playback control
    currentTime: playback.currentTime,
    isPlaying: playback.isPlaying,
    duration: playback.duration,
    videoElement: playback.videoElement,
    setVideoElement: playback.setVideoElement,
    togglePlayback: playback.togglePlayback,
    seekTo: playback.seekTo,
    stepBackward: playback.stepBackward,
    stepForward: playback.stepForward,
    jumpBackward: playback.jumpBackward,
    jumpForward: playback.jumpForward,
    updateCurrentTime: playback.updateCurrentTime,
    handleVideoEnded: playback.handleVideoEnded,
    handleVideoLoaded: playback.handleVideoLoaded,
    
    // Segment management
    segments: segments.segments,
    totalDuration: segments.totalDuration,
    addSegment,
    updateSegment,
    removeSegment,
    trimVideo,
    clearSegments: segments.clearSegments,
    
    // Project management
    clearProject,
    
    // Utils
    generateThumbnails: videoManagement.generateThumbnails
  };
};
