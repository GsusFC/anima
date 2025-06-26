import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={{
      height: '64px',
      backgroundColor: '#1a1a1b',
      borderBottom: '1px solid #343536',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: 'rgba(255, 69, 0, 0.15)',
          border: '1px solid #ff4500',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg style={{ width: '20px', height: '20px', color: '#ff4500' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            fontFamily: '"Space Mono", monospace'
          }}>
            ANIMAGEN
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0,
            fontFamily: '"Space Mono", monospace'
          }}>
            ANIMATED GIF & VIDEO CREATOR
          </p>
        </div>
      </div>
      
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#ff4500',
          fontFamily: '"Space Mono", monospace',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          DURATION: <span id="timeline-duration">0.0s</span>
        </div>
      </div>
    </header>
  );
};

export default Header; 