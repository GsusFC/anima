import React, { useEffect, useRef } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';

const Preview: React.FC = () => {
  const { preview, hasTimeline, generatePreview } = useSlideshowContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-generate preview when timeline changes (but not on errors)
  useEffect(() => {
    // Only auto-generate on initial load when timeline has items but no preview exists
    if (hasTimeline && !preview.isGenerating && !preview.url && !preview.error) {
      console.log('🎬 Auto-generating initial preview...');
      generatePreview();
    }
  }, [hasTimeline]); // Only depend on hasTimeline to prevent loops

  if (!hasTimeline) {
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

  return (
    <div className="h-full bg-dark-950 flex flex-col p-3">
      {/* Preview Area */}
      <div className="panel flex-1 flex items-center justify-center relative min-h-[500px] overflow-hidden">
        {preview.isGenerating && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col gap-3 z-10">
            <div className="w-8 h-8 border-3 border-dark-700 border-t-accent-orange rounded-full animate-spin" />
            <div className="text-accent-orange text-sm font-bold font-mono">
              Generating Preview...
            </div>
          </div>
        )}

        {preview.error && (
          <div className="text-center text-accent-red font-mono">
            <div className="text-lg mb-2">Preview Error</div>
            <div className="text-sm mb-3">{preview.error}</div>
            <button
              onClick={generatePreview}
              className="btn-pink text-sm py-2 px-4"
            >
              Retry Preview
            </button>
          </div>
        )}

        {preview.url && !preview.isGenerating && (
          <video
            ref={videoRef}
            src={preview.url}
            controls
            loop
            autoPlay
            muted
            playsInline
            crossOrigin="anonymous"
            className="w-full h-full object-contain rounded"
            onError={(e) => {
              console.error('Video playback error:', e);
              console.error('Video source:', preview.url);
              console.error('Video element state:', {
                readyState: videoRef.current?.readyState,
                networkState: videoRef.current?.networkState,
                error: videoRef.current?.error
              });
            }}
            onLoadStart={() => console.log('🎬 Video load started')}
            onLoadedData={() => console.log('🎬 Video data loaded')}
            onCanPlay={() => console.log('🎬 Video can play')}
          />
        )}

        {!preview.url && !preview.isGenerating && !preview.error && (
          <div className="text-center text-dark-400 font-mono">
            <div className="text-lg mb-2">Ready to Preview</div>
            <button
              onClick={generatePreview}
              className="btn-pink text-sm py-2 px-4"
            >
              Generate Preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preview;
