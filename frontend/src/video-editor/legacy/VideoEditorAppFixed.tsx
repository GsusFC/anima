import React, { useState, useRef } from 'react';

interface VideoWithThumbnail {
  file: File;
  duration: number;
  width: number;
  height: number;
  thumbnails: string[];
  isLoading: boolean;
}

const VideoEditorAppFixed: React.FC = () => {
  const [videos, setVideos] = useState<VideoWithThumbnail[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoWithThumbnail | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateVideoThumbnails = async (file: File, duration: number, count: number = 5): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const thumbnails: string[] = [];
      let currentIndex = 0;
      let seekTimer: ReturnType<typeof setTimeout> | null = null;
      const SEEK_TIMEOUT_MS = 5000;
      
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

          // If onseeked never fires, abort this frame and continue.
          if (seekTimer) clearTimeout(seekTimer);
          seekTimer = setTimeout(() => {
            console.warn('Seek timeout, skipping frame', currentIndex);
            currentIndex++;
            captureFrame();
          }, SEEK_TIMEOUT_MS);
        };
        
        video.onseeked = () => {
          // Clear per-seek timer
          if (seekTimer) clearTimeout(seekTimer);

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
        // Remove failed video
        setVideos(prev => prev.filter(v => v.file !== videoFiles[i]));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb < 1000 ? `${mb.toFixed(1)}MB` : `${(mb / 1024).toFixed(1)}GB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        backgroundColor: '#1a1a1b',
        flexShrink: 0
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          color: '#22c55e',
          fontWeight: 'bold'
        }}>
          🎬 PROFESSIONAL VIDEO EDITOR - Multi-Video
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
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #343536'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <h3 style={{
                margin: 0,
                color: '#22c55e',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                Video Library
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Add Videos
              </button>
            </div>
            <p style={{
              margin: 0,
              color: '#9ca3af',
              fontSize: '12px'
            }}>
              {videos.length} video{videos.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Video List */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px'
          }}>
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
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
                <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Drop videos here</p>
                <p style={{ margin: 0, fontSize: '12px' }}>or click "Add Videos" to browse</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {videos.map((video, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: selectedVideo === video ? '#2563eb20' : '#272729',
                      border: selectedVideo === video ? '1px solid #3b82f6' : '1px solid #343536',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: video.isLoading ? 0.6 : 1
                    }}
                    onClick={() => !video.isLoading && setSelectedVideo(video)}
                    onMouseOver={(e) => {
                      if (selectedVideo !== video && !video.isLoading) {
                        e.currentTarget.style.backgroundColor = '#343536';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedVideo !== video && !video.isLoading) {
                        e.currentTarget.style.backgroundColor = '#272729';
                      }
                    }}
                  >
                    {/* Video Thumbnail */}
                    <div style={{
                      width: '100%',
                      height: '60px',
                      backgroundColor: '#343536',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {video.isLoading ? (
                        <div style={{ 
                          color: '#9ca3af', 
                          fontSize: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ marginBottom: '4px' }}>⏳</div>
                          Loading...
                        </div>
                      ) : video.thumbnails.length > 0 ? (
                        <img
                          src={video.thumbnails[0]}
                          alt={video.file.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        <svg style={{ width: '24px', height: '24px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                      
                      {/* Duration overlay */}
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
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {video.file.name}
                      </h4>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#9ca3af',
                        marginBottom: '4px'
                      }}>
                        <span>{formatFileSize(video.file.size)}</span>
                        <span>{video.width > 0 ? `${video.width}×${video.height}` : 'Processing...'}</span>
                      </div>
                      {!video.isLoading && video.duration > 0 && (
                        <div style={{
                          fontSize: '12px',
                          color: '#9ca3af'
                        }}>
                          Duration: {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hidden file input */}
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
            {selectedVideo ? (
              <video
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                controls
                src={URL.createObjectURL(selectedVideo.file)}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎥</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Multi-Video Editor</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Select a video from the library to preview
                </p>
              </div>
            )}

            {/* Controls Overlay */}
            {selectedVideo && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '8px',
                padding: '12px',
                backdropFilter: 'blur(4px)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '14px'
                }}>
                  <span style={{ color: 'white' }}>{selectedVideo.file.name}</span>
                  <span style={{ color: '#9ca3af', fontFamily: 'monospace' }}>
                    {formatFileSize(selectedVideo.file.size)} • {formatDuration(selectedVideo.duration)} • {selectedVideo.width}×{selectedVideo.height}
                  </span>
                </div>
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <button style={{
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
                }}>
                  ▶️
                </button>
                <span style={{
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>
                  0:00 / {videos.length > 0 ? `${videos.length} videos` : '0:00'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <button style={{
                  padding: '4px 8px',
                  backgroundColor: '#343536',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}>
                  −
                </button>
                <span style={{ color: 'white', fontSize: '12px', width: '48px', textAlign: 'center' }}>
                  100%
                </span>
                <button style={{
                  padding: '4px 8px',
                  backgroundColor: '#343536',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}>
                  +
                </button>
              </div>
            </div>

            {/* Timeline Content */}
            <div style={{
              flex: 1,
              backgroundColor: '#343536',
              position: 'relative',
              overflow: 'auto'
            }}>
              {videos.length === 0 ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}>
                  Drag videos from library to create sequence
                </div>
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  gap: '8px'
                }}>
                  {videos.map((video, index) => (
                    <div
                      key={index}
                      style={{
                        height: '60px',
                        width: '100px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: selectedVideo === video ? '2px solid #22c55e' : '1px solid #2563eb',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onClick={() => setSelectedVideo(video)}
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
                        backgroundColor: video.thumbnails.length > 0 ? 'rgba(59, 130, 246, 0.8)' : '#3b82f6',
                        borderRadius: '2px',
                        padding: '4px'
                      }}>
                        {video.isLoading ? (
                          <div>
                            <div style={{ marginBottom: '4px' }}>⏳</div>
                            <div style={{ fontSize: '10px' }}>Loading...</div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ marginBottom: '4px' }}>📹</div>
                            <div style={{ fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {video.file.name.substring(0, 10)}...
                            </div>
                            <div style={{ fontSize: '9px', marginTop: '2px' }}>
                              {formatDuration(video.duration)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          {/* Export Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #343536'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              color: '#22c55e',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Export Settings
            </h3>
            <p style={{
              margin: 0,
              color: '#9ca3af',
              fontSize: '12px'
            }}>
              {videos.length > 0 ? `${videos.length} videos ready` : 'No videos to export'}
            </p>
          </div>

          {/* Export Settings */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflow: 'auto'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#d1d5db',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Format
              </label>
              <select style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#272729',
                border: '1px solid #343536',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px'
              }}>
                <option>MP4 (H.264)</option>
                <option>WebM (VP9)</option>
                <option>MOV</option>
                <option>GIF</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#d1d5db',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Quality
              </label>
              <select style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#272729',
                border: '1px solid #343536',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px'
              }}>
                <option>Web (Small file)</option>
                <option>Standard</option>
                <option>High</option>
                <option>Ultra</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#d1d5db',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Resolution
              </label>
              <select style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#272729',
                border: '1px solid #343536',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px'
              }}>
                <option>Original</option>
                <option>1080p (1920×1080)</option>
                <option>720p (1280×720)</option>
                <option>480p (854×480)</option>
              </select>
            </div>

            {/* Keyboard Shortcuts Info */}
            <div style={{
              backgroundColor: '#272729',
              border: '1px solid #343536',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: '#22c55e',
                fontSize: '14px'
              }}>
                Keyboard Shortcuts
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
                  </code> - Frame Step
                </div>
                <div>
                  <code style={{ backgroundColor: '#343536', padding: '2px 4px', borderRadius: '2px' }}>
                    Shift + ←/→
                  </code> - 5s Jump
                </div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div style={{ padding: '16px', borderTop: '1px solid #343536' }}>
            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: videos.length > 0 ? '#22c55e' : '#343536',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: videos.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              disabled={videos.length === 0}
              onClick={() => {
                if (videos.length === 0) {
                  alert('Add videos to export first');
                  return;
                }
                // Placeholder export action
                alert(`Exporting ${videos.length} videos (not implemented)`);
              }}
            >
              {videos.length > 0 ? 'Export Sequence' : 'Add Videos to Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorAppFixed;
