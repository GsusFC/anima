import React, { useState, useCallback, useMemo } from 'react';
import { useVideoEditorContext } from '../../context/VideoEditorContext';
import { useVideoEditorHotkeys } from '../../hooks/useVideoEditorHotkeys';
import { showToast } from '../Toast';
import TimelineHoverPreview from '../TimelineHoverPreview';
import { TimelineControls } from './TimelineControls';
import { TimelineSeeker } from './TimelineSeeker';
import { TimelinePlayhead } from './TimelinePlayhead';
import { TimelineSegments } from './TimelineSegments';
import { TimelineThumbnails } from './TimelineThumbnails';
import { HotkeysHelp } from '../HotkeysHelp';

/**
 * Video Timeline Builder - Composition Pattern
 * Composes specialized timeline components for clean separation of concerns
 */
export const VideoTimelineBuilder: React.FC = () => {
  const { 
    project, 
    hasVideo, 
    addSegment,
    updateSegment, 
    removeSegment,
    trimVideo,
    currentTime, 
    isPlaying, 
    setCurrentTime, 
    togglePlayback,
    stepBackward,
    stepForward,
    jumpBackward,
    jumpForward,
    videoElement
  } = useVideoEditorContext();

  // Local state
  const [zoom, setZoom] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [isDragging, setIsDragging] = useState<{ type: 'playhead' | 'trim-start' | 'trim-end', segmentId?: string } | null>(null);
  const [hoverPreview, setHoverPreview] = useState<{
    visible: boolean;
    timestamp: number;
    mousePos: { x: number; y: number };
  }>({
    visible: false,
    timestamp: 0,
    mousePos: { x: 0, y: 0 }
  });

  // Timeline calculations
  const videoDuration = hasVideo ? project.video!.duration : 1;
  const timelineWidth = useMemo(() => 800 * zoom, [zoom]);
  const pixelsPerSecond = timelineWidth / videoDuration;

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }, []);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'playhead' | 'trim-start' | 'trim-end', segmentId?: string) => {
    e.preventDefault();
    setIsDragging({ type, segmentId });
  }, []);

  // Handle time change from seeker
  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, [setCurrentTime]);

  // Handle trim updates from seeker
  const handleTrimUpdate = useCallback((segmentId: string, type: 'start' | 'end', time: number) => {
    const updates = type === 'start' ? { startTime: time } : { endTime: time };
    updateSegment(segmentId, updates);
  }, [updateSegment]);

  // Handle hover preview changes
  const handleHoverChange = useCallback((show: boolean, time: number, mousePos: { x: number; y: number }) => {
    setHoverPreview({
      visible: show,
      timestamp: time,
      mousePos
    });
  }, []);

  // Handle trim action
  const handleTrimSegment = useCallback(async (_segmentId: string, startTime: number, endTime: number) => {
    try {
      const segment = trimVideo(startTime, endTime);
      console.log('✅ Segment trimmed successfully (UI-only):', segment);
      showToast('Segment trimmed! Will be processed during export.', 'success');
    } catch (error) {
      console.error('❌ Trim failed:', error);
      showToast(`Trim failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [trimVideo]);

  // Handle creating initial segment for trimming
  const handleCreateSegment = useCallback(() => {
    // Check if there's already a segment
    if (project.segments.length > 0) {
      showToast('Segment already exists! Drag the trim handles to adjust.', 'info');
      return;
    }
    
    const segmentDuration = Math.min(videoDuration, 10); // 10 seconds or full video
    const segment = addSegment(0, segmentDuration);
    console.log('✅ Created initial segment for trimming:', segment);
    showToast('Segment created! Drag the pink handles to trim, then click Export.', 'success');
  }, [addSegment, videoDuration, project.segments.length]);

  // Handle clearing all segments
  const handleClearSegments = useCallback(() => {
    project.segments.forEach(segment => removeSegment(segment.id));
    showToast('Segments cleared. Click Create Segment to start again.', 'info');
  }, [project.segments, removeSegment]);

  // Initialize keyboard shortcuts
  const { hotkeys } = useVideoEditorHotkeys({
    onCreateSegment: handleCreateSegment,
    onClearSegments: handleClearSegments,
    stepBackward,
    stepForward,
    jumpBackward,
    jumpForward,
    setZoom,
    zoom,
    onToggleHelp: () => setShowHelp(!showHelp)
  });

  // Empty state
  if (!hasVideo) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-850 text-dark-500">
        <div className="text-center font-mono">
          <p className="m-0 text-lg">No Video Loaded</p>
          <p className="m-0 text-sm mt-1">Timeline will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-dark-950 p-5">
      {/* Timeline Controls */}
      <TimelineControls
      zoom={zoom}
      setZoom={setZoom}
      isPlaying={isPlaying}
      togglePlayback={togglePlayback}
      stepBackward={stepBackward}
      stepForward={stepForward}
      jumpBackward={jumpBackward}
      jumpForward={jumpForward}
      formatTime={formatTime}
      currentTime={currentTime}
      videoDuration={videoDuration}
      onCreateSegment={handleCreateSegment}
        hasSegments={project.segments.length > 0}
          onClearSegments={handleClearSegments}
        />

      {/* Main Timeline Container */}
      <div className="flex justify-center items-center flex-1 overflow-x-auto overflow-y-hidden py-5">
        <TimelineSeeker
          videoDuration={videoDuration}
          timelineWidth={timelineWidth}
          pixelsPerSecond={pixelsPerSecond}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onTimeChange={handleTimeChange}
          onTrimUpdate={handleTrimUpdate}
          onHoverChange={handleHoverChange}
          segments={project.segments}
        >
          {/* Thumbnail strip */}
          {hasVideo && project.video!.thumbnails && (
            <TimelineThumbnails
              thumbnails={project.video!.thumbnails}
              timelineWidth={timelineWidth}
              zoom={zoom}
            />
          )}

          {/* Segments */}
          <TimelineSegments
            segments={project.segments}
            videoDuration={videoDuration}
            timelineWidth={timelineWidth}
            onMouseDown={handleMouseDown}
            onTrimSegment={handleTrimSegment}
          />

          {/* Playhead */}
          <TimelinePlayhead
            currentTime={currentTime}
            videoDuration={videoDuration}
            timelineWidth={timelineWidth}
            onMouseDown={handleMouseDown}
          />
        </TimelineSeeker>
      </div>

      {/* Hover Preview */}
      {hoverPreview.visible && videoElement && hasVideo && (
        <TimelineHoverPreview
          videoElement={videoElement}
          isVisible={hoverPreview.visible}
          timestamp={hoverPreview.timestamp}
          mousePosition={hoverPreview.mousePos}
          videoDuration={videoDuration}
          videoThumbnails={project.video!.thumbnails || []}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <HotkeysHelp 
        hotkeys={hotkeys} 
        isOpen={showHelp}
        onToggle={() => setShowHelp(!showHelp)}
      />
    </div>
  );
};
