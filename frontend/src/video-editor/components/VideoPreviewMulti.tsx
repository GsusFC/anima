import React, { useRef, useEffect, useState } from 'react';
import { useVideoEditor } from '../context/VideoEditorContextMulti';
import { VideoTimelineItem } from '../types/video-editor.types';

interface VideoPreviewMultiProps {}

export const VideoPreviewMulti: React.FC<VideoPreviewMultiProps> = () => {
  const { 
    project, 
    currentTime, 
    setVideoRef, 
    setCurrentTime,
    togglePlayback,
    getVideoById,
    getSequenceDuration
  } = useVideoEditor();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentVideoItem, setCurrentVideoItem] = useState<VideoTimelineItem | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Set video ref in context when component mounts
  useEffect(() => {
    if (videoRef) {
      setVideoRef(videoRef);
    }
  }, [setVideoRef]);

  // Find which video should be playing at current time
  useEffect(() => {
    const findCurrentVideoItem = (): VideoTimelineItem | null => {
      for (const item of project.sequence.items) {
        if (item.type === 'video') {
          const videoItem = item as VideoTimelineItem;
          const itemStart = videoItem.position;
          const itemEnd = videoItem.position + videoItem.duration;
          
          if (currentTime >= itemStart && currentTime < itemEnd) {
            return videoItem;
          }
        }
      }
      return null;
    };

    const newVideoItem = findCurrentVideoItem();
    
    if (newVideoItem?.id !== currentVideoItem?.id) {
      setCurrentVideoItem(newVideoItem);
      setVideoError(null);
    }
  }, [currentTime, project.sequence.items, currentVideoItem?.id]);

  // Update video source when current video item changes
  useEffect(() => {
    if (!videoRef.current || !currentVideoItem) return;

    const video = getVideoById(currentVideoItem.videoId);
    if (!video) return;

    const videoUrl = URL.createObjectURL(video.file);
    
    const handleLoadedData = () => {
      if (!videoRef.current || !currentVideoItem) return;
      
      // Calculate the time within this specific video
      const relativeTime = currentTime - currentVideoItem.position;
      const adjustedTime = currentVideoItem.startTime + (relativeTime / currentVideoItem.speed);
      
      videoRef.current.currentTime = Math.max(0, Math.min(adjustedTime, currentVideoItem.endTime));
      setVideoError(null);
    };

    const handleError = () => {
      setVideoError(`Failed to load video: ${video.name}`);
    };

    videoRef.current.src = videoUrl;
    videoRef.current.addEventListener('loadeddata', handleLoadedData);
    videoRef.current.addEventListener('error', handleError);

    return () => {
      URL.revokeObjectURL(videoUrl);
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', handleLoadedData);
        videoRef.current.removeEventListener('error', handleError);
      }
    };
  }, [currentVideoItem, getVideoById]);

  // Sync video time with timeline
  useEffect(() => {
    if (!videoRef.current || !currentVideoItem) return;

    const relativeTime = currentTime - currentVideoItem.position;
    const adjustedTime = currentVideoItem.startTime + (relativeTime / currentVideoItem.speed);
    const clampedTime = Math.max(currentVideoItem.startTime, Math.min(adjustedTime, currentVideoItem.endTime));

    if (Math.abs(videoRef.current.currentTime - clampedTime) > 0.1) {
      videoRef.current.currentTime = clampedTime;
    }

    // Set playback rate
    videoRef.current.playbackRate = currentVideoItem.speed;
  }, [currentTime, currentVideoItem]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing in inputs
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            // Jump backward 5 seconds
            setCurrentTime(Math.max(0, currentTime - 5));
          } else {
            // Step backward one frame (1/30 second)
            setCurrentTime(Math.max(0, currentTime - (1/30)));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            // Jump forward 5 seconds
            setCurrentTime(Math.min(getSequenceDuration(), currentTime + 5));
          } else {
            // Step forward one frame
            setCurrentTime(Math.min(getSequenceDuration(), currentTime + (1/30)));
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, setCurrentTime, currentTime, getSequenceDuration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sequenceDuration = getSequenceDuration();

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {project.sequence.items.length === 0 ? (
          <div className="text-center">
            <div className="text-gray-500 mb-4">
              <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">No Video Sequence</h3>
            <p className="text-gray-500">
              Add videos from the library to create a sequence
            </p>
          </div>
        ) : !currentVideoItem ? (
          <div className="text-center">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400">No video at current time</p>
            <p className="text-sm text-gray-500">Sequence duration: {formatTime(sequenceDuration)}</p>
          </div>
        ) : (
          <>
            {videoError ? (
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-400">{videoError}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                className="max-w-full max-h-full"
                muted
                playsInline
              />
            )}
          </>
        )}

        {/* Playback Controls Overlay */}
        {currentVideoItem && !videoError && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 rounded-lg p-3">
              <div className="flex items-center justify-between text-white text-sm">
                <div>
                  {getVideoById(currentVideoItem.videoId)?.name}
                </div>
                <div className="flex items-center space-x-4">
                  {currentVideoItem.speed !== 1 && (
                    <span className="bg-blue-600 px-2 py-1 rounded text-xs">
                      {currentVideoItem.speed}x
                    </span>
                  )}
                  <span className="font-mono">
                    {formatTime(currentTime)} / {formatTime(sequenceDuration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center justify-center">
        <div className="text-center text-sm text-gray-400">
          <div className="flex items-center justify-center space-x-6">
            <span><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">SPACE</kbd> Play/Pause</span>
            <span><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">←/→</kbd> Frame Step</span>
            <span><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Shift + ←/→</kbd> 5s Jump</span>
          </div>
        </div>
      </div>
    </div>
  );
};
