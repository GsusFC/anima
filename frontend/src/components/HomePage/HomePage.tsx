import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface RecentProject {
  id: string;
  name: string;
  type: 'slideshow' | 'video';
  thumbnail: string;
  lastModified: string;
  duration: string;
}

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  path: string;
  color: string;
  bgColor: string;
  comingSoon?: boolean;
  stats?: {
    projects: number;
    avgDuration: string;
  };
}

const HomePage: React.FC = () => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const navigate = useNavigate();

  // Mock recent projects - in real app, fetch from API
  useEffect(() => {
    const mockProjects: RecentProject[] = [
      {
        id: '1',
        name: 'Product Launch Video',
        type: 'slideshow',
        thumbnail: '/api/placeholder/160/90',
        lastModified: '2 hours ago',
        duration: '1:32'
      },
      {
        id: '2',
        name: 'Marketing Clip',
        type: 'video',
        thumbnail: '/api/placeholder/160/90',
        lastModified: '1 day ago',
        duration: '0:45'
      },
      {
        id: '3',
        name: 'Tutorial Slideshow',
        type: 'slideshow',
        thumbnail: '/api/placeholder/160/90',
        lastModified: '3 days ago',
        duration: '2:15'
      }
    ];
    setRecentProjects(mockProjects);
  }, []);

  const features = [
    {
      icon: '🖼️',
      title: 'SlideShow Creator',
      description: 'Create stunning videos from images with smooth transitions and effects',
      path: '/slideshow',
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)'
    },
    {
      icon: '🎬',
      title: 'Video Editor',
      description: 'Trim, edit, and enhance your video files with professional tools',
      path: '/video-editor',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      icon: '🎨',
      title: 'Templates',
      description: 'Start with pre-made templates for common video types',
      path: '/templates',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      comingSoon: true
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Track performance and engagement of your created content',
      path: '/analytics',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      comingSoon: true
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      fontFamily: '"Space Mono", monospace'
    }}>
      {/* Header */}
      <header style={{
        height: '70px',
        backgroundColor: '#1a1a1b',
        borderBottom: '1px solid #343536',
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
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
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>
              AnimaGen
            </h1>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: 0
            }}>
              Animated GIF & Video Creator
            </p>
          </div>
        </div>
        
        <nav style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <button style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.backgroundColor = '#343536';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9ca3af';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}>
            Projects
          </button>
          <button style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.backgroundColor = '#343536';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9ca3af';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}>
            Settings
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px' }}>
        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h2 style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 20px 0',
            background: 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Create Amazing Videos
          </h2>
          <p style={{
            fontSize: '20px',
            color: '#9ca3af',
            margin: '0 0 40px 0',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Transform your images into stunning videos with smooth transitions, or edit existing videos with professional tools.
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center'
          }}>
            <Link
              to="/slideshow"
              style={{
                textDecoration: 'none',
                padding: '16px 32px',
                backgroundColor: '#ec4899',
                color: 'white',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#be185d';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ec4899';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🖼️ Start Creating
            </Link>
            <Link
              to="/video-editor"
              style={{
                textDecoration: 'none',
                padding: '16px 32px',
                backgroundColor: 'transparent',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🎬 Edit Videos
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section style={{ marginBottom: '60px' }}>
          <h3 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 40px 0',
            textAlign: 'center'
          }}>
            Choose Your Tool
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                onClick={() => !feature.comingSoon && navigate(feature.path)}
                style={{
                  backgroundColor: '#1a1a1b',
                  border: '2px solid #343536',
                  borderRadius: '12px',
                  padding: '32px',
                  cursor: feature.comingSoon ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: feature.comingSoon ? 0.6 : 1,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!feature.comingSoon) {
                    e.currentTarget.style.borderColor = feature.color;
                    e.currentTarget.style.backgroundColor = feature.bgColor;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!feature.comingSoon) {
                    e.currentTarget.style.borderColor = '#343536';
                    e.currentTarget.style.backgroundColor = '#1a1a1b';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {feature.comingSoon && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    COMING SOON
                  </div>
                )}
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>
                  {feature.icon}
                </div>
                <h4 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: feature.color,
                  margin: '0 0 12px 0'
                }}>
                  {feature.title}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <section>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <h3 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: 0
              }}>
                Recent Projects
              </h3>
              <button style={{
                background: 'none',
                border: '1px solid #343536',
                color: '#9ca3af',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#ec4899';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.borderColor = '#343536';
              }}>
                View All Projects
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    backgroundColor: '#1a1a1b',
                    border: '1px solid #343536',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ec4899';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#343536';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => navigate(`/${project.type}/${project.id}`)}
                >
                  <div style={{
                    width: '100%',
                    height: '160px',
                    backgroundColor: '#333333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666666',
                    fontSize: '48px'
                  }}>
                    {project.type === 'slideshow' ? '🖼️' : '🎬'}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      margin: '0 0 8px 0'
                    }}>
                      {project.name}
                    </h4>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      <span>{project.lastModified}</span>
                      <span>{project.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '40px',
        borderTop: '1px solid #343536',
        color: '#666666',
        fontSize: '14px'
      }}>
        <p>© 2024 AnimaGen. Built with ❤️ for creators.</p>
      </footer>
    </div>
  );
};

export default HomePage;
