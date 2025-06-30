import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useVideoEditorContext } from '../context/VideoEditorContext';
import { showToast } from './Toast';
import TimelineHoverPreview from './TimelineHoverPreview';

const VideoTimeline: React.FC = () => {
  const { 
    project, 
    hasVideo, 
    updateSegment, 
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
  const [zoom, setZoom] = useState(1);
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
  
  const timelineRef = useRef<HTMLDivElement>(null);

  // All calculations that depend on video data
  const videoDuration = hasVideo ? project.video!.duration : 1;
  const timelineWidth = useMemo(() => 800 * zoom, [zoom]);
  const pixelsPerSecond = timelineWidth / videoDuration;
  
  // Adaptive thumbnail density based on zoom level
  const adaptiveThumbnailCount = useMemo(() => {
    const baseThumbnails = hasVideo ? project.video!.thumbnails.length : 0;
    if (baseThumbnails === 0) return 0;
    
    // More thumbnails at higher zoom levels for precision
    const zoomMultiplier = Math.min(zoom * 2, 6); // Cap at 6x density
    const targetCount = Math.ceil(baseThumbnails * zoomMultiplier);
    
    // But don't exceed reasonable limits
    return Math.min(targetCount, baseThumbnails * 4, 200);
  }, [zoom, hasVideo, project.video?.thumbnails.length]);
  
  // Calculate optimal thumbnail width for current zoom
  const optimalThumbnailWidth = useMemo(() => {
    if (!adaptiveThumbnailCount) return 0;
    const minWidth = 40; // Minimum readable thumbnail width
    const maxWidth = 120; // Maximum for performance
    const calculatedWidth = timelineWidth / adaptiveThumbnailCount;
    return Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
  }, [timelineWidth, adaptiveThumbnailCount]);

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number) => (time / videoDuration) * timelineWidth, [videoDuration, timelineWidth]);
  
  // Convert pixel position to time
  const pixelToTime = useCallback((pixel: number) => (pixel / timelineWidth) * videoDuration, [timelineWidth, videoDuration]);

  // Hover preview handlers
  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const timestamp = pixelToTime(relativeX);
    
    if (timestamp >= 0 && timestamp <= videoDuration) {
      setHoverPreview({
        visible: true,
        timestamp,
        mousePos: { x: e.clientX, y: e.clientY }
      });
    }
  }, [pixelToTime, videoDuration, isDragging]);

  const handleTimelineMouseLeave = useCallback(() => {
    setHoverPreview(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle timeline click to set playhead
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = pixelToTime(clickX);
    const clampedTime = Math.max(0, Math.min(videoDuration, newTime));
    
    setCurrentTime(clampedTime);
  }, [pixelToTime, videoDuration, isDragging, setCurrentTime]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'playhead' | 'trim-start' | 'trim-end', segmentId?: string) => {
    e.preventDefault();
    setIsDragging({ type, segmentId });
  }, []);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(videoDuration, pixelToTime(mouseX)));

    if (isDragging.type === 'playhead') {
      setCurrentTime(newTime);
    } else if (isDragging.type === 'trim-start' && isDragging.segmentId) {
      const segment = project.segments.find(s => s.id === isDragging.segmentId);
      if (segment && newTime < segment.endTime) {
        // Only update segment, don't move playhead during trim
        updateSegment(isDragging.segmentId, { startTime: newTime });
      }
    } else if (isDragging.type === 'trim-end' && isDragging.segmentId) {
      const segment = project.segments.find(s => s.id === isDragging.segmentId);
      if (segment && newTime > segment.startTime) {
        // Only update segment, don't move playhead during trim
        updateSegment(isDragging.segmentId, { endTime: newTime });
      }
    }
  }, [isDragging, pixelToTime, videoDuration, project.segments, updateSegment, setCurrentTime]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Setup mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Play/pause control is now handled by context
  // const togglePlayback is provided by useVideoEditorContext

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }, []);

  if (!hasVideo) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f0f0f',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center', fontFamily: '"Space Mono", monospace' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>No Video Loaded</p>
          <p style={{ margin: 0, fontSize: '11px', marginTop: '4px' }}>Timeline will appear here</p>
        </div>
      </div>
    );
  }

  // Handle trim action (now instant UI feedback)
  const handleTrimSegment = async (segmentId: string, startTime: number, endTime: number) => {
    try {
      await trimVideo(segmentId, startTime, endTime);
      console.log('✅ Segment trimmed successfully (UI-only)');
      showToast('Segment trimmed! Will be processed during export.', 'success');
    } catch (error) {
      console.error('❌ Trim failed:', error);
      showToast(`Trim failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0b',
      padding: '20px'
    }}>
      {/* Timeline Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #343536'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            color: '#ff4500',
            fontWeight: 'bold',
            fontFamily: '"Space Mono", monospace'
          }}>
            VIDEO TIMELINE
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={togglePlayback}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#ff4500',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
              title="Play/Pause (SPACE)"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <div style={{
              fontSize: '12px',
              color: '#d1d5db',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 'bold'
            }}>
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </div>
            
            {/* Enhanced Frame Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '15px' }}>
              <button
                onClick={jumpBackward}
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}
                title="Jump back 5s (SHIFT + ←)"
              >
                ⏪
              </button>
              
              <button
                onClick={stepBackward}
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}
                title="Previous frame (←)"
              >
                ⏮
              </button>
              
              <button
                onClick={stepForward}
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}
                title="Next frame (→)"
              >
                ⏭
              </button>
              
              <button
                onClick={jumpForward}
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}
                title="Jump forward 5s (SHIFT + →)"
              >
                ⏩
              </button>
              
              <div style={{
                fontSize: '10px',
                color: '#6b7280',
                marginLeft: '8px',
                display: 'flex',
                flexDirection: 'column',
                lineHeight: '1.2'
              }}>
                <span>Precision: {(pixelsPerSecond * zoom).toFixed(1)}px/s</span>
                <span>Zoom: {adaptiveThumbnailCount} thumbs</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '11px', color: '#9ca3af' }}>Zoom:</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: '80px' }}
          />
          <span style={{ fontSize: '11px', color: '#d1d5db', minWidth: '30px' }}>
            {zoom.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* Timeline Track */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {/* Time ruler */}
        <div style={{
          height: '30px',
          backgroundColor: '#1a1a1b',
          borderRadius: '4px 4px 0 0',
          border: '1px solid #343536',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${timelineWidth}px`, 
            height: '100%', 
            position: 'relative',
            borderBottom: '1px solid #343536'
          }}>
            {/* Time markers */}
            {Array.from({ length: Math.ceil(videoDuration) + 1 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${timeToPixel(i)}px`,
                  top: 0,
                  height: '100%',
                  borderLeft: '1px solid #4b5563',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '4px'
                }}
              >
                <span style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  fontFamily: '"Space Mono", monospace'
                }}>
                  {i}s
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Video track */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
          style={{
            height: '80px',
            backgroundColor: '#1a1a1b',
            border: '1px solid #343536',
            borderTop: 0,
            position: 'relative',
            overflow: 'auto',
            cursor: 'pointer'
          }}
        >
          <div style={{ 
            width: `${timelineWidth}px`, 
            height: '100%', 
            position: 'relative',
            backgroundColor: '#2a2a2b'
          }}>
            {/* Enhanced adaptive thumbnails */}
            {hasVideo && project.video!.thumbnails.length > 0 && adaptiveThumbnailCount > 0 && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                overflow: 'hidden'
              }}>
                {Array.from({ length: adaptiveThumbnailCount }, (_, index) => {
                  // Map adaptive index to original thumbnail index
                  const originalIndex = Math.floor((index / adaptiveThumbnailCount) * project.video!.thumbnails.length);
                  const thumbnail = project.video!.thumbnails[originalIndex];
                  const thumbWidth = optimalThumbnailWidth;
                  const leftPosition = (index / adaptiveThumbnailCount) * timelineWidth;
                  
                  return (
                    <div
                      key={`adaptive-thumb-${index}`}
                      style={{
                        position: 'absolute',
                        left: `${leftPosition}px`,
                        width: `${thumbWidth}px`,
                        height: '100%',
                        backgroundImage: `url(${thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRight: '1px solid #4b5563',
                        opacity: 0.7
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Video segments */}
            {project.segments.map((segment) => (
              <div
                key={segment.id}
                style={{
                  position: 'absolute',
                  left: `${timeToPixel(segment.startTime)}px`,
                  width: `${timeToPixel(segment.endTime - segment.startTime)}px`,
                  height: '100%',
                  backgroundColor: 'rgba(255, 69, 0, 0.5)',
                  border: '2px solid #ff4500',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: 'white',
                  fontWeight: 'bold',
                  fontFamily: '"Space Mono", monospace'
                }}
              >
                {/* Trim handles */}
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'trim-start', segment.id)}
                  style={{
                    position: 'absolute',
                    left: '-4px',
                    top: 0,
                    width: '8px',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    cursor: 'ew-resize',
                    borderRadius: '2px 0 0 2px'
                  }}
                />
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'trim-end', segment.id)}
                  style={{
                    position: 'absolute',
                    right: '-4px',
                    top: 0,
                    width: '8px',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    cursor: 'ew-resize',
                    borderRadius: '0 2px 2px 0'
                  }}
                />
                
                {/* Segment content with trim button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  height: '100%'
                }}>
                  <span style={{ fontSize: '10px' }}>
                    {formatTime(segment.endTime - segment.startTime)}
                  </span>
                  
                  {/* Compact trim button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrimSegment(segment.id, segment.startTime, segment.endTime);
                    }}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#22c55e',
                      border: 'none',
                      borderRadius: '3px',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontFamily: '"Space Mono", monospace',
                      opacity: 0.9,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                    title="Apply trim - process this segment"
                  >
                    ✂️
                  </button>
                </div>
              </div>
            ))}

            {/* Playhead */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'playhead')}
              style={{
                position: 'absolute',
                left: `${timeToPixel(currentTime)}px`,
                top: 0,
                width: '2px',
                height: '100%',
                backgroundColor: '#ffffff',
                cursor: 'ew-resize',
                zIndex: 10
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '-6px',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #ffffff'
              }} />
            </div>
          </div>
        </div>

        {/* Timeline info */}
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#1a1a1b',
          borderRadius: '4px',
          border: '1px solid #343536',
          fontSize: '11px',
          color: '#9ca3af',
          fontFamily: '"Space Mono", monospace'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Segments: {project.segments.length}</span>
            <span>Total duration: {formatTime(project.segments.reduce((sum, seg) => sum + (seg.endTime - seg.startTime), 0))}</span>
            <span>Original: {formatTime(videoDuration)}</span>
            
            {/* Keyboard shortcuts */}
            <div style={{ 
              marginLeft: 'auto', 
              fontSize: '10px', 
              color: '#6b7280',
              display: 'flex',
              gap: '15px'
            }}>
              <span>⌨️ SPACE: play/pause</span>
              <span>← →: frame navigation</span>
              <span>SHIFT + ← →: 5s jumps</span>
              <span>Click timeline: jump to time</span>
              <span>✂️ in segments: apply trim</span>
            </div>
          </div>
        </div>
      </div>



      {/* Video playback is now controlled by VideoPreview component */}
      
      {/* Hover Preview */}
      <TimelineHoverPreview
        videoElement={videoElement}
        isVisible={hoverPreview.visible}
        timestamp={hoverPreview.timestamp}
        mousePosition={hoverPreview.mousePos}
        videoDuration={videoDuration}
        videoThumbnails={hasVideo ? project.video!.thumbnails : []}
      />
    </div>
  );
};

export default VideoTimeline;
