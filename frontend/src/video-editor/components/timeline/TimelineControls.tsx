import React from 'react';

interface TimelineControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  isPlaying: boolean;
  togglePlayback: () => void;
  stepBackward: () => void;
  stepForward: () => void;
  jumpBackward: () => void;
  jumpForward: () => void;
  formatTime: (seconds: number) => string;
  currentTime: number;
  videoDuration: number;
  onCreateSegment: () => void;
  hasSegments: boolean;
  onClearSegments: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  zoom,
  setZoom,
  isPlaying,
  togglePlayback,
  stepBackward,
  stepForward,
  jumpBackward,
  jumpForward,
  formatTime,
  currentTime,
  videoDuration,
  onCreateSegment,
  hasSegments,
  onClearSegments
}) => {
  return (
    <div className="flex justify-between items-center mb-5 px-2.5">
      {/* Time Info */}
      <div className="font-mono text-xs text-gray-400">
        {formatTime(currentTime)} / {formatTime(videoDuration)}
      </div>

      {/* Controls */}
      <div className="flex gap-2 items-center">
        <button
          onClick={jumpBackward}
          className="bg-gray-700 border-none text-gray-200 px-2.5 py-1.5 rounded text-xs font-mono hover:bg-gray-600 transition-colors"
        >
          -5s
        </button>
        
        <button
          onClick={stepBackward}
          className="bg-gray-700 border-none text-gray-200 px-2.5 py-1.5 rounded text-xs font-mono hover:bg-gray-600 transition-colors"
        >
          -1f
        </button>
        
        <button
          onClick={togglePlayback}
          className="bg-pink-500 border-none text-white px-4 py-2 rounded text-xs font-bold font-mono min-w-[60px] hover:bg-pink-600 transition-colors"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button
          onClick={stepForward}
          className="bg-gray-700 border-none text-gray-200 px-2.5 py-1.5 rounded text-xs font-mono hover:bg-gray-600 transition-colors"
        >
          +1f
        </button>
        
        <button
          onClick={jumpForward}
          className="bg-gray-700 border-none text-gray-200 px-2.5 py-1.5 rounded text-xs font-mono hover:bg-gray-600 transition-colors"
        >
          +5s
        </button>
        
        <button
          onClick={hasSegments ? onClearSegments : onCreateSegment}
          className={`border-none text-white px-3 py-1.5 rounded text-xs font-mono font-bold ml-3 transition-colors ${
            hasSegments 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-pink-500 hover:bg-pink-600'
          }`}
        >
          {hasSegments ? 'Clear Segment' : 'Create Segment'}
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
          className="bg-gray-700 border-none text-gray-200 px-2.5 py-1.5 rounded text-xs font-mono hover:bg-gray-600 transition-colors"
        >
          -
        </button>
        
        <span className="font-mono text-xs text-gray-400 min-w-[50px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        
        <button
          onClick={() => setZoom(Math.min(4, zoom + 0.25))}
          className="bg-gray-700 border-none text-gray-200 px-2.5 py-1.5 rounded text-xs font-mono hover:bg-gray-600 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
};
