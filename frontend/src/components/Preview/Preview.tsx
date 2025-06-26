import React, { useState, useEffect, useRef } from 'react';

const Preview: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [previews, setPreviews] = useState<{[key: string]: string}>({});
  const intervalRef = useRef<number | null>(null);
  const frameStartTime = useRef(Date.now());

  // Sync with timeline data
  useEffect(() => {
    const checkTimelineData = () => {
      const data = (window as any).__timelineData || [];
      if (data.length !== timelineData.length || JSON.stringify(data) !== JSON.stringify(timelineData)) {
        setTimelineData(data);
        setCurrentFrame(0);
        setIsPlaying(false);
        
        // Create previews for new files
        data.forEach((item: any) => {
          if (item.file) {
            createPreview(item.file);
          }
        });
      }
    };

    const interval = setInterval(checkTimelineData, 100);
    return () => clearInterval(interval);
  }, [timelineData]);

  // Create preview from file
  const createPreview = (file: File) => {
    const key = file.name + file.size;
    if (!previews[key]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews(prev => ({
            ...prev,
            [key]: e.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Animation logic
  useEffect(() => {
    if (isPlaying && timelineData.length > 0) {
      const currentFrameData = timelineData[currentFrame];
      if (currentFrameData) {
        const frameDuration = currentFrameData.duration || 1000;
        
        intervalRef.current = window.setTimeout(() => {
          setCurrentFrame(prev => (prev + 1) % timelineData.length);
        }, frameDuration);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, currentFrame, timelineData]);

  const handlePlay = () => {
    if (timelineData.length === 0) return;
    setIsPlaying(true);
    frameStartTime.current = Date.now();
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getCurrentPreview = () => {
    if (timelineData.length === 0 || currentFrame >= timelineData.length) return null;
    const currentFrameData = timelineData[currentFrame];
    if (!currentFrameData?.file) return null;
    const key = currentFrameData.file.name + currentFrameData.file.size;
    return previews[key];
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px'
    }}>
      {/* Preview Area */}
      <div style={{
        flex: 1,
        backgroundColor: '#0f0f0f',
        border: '1px solid #343536',
        borderRadius: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: '250px',
        maxHeight: '300px'
      }}>
        {/* Preview Content */}
        {getCurrentPreview() ? (
          <img
            src={getCurrentPreview()!}
            alt={`Frame ${currentFrame + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          /* Placeholder */
          <div style={{
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p style={{ margin: 0, fontSize: '14px', fontFamily: '"Space Mono", monospace' }}>
              Your animation will appear here
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#4b5563', fontFamily: '"Space Mono", monospace' }}>
              Upload images to get started
            </p>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button 
          onClick={handlePlay}
          disabled={timelineData.length === 0 || isPlaying}
          style={{
            backgroundColor: 'rgba(255, 69, 0, 0.15)',
            color: '#ff4500',
            border: '1px solid #ff4500',
            borderRadius: '2px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: timelineData.length === 0 || isPlaying ? 'not-allowed' : 'pointer',
            opacity: timelineData.length === 0 || isPlaying ? 0.5 : 1,
            fontFamily: '"Space Mono", monospace'
          }}
        >
          <svg style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          {isPlaying ? 'PLAYING...' : 'PLAY'}
        </button>
        
        <button 
          onClick={handleStop}
          disabled={!isPlaying}
          style={{
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: !isPlaying ? 'not-allowed' : 'pointer',
            opacity: !isPlaying ? 0.5 : 1,
            fontFamily: '"Space Mono", monospace'
          }}
        >
          <svg style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z"/>
          </svg>
          STOP
        </button>
        
        <div style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: '#9ca3af',
          fontFamily: '"Space Mono", monospace'
        }}>
          Frame {timelineData.length > 0 ? currentFrame + 1 : 0} of {timelineData.length}
        </div>
      </div>
    </div>
  );
};

export default Preview; 