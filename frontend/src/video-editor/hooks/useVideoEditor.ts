import { useState, useCallback } from 'react';
import {
  VideoProject,
  VideoSegmentUpdate,
  VideoExportSettings
} from '../types/video-editor.types';
import { useVideoManagement } from './useVideoManagement';
import { useVideoPlayback } from './useVideoPlayback';
import { useVideoSegments } from './useVideoSegments';

/**
 * Main Video Editor Hook - Composition Pattern
 * Composes specialized hooks for clean separation of concerns
 */
export const useVideoEditor = () => {
  // Project state
  const createEmptyProject = (): VideoProject => {
    const timestamp = Date.now();

    // Minimal viable export settings to satisfy type requirements
    const defaultExportSettings: VideoExportSettings = {
      format: 'mp4',
      quality: 'standard',
      fps: 30,
      resolution: {
        width: 1920,
        height: 1080,
        preset: 'original'
      }
    };

    return {
      id: `video_project_${timestamp}`,
      name: 'Untitled Video Project',
      // BaseProject requirements
      timeline: [],
      exportSettings: defaultExportSettings,
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
      // Video-editor specific
      library: {
        videos: [],
        selectedVideoId: null
      },
      sequence: {
        items: [],
        totalDuration: 0
      },
      video: null,
      segments: [],
      effects: [],
      sessionId: `session_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
    };
  };

  const [project, setProject] = useState<VideoProject>(createEmptyProject());

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
    // Reset to a fully-formed, type-safe initial project
    setProject(() => createEmptyProject());
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
