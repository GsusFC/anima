import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface RecentProject {
  id: string;
  name: string;
  type: 'slideshow' | 'video';
  thumbnail: string;
  lastModified: string;
  duration: string;
  status: 'completed' | 'draft' | 'processing';
}

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  action: () => void;
  color: string;
  bgColor: string;
}

// PROPOSAL 1: PROJECT-CENTERED DASHBOARD
const HomePageProposal1: React.FC = () => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDuration: '0:00',
    thisWeek: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockProjects: RecentProject[] = [
      {
        id: '1',
        name: 'Product Launch Video',
        type: 'slideshow',
        thumbnail: '/api/placeholder/160/90',
        lastModified: '2 hours ago',
        duration: '1:32',
        status: 'completed'
      },
      {
        id: '2',
        name: 'Marketing Clip',
        type: 'video',
        thumbnail: '/api/placeholder/160/90',
        lastModified: '1 day ago',
        duration: '0:45',
        status: 'draft'
      },
      {
        id: '3',
        name: 'Tutorial Slideshow',
        type: 'slideshow',
        thumbnail: '/api/placeholder/160/90',
        lastModified: '3 days ago',
        duration: '2:15',
        status: 'processing'
      }
    ];
    setRecentProjects(mockProjects);
    setStats({
      totalProjects: 12,
      totalDuration: '15:32',
      thisWeek: 3
    });
  }, []);

  const quickActions: QuickAction[] = [
    {
      icon: '🖼️',
      title: 'New Slideshow',
      description: 'Create from images',
      action: () => navigate('/slideshow'),
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)'
    },
    {
      icon: '🎬',
      title: 'Edit Video',
      description: 'Trim & enhance',
      action: () => navigate('/video-editor'),
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      icon: '📁',
      title: 'Import Project',
      description: 'From file or URL',
      action: () => {/* TODO: Import modal */},
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      icon: '🎨',
      title: 'Templates',
      description: 'Start with preset',
      action: () => {/* TODO: Templates */},
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'processing': return '#f59e0b';
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'draft': return '📝';
      default: return '📄';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      fontFamily: '"Space Mono", monospace'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        borderBottom: '1px solid #343536',
        backgroundColor: '#1a1a1b'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              border: '2px solid #ec4899',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '24px', height: '24px', color: '#ec4899' }} fill="currentColor" viewBox="0 0 24 24">
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
                AnimaGen Dashboard
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#9ca3af',
                margin: 0
              }}>
                Your creative workspace
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '32px',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec4899' }}>
                {stats.totalProjects}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Projects</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {stats.totalDuration}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total Duration</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                {stats.thisWeek}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>This Week</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        padding: '40px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Quick Actions */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 24px 0'
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={action.action}
                style={{
                  backgroundColor: '#1a1a1b',
                  border: '2px solid #343536',
                  borderRadius: '12px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.backgroundColor = action.bgColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#343536';
                  e.currentTarget.style.backgroundColor = '#1a1a1b';
                }}
              >
                <div style={{
                  fontSize: '32px',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: action.bgColor,
                  borderRadius: '8px'
                }}>
                  {action.icon}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    margin: '0 0 4px 0'
                  }}>
                    {action.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    margin: 0
                  }}>
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Projects */}
        <section>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: 0
            }}>
              Recent Projects
            </h2>
            <Link
              to="/projects"
              style={{
                color: '#ec4899',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              View All →
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
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
              >
                {/* Thumbnail */}
                <div style={{
                  width: '100%',
                  height: '160px',
                  backgroundColor: '#343536',
                  backgroundImage: `url(${project.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'white'
                  }}>
                    {project.duration}
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: getStatusColor(project.status)
                  }}>
                    {getStatusIcon(project.status)}
                    {project.status}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '16px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    margin: '0 0 8px 0'
                  }}>
                    {project.name}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    <span>{project.type === 'slideshow' ? '🖼️ Slideshow' : '🎬 Video'}</span>
                    <span>{project.lastModified}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePageProposal1;
