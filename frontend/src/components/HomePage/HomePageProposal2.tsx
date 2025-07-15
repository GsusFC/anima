import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Tool {
  id: string;
  icon: string;
  title: string;
  description: string;
  longDescription: string;
  path: string;
  color: string;
  bgColor: string;
  features: string[];
  comingSoon?: boolean;
}

// PROPOSAL 2: TOOL-CENTERED HUB
const HomePageProposal2: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const navigate = useNavigate();

  const tools: Tool[] = [
    {
      id: 'slideshow',
      icon: '🖼️',
      title: 'SlideShow Creator',
      description: 'Transform images into stunning videos',
      longDescription: 'Create professional slideshows from your images with smooth transitions, effects, and customizable timing. Perfect for presentations, social media, and marketing content.',
      path: '/slideshow',
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)',
      features: ['Drag & drop images', 'Custom transitions', 'Timing control', 'Export to MP4/GIF']
    },
    {
      id: 'video-editor',
      icon: '🎬',
      title: 'Video Editor',
      description: 'Edit and enhance your videos',
      longDescription: 'Professional video editing tools to trim, cut, and enhance your video content. Add effects, adjust timing, and export in multiple formats.',
      path: '/video-editor',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      features: ['Trim & cut videos', 'Add effects', 'Timeline editing', 'Multiple formats']
    },
    {
      id: 'templates',
      icon: '🎨',
      title: 'Templates',
      description: 'Start with pre-made designs',
      longDescription: 'Choose from a variety of professionally designed templates for different use cases. Customize colors, text, and timing to match your brand.',
      path: '/templates',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      features: ['Social media templates', 'Business presentations', 'Marketing videos', 'Custom branding'],
      comingSoon: true
    },
    {
      id: 'ai-generator',
      icon: '🤖',
      title: 'AI Generator',
      description: 'Generate content with AI',
      longDescription: 'Use artificial intelligence to generate video content, suggest transitions, and optimize your creations automatically.',
      path: '/ai-generator',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      features: ['Auto transitions', 'Content suggestions', 'Smart timing', 'Style transfer'],
      comingSoon: true
    }
  ];

  const handleToolClick = (tool: Tool) => {
    if (tool.comingSoon) return;
    navigate(tool.path);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      fontFamily: '"Space Mono", monospace'
    }}>
      {/* Hero Header */}
      <header style={{
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        padding: '60px 40px',
        textAlign: 'center',
        borderBottom: '1px solid #343536'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
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
            AnimaGen Studio
          </h1>
          
          <p style={{
            fontSize: '20px',
            color: '#9ca3af',
            margin: '0 0 32px 0',
            lineHeight: '1.6'
          }}>
            Your complete toolkit for creating stunning animated content. 
            Choose your tool and start creating professional videos in minutes.
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid #ec4899',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '14px',
              color: '#ec4899'
            }}>
              ✨ No watermarks
            </div>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid #3b82f6',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '14px',
              color: '#3b82f6'
            }}>
              🚀 Fast export
            </div>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '14px',
              color: '#10b981'
            }}>
              💎 Professional quality
            </div>
          </div>
        </div>
      </header>

      {/* Tools Grid */}
      <main style={{
        padding: '60px 40px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedTool ? '1fr 400px' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          transition: 'all 0.3s ease'
        }}>
          {/* Tools */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedTool ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => selectedTool === tool.id ? handleToolClick(tool) : setSelectedTool(tool.id)}
                style={{
                  backgroundColor: selectedTool === tool.id ? tool.bgColor : '#1a1a1b',
                  border: selectedTool === tool.id ? `2px solid ${tool.color}` : '2px solid #343536',
                  borderRadius: '16px',
                  padding: '32px',
                  cursor: tool.comingSoon ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: tool.comingSoon ? 0.6 : 1,
                  position: 'relative',
                  transform: selectedTool === tool.id ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!tool.comingSoon && selectedTool !== tool.id) {
                    e.currentTarget.style.borderColor = tool.color;
                    e.currentTarget.style.backgroundColor = tool.bgColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!tool.comingSoon && selectedTool !== tool.id) {
                    e.currentTarget.style.borderColor = '#343536';
                    e.currentTarget.style.backgroundColor = '#1a1a1b';
                  }
                }}
              >
                {tool.comingSoon && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: '#f59e0b',
                    color: '#000',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    COMING SOON
                  </div>
                )}

                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {tool.icon}
                </div>

                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: tool.color,
                  margin: '0 0 8px 0',
                  textAlign: 'center'
                }}>
                  {tool.title}
                </h3>

                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  margin: '0 0 16px 0',
                  textAlign: 'center',
                  lineHeight: '1.5'
                }}>
                  {tool.description}
                </p>

                {selectedTool === tool.id && (
                  <div style={{
                    borderTop: '1px solid #343536',
                    paddingTop: '16px',
                    marginTop: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      justifyContent: 'center'
                    }}>
                      {tool.features.slice(0, 2).map((feature, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#9ca3af'
                          }}
                        >
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTool === tool.id && !tool.comingSoon && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToolClick(tool);
                    }}
                    style={{
                      width: '100%',
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: tool.color,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    Launch {tool.title} →
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Tool Details Sidebar */}
          {selectedTool && (
            <div style={{
              backgroundColor: '#1a1a1b',
              border: '1px solid #343536',
              borderRadius: '16px',
              padding: '32px',
              height: 'fit-content',
              position: 'sticky',
              top: '20px'
            }}>
              {(() => {
                const tool = tools.find(t => t.id === selectedTool);
                if (!tool) return null;

                return (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontSize: '32px' }}>{tool.icon}</div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: tool.color,
                        margin: 0
                      }}>
                        {tool.title}
                      </h3>
                    </div>

                    <p style={{
                      fontSize: '14px',
                      color: '#9ca3af',
                      margin: '0 0 24px 0',
                      lineHeight: '1.6'
                    }}>
                      {tool.longDescription}
                    </p>

                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      margin: '0 0 12px 0'
                    }}>
                      Features:
                    </h4>

                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 24px 0'
                    }}>
                      {tool.features.map((feature, index) => (
                        <li
                          key={index}
                          style={{
                            fontSize: '14px',
                            color: '#9ca3af',
                            margin: '0 0 8px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <div style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: tool.color,
                            borderRadius: '50%'
                          }} />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {!tool.comingSoon && (
                      <button
                        onClick={() => handleToolClick(tool)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: tool.color,
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        Get Started →
                      </button>
                    )}

                    {tool.comingSoon && (
                      <div style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#343536',
                        color: '#9ca3af',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}>
                        Coming Soon
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePageProposal2;
