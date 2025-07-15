import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  action: () => void;
  isActive?: boolean;
}

interface Workflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  steps: WorkflowStep[];
  estimatedTime: string;
}

// PROPOSAL 3: WORKFLOW-ORIENTED DESIGN
const HomePageProposal3: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('slideshow');
  const navigate = useNavigate();

  const workflows: Workflow[] = [
    {
      id: 'slideshow',
      title: 'Create Slideshow',
      description: 'Transform images into engaging video content',
      icon: '🖼️',
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)',
      estimatedTime: '5-10 min',
      steps: [
        {
          id: 'upload',
          title: 'Upload Images',
          description: 'Drag & drop your images or select from files',
          icon: '📁',
          color: '#ec4899',
          bgColor: 'rgba(236, 72, 153, 0.1)',
          action: () => navigate('/slideshow')
        },
        {
          id: 'arrange',
          title: 'Arrange & Time',
          description: 'Set order, duration, and transitions',
          icon: '⏱️',
          color: '#ec4899',
          bgColor: 'rgba(236, 72, 153, 0.1)',
          action: () => navigate('/slideshow')
        },
        {
          id: 'preview',
          title: 'Preview & Adjust',
          description: 'Review your slideshow and make changes',
          icon: '👁️',
          color: '#ec4899',
          bgColor: 'rgba(236, 72, 153, 0.1)',
          action: () => navigate('/slideshow')
        },
        {
          id: 'export',
          title: 'Export Video',
          description: 'Download as MP4, GIF, or WebM',
          icon: '💾',
          color: '#ec4899',
          bgColor: 'rgba(236, 72, 153, 0.1)',
          action: () => navigate('/slideshow')
        }
      ]
    },
    {
      id: 'video-edit',
      title: 'Edit Video',
      description: 'Enhance and modify existing video content',
      icon: '🎬',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      estimatedTime: '3-8 min',
      steps: [
        {
          id: 'import',
          title: 'Import Video',
          description: 'Upload your video file to edit',
          icon: '📹',
          color: '#3b82f6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          action: () => navigate('/video-editor')
        },
        {
          id: 'trim',
          title: 'Trim & Cut',
          description: 'Remove unwanted parts and segments',
          icon: '✂️',
          color: '#3b82f6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          action: () => navigate('/video-editor')
        },
        {
          id: 'enhance',
          title: 'Add Effects',
          description: 'Apply filters, transitions, and effects',
          icon: '✨',
          color: '#3b82f6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          action: () => navigate('/video-editor')
        },
        {
          id: 'finalize',
          title: 'Export Final',
          description: 'Save your edited video in desired format',
          icon: '🎯',
          color: '#3b82f6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          action: () => navigate('/video-editor')
        }
      ]
    }
  ];

  const selectedWorkflowData = workflows.find(w => w.id === selectedWorkflow);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      fontFamily: '"Space Mono", monospace'
    }}>
      {/* Header */}
      <header style={{
        padding: '40px',
        textAlign: 'center',
        borderBottom: '1px solid #343536',
        backgroundColor: '#1a1a1b'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(236, 72, 153, 0.15)',
            border: '2px solid #ec4899',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <svg style={{ width: '32px', height: '32px', color: '#ec4899' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            margin: '0 0 12px 0',
            background: 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AnimaGen Workflow
          </h1>
          
          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Choose your creative workflow and follow the guided steps to create amazing content
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        padding: '40px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Workflow Selector */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 20px 0',
            textAlign: 'center'
          }}>
            What would you like to create?
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => setSelectedWorkflow(workflow.id)}
                style={{
                  backgroundColor: selectedWorkflow === workflow.id ? workflow.bgColor : '#1a1a1b',
                  border: selectedWorkflow === workflow.id ? `2px solid ${workflow.color}` : '2px solid #343536',
                  borderRadius: '12px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '280px',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (selectedWorkflow !== workflow.id) {
                    e.currentTarget.style.borderColor = workflow.color;
                    e.currentTarget.style.backgroundColor = workflow.bgColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedWorkflow !== workflow.id) {
                    e.currentTarget.style.borderColor = '#343536';
                    e.currentTarget.style.backgroundColor = '#1a1a1b';
                  }
                }}
              >
                <div style={{
                  fontSize: '40px',
                  marginBottom: '12px'
                }}>
                  {workflow.icon}
                </div>
                
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: workflow.color,
                  margin: '0 0 8px 0'
                }}>
                  {workflow.title}
                </h3>
                
                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  margin: '0 0 12px 0',
                  lineHeight: '1.4'
                }}>
                  {workflow.description}
                </p>
                
                <div style={{
                  fontSize: '12px',
                  color: workflow.color,
                  backgroundColor: `${workflow.color}20`,
                  padding: '4px 8px',
                  borderRadius: '12px',
                  display: 'inline-block'
                }}>
                  ⏱️ {workflow.estimatedTime}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Steps */}
        {selectedWorkflowData && (
          <section>
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: selectedWorkflowData.color,
                margin: '0 0 8px 0'
              }}>
                {selectedWorkflowData.title} Workflow
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#9ca3af',
                margin: 0
              }}>
                Follow these steps to create your content
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              position: 'relative'
            }}>
              {selectedWorkflowData.steps.map((step, index) => (
                <div key={step.id} style={{ position: 'relative' }}>
                  {/* Step Number */}
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '20px',
                    width: '32px',
                    height: '32px',
                    backgroundColor: selectedWorkflowData.color,
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    zIndex: 2
                  }}>
                    {index + 1}
                  </div>

                  {/* Connector Line */}
                  {index < selectedWorkflowData.steps.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '52px',
                      width: 'calc(100% - 32px)',
                      height: '2px',
                      backgroundColor: '#343536',
                      zIndex: 1
                    }} />
                  )}

                  {/* Step Card */}
                  <div
                    onClick={step.action}
                    style={{
                      backgroundColor: '#1a1a1b',
                      border: '2px solid #343536',
                      borderRadius: '12px',
                      padding: '24px 20px 20px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginTop: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = selectedWorkflowData.color;
                      e.currentTarget.style.backgroundColor = selectedWorkflowData.bgColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#343536';
                      e.currentTarget.style.backgroundColor = '#1a1a1b';
                    }}
                  >
                    <div style={{
                      fontSize: '32px',
                      textAlign: 'center',
                      marginBottom: '12px'
                    }}>
                      {step.icon}
                    </div>
                    
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      margin: '0 0 8px 0',
                      textAlign: 'center'
                    }}>
                      {step.title}
                    </h4>
                    
                    <p style={{
                      fontSize: '14px',
                      color: '#9ca3af',
                      margin: 0,
                      textAlign: 'center',
                      lineHeight: '1.4'
                    }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Start Button */}
            <div style={{
              textAlign: 'center',
              marginTop: '40px'
            }}>
              <button
                onClick={() => selectedWorkflowData.steps[0].action()}
                style={{
                  backgroundColor: selectedWorkflowData.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>{selectedWorkflowData.icon}</span>
                Start {selectedWorkflowData.title}
                <span>→</span>
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default HomePageProposal3;
