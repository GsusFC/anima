import React, { useMemo } from 'react';

interface TimelineThumbnailsProps {
  thumbnails: string[];
  timelineWidth: number;
  zoom: number;
}

export const TimelineThumbnails: React.FC<TimelineThumbnailsProps> = ({
  thumbnails,
  timelineWidth,
  zoom
}) => {
  // Simple: show all available thumbnails
  const displayThumbnails = useMemo(() => {
    return thumbnails; // Show all thumbnails we have
  }, [thumbnails]);

  const thumbnailWidth = timelineWidth / Math.max(1, displayThumbnails.length);

  // Debug: log thumbnails
  console.log('🖼️ TimelineThumbnails render:', {
    totalThumbnails: thumbnails.length,
    displayThumbnails: displayThumbnails.length,
    thumbnailWidth,
    zoom,
    timelineWidth
  });

  return (
    <div className="absolute inset-0 flex z-10">
      {displayThumbnails.length > 0 ? (
        displayThumbnails.map((thumbnail, index) => (
          <div
            key={index}
            className="h-full bg-cover bg-center opacity-80"
            style={{
              width: thumbnailWidth,
              backgroundImage: `url(${thumbnail})`,
              borderRight: index < displayThumbnails.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}
          />
        ))
      ) : (
        // Placeholder when no thumbnails
        <div className="w-full h-full bg-dark-800 flex items-center justify-center font-mono text-xs text-dark-500">
          No thumbnails available
        </div>
      )}
    </div>
  );
};
