import { useState, useCallback, useRef } from 'react';

/**
 * Hook specialized in video playback control
 */
export const useVideoPlayback = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Set video element reference
  const setVideoElement = useCallback((element: HTMLVideoElement | null) => {
    videoElementRef.current = element;
    if (element) {
      setDuration(element.duration || 0);
    }
  }, []);

  // Play/pause toggle
  const togglePlayback = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Set current time
  const seekTo = useCallback((time: number) => {
    const video = videoElementRef.current;
    if (!video) return;

    const clampedTime = Math.max(0, Math.min(time, video.duration || 0));
    video.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, []);

  // Step backward (1 second)
  const stepBackward = useCallback(() => {
    seekTo(currentTime - 1);
  }, [currentTime, seekTo]);

  // Step forward (1 second)
  const stepForward = useCallback(() => {
    seekTo(currentTime + 1);
  }, [currentTime, seekTo]);

  // Jump backward (10 seconds)
  const jumpBackward = useCallback(() => {
    seekTo(currentTime - 10);
  }, [currentTime, seekTo]);

  // Jump forward (10 seconds)
  const jumpForward = useCallback(() => {
    seekTo(currentTime + 10);
  }, [currentTime, seekTo]);

  // Update current time (called by video element timeupdate event)
  const updateCurrentTime = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Handle video loaded
  const handleVideoLoaded = useCallback((videoDuration: number) => {
    setDuration(videoDuration);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  return {
    // State
    currentTime,
    isPlaying,
    duration,
    videoElement: videoElementRef.current,

    // Actions
    setVideoElement,
    togglePlayback,
    seekTo,
    stepBackward,
    stepForward,
    jumpBackward,
    jumpForward,
    updateCurrentTime,
    handleVideoEnded,
    handleVideoLoaded
  };
};
