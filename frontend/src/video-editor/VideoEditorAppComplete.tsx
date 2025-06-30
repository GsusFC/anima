import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VideoWithThumbnail {
  file: File;
  duration: number;
  width: number;
  height: number;
  thumbnails: string[];
  isLoading: boolean;
  id: string;
}

interface VideoSequenceItem {
  id: string;
  videoId: string;
  startTime: number;  // Trim start in original video
  endTime: number;    // Trim end in original video
  position: number;   // Position in sequence
  duration: number;   // Trimmed duration
}

const VideoEditorAppComplete: React.FC = () => {
  const [videos, setVideos] = useState<VideoWithThumbnail[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoWithThumbnail | null>(null);
  const [sequence, setSequence] = useState<VideoSequenceItem[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const generateVideoThumbnails = async (file: File, duration: number, count: number = 10): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const thumbnails: string[] = [];
      let currentIndex = 0;
      
      video.onloadeddata = () => {
        canvas.width = 160;
        canvas.height = 90;
        
        const captureFrame = () => {
          if (currentIndex >= count) {
            URL.revokeObjectURL(video.src);
            resolve(thumbnails);
            return;
          }
          
          const time = (currentIndex / (count - 1)) * duration;
          video.currentTime = time;
        };
        
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
          currentIndex++;
          captureFrame();
        };
        
        captureFrame();
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const extractVideoMetadata = async (file: File): Promise<VideoWithThumbnail> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = async () => {
        const thumbnails = await generateVideoThumbnails(file, video.duration);
        
        const videoData: VideoWithThumbnail = {
          file,
          id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          thumbnails,
          isLoading: false
        };
        
        URL.revokeObjectURL(video.src);
        resolve(videoData);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          file,
          id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          duration: 0,
          width: 1920,
          height: 1080,
          thumbnails: [],
          isLoading: false
        });
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
    
    // Add videos with loading state first
    const loadingVideos = videoFiles.map(file => ({
      file,
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      duration: 0,
      width: 0,
      height: 0,
      thumbnails: [],
      isLoading: true
    }));
    
    setVideos(prev => [...prev, ...loadingVideos]);

    // Process each video to extract metadata and thumbnails
    for (let i = 0; i < videoFiles.length; i++) {
      try {
        const videoData = await extractVideoMetadata(videoFiles[i]);
        setVideos(prev => 
          prev.map(v => 
            v.file === videoFiles[i] ? videoData : v
          )
        );
      } catch (error) {
        console.error('Error processing video:', error);
        setVideos(prev => prev.filter(v => v.file !== videoFiles[i]));
      }
    }
  };

  const addVideoToSequence = (video: VideoWithThumbnail) => {
    const sequenceItem: VideoSequenceItem = {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoId: video.id,
      startTime: 0,
      endTime: video.duration,
      position: getSequenceDuration(),
      duration: video.duration
    };
    
    setSequence(prev => [...prev, sequenceItem]);
  };

  const getSequenceDuration = () => {
    return sequence.reduce((total, item) => Math.max(total, item.position + item.duration), 0);
  };

  const getCurrentSequenceItem = () => {
    return sequence.find(item => 
      currentTime >= item.position && currentTime < item.position + item.duration
    );
  };

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const sequenceDuration = getSequenceDuration();
    const time = (x / (timelineRef.current.offsetWidth)) * sequenceDuration;
    
    setCurrentTime(Math.max(0, Math.min(sequenceDuration, time)));
  }, [sequence]);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Sync video with timeline
  useEffect(() => {
    if (!videoRef.current) return;
    
    const currentItem = getCurrentSequenceItem();
    if (!currentItem) return;
    
    const video = videos.find(v => v.id === currentItem.videoId);
    if (!video) return;
    
    const relativeTime = currentTime - currentItem.position;
    const videoTime = currentItem.startTime + relativeTime;
    
    if (videoRef.current.src !== URL.createObjectURL(video.file)) {
      videoRef.current.src = URL.createObjectURL(video.file);
    }
    
    videoRef.current.currentTime = Math.max(currentItem.startTime, Math.min(videoTime, currentItem.endTime));
  }, [currentTime, sequence, videos]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          const stepBack = e.shiftKey ? 5 : 1/30; // 5s or 1 frame
          setCurrentTime(prev => Math.max(0, prev - stepBack));
          break;
        case 'ArrowRight':
          e.preventDefault();
          const stepForward = e.shiftKey ? 5 : 1/30;
          setCurrentTime(prev => Math.min(getSequenceDuration(), prev + stepForward));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb < 1000 ? `${mb.toFixed(1)}MB` : `${(mb / 1024).toFixed(1)}GB`;
  };

  const sequenceDuration = getSequenceDuration();
  const timelineWidth = Math.max(800, sequenceDuration * 50 * timelineZoom);

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
        backgroundColor: '#1a1a1b',
        flexShrink: 0
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          color: '#ff4500',
          fontWeight: 'bold'
        }}>
          🎬 PROFESSIONAL VIDEO EDITOR - Full Featured
        </h1>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        minHeight: 0
      }}>
        {/* Left Panel - Video Library */}
        <div style={{
          width: '320px',
          borderRight: '1px solid #343536',
          backgroundColor: '#1a1a1b',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Library Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid #343536' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, color: '#ff4500', fontSize: '16px', fontWeight: '600' }}>Video Library</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Add Videos
              </button>
            </div>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
              {videos.length} videos • {sequence.length} in sequence
            </p>
          </div>

          {/* Video List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            {videos.length === 0 ? (
              <div
                style={{
                  border: '2px dashed #343536',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  cursor: 'pointer'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
                <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Drop videos here</p>
                <p style={{ margin: 0, fontSize: '12px' }}>or click "Add Videos"</p>
              </div>
            ) : (
              videos.map((video, index) => (
                <div
                  key={video.id}
                  style={{
                    backgroundColor: selectedVideo === video ? '#2563eb20' : '#272729',
                    border: selectedVideo === video ? '1px solid #3b82f6' : '1px solid #343536',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    opacity: video.isLoading ? 0.6 : 1
                  }}
                  onClick={() => setSelectedVideo(video)}
                  onDoubleClick={() => !video.isLoading && addVideoToSequence(video)}
                >
                  {/* Video Thumbnail */}
                  <div style={{
                    width: '100%',
                    height: '60px',
                    backgroundColor: '#343536',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {video.isLoading ? (
                      <div style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '4px' }}>⏳</div>
                        Loading...
                      </div>
                    ) : video.thumbnails.length > 0 ? (
                      <img
                        src={video.thumbnails[0]}
                        alt={video.file.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <svg style={{ width: '24px', height: '24px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    {!video.isLoading && video.duration > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '2px 4px',
                        borderRadius: '2px',
                        fontSize: '10px',
                        fontFamily: 'monospace'
                      }}>
                        {formatTime(video.duration)}
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div>
                    <h4 style={{
                      margin: '0 0 4px 0',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {video.file.name}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {formatFileSize(video.file.size)} • {video.width}×{video.height}
                    </div>
                    {!video.isLoading && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                        Double-click to add to sequence
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>

        {/* Center Panel - Preview & Timeline */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}>
          {/* Video Preview */}
          <div style={{
            flex: 1,
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {sequence.length > 0 ? (
              <>
                <video
                  ref={videoRef}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  muted
                  playsInline
                />
                
                {/* Preview Controls */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    color: 'white'
                  }}>
                    <span>Sequence Preview</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {formatTime(currentTime)} / {formatTime(sequenceDuration)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎥</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Professional Video Editor</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Add videos to library and double-click to create sequence
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div style={{
            height: '200px',
            borderTop: '1px solid #343536',
            backgroundColor: '#272729',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Timeline Header */}
            <div style={{
              height: '48px',
              backgroundColor: '#1a1a1b',
              borderBottom: '1px solid #343536',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={togglePlayback}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <span style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px' }}>
                  {formatTime(currentTime)} / {formatTime(sequenceDuration)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setTimelineZoom(timelineZoom * 0.8)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#343536',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  −
                </button>
                <span style={{ color: 'white', fontSize: '12px', width: '48px', textAlign: 'center' }}>
                  {(timelineZoom * 100).toFixed(0)}%
                </span>
                <button
                  onClick={() => setTimelineZoom(timelineZoom * 1.25)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#343536',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Timeline Content */}
            <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
              <div
                ref={timelineRef}
                style={{
                  height: '100%',
                  backgroundColor: '#343536',
                  position: 'relative',
                  cursor: 'pointer',
                  minWidth: timelineWidth
                }}
                onClick={handleTimelineClick}
              >
                {sequence.length === 0 ? (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    Double-click videos in library to create sequence
                  </div>
                ) : (
                  <>
                    {/* Sequence Items */}
                    {sequence.map((item) => {
                      const video = videos.find(v => v.id === item.videoId);
                      if (!video) return null;
                      
                      const left = (item.position / sequenceDuration) * timelineWidth;
                      const width = (item.duration / sequenceDuration) * timelineWidth;
                      
                      return (
                        <div
                          key={item.id}
                          style={{
                            position: 'absolute',
                            left,
                            width: Math.max(width, 60),
                            height: '80px',
                            top: '20px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '4px',
                            border: '1px solid #2563eb',
                            overflow: 'hidden',
                            cursor: 'move'
                          }}
                        >
                          {/* Thumbnail background */}
                          {video.thumbnails.length > 0 && (
                            <img
                              src={video.thumbnails[0]}
                              alt={video.file.name}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                opacity: 0.3
                              }}
                            />
                          )}
                          
                          {/* Content overlay */}
                          <div style={{
                            position: 'relative',
                            zIndex: 1,
                            padding: '8px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                              {video.file.name.substring(0, 15)}...
                            </div>
                            <div style={{ color: '#e5e7eb', fontSize: '10px' }}>
                              {formatTime(item.duration)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Playhead */}
                    <div
                      style={{
                        position: 'absolute',
                        left: (currentTime / sequenceDuration) * timelineWidth,
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        backgroundColor: '#ff4500',
                        zIndex: 10,
                        cursor: 'ew-resize'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '-6px',
                        width: '14px',
                        height: '16px',
                        backgroundColor: '#ff4500',
                        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                      }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Export Controls */}
        <div style={{
          width: '320px',
          borderLeft: '1px solid #343536',
          backgroundColor: '#1a1a1b',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #343536' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#ff4500', fontSize: '16px', fontWeight: '600' }}>
              Export Settings
            </h3>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
              {sequence.length > 0 ? `Sequence: ${formatTime(sequenceDuration)}` : 'No sequence to export'}
            </p>
          </div>

          <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
            {/* Keyboard Shortcuts */}
            <div style={{
              backgroundColor: '#272729',
              border: '1px solid #343536',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ff4500', fontSize: '14px' }}>
                🎮 Controls
              </h4>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                <div style={{ marginBottom: '4px' }}>
                  <code style={{ backgroundColor: '#343536', padding: '2px 4px', borderRadius: '2px' }}>
                    SPACE
                  </code> - Play/Pause
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <code style={{ backgroundColor: '#343536', padding: '2px 4px', borderRadius: '2px' }}>
                    ←/→
                  </code> - Frame Step (1/30s)
                </div>
                <div>
                  <code style={{ backgroundColor: '#343536', padding: '2px 4px', borderRadius: '2px' }}>
                    Shift + ←/→
                  </code> - 5s Jump
                </div>
              </div>
            </div>

            {/* Sequence Info */}
            {sequence.length > 0 && (
              <div style={{
                backgroundColor: '#272729',
                border: '1px solid #343536',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#ff4500', fontSize: '14px' }}>
                  📊 Sequence Info
                </h4>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  <div>Videos: {sequence.length}</div>
                  <div>Total Duration: {formatTime(sequenceDuration)}</div>
                  <div>Current Time: {formatTime(currentTime)}</div>
                  <div>Zoom: {(timelineZoom * 100).toFixed(0)}%</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #343536' }}>
            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: sequence.length > 0 ? '#ff4500' : '#343536',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: sequence.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              disabled={sequence.length === 0}
            >
              {sequence.length > 0 ? 'Export Sequence' : 'Add Videos to Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorAppComplete;
