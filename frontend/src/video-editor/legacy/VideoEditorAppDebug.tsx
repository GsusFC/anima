import React, { useState, useRef } from 'react';

const VideoEditorAppDebug: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setStatus('Processing...');
    
    // Simple video processing
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const info = {
        name: selectedFile.name,
        size: selectedFile.size,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        type: selectedFile.type
      };
      
      setVideoInfo(info);
      setStatus('Ready!');
      
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(selectedFile);
      }
      
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = (e) => {
      setError(`Video load error: ${e}`);
      setStatus('Error');
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(selectedFile);
  };

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Space Mono", monospace',
      padding: '20px'
    }}>
      <h1 style={{ color: '#22c55e', marginBottom: '20px' }}>
        🔍 Video Editor Debug Mode
      </h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Status: <span style={{ color: error ? '#ff4444' : '#44ff44' }}>{status}</span></p>
        {error && <p style={{ color: '#ff4444' }}>Error: {error}</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Select Video File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e.target.files)}
        />
      </div>

      {videoInfo && (
        <div style={{
          backgroundColor: '#1a1a1b',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#22c55e', margin: '0 0 10px 0' }}>Video Information</h3>
          <p>Name: {videoInfo.name}</p>
          <p>Size: {(videoInfo.size / 1024 / 1024).toFixed(2)} MB</p>
          <p>Duration: {videoInfo.duration.toFixed(2)} seconds</p>
          <p>Resolution: {videoInfo.width} × {videoInfo.height}</p>
          <p>Type: {videoInfo.type}</p>
        </div>
      )}

      {file && (
        <div style={{
          flex: 1,
          backgroundColor: '#000',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <video
            ref={videoRef}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af' }}>
        <p>🔧 This debug mode tests basic video upload functionality</p>
        <p>📋 Steps: 1) Select video → 2) Check info → 3) Verify playback</p>
      </div>
    </div>
  );
};

export default VideoEditorAppDebug;
