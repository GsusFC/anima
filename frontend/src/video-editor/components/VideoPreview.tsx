import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useVideoEditorContext } from '../context/VideoEditorContext';

const VideoPreview: React.FC = () => {
  const { project, hasVideo, setVideoRef } = useVideoEditorContext();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Register video ref with context when component mounts
  useEffect(() => {
    if (localVideoRef.current) {
      setVideoRef(localVideoRef);
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
    return (
      <div className="h-full flex items-center justify-center bg-dark-850">
        <div className="text-center text-dark-500">
          <p className="m-0 text-xl font-mono">
            No Video Loaded
          </p>
          <p className="mt-2 text-sm">
            Upload a video to see preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-5">
      {/* Video Preview Area */}
      <div className="panel flex-1 flex items-center justify-center relative min-h-[500px] overflow-hidden">
        <video
          ref={localVideoRef}
          src={videoSrc}
          controls
          preload="metadata"
          className="w-full h-auto max-h-[90%] object-contain rounded"
          onLoadedMetadata={handleVideoLoaded}
          onError={handleVideoError}
        />

        {/* Video Info Overlay */}
        <div className="absolute top-2.5 left-2.5 bg-black/80 px-3 py-2 rounded text-xs font-mono">
          <div className="text-accent-green mb-0.5">
            {project.video!.width} × {project.video!.height}
          </div>
          <div className="text-dark-400">
            {project.video!.duration.toFixed(1)}s • {(project.video!.file.size / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
