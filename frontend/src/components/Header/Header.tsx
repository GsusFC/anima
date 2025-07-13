import React from 'react';

interface HeaderProps {
  onOpenAPIKeyModal?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAPIKeyModal }) => {
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
        {/* API Key Button */}
        {onOpenAPIKeyModal && (
          <button
            onClick={onOpenAPIKeyModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '6px',
              color: '#ec4899',
              fontSize: '12px',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.2)';
              e.currentTarget.style.borderColor = '#ec4899';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.3)';
            }}
          >
            <svg style={{ width: '14px', height: '14px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31.84 2.41 2 2.83V22h2v-2.17c1.16-.42 2-1.52 2-2.83 0-1.66-1.34-3-3-3zM10.5 2C9 2 7.73 3.15 7.59 4.59L7.17 8.41C7.05 9.85 8.23 11 9.67 11h1.66c1.44 0 2.62-1.15 2.5-2.59L13.41 4.59C13.27 3.15 12 2 10.5 2z"/>
            </svg>
            API KEYS
          </button>
        )}

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