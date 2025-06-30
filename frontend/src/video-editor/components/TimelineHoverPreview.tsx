import React, { useEffect, useState } from 'react';

interface TimelineHoverPreviewProps {
  videoElement: HTMLVideoElement | null;
  isVisible: boolean;
  timestamp: number;
  mousePosition: { x: number; y: number };
  videoDuration: number;
  videoThumbnails: string[];
}

const TimelineHoverPreview: React.FC<TimelineHoverPreviewProps> = ({
  // videoElement,
  isVisible,
  timestamp,
  mousePosition,
  videoDuration,
  videoThumbnails
}) => {
  const [thumbnailData, setThumbnailData] = useState<string>('');

  useEffect(() => {
    if (!isVisible || videoThumbnails.length === 0) {
      setThumbnailData('');
      return;
    }

    // Find the closest thumbnail to the timestamp
    const thumbnailIndex = Math.floor((timestamp / videoDuration) * videoThumbnails.length);
    const clampedIndex = Math.max(0, Math.min(thumbnailIndex, videoThumbnails.length - 1));
    const selectedThumbnail = videoThumbnails[clampedIndex];
    
    setThumbnailData(selectedThumbnail);
    
  }, [timestamp, isVisible, videoDuration, videoThumbnails]);

  const formatTimestamp = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: mousePosition.x + 10,
        top: mousePosition.y - 120,
        zIndex: 9999,
        backgroundColor: '#1a1a1b',
        border: '1px solid #343536',
        borderRadius: '6px',
        padding: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        pointerEvents: 'none'
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '150px',
          height: '100px',
          backgroundColor: '#0f0f0f',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {thumbnailData ? (
          <img
            src={thumbnailData}
            alt="Frame preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            color: '#6b7280',
            fontSize: '11px',
            fontFamily: '"Space Mono", monospace'
          }}>
            Loading...
          </div>
        )}
      </div>
      
      {/* Timestamp */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#22c55e',
          fontWeight: 'bold',
          fontFamily: '"Space Mono", monospace'
        }}
      >
        {formatTimestamp(timestamp)}
      </div>
    </div>
  );
};

export default TimelineHoverPreview;
