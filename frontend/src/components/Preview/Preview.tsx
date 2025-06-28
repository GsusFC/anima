import React, { useState, useEffect, useRef } from 'react';

// Add spinning animation inline
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject the CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

const Preview: React.FC = () => {
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync with timeline data and generate preview
  useEffect(() => {
    const checkTimelineData = () => {
      const data = (window as any).__timelineData || [];
      if (JSON.stringify(data) !== JSON.stringify(timelineData)) {
        setTimelineData(data);
        setPreviewVideoUrl(null);
        setError(null);
        
        if (data.length > 0) {
          generatePreview(data);
        }
      }
    };
    const interval = setInterval(checkTimelineData, 500);
    return () => clearInterval(interval);
  }, [timelineData]);

  const generatePreview = async (data: any[]) => {
    const sessionId = (window as any).__sessionId;
    if (!sessionId || data.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const payload = {
        images: data.map(item => ({ filename: item.uploadedFile?.filename || item.file.name })),
        transitions: data.slice(0, -1).map(item => ({
          type: item.transition?.type || 'fade',
          duration: item.transition?.duration || 500 // Already in milliseconds from Timeline
        })),
        frameDurations: data.map(item => item.duration || 1000),
        sessionId
      };

      console.log('Preview payload:', JSON.stringify(payload, null, 2));

      const API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : window.location.origin;
      
      const response = await fetch(`${API_BASE_URL}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('Preview response:', result);
      
      if (result.success) {
        const videoUrl = `${API_BASE_URL}${result.previewUrl}?t=${Date.now()}`;
        console.log('Setting preview video URL:', videoUrl);
        setPreviewVideoUrl(videoUrl);
      } else {
        console.error('Preview error from backend:', result);
        setError(result.error || 'Preview generation failed');
      }
    } catch (error) {
      console.error('Preview error:', error);
      setError('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <div style={{ flex: 1, backgroundColor: '#0f0f0f', border: '1px solid #343536', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '500px', maxHeight: '600px', overflow: 'hidden' }}>
        
        {/* Loading State */}
        {isGenerating && (
          <div style={{ textAlign: 'center', color: '#ff4500' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #374151',
              borderTop: '3px solid #ff4500',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ margin: 0, fontSize: '14px', fontFamily: '"Space Mono", monospace' }}>Generating preview...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p style={{ margin: 0, fontSize: '14px', fontFamily: '"Space Mono", monospace' }}>Preview Error</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280', fontFamily: '"Space Mono", monospace' }}>{error}</p>
          </div>
        )}

        {/* Video Preview */}
        {previewVideoUrl && !isGenerating && (
          <video
            ref={videoRef}
            src={previewVideoUrl}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            controls
            loop
            onError={() => setError('Failed to load preview video')}
          />
        )}

        {/* Empty State */}
        {!previewVideoUrl && !isGenerating && !error && (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p style={{ margin: 0, fontSize: '14px', fontFamily: '"Space Mono", monospace' }}>Your animation will appear here</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#4b5563', fontFamily: '"Space Mono", monospace' }}>Upload images to get started</p>
          </div>
        )}
      </div>
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={handlePlay} 
          disabled={!previewVideoUrl || isGenerating} 
          style={{ 
            backgroundColor: 'rgba(255, 69, 0, 0.15)', 
            color: '#ff4500', 
            border: '1px solid #ff4500', 
            borderRadius: '2px', 
            padding: '8px 16px', 
            fontSize: '14px', 
            fontWeight: '500', 
            cursor: (!previewVideoUrl || isGenerating) ? 'not-allowed' : 'pointer', 
            opacity: (!previewVideoUrl || isGenerating) ? 0.5 : 1, 
            fontFamily: '"Space Mono", monospace', 
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        >
          <svg style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          PLAY
        </button>
        <button 
          onClick={handleStop} 
          disabled={!previewVideoUrl} 
          style={{ 
            backgroundColor: '#374151', 
            color: 'white', 
            border: 'none', 
            borderRadius: '2px', 
            padding: '8px 16px', 
            fontSize: '14px', 
            fontWeight: '500', 
            cursor: !previewVideoUrl ? 'not-allowed' : 'pointer', 
            opacity: !previewVideoUrl ? 0.5 : 1, 
            fontFamily: '"Space Mono", monospace', 
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        >
          <svg style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z"/>
          </svg>
          STOP
        </button>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af', fontFamily: '"Space Mono", monospace' }}>
          {isGenerating && <span style={{ color: '#ff4500' }}>• Generating preview...</span>}
          {previewVideoUrl && !isGenerating && <span style={{ color: '#10b981' }}>• Preview ready</span>}
          {timelineData.length > 0 && <span style={{ marginLeft: '8px' }}>{timelineData.length} frame{timelineData.length !== 1 ? 's' : ''}</span>}
        </div>
      </div>
    </div>
  );
};

export default Preview; 