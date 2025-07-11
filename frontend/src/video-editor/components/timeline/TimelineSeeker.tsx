import React, { useRef, useCallback, useEffect } from 'react';
import { VideoSegment } from '../../types/video-editor.types';

interface TimelineSeekerProps {
  videoDuration: number;
  timelineWidth: number;
  pixelsPerSecond: number;
  isDragging: { type: 'playhead' | 'trim-start' | 'trim-end', segmentId?: string } | null;
  setIsDragging: (dragging: { type: 'playhead' | 'trim-start' | 'trim-end', segmentId?: string } | null) => void;
  onTimeChange: (time: number) => void;
  onTrimUpdate: (segmentId: string, type: 'start' | 'end', time: number) => void;
  onHoverChange: (show: boolean, time: number, mousePos: { x: number; y: number }) => void;
  segments: VideoSegment[];
  children: React.ReactNode;
}

export const TimelineSeeker: React.FC<TimelineSeekerProps> = ({
  videoDuration,
  timelineWidth,
  pixelsPerSecond,
  isDragging,
  setIsDragging,
  onTimeChange,
  onTrimUpdate,
  onHoverChange,
  segments,
  children
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Convert pixel position to time
  const pixelToTime = useCallback((pixel: number) => {
    return Math.max(0, Math.min(videoDuration, (pixel / pixelsPerSecond)));
  }, [pixelsPerSecond, videoDuration]);

  // Handle timeline click for seeking
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const clickTime = pixelToTime(mouseX);
    onTimeChange(clickTime);
  }, [pixelToTime, isDragging, onTimeChange]);

  // Handle mouse move for hover preview and dragging
  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(videoDuration, pixelToTime(mouseX)));

    // Always update hover preview if not dragging
    if (!isDragging) {
      onHoverChange(true, newTime, { x: e.clientX, y: e.clientY });
    }
  }, [isDragging, pixelToTime, videoDuration, onHoverChange]);

  // Handle mouse move for dragging (document level)
  const handleDocumentMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(videoDuration, pixelToTime(mouseX)));

    if (isDragging.type === 'playhead') {
      onTimeChange(newTime);
    } else if (isDragging.type === 'trim-start' && isDragging.segmentId) {
      const segment = segments.find(s => s.id === isDragging.segmentId);
      if (segment && newTime < segment.endTime) {
        onTrimUpdate(isDragging.segmentId, 'start', newTime);
      }
    } else if (isDragging.type === 'trim-end' && isDragging.segmentId) {
      const segment = segments.find(s => s.id === isDragging.segmentId);
      if (segment && newTime > segment.startTime) {
        onTrimUpdate(isDragging.segmentId, 'end', newTime);
      }
    }
  }, [isDragging, pixelToTime, videoDuration, segments, onTimeChange, onTrimUpdate]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, [setIsDragging]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      onHoverChange(false, 0, { x: 0, y: 0 });
    }
  }, [isDragging, onHoverChange]);

  // Setup mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleDocumentMouseMove, handleMouseUp]);

  return (
    <div
      ref={timelineRef}
      onClick={handleTimelineClick}
      onMouseMove={handleTimelineMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative h-32 bg-dark-900 border border-dark-700 rounded overflow-hidden ${
        isDragging ? 'cursor-grabbing' : 'cursor-pointer'
      }`}
      style={{
        width: timelineWidth,
      }}
    >
      {children}
    </div>
  );
};
