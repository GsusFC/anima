import React, { useRef, useEffect, useState } from 'react';
import styles from './BaseVideoPreview.module.css';

export interface BaseVideoPreviewProps {
  // Core video props
  videoSrc: string;
  mode: 'slideshow' | 'video-editor';
  
  // Event handlers
  onVideoLoaded?: () => void;
  onVideoError?: (error: Event) => void;
  onVideoPlay?: () => void;
  onVideoPause?: () => void;
  
  // Display options
  showControls?: boolean;
  showOverlay?: boolean;
  overlayContent?: React.ReactNode;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  
  // Styling
  className?: string;
  containerClassName?: string;
  
  // Loading state
  isLoading?: boolean;
  loadingContent?: React.ReactNode;
  
  // Error state
  error?: string | null;
  errorContent?: React.ReactNode;
}

/**
 * Base Video Preview Component
 * 
 * Reusable foundation for video preview functionality across AnimaGen.
 * Eliminates code duplication between slideshow Preview.tsx and video-editor VideoPreview.tsx.
 * 
 * Features:
 * - Unified video element with consistent styling
 * - Mode-specific theming (slideshow vs video-editor)
 * - Comprehensive event handling
 * - Loading and error states
 * - Overlay support for additional UI elements
 * - CSS modules for maintainable styling
 */
export const BaseVideoPreview: React.FC<BaseVideoPreviewProps> = ({
  videoSrc,
  mode,
  onVideoLoaded,
  onVideoError,
  onVideoPlay,
  onVideoPause,
  showControls = true,
  showOverlay = false,
  overlayContent,
  autoPlay = false,
  loop = false,
  muted = true,
  className = '',
  containerClassName = '',
  isLoading = false,
  loadingContent,
  error = null,
  errorContent
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [_videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Handle video load event
  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setVideoError(null);
    onVideoLoaded?.();
  };

  // Handle video error event
  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const errorMessage = 'Failed to load video preview';
    setVideoError(errorMessage);
    setVideoLoaded(false);
    onVideoError?.(event.nativeEvent);
  };

  // Handle video play event
  const handleVideoPlay = () => {
    onVideoPlay?.();
  };

  // Handle video pause event
  const handleVideoPause = () => {
    onVideoPause?.();
  };

  // Update video source when prop changes
  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.load();
    }
  }, [videoSrc]);

  // Determine container classes
  const containerClasses = [
    styles.container,
    styles[`container${mode === 'slideshow' ? 'Slideshow' : 'VideoEditor'}`],
    containerClassName
  ].filter(Boolean).join(' ');

  // Determine video classes
  const videoClasses = [
    styles.video,
    className
  ].filter(Boolean).join(' ');

  // Show loading state
  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className={styles.loadingContainer}>
          {loadingContent || (
            <div className={styles.loadingDefault}>
              <div className={styles.loadingSpinner}></div>
              <span className={styles.loadingText}>Loading preview...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (error || videoError) {
    return (
      <div className={containerClasses}>
        <div className={styles.errorContainer}>
          {errorContent || (
            <div className={styles.errorDefault}>
              <div className={styles.errorIcon}>⚠️</div>
              <span className={styles.errorText}>
                {error || videoError || 'Failed to load video'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show empty state if no video source
  if (!videoSrc) {
    return (
      <div className={containerClasses}>
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>🎬</div>
          <span className={styles.emptyText}>No preview available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className={videoClasses}
        controls={showControls}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay Content */}
      {showOverlay && overlayContent && (
        <div className={styles.overlay}>
          {overlayContent}
        </div>
      )}
    </div>
  );
};

export default BaseVideoPreview;
