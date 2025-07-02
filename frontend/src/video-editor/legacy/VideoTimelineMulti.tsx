import React, { useRef, useState, useCallback } from 'react';
import { useVideoEditor } from '../context/VideoEditorContextMulti';
import { VideoTimelineItem, TimelineItem } from '../types/video-editor.types';

interface VideoTimelineMultiProps {}

export const VideoTimelineMulti: React.FC<VideoTimelineMultiProps> = () => {
  const { 
    project, 
    currentTime, 
    isPlaying, 
    timelineZoom,
    togglePlayback, 
    setCurrentTime,
    setTimelineZoom,
    addVideoToSequence,
    removeItemFromSequence,
    getVideoById,
    getSequenceDuration
  } = useVideoEditor();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isDraggingItem, setIsDraggingItem] = useState<string | null>(null);

  const sequenceDuration = getSequenceDuration();
  const timelineWidth = Math.max(800, sequenceDuration * 100 * timelineZoom); // 100px per second base

  // Handle playhead drag
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    setIsDraggingPlayhead(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / timelineWidth) * sequenceDuration;
    const clampedTime = Math.max(0, Math.min(sequenceDuration, time));

    if (isDraggingPlayhead) {
      setCurrentTime(clampedTime);
    }
  }, [isDraggingPlayhead, timelineWidth, sequenceDuration, setCurrentTime]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false);
    setIsDraggingItem(null);
  }, []);

  React.useEffect(() => {
    if (isDraggingPlayhead || isDraggingItem) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingPlayhead, isDraggingItem, handleMouseMove, handleMouseUp]);

  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDraggingPlayhead || isDraggingItem) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / timelineWidth) * sequenceDuration;
    const clampedTime = Math.max(0, Math.min(sequenceDuration, time));
    
    setCurrentTime(clampedTime);
  };

  // Handle drop from video library
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const videoId = e.dataTransfer.getData('application/video-id');
    
    if (videoId && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = (x / timelineWidth) * sequenceDuration;
      
      addVideoToSequence(videoId, Math.max(0, position));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Get position and width for timeline items
  const getItemStyle = (item: TimelineItem) => {
    const left = (item.position / sequenceDuration) * timelineWidth;
    const width = (item.duration / sequenceDuration) * timelineWidth;
    return { left, width: Math.max(width, 50) }; // Minimum width of 50px
  };

  const renderVideoItem = (item: VideoTimelineItem) => {
    const video = getVideoById(item.videoId);
    if (!video) return null;

    const style = getItemStyle(item);
    const trimmedDuration = item.endTime - item.startTime;
    
    return (
      <div
        key={item.id}
        className="absolute bg-blue-600 border border-blue-500 rounded cursor-move group"
        style={{
          left: style.left,
          width: style.width,
          height: '60px',
          top: '10px'
        }}
        draggable
        onDragStart={() => setIsDraggingItem(item.id)}
      >
        {/* Video thumbnail background */}
        {video.thumbnails[0] && (
          <img
            src={video.thumbnails[0]}
            alt={video.name}
            className="absolute inset-0 w-full h-full object-cover rounded opacity-30"
          />
        )}
        
        {/* Video info overlay */}
        <div className="relative z-10 p-2 h-full flex flex-col justify-between">
          <div>
            <div className="text-white text-sm font-medium truncate">{video.name}</div>
            <div className="text-blue-200 text-xs">
              {formatTime(trimmedDuration)} {item.speed !== 1 && `(${item.speed}x)`}
            </div>
          </div>
          
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeItemFromSequence(item.id);
            }}
            className="self-end opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>

        {/* Trim handles */}
        <div className="absolute left-0 top-0 w-2 h-full bg-blue-400 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute right-0 top-0 w-2 h-full bg-blue-400 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  const playheadPosition = sequenceDuration > 0 ? (currentTime / sequenceDuration) * timelineWidth : 0;

  return (
    <div className="h-full bg-gray-800 flex flex-col">
      {/* Timeline Header */}
      <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayback}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Time Display */}
          <div className="text-white font-mono text-sm">
            {formatTime(currentTime)} / {formatTime(sequenceDuration)}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTimelineZoom(timelineZoom * 0.8)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            −
          </button>
          <span className="text-white text-sm w-12 text-center">{(timelineZoom * 100).toFixed(0)}%</span>
          <button
            onClick={() => setTimelineZoom(timelineZoom * 1.25)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto">
        <div
          ref={timelineRef}
          className="relative h-20 bg-gray-700 cursor-pointer"
          style={{ width: timelineWidth }}
          onClick={handleTimelineClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Drop zone indicator */}
          {project.sequence.items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              Drag videos from library to create sequence
            </div>
          )}

          {/* Timeline items */}
          {project.sequence.items.map(item => {
            if (item.type === 'video') {
              return renderVideoItem(item as VideoTimelineItem);
            }
            return null; // Transitions will be implemented later
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 cursor-ew-resize"
            style={{ left: playheadPosition }}
            onMouseDown={handlePlayheadMouseDown}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rotate-45" />
          </div>

          {/* Time ruler */}
          <div className="absolute bottom-0 left-0 right-0 h-6 border-t border-gray-600">
            {Array.from({ length: Math.ceil(sequenceDuration) + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute text-xs text-gray-400"
                style={{
                  left: (i / sequenceDuration) * timelineWidth,
                  transform: 'translateX(-50%)'
                }}
              >
                {i}s
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
