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
      className="fixed z-50 bg-dark-900 border border-dark-700 rounded-md p-2 shadow-lg pointer-events-none"
      style={{
        left: mousePosition.x + 10,
        top: mousePosition.y - 120,
      }}
    >
      {/* Thumbnail */}
      <div className="w-40 h-24 bg-dark-950 rounded overflow-hidden mb-1.5 flex items-center justify-center">
        {thumbnailData ? (
          <img
            src={thumbnailData}
            alt="Frame preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-dark-500 text-sm font-mono">
            Loading...
          </div>
        )}
      </div>
      
      {/* Timestamp */}
      <div className="text-center text-sm text-accent-green font-bold font-mono">
        {formatTimestamp(timestamp)}
      </div>
    </div>
  );
};

export default TimelineHoverPreview;
