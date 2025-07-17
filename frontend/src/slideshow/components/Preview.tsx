import React, { useEffect } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import { UnifiedPreviewEmptyState } from '../../shared/components/unified';
import BaseVideoPreview from '../../shared/components/base/BaseVideoPreview';

const Preview: React.FC = () => {
  const { preview, hasTimeline, generatePreview } = useSlideshowContext();

  // Auto-generate preview when timeline changes (but not on errors)
  useEffect(() => {
    // Only auto-generate on initial load when timeline has items but no preview exists
    if (hasTimeline && !preview.isGenerating && !preview.url && !preview.error) {
      console.log('🎬 Auto-generating initial preview...');
      generatePreview();
    }
  }, [hasTimeline]); // Only depend on hasTimeline to prevent loops

  if (!hasTimeline) {
    return <UnifiedPreviewEmptyState mode="slideshow" />;
  }

  // Custom loading content for slideshow
  const loadingContent = (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-dark-700 border-t-accent-orange rounded-full animate-spin" />
      <div className="text-accent-orange text-sm font-bold font-mono">
        Generating Preview...
      </div>
    </div>
  );

  // Custom error content for slideshow
  const errorContent = preview.error ? (
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
  ) : null;

  return (
    <BaseVideoPreview
      videoSrc={preview.url || ''}
      mode="slideshow"
      isLoading={preview.isGenerating}
      error={preview.error}
      loadingContent={loadingContent}
      errorContent={errorContent}
      onVideoLoaded={() => {
        console.log('🎬 Slideshow preview loaded');
      }}
      onVideoError={(e) => {
        console.error('❌ Slideshow preview error:', e);
      }}
      showControls={true}
      autoPlay={true}
      loop={true}
      muted={true}
      containerClassName="h-full"
    />
  );
};

export default Preview;
