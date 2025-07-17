import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useVideoEditorContext } from '../context/VideoEditorContext';
import { UnifiedPreviewEmptyState } from '../../shared/components/unified';
import BaseVideoPreview from '../../shared/components/base/BaseVideoPreview';

const VideoPreview: React.FC = () => {
  const { project, hasVideo, setVideoRef } = useVideoEditorContext();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Register video ref with context when component mounts
  useEffect(() => {
    if (localVideoRef.current) {
      setVideoRef(localVideoRef as React.RefObject<HTMLVideoElement>);
    }
  }, [hasVideo, setVideoRef]);

  const handleVideoLoaded = useCallback(() => {
    // Video loaded successfully
  }, []);

  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('❌ Video preview error:', e);
  }, []);

  // Memoize blob URL to prevent memory leaks
  const videoSrc = useMemo(() => {
    if (!project.video?.file) return '';
    return URL.createObjectURL(project.video.file);
  }, [project.video?.file]);

  // Cleanup blob URL on unmount or video change
  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  if (!hasVideo) {
    return <UnifiedPreviewEmptyState mode="video-editor" />;
  }

  // Video info overlay content
  const overlayContent = project.video ? (
    <div className="absolute top-2.5 left-2.5 bg-black/80 px-3 py-2 rounded text-xs font-mono">
      <div className="text-accent-green mb-0.5">
        {project.video.width} × {project.video.height}
      </div>
      <div className="text-dark-400">
        {project.video.duration.toFixed(1)}s • {(project.video.file.size / 1024 / 1024).toFixed(1)}MB
      </div>
    </div>
  ) : null;

  return (
    <div className="h-full">
      <BaseVideoPreview
        videoSrc={videoSrc}
        mode="video-editor"
        onVideoLoaded={handleVideoLoaded}
        onVideoError={handleVideoError}
        showControls={true}
        showOverlay={true}
        overlayContent={overlayContent}
        containerClassName="h-full"
        className="w-full h-auto max-h-[90%] object-contain rounded"
      />
      {/* Hidden video element for context ref - temporary solution */}
      <video
        ref={localVideoRef}
        src={videoSrc}
        style={{ display: 'none' }}
        onLoadedMetadata={handleVideoLoaded}
      />
    </div>
  );
};

export default VideoPreview;
