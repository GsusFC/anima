import React from 'react';

interface FlowNode {
  id: string;
  title: string;
  description: string;
  path: string;
  color: string;
  bgColor: string;
  icon: string;
  connections: string[];
  issues?: string[];
  improvements?: string[];
}

const NavigationFlowDiagram: React.FC = () => {
  const nodes: FlowNode[] = [
    {
      id: 'home',
      title: 'Home Page',
      description: 'Central hub and landing page',
      path: '/',
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)',
      icon: '🏠',
      connections: ['slideshow', 'video-editor', 'projects'],
      improvements: [
        'Better project management',
        'Quick action buttons',
        'Recent projects display',
        'Statistics dashboard'
      ]
    },
    {
      id: 'slideshow',
      title: 'Slideshow Creator',
      description: 'Create videos from images',
      path: '/slideshow',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      icon: '🖼️',
      connections: ['home', 'slideshow-viewer'],
      issues: [
        'No clear exit strategy',
        'Missing breadcrumb navigation'
      ],
      improvements: [
        'Add breadcrumb navigation',
        'Better home button visibility',
        'Save/load project functionality'
      ]
    },
    {
      id: 'slideshow-viewer',
      title: 'Slideshow Viewer',
      description: 'View shared slideshows',
      path: '/slideshow/:id',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      icon: '👁️',
      connections: ['home'],
      improvements: [
        'Edit mode toggle',
        'Share functionality',
        'Comments system'
      ]
    },
    {
      id: 'video-editor',
      title: 'Video Editor',
      description: 'Edit and enhance videos',
      path: '/video-editor',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      icon: '🎬',
      connections: ['home'],
      issues: [
        'Limited navigation options',
        'No project saving'
      ],
      improvements: [
        'Project management',
        'Auto-save functionality',
        'Export history'
      ]
    },
    {
      id: 'projects',
      title: 'Projects Manager',
      description: 'Manage all user projects',
      path: '/projects',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      icon: '📁',
      connections: ['home', 'slideshow', 'video-editor'],
      improvements: [
        'Project templates',
        'Bulk operations',
        'Search and filter',
        'Project sharing'
      ]
    }
  ];

  const getNodePosition = (index: number, total: number) => {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    const angle = (index * 2 * Math.PI) / total;
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const renderConnection = (fromNode: FlowNode, toNodeId: string, nodes: FlowNode[]) => {
    const fromIndex = nodes.findIndex(n => n.id === fromNode.id);
    const toIndex = nodes.findIndex(n => n.id === toNodeId);
    
    if (fromIndex === -1 || toIndex === -1) return null;
    
    const fromPos = getNodePosition(fromIndex, nodes.length);
    const toPos = getNodePosition(toIndex, nodes.length);
    
    return (
      <line
        key={`${fromNode.id}-${toNodeId}`}
        x1={fromPos.x}
        y1={fromPos.y}
        x2={toPos.x}
        y2={toPos.y}
        stroke="#343536"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.6"
      />
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      fontFamily: '"Space Mono", monospace',
      padding: '40px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 0 16px 0',
            background: 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AnimaGen Navigation Flow Analysis
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
            margin: 0
          }}>
            Current navigation structure, identified issues, and proposed improvements
          </p>
        </div>

        {/* Flow Diagram */}
        <div style={{
          display: 'flex',
          gap: '40px',
          alignItems: 'flex-start'
        }}>
          {/* SVG Diagram */}
          <div style={{
            flex: '1',
            backgroundColor: '#1a1a1b',
            border: '1px solid #343536',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              Navigation Flow Map
            </h3>
            
            <svg width="800" height="600" style={{ width: '100%', height: 'auto' }}>
              {/* Render connections */}
              {nodes.map(node => 
                node.connections.map(connectionId => 
                  renderConnection(node, connectionId, nodes)
                )
              )}
              
              {/* Render nodes */}
              {nodes.map((node, index) => {
                const pos = getNodePosition(index, nodes.length);
                const hasIssues = node.issues && node.issues.length > 0;
                
                return (
                  <g key={node.id}>
                    {/* Node circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="60"
                      fill={node.bgColor}
                      stroke={hasIssues ? '#ef4444' : node.color}
                      strokeWidth={hasIssues ? "3" : "2"}
                      strokeDasharray={hasIssues ? "5,5" : "none"}
                    />
                    
                    {/* Icon */}
                    <text
                      x={pos.x}
                      y={pos.y - 10}
                      textAnchor="middle"
                      fontSize="24"
                    >
                      {node.icon}
                    </text>
                    
                    {/* Title */}
                    <text
                      x={pos.x}
                      y={pos.y + 15}
                      textAnchor="middle"
                      fontSize="12"
                      fill={node.color}
                      fontWeight="bold"
                    >
                      {node.title}
                    </text>
                    
                    {/* Path */}
                    <text
                      x={pos.x}
                      y={pos.y + 30}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#9ca3af"
                    >
                      {node.path}
                    </text>
                    
                    {/* Issue indicator */}
                    {hasIssues && (
                      <circle
                        cx={pos.x + 45}
                        cy={pos.y - 45}
                        r="8"
                        fill="#ef4444"
                      />
                    )}
                    {hasIssues && (
                      <text
                        x={pos.x + 45}
                        y={pos.y - 41}
                        textAnchor="middle"
                        fontSize="10"
                        fill="white"
                        fontWeight="bold"
                      >
                        !
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            
            <div style={{
              marginTop: '20px',
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid #10b981',
                  borderRadius: '50%'
                }} />
                <span style={{ color: '#9ca3af' }}>Working</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px dashed #ef4444',
                  borderRadius: '50%'
                }} />
                <span style={{ color: '#9ca3af' }}>Has Issues</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '2px',
                  backgroundColor: '#343536'
                }} />
                <span style={{ color: '#9ca3af' }}>Navigation Link</span>
              </div>
            </div>
          </div>

          {/* Issues & Improvements Panel */}
          <div style={{
            width: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {nodes.map(node => (
              <div
                key={node.id}
                style={{
                  backgroundColor: '#1a1a1b',
                  border: '1px solid #343536',
                  borderRadius: '12px',
                  padding: '16px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '20px' }}>{node.icon}</span>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: node.color,
                    margin: 0
                  }}>
                    {node.title}
                  </h4>
                </div>

                {node.issues && node.issues.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <h5 style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#ef4444',
                      margin: '0 0 6px 0'
                    }}>
                      🚨 Issues:
                    </h5>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}>
                      {node.issues.map((issue, index) => (
                        <li
                          key={index}
                          style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <div style={{
                            width: '3px',
                            height: '3px',
                            backgroundColor: '#ef4444',
                            borderRadius: '50%'
                          }} />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {node.improvements && node.improvements.length > 0 && (
                  <div>
                    <h5 style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#10b981',
                      margin: '0 0 6px 0'
                    }}>
                      ✅ Improvements:
                    </h5>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}>
                      {node.improvements.map((improvement, index) => (
                        <li
                          key={index}
                          style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <div style={{
                            width: '3px',
                            height: '3px',
                            backgroundColor: '#10b981',
                            borderRadius: '50%'
                          }} />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationFlowDiagram;
