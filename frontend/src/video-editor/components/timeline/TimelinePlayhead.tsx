import React from 'react';

interface TimelinePlayheadProps {
  currentTime: number;
  videoDuration: number;
  timelineWidth: number;
  onMouseDown: (e: React.MouseEvent, type: 'playhead') => void;
}

export const TimelinePlayhead: React.FC<TimelinePlayheadProps> = ({
  currentTime,
  videoDuration,
  timelineWidth,
  onMouseDown
}) => {
  const playheadPosition = Math.min(timelineWidth, (currentTime / videoDuration) * timelineWidth);

  return (
    <>
      {/* Playhead line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-accent-pink z-30 pointer-events-none"
        style={{
          left: playheadPosition,
        }}
      />
      
      {/* Playhead handle */}
      <div
        onMouseDown={(e) => onMouseDown(e, 'playhead')}
        className="absolute -top-1 w-3 h-3 bg-accent-pink rounded-full cursor-grab z-31 border-2 border-white shadow-lg"
        style={{
          left: playheadPosition - 6,
        }}
      />
      
      {/* Playhead time label */}
      <div
        className="absolute -top-6 bg-accent-pink text-white px-1.5 py-0.5 rounded text-xs font-mono font-bold z-32 whitespace-nowrap"
        style={{
          left: Math.max(0, Math.min(timelineWidth - 80, playheadPosition - 40)),
        }}
      >
        {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}.{Math.floor((currentTime % 1) * 100).toString().padStart(2, '0')}
      </div>
    </>
  );
};
