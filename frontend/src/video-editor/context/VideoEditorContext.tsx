import React, { createContext, useContext, ReactNode } from 'react';
import { useVideoEditor } from '../hooks/useVideoEditor';
import { VideoSegment, VideoSegmentUpdate } from '../types/video-editor.types';

// Create context with the same interface as the hook + video controls
interface VideoEditorContextType {
  project: ReturnType<typeof useVideoEditor>['project'];
  isUploading: boolean;
  error: string | null;
  hasVideo: boolean;
  uploadVideo: (file: File) => Promise<void>;
  addSegment: (startTime: number, endTime: number) => VideoSegment | null;
  updateSegment: (segmentId: string, updates: VideoSegmentUpdate) => void;
  removeSegment: (segmentId: string) => void;
  trimVideo: (startTime: number, endTime: number) => VideoSegment | null;
  clearProject: () => void;
  generateThumbnails: (videoElement: HTMLVideoElement, count?: number) => Promise<string[]>;
  // Video playback controls
  videoRef: React.RefObject<HTMLVideoElement> | null;
  videoElement: HTMLVideoElement | null; // Direct access to video element
  currentTime: number;
  videoDuration: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  togglePlayback: () => void;
  setVideoRef: (ref: React.RefObject<HTMLVideoElement>) => void;
  // Frame navigation
  stepBackward: () => void;
  stepForward: () => void;
  jumpBackward: () => void;
  jumpForward: () => void;
  seekTo: (time: number) => void;
}

const VideoEditorContext = createContext<VideoEditorContextType | null>(null);

interface VideoEditorProviderProps {
  children: ReactNode;
}

export const VideoEditorProvider: React.FC<VideoEditorProviderProps> = ({ children }) => {
  const videoEditorState = useVideoEditor();
  const [videoRef, setVideoRefState] = React.useState<React.RefObject<HTMLVideoElement> | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const setVideoRef = React.useCallback((ref: React.RefObject<HTMLVideoElement>) => {
    setVideoRefState(ref);
  }, []);

  const togglePlayback = React.useCallback(() => {
    if (videoRef?.current) {
      if (isPlaying) {
        console.log('⏸️ Pausing video');
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('▶️ Playing video');
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      console.log('❌ No video ref available for playback');
    }
  }, [videoRef, isPlaying]);

  const setTimeAndSync = React.useCallback((time: number) => {
    // Only log significant time changes to reduce noise
    if (Math.abs(currentTime - time) > 1) {
      console.log(`🕐 Setting time to: ${time.toFixed(3)}s`);
    }
    setCurrentTime(time);
    if (videoRef?.current && Math.abs(videoRef.current.currentTime - time) > 0.1) {
      videoRef.current.currentTime = time;
    }
  }, [videoRef, currentTime]);

  // Frame navigation functions
  const stepBackward = React.useCallback(() => {
    if (videoRef?.current && videoEditorState.hasVideo) {
      const fps = videoEditorState.project.video?.fps || 30;
      const frameTime = 1 / fps;
      const newTime = Math.max(0, currentTime - frameTime);
      
      console.log(`⬅️ Step backward: ${currentTime.toFixed(3)}s → ${newTime.toFixed(3)}s (${frameTime.toFixed(3)}s frame)`);
      setTimeAndSync(newTime);
    }
  }, [videoRef, videoEditorState.hasVideo, videoEditorState.project.video?.fps, currentTime, setTimeAndSync]);

  const stepForward = React.useCallback(() => {
    if (videoRef?.current && videoEditorState.hasVideo) {
      const fps = videoEditorState.project.video?.fps || 30;
      const frameTime = 1 / fps;
      const duration = videoEditorState.project.video?.duration || 0;
      const newTime = Math.min(duration, currentTime + frameTime);
      
      console.log(`➡️ Step forward: ${currentTime.toFixed(3)}s → ${newTime.toFixed(3)}s (${frameTime.toFixed(3)}s frame)`);
      setTimeAndSync(newTime);
    }
  }, [videoRef, videoEditorState.hasVideo, videoEditorState.project.video?.fps, videoEditorState.project.video?.duration, currentTime, setTimeAndSync]);

  const jumpBackward = React.useCallback(() => {
    if (videoRef?.current && videoEditorState.hasVideo) {
      const newTime = Math.max(0, currentTime - 5); // 5 seconds back
      setTimeAndSync(newTime);
    }
  }, [videoRef, videoEditorState.hasVideo, currentTime, setTimeAndSync]);

  const jumpForward = React.useCallback(() => {
    if (videoRef?.current && videoEditorState.hasVideo) {
      const duration = videoEditorState.project.video?.duration || 0;
      const newTime = Math.min(duration, currentTime + 5); // 5 seconds forward
      setTimeAndSync(newTime);
    }
  }, [videoRef, videoEditorState.hasVideo, videoEditorState.project.video?.duration, currentTime, setTimeAndSync]);

  const seekTo = React.useCallback((time: number) => {
    if (videoRef?.current && videoEditorState.hasVideo) {
      const duration = videoEditorState.project.video?.duration || 0;
      const clampedTime = Math.max(0, Math.min(time, duration));
      setTimeAndSync(clampedTime);
    }
  }, [videoRef, videoEditorState.hasVideo, videoEditorState.project.video?.duration, setTimeAndSync]);

  // Listen to video time updates
  React.useEffect(() => {
    if (videoRef?.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        // Only update if there's a significant difference to avoid loops
        if (Math.abs(currentTime - video.currentTime) > 0.05) {
          setCurrentTime(video.currentTime);
        }
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
  }, [videoRef, currentTime]);

  const contextValue = React.useMemo(() => ({
    ...videoEditorState,
    videoRef,
    videoElement: videoRef?.current || null,
    currentTime,
    videoDuration: videoEditorState.hasVideo ? videoEditorState.project.video!.duration : 0,
    isPlaying,
    setCurrentTime: setTimeAndSync,
    togglePlayback,
    setVideoRef,
    stepBackward,
    stepForward,
    jumpBackward,
    jumpForward,
    seekTo
  }), [videoEditorState, videoRef, currentTime, isPlaying, setTimeAndSync, togglePlayback, setVideoRef, stepBackward, stepForward, jumpBackward, jumpForward, seekTo]);

  return (
    <VideoEditorContext.Provider value={contextValue}>
      {children}
    </VideoEditorContext.Provider>
  );
};

export const useVideoEditorContext = (): VideoEditorContextType => {
  const context = useContext(VideoEditorContext);
  if (!context) {
    throw new Error('useVideoEditorContext must be used within a VideoEditorProvider');
  }
  return context;
};
