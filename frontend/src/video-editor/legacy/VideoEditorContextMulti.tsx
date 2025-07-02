import React, { createContext, useContext, ReactNode } from 'react';
import { useVideoEditorMulti } from '../hooks/useVideoEditorMulti';
import { 
  VideoFile, 
  VideoProject, 
  VideoTimelineItem,
  VideoExportSettings
} from '../types/video-editor.types';

// Create context with the multi-video interface
interface VideoEditorContextType {
  // Project state
  project: VideoProject;
  isUploading: boolean;
  error: string | null;
  hasVideos: boolean;
  hasSequence: boolean;
  
  // Video Library Management
  addVideoToLibrary: (file: File) => Promise<void>;
  removeVideoFromLibrary: (videoId: string) => void;
  selectVideo: (videoId: string | null) => void;
  
  // Timeline/Sequence Management
  addVideoToSequence: (videoId: string, position?: number) => void;
  removeItemFromSequence: (itemId: string) => void;
  moveSequenceItem: (itemId: string, newPosition: number) => void;
  updateVideoItem: (itemId: string, updates: Partial<VideoTimelineItem>) => void;
  
  // Export
  setExportSettings: (settings: VideoExportSettings) => void;
  
  // Utilities
  getSequenceDuration: () => number;
  getVideoById: (videoId: string) => VideoFile | null;
  clearProject: () => void;
  
  // Video playback controls
  videoRef: React.RefObject<HTMLVideoElement> | null;
  currentTime: number;
  isPlaying: boolean;
  timelineZoom: number;
  setCurrentTime: (time: number) => void;
  setTimelineZoom: (zoom: number) => void;
  togglePlayback: () => void;
  setVideoRef: (ref: React.RefObject<HTMLVideoElement>) => void;
  
  // Frame navigation
  stepBackward: () => void;
  stepForward: () => void;
  jumpBackward: () => void;
  jumpForward: () => void;
}

const VideoEditorContext = createContext<VideoEditorContextType | null>(null);

interface VideoEditorProviderProps {
  children: ReactNode;
}

export const VideoEditorProvider: React.FC<VideoEditorProviderProps> = ({ children }) => {
  const videoEditorState = useVideoEditorMulti();
  const [videoRef, setVideoRefState] = React.useState<React.RefObject<HTMLVideoElement> | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [timelineZoom, setTimelineZoomState] = React.useState(1);

  const setVideoRef = React.useCallback((ref: React.RefObject<HTMLVideoElement>) => {
    setVideoRefState(ref);
  }, []);

  const setTimelineZoom = React.useCallback((zoom: number) => {
    setTimelineZoomState(Math.max(0.1, Math.min(5, zoom))); // Clamp between 0.1x and 5x
  }, []);

  const togglePlayback = React.useCallback(() => {
    if (videoRef?.current) {
      if (isPlaying) {
        console.log('⏸️ Pausing sequence');
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('▶️ Playing sequence');
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      console.log('❌ No video ref available for playback');
    }
  }, [videoRef, isPlaying]);

  const setTimeAndSync = React.useCallback((time: number) => {
    const maxTime = videoEditorState.getSequenceDuration();
    const clampedTime = Math.max(0, Math.min(maxTime, time));
    
    console.log(`🕐 Setting time to: ${clampedTime.toFixed(3)}s (sequence duration: ${maxTime.toFixed(3)}s)`);
    setCurrentTime(clampedTime);
    if (videoRef?.current) {
      videoRef.current.currentTime = clampedTime;
    }
  }, [videoRef, videoEditorState]);

  // Frame navigation functions
  const stepBackward = React.useCallback(() => {
    if (videoRef?.current && videoEditorState.hasSequence) {
      // Use 30fps as default for frame stepping
      const frameTime = 1 / 30;
      const newTime = Math.max(0, currentTime - frameTime);
      
      console.log(`⬅️ Step backward: ${currentTime.toFixed(3)}s → ${newTime.toFixed(3)}s (${frameTime.toFixed(3)}s frame)`);
      setTimeAndSync(newTime);
    }
  }, [videoRef, videoEditorState.hasSequence, currentTime, setTimeAndSync]);

  const stepForward = React.useCallback(() => {
    if (videoRef?.current && videoEditorState.hasSequence) {
      const frameTime = 1 / 30;
      const duration = videoEditorState.getSequenceDuration();
      const newTime = Math.min(duration, currentTime + frameTime);
      
      console.log(`➡️ Step forward: ${currentTime.toFixed(3)}s → ${newTime.toFixed(3)}s (${frameTime.toFixed(3)}s frame)`);
      setTimeAndSync(newTime);
    }
  }, [videoRef, videoEditorState.hasSequence, videoEditorState, currentTime, setTimeAndSync]);

  const jumpBackward = React.useCallback(() => {
    if (videoRef?.current && videoEditorState.hasSequence) {
      const newTime = Math.max(0, currentTime - 5); // 5 seconds back
      setTimeAndSync(newTime);
    }
  }, [videoRef, videoEditorState.hasSequence, currentTime, setTimeAndSync]);

  const jumpForward = React.useCallback(() => {
    if (videoRef?.current && videoEditorState.hasSequence) {
      const duration = videoEditorState.getSequenceDuration();
      const newTime = Math.min(duration, currentTime + 5); // 5 seconds forward
      setTimeAndSync(newTime);
    }
  }, [videoRef, videoEditorState.hasSequence, videoEditorState, currentTime, setTimeAndSync]);

  // Listen to video time updates
  React.useEffect(() => {
    if (videoRef?.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };
      
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);
      
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [videoRef]);

  const contextValue: VideoEditorContextType = {
    ...videoEditorState,
    videoRef,
    currentTime,
    isPlaying,
    timelineZoom,
    setCurrentTime: setTimeAndSync,
    setTimelineZoom,
    togglePlayback,
    setVideoRef,
    stepBackward,
    stepForward,
    jumpBackward,
    jumpForward
  };

  return (
    <VideoEditorContext.Provider value={contextValue}>
      {children}
    </VideoEditorContext.Provider>
  );
};

export const useVideoEditor = (): VideoEditorContextType => {
  const context = useContext(VideoEditorContext);
  if (!context) {
    throw new Error('useVideoEditor must be used within a VideoEditorProvider');
  }
  return context;
};

// Keep the old export name for compatibility
export const useVideoEditorContext = useVideoEditor;
