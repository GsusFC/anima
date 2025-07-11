import React, { useState, useEffect } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';

const SimplePreview: React.FC = () => {
  const { project, hasTimeline } = useSlideshowContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play slideshow
  useEffect(() => {
    if (!isPlaying || !hasTimeline || project.timeline.length === 0) return;

    const currentItem = project.timeline[currentIndex];
    const duration = currentItem?.duration || 3000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % project.timeline.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, hasTimeline, project.timeline]);

  if (!hasTimeline || project.timeline.length === 0) {
    return (
      <div className="h-full bg-dark-950 flex flex-col p-3">
        <div className="panel flex-1 flex items-center justify-center flex-col gap-3">
          <svg className="w-12 h-12 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
          </svg>
          <div className="text-center text-dark-400 font-mono">
            <div className="text-lg mb-1">No Preview Available</div>
            <div className="text-sm">Add images to timeline to generate preview</div>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = project.timeline[currentIndex];
  const currentImage = project.images.find(img => img.id === currentItem?.imageId);

  return (
    <div className="h-full bg-dark-950 flex flex-col p-3">
      {/* Preview Area */}
      <div className="panel flex-1 flex items-center justify-center relative min-h-[500px] overflow-hidden">
        {currentImage && (
          <img
            src={currentImage.preview}
            alt={`Slide ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg transition-all duration-500"
            style={{
              filter: isPlaying ? 'brightness(1)' : 'brightness(0.8)'
            }}
          />
        )}

        {/* Play/Pause Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:text-accent-orange transition-colors"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <div className="text-white text-sm font-mono">
            {currentIndex + 1} / {project.timeline.length}
          </div>

          <div className="text-white text-xs opacity-75">
            {((currentItem?.duration || 3000) / 1000).toFixed(1)}s
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-700">
          <div 
            className="h-full bg-accent-orange transition-all duration-100"
            style={{ 
              width: `${((currentIndex + 1) / project.timeline.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Simple Controls */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-3 py-1 bg-dark-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 transition-colors"
        >
          Previous
        </button>

        <div className="px-4 py-1 bg-dark-800 text-white rounded font-mono text-sm">
          Slide {currentIndex + 1}
        </div>

        <button
          onClick={() => setCurrentIndex(Math.min(project.timeline.length - 1, currentIndex + 1))}
          disabled={currentIndex === project.timeline.length - 1}
          className="px-3 py-1 bg-dark-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SimplePreview;
