import React from 'react';

interface Segment {
  id: string;
  startTime: number;
  endTime: number;
  videoId?: string;
}

interface TimelineSegmentsProps {
  segments: Segment[];
  videoDuration: number;
  timelineWidth: number;
  onMouseDown: (e: React.MouseEvent, type: 'trim-start' | 'trim-end', segmentId: string) => void;
  onTrimSegment: (segmentId: string, startTime: number, endTime: number) => void;
}

export const TimelineSegments: React.FC<TimelineSegmentsProps> = ({
  segments,
  videoDuration,
  timelineWidth,
  onMouseDown,
  onTrimSegment
}) => {
  return (
    <>
      {segments.map((segment) => {
        const startPixel = (segment.startTime / videoDuration) * timelineWidth;
        const endPixel = (segment.endTime / videoDuration) * timelineWidth;
        const segmentWidth = endPixel - startPixel;
        
        return (
          <div key={segment.id}>
            {/* Segment overlay */}
            <div
              className="absolute top-0 h-full bg-accent-pink/30 border-2 border-accent-pink rounded z-20 pointer-events-none"
              style={{
                left: startPixel,
                width: segmentWidth,
              }}
            />
            
            {/* Start trim handle */}
            <div
              onMouseDown={(e) => onMouseDown(e, 'trim-start', segment.id)}
              className="absolute top-0 w-2 h-full bg-accent-pink cursor-ew-resize z-25 rounded-l border border-white shadow-lg flex items-center justify-center"
              style={{
                left: startPixel - 4,
              }}
            >
              <div className="w-0.5 h-3/5 bg-white rounded-sm" />
            </div>
            
            {/* End trim handle */}
            <div
              onMouseDown={(e) => onMouseDown(e, 'trim-end', segment.id)}
              className="absolute top-0 w-2 h-full bg-accent-pink cursor-ew-resize z-25 rounded-r border border-white shadow-lg flex items-center justify-center"
              style={{
                left: endPixel - 4,
              }}
            >
              <div className="w-0.5 h-3/5 bg-white rounded-sm" />
            </div>
            
            {/* Segment info */}
            <div
              className="absolute top-2 text-white text-xs font-mono font-bold z-26 pointer-events-none"
              style={{
                left: startPixel + 8,
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {Math.floor((segment.endTime - segment.startTime) * 10) / 10}s
            </div>
            
            {/* Trim button */}
            <button
              onClick={() => onTrimSegment(segment.id, segment.startTime, segment.endTime)}
              className="absolute top-2 bg-accent-green border-none text-white px-2 py-1 rounded cursor-pointer text-xs font-mono font-bold z-26 hover:bg-green-600 transition-colors"
              style={{
                right: timelineWidth - endPixel + 8,
              }}
            >
              TRIM
            </button>
          </div>
        );
      })}
    </>
  );
};
