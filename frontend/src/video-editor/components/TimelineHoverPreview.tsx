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
        ) : null}
      </div>

    </div>
  );
};

export default TimelineHoverPreview;
