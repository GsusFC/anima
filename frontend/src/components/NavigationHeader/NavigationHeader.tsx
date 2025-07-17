import React from 'react';
import { Link } from 'react-router-dom';

interface NavigationHeaderProps {
  onOpenAPIKeyModal?: () => void;
  currentMode?: 'slideshow' | 'video-editor' | 'home';
  projectName?: string;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  onOpenAPIKeyModal,
  currentMode = 'home',
  projectName
}) => {
  // const location = useLocation();
  // const navigate = useNavigate();



  return (
    <header style={{
      height: '70px',
      backgroundColor: '#1a1a1b',
      borderBottom: '1px solid #343536',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Logo and Home Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Link 
          to="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'rgba(236, 72, 153, 0.15)',
            border: '2px solid #ec4899',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg style={{ width: '20px', height: '20px', color: '#ec4899' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              fontFamily: '"Space Mono", monospace'
            }}>
              AnimaGen
            </h1>
            <p style={{
              fontSize: '10px',
              color: '#9ca3af',
              margin: 0,
              fontFamily: '"Space Mono", monospace'
            }}>
              Home
            </p>
          </div>
        </Link>



        {/* Project Name */}
        {projectName && (
          <>
            <span style={{ color: '#666666', fontSize: '16px' }}>→</span>
            <div style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '4px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#3b82f6',
                fontFamily: '"Space Mono", monospace',
                fontWeight: 'bold'
              }}>
                {projectName}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Center Navigation - Only show when not on home */}
      {currentMode !== 'home' && (
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
        <Link
          to="/slideshow"
          style={{
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: '"Space Mono", monospace',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            backgroundColor: currentMode === 'slideshow' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
            color: currentMode === 'slideshow' ? '#ec4899' : '#9ca3af',
            border: currentMode === 'slideshow' ? '1px solid #ec4899' : '1px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (currentMode !== 'slideshow') {
              e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.1)';
              e.currentTarget.style.color = '#ec4899';
            }
          }}
          onMouseLeave={(e) => {
            if (currentMode !== 'slideshow') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }
          }}
        >
          🖼️ SlideShow
        </Link>
        
        <Link
          to="/video-editor"
          style={{
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: '"Space Mono", monospace',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            backgroundColor: currentMode === 'video-editor' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            color: currentMode === 'video-editor' ? '#3b82f6' : '#9ca3af',
            border: currentMode === 'video-editor' ? '1px solid #3b82f6' : '1px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (currentMode !== 'video-editor') {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.color = '#3b82f6';
            }
          }}
          onMouseLeave={(e) => {
            if (currentMode !== 'video-editor') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }
          }}
        >
          🎬 Video Editor
        </Link>
        </nav>
      )}

      {/* Right Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginLeft: currentMode === 'home' ? 'auto' : '0'
      }}>


        {/* API Key Button */}
        {onOpenAPIKeyModal && (
          <button
            onClick={onOpenAPIKeyModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
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

        {/* Duration Display (for slideshow mode) */}
        {currentMode === 'slideshow' && (
          <div style={{
            fontSize: '14px',
            color: '#ec4899',
            fontFamily: '"Space Mono", monospace',
            fontWeight: 'bold',
            letterSpacing: '0.5px'
          }}>
            DURATION: <span id="timeline-duration">0.0s</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavigationHeader;
