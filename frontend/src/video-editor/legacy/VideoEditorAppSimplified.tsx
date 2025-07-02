import React, { useState, useRef, useCallback, useEffect } from 'react';

interface VideoData {
  file: File;
  id: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  thumbnails: string[];
}

interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
}

const VideoEditorAppSimplified: React.FC = () => {
  const [video, setVideo] = useState<VideoData | null>(null);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Generate thumbnails function
  const generateThumbnails = async (file: File, duration: number): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const thumbnails: string[] = [];
      let currentIndex = 0;
      const count = 6; // Reduced for faster generation
      let isProcessing = false;
      
      const cleanup = () => {
        if (video.src.startsWith('blob:')) {
          URL.revokeObjectURL(video.src);
        }
      };
      
      video.onloadeddata = () => {
        canvas.width = 100; // Smaller for faster processing
        canvas.height = 56;
        
        const captureFrame = () => {
          if (currentIndex >= count || isProcessing) {
            cleanup();
            resolve(thumbnails);
            return;
          }
          
          const time = Math.min((currentIndex / (count - 1)) * duration, duration - 0.1);
          video.currentTime = time;
        };
        
        video.onseeked = () => {
          if (isProcessing) return;
          
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnails.push(canvas.toDataURL('image/jpeg', 0.5));
            currentIndex++;
            setTimeout(captureFrame, 150); // Longer delay for stability
          } catch (error) {
            console.warn('Thumbnail capture error:', error);
            currentIndex++;
            captureFrame();
          }
        };
        
        // Timeout to prevent hanging
        setTimeout(() => {
          if (!isProcessing) {
            isProcessing = true;
            cleanup();
            resolve(thumbnails);
          }
        }, 15000); // 15 second timeout
        
        captureFrame();
      };
      
      video.onerror = () => {
        console.warn('Thumbnail video load error');
        cleanup();
        resolve([]);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Clear previous video resources
  const clearVideo = useCallback(() => {
    console.log('🧹 Clearing video resources...');
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.load(); // Force cleanup
    }
    
    // Clear state
    setVideo(null);
    setSegments([]);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsDragging(null);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    if (!selectedFile.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    console.log('📹 Starting new video upload:', selectedFile.name);
    
    // Clear any existing video first
    clearVideo();
    
    setIsUploading(true);
    
    try {
      // Quick metadata extraction
      const videoData = await new Promise<VideoData>((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        const cleanup = () => {
          if (video.src.startsWith('blob:')) {
            URL.revokeObjectURL(video.src);
          }
        };
        
        video.onloadedmetadata = () => {
          const data: VideoData = {
            file: selectedFile,
            id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: selectedFile.name,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            size: selectedFile.size,
            thumbnails: []
          };
          
          cleanup();
          console.log('✅ Video metadata extracted:', {
            duration: data.duration,
            resolution: `${data.width}x${data.height}`
          });
          resolve(data);
        };
        
        video.onerror = (e) => {
          cleanup();
          console.error('❌ Video metadata extraction failed:', e);
          reject(new Error('Failed to load video metadata'));
        };
        
        // Set timeout to prevent hanging
        setTimeout(() => {
          cleanup();
          reject(new Error('Video metadata extraction timeout'));
        }, 10000);
        
        video.src = URL.createObjectURL(selectedFile);
      });

      // Set video immediately
      setVideo(videoData);
      setSegments([{
        id: 'segment_1',
        startTime: 0,
        endTime: videoData.duration
      }]);
      setCurrentTime(0);
      setIsUploading(false);

      console.log('⚡ Video ready! Generating thumbnails...');

      // Generate thumbnails in background
      generateThumbnails(selectedFile, videoData.duration)
        .then(thumbnails => {
          console.log('🖼️ Thumbnails generated:', thumbnails.length);
          setVideo(prev => prev && prev.id === videoData.id ? { ...prev, thumbnails } : prev);
        })
        .catch(err => {
          console.warn('Thumbnail generation failed:', err);
        });

    } catch (error) {
      console.error('❌ Upload failed:', error);
      setIsUploading(false);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Timeline calculations - memoized to prevent zoom/trim issues
  const timelineWidth = React.useMemo(() => 
    video ? Math.max(800, video.duration * 50 * zoom) : 800, 
    [video, zoom]
  );
  
  const timeToPixel = React.useCallback((time: number) => 
    video ? (time / video.duration) * timelineWidth : 0, 
    [video, timelineWidth]
  );
  
  const pixelToTime = React.useCallback((pixel: number) => 
    video ? (pixel / timelineWidth) * video.duration : 0, 
    [video, timelineWidth]
  );

  // Handle timeline click
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || !video) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelToTime(x);
    const clampedTime = Math.max(0, Math.min(video.duration, time));
    
    setCurrentTime(clampedTime);
    if (videoRef.current) {
      videoRef.current.currentTime = clampedTime;
    }
  }, [video, pixelToTime]);

  // Handle trim drag
  const handleMouseDown = (e: React.MouseEvent, type: string, segmentId: string) => {
    e.preventDefault();
    setIsDragging(`${type}-${segmentId}`);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current || !video) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(video.duration, pixelToTime(x)));
    
    const [type, segmentId] = isDragging.split('-');
    
    setSegments(prev => prev.map(segment => {
      if (segment.id === segmentId) {
        if (type === 'start') {
          return { ...segment, startTime: Math.min(time, segment.endTime - 0.1) };
        } else if (type === 'end') {
          return { ...segment, endTime: Math.max(time, segment.startTime + 0.1) };
        }
      }
      return segment;
    }));
  }, [isDragging, video, pixelToTime]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Video time sync
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(videoEl.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('pause', handlePause);

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('pause', handlePause);
    };
  }, [isDragging]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (videoRef.current) {
            if (isPlaying) {
              videoRef.current.pause();
            } else {
              videoRef.current.play();
            }
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (video) {
            const step = e.shiftKey ? 5 : 1/30;
            const newTime = Math.max(0, currentTime - step);
            setCurrentTime(newTime);
            if (videoRef.current) videoRef.current.currentTime = newTime;
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (video) {
            const step = e.shiftKey ? 5 : 1/30;
            const newTime = Math.min(video.duration, currentTime + step);
            setCurrentTime(newTime);
            if (videoRef.current) videoRef.current.currentTime = newTime;
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [video, currentTime, isPlaying]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Space Mono", monospace',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        height: '60px',
        borderBottom: '1px solid #343536',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        backgroundColor: '#1a1a1b'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          color: '#22c55e',
          fontWeight: 'bold'
        }}>
          🎬 VIDEO EDITOR - Funcional & Rápido
        </h1>
        
        <div style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          {video ? `${video.name} • ${formatTime(video.duration)}` : 'No video loaded'}
        </div>
      </div>

      {/* Main Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {/* Top Section */}
        <div style={{
          flex: 1,
          display: 'flex',
          minHeight: 0
        }}>
          {/* Left - Upload */}
          <div style={{
            width: '320px',
            borderRight: '1px solid #343536',
            backgroundColor: '#1a1a1b',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#22c55e' }}>Upload Video</h3>
            
            {!video ? (
              <div
                style={{
                  border: '2px dashed #343536',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
              >
                {isUploading ? (
                  <div style={{ color: '#3b82f6' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                    <p>Processing...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📹</div>
                    <p style={{ margin: '0 0 10px 0' }}>Drop video here</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>or click to browse</p>
                  </>
                )}
              </div>
            ) : (
              <div style={{
                backgroundColor: '#272729',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#22c55e' }}>Video Info</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>Name: {video.name}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>Size: {formatFileSize(video.size)}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>Duration: {formatTime(video.duration)}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>Resolution: {video.width}×{video.height}</p>
                
                <button
                  onClick={clearVideo}
                  style={{
                    marginTop: '15px',
                    padding: '8px 16px',
                    backgroundColor: '#dc2626',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Remove Video
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

          {/* Center - Preview */}
          <div style={{
            flex: 1,
            borderRight: '1px solid #343536',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              flex: 1,
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {video ? (
                <video
                  ref={videoRef}
                  src={URL.createObjectURL(video.file)}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  controls
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎥</div>
                  <h3>Video Preview</h3>
                  <p>Upload a video to start editing</p>
                </div>
              )}
            </div>
          </div>

          {/* Right - Controls */}
          <div style={{
            width: '320px',
            backgroundColor: '#1a1a1b',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#22c55e' }}>Controls</h3>
            
            {video && (
              <>
                <div style={{
                  backgroundColor: '#272729',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Playback</h4>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    Time: {formatTime(currentTime)} / {formatTime(video.duration)}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    Status: {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#272729',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Timeline Zoom</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => setZoom(Math.max(0.5, zoom * 0.8))}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#343536',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: '60px', textAlign: 'center' }}>
                      {(zoom * 100).toFixed(0)}%
                    </span>
                    <button
                      onClick={() => setZoom(Math.min(3, zoom * 1.25))}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#343536',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#272729',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Segments</h4>
                  {segments.map(segment => (
                    <div key={segment.id} style={{ marginBottom: '10px', fontSize: '14px' }}>
                      <p style={{ margin: '2px 0' }}>
                        Start: {formatTime(segment.startTime)}
                      </p>
                      <p style={{ margin: '2px 0' }}>
                        End: {formatTime(segment.endTime)}
                      </p>
                      <p style={{ margin: '2px 0' }}>
                        Duration: {formatTime(segment.endTime - segment.startTime)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom - Timeline */}
        {video && (
          <div style={{
            height: '200px',
            borderTop: '1px solid #343536',
            backgroundColor: '#272729',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Timeline Header */}
            <div style={{
              height: '40px',
              backgroundColor: '#1a1a1b',
              borderBottom: '1px solid #343536',
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              gap: '20px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Timeline</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                SPACE: Play/Pause • ←/→: Frame • Shift+←/→: 5s
              </span>
            </div>

            {/* Timeline Track */}
            <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
              <div
                ref={timelineRef}
                style={{
                  width: `${timelineWidth}px`,
                  height: '120px',
                  backgroundColor: '#1a1a1b',
                  border: '1px solid #343536',
                  borderRadius: '4px',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={handleTimelineClick}
              >
                {/* Thumbnails Background */}
                {video.thumbnails.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex'
                  }}>
                    {video.thumbnails.map((thumb, index) => (
                      <div
                        key={index}
                        style={{
                          width: `${100 / video.thumbnails.length}%`,
                          height: '100%',
                          backgroundImage: `url(${thumb})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRight: '1px solid #4b5563',
                          opacity: 0.5
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Segments */}
                {segments.map(segment => (
                  <div
                    key={segment.id}
                    style={{
                      position: 'absolute',
                      left: `${timeToPixel(segment.startTime)}px`,
                      width: `${timeToPixel(segment.endTime - segment.startTime)}px`,
                      height: '100%',
                      backgroundColor: 'rgba(34, 197, 94, 0.7)',
                      border: '2px solid #22c55e',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {/* Trim Handles */}
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'start', segment.id)}
                      style={{
                        position: 'absolute',
                        left: '-4px',
                        top: 0,
                        width: '8px',
                        height: '100%',
                        backgroundColor: '#ffffff',
                        cursor: 'ew-resize',
                        borderRadius: '2px 0 0 2px'
                      }}
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'end', segment.id)}
                      style={{
                        position: 'absolute',
                        right: '-4px',
                        top: 0,
                        width: '8px',
                        height: '100%',
                        backgroundColor: '#ffffff',
                        cursor: 'ew-resize',
                        borderRadius: '0 2px 2px 0'
                      }}
                    />
                    
                    <span>{formatTime(segment.endTime - segment.startTime)}</span>
                  </div>
                ))}

                {/* Playhead */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${timeToPixel(currentTime)}px`,
                    top: 0,
                    width: '2px',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    zIndex: 10
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-6px',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '8px solid #ffffff'
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoEditorAppSimplified;
