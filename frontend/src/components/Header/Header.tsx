import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={{
      height: '50px', // Reduced from 64px to save space
      backgroundColor: '#1a1a1b',
      borderBottom: '1px solid #343536',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px', // Reduced padding
      flexShrink: 0
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '28px', // Slightly smaller
          height: '28px',
          backgroundColor: 'rgba(236, 72, 153, 0.15)',
          border: '1px solid #ec4899',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg style={{ width: '16px', height: '16px', color: '#ec4899' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
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
          color: '#ec4899',
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