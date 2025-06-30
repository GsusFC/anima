import React from 'react';

const VideoEditorAppTest: React.FC = () => {
  return (
    <div style={{ 
      height: '100vh', 
      background: '#0a0a0b', 
      color: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#ff4500', marginBottom: '20px' }}>🎬 VIDEO EDITOR</h1>
        <p>La nueva interfaz multi-video está funcionando!</p>
        <p style={{ fontSize: '16px', marginTop: '20px', color: '#9ca3af' }}>
          URL: /video-editor
        </p>
      </div>
    </div>
  );
};

export default VideoEditorAppTest;
