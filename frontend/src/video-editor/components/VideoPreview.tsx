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
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f0f0f'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280'
        }}>

          <p style={{ margin: 0, fontSize: '16px', fontFamily: '"Space Mono", monospace' }}>
            No Video Loaded
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
            Upload a video to see preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    }}>


      {/* Video Preview Area */}
      <div style={{
        flex: 1,
        backgroundColor: '#1a1a1b',
        borderRadius: '8px',
        border: '1px solid #343536',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: '500px',
        overflow: 'hidden'
      }}>
        <video
          ref={localVideoRef}
          src={videoSrc}
          controls
          preload="metadata"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '90%',
            objectFit: 'contain',
            borderRadius: '4px'
          }}
          onLoadedMetadata={handleVideoLoaded}
          onError={handleVideoError}
        />

        {/* Video Info Overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: '"Space Mono", monospace'
        }}>
          <div style={{ color: '#22c55e', marginBottom: '2px' }}>
            {project.video!.width} × {project.video!.height}
          </div>
          <div style={{ color: '#9ca3af' }}>
            {project.video!.duration.toFixed(1)}s • {(project.video!.file.size / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div style={{
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#1a1a1b',
        borderRadius: '6px',
        border: '1px solid #343536'
      }}>

      </div>
    </div>
  );
};

export default VideoPreview;
