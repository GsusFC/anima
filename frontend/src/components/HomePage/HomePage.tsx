import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../NavigationHeader/NavigationHeader';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      icon: '🖼️',
      title: 'Create Slideshow',
      description: 'Transform your images into stunning videos with smooth transitions and effects',
      path: '/slideshow',
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)'
    },
    {
      icon: '🎬',
      title: 'Edit Video',
      description: 'Trim, edit, and enhance your video files with professional tools',
      path: '/video-editor',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      fontFamily: '"Space Mono", monospace',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navigation Header */}
      <NavigationHeader currentMode="home" />

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center'
        }}>
          {/* Hero Section */}
          <div style={{
            marginBottom: '60px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              border: '3px solid #ec4899',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}>
              <svg style={{ width: '40px', height: '40px', color: '#ec4899' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>

            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              margin: '0 0 16px 0',
              background: 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              AnimaGen
            </h1>

            <p style={{
              fontSize: '20px',
              color: '#9ca3af',
              margin: '0 0 40px 0',
              lineHeight: '1.6'
            }}>
              Create stunning animated content with professional tools.
              <br />
              Choose your creative path and start building amazing videos.
            </p>
          </div>

          {/* Tool Selection */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {tools.map((tool, index) => (
              <div
                key={index}
                onClick={() => navigate(tool.path)}
                style={{
                  backgroundColor: '#1a1a1b',
                  border: '2px solid #343536',
                  borderRadius: '16px',
                  padding: '40px 32px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tool.color;
                  e.currentTarget.style.backgroundColor = tool.bgColor;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#343536';
                  e.currentTarget.style.backgroundColor = '#1a1a1b';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  fontSize: '64px',
                  marginBottom: '20px'
                }}>
                  {tool.icon}
                </div>

                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: tool.color,
                  margin: '0 0 12px 0'
                }}>
                  {tool.title}
                </h3>

                <p style={{
                  fontSize: '16px',
                  color: '#9ca3af',
                  margin: '0 0 24px 0',
                  lineHeight: '1.5'
                }}>
                  {tool.description}
                </p>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: tool.color,
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  Get Started
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div style={{
            marginTop: '60px',
            display: 'flex',
            gap: '32px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#9ca3af',
              fontSize: '14px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%'
              }} />
              No watermarks
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#9ca3af',
              fontSize: '14px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%'
              }} />
              Fast export
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#9ca3af',
              fontSize: '14px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#ec4899',
                borderRadius: '50%'
              }} />
              Professional quality
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;